-- A versioned canonical document and append-only evidence chain for agreements.
-- This provides tamper evidence within the application; it is not a qualified
-- electronic signature or an independent timestamp/notary service.
create extension if not exists pgcrypto with schema extensions;

create table public.agreement_documents (
  agreement_id uuid primary key references public.shift_agreements(id),
  schema_version text not null default '1.0',
  canonical_content jsonb not null,
  canonical_content_text text not null,
  document_sha256 text not null check (document_sha256 ~ '^[0-9a-f]{64}$'),
  generated_at timestamptz not null default now()
);

create table public.agreement_evidence_events (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.shift_agreements(id),
  event_type text not null check (event_type in (
    'owner_terms_published', 'document_generated', 'substitute_accepted',
    'institution_approved'
  )),
  actor_id uuid references public.profiles(id),
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now(),
  document_sha256 text not null check (document_sha256 ~ '^[0-9a-f]{64}$'),
  previous_event_sha256 text,
  event_sha256 text not null unique check (event_sha256 ~ '^[0-9a-f]{64}$'),
  event_content text not null,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.agreement_documents enable row level security;
alter table public.agreement_evidence_events enable row level security;
revoke all on public.agreement_documents, public.agreement_evidence_events
  from public, anon, authenticated;
grant select on public.agreement_documents, public.agreement_evidence_events
  to authenticated;
grant select on public.agreement_documents, public.agreement_evidence_events
  to service_role;

create policy "agreement parties and approvers read canonical documents"
on public.agreement_documents for select to authenticated
using (
  exists (
    select 1 from public.shift_agreements a
    where a.id = agreement_documents.agreement_id
      and (
        a.owner_id = (select auth.uid())
        or a.substitute_id = (select auth.uid())
        or exists (
          select 1 from public.group_memberships gm
          where gm.group_id = a.group_id and gm.profile_id = (select auth.uid())
            and gm.active and gm.role = 'approver'
        )
      )
  )
);

create policy "agreement parties and approvers read evidence events"
on public.agreement_evidence_events for select to authenticated
using (
  exists (
    select 1 from public.shift_agreements a
    where a.id = agreement_evidence_events.agreement_id
      and (
        a.owner_id = (select auth.uid())
        or a.substitute_id = (select auth.uid())
        or exists (
          select 1 from public.group_memberships gm
          where gm.group_id = a.group_id and gm.profile_id = (select auth.uid())
            and gm.active and gm.role = 'approver'
        )
      )
  )
);

create or replace function private.append_agreement_evidence(
  target_agreement_id uuid,
  target_event_type text,
  target_actor_id uuid,
  target_metadata jsonb default '{}'::jsonb,
  target_occurred_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  document_hash text;
  previous_hash text;
  event_id uuid := gen_random_uuid();
  event_time timestamptz := clock_timestamp();
  record_time timestamptz := clock_timestamp();
  event_hash text;
  event_content_value text;
begin
  if (select auth.uid()) is null then
    raise exception 'Registro de evidência requer usuário autenticado';
  end if;
  -- Serialize writes to this agreement so two events cannot fork the chain.
  perform 1 from public.shift_agreements where id = target_agreement_id for update;
  select document_sha256 into document_hash
  from public.agreement_documents where agreement_id = target_agreement_id;
  if document_hash is null then
    raise exception 'Documento canônico do acordo não encontrado';
  end if;
  select e.event_sha256 into previous_hash
  from public.agreement_evidence_events e
  where e.agreement_id = target_agreement_id
  order by e.recorded_at desc, e.id desc limit 1;
  event_time := coalesce(target_occurred_at, event_time);

  event_content_value := jsonb_build_object(
    'id', event_id,
    'agreement_id', target_agreement_id,
    'event_type', target_event_type,
    'actor_id', target_actor_id,
    'occurred_at', event_time,
    'recorded_at', record_time,
    'document_sha256', document_hash,
    'previous_event_sha256', previous_hash,
    'metadata', coalesce(target_metadata, '{}'::jsonb)
  )::text;
  event_hash := encode(extensions.digest(convert_to(event_content_value, 'UTF8'), 'sha256'), 'hex');

  insert into public.agreement_evidence_events (
    id, agreement_id, event_type, actor_id, occurred_at, recorded_at, document_sha256,
    previous_event_sha256, event_sha256, event_content, metadata
  ) values (
    event_id, target_agreement_id, target_event_type, target_actor_id,
    event_time, record_time, document_hash, previous_hash, event_hash, event_content_value,
    coalesce(target_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function private.create_agreement_dossier()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_name text;
  substitute_name text;
  group_name text;
  institution_name text;
  content jsonb;
  content_text text;
  prior_acceptance record;
  owner_offer_event record;
  owner_terms_found boolean := false;
begin
  if (select auth.uid()) is null then
    raise exception 'Geração do acordo requer usuário autenticado';
  end if;
  select display_name into owner_name from public.profiles where id = new.owner_id;
  select display_name into substitute_name from public.profiles where id = new.substitute_id;
  select g.name, i.name into group_name, institution_name
  from public.groups g join public.institutions i on i.id = g.institution_id
  where g.id = new.group_id;

  content := jsonb_build_object(
    'document_type', 'Registro eletrônico do acordo de repasse',
    'schema_version', '1.0',
    'agreement_id', new.id,
    'substitution_id', new.substitution_id,
    'offer_id', new.offer_id,
    'parties', jsonb_build_object(
      'owner', jsonb_build_object('profile_id', new.owner_id, 'display_name', owner_name),
      'substitute', jsonb_build_object('profile_id', new.substitute_id, 'display_name', substitute_name)
    ),
    'group', jsonb_build_object('id', new.group_id, 'name', group_name,
      'institution_name', institution_name),
    'agreement_confirmed_at', new.confirmed_at,
    'owner_offer_terms', null,
    'terms', new.snapshot
  );

  select ae.actor_id, ae.occurred_at, ae.id into owner_offer_event
  from public.audit_events ae
  where ae.entity_type = 'shift_offer' and ae.entity_id = new.offer_id
    and ae.event_type = 'shift_offer.terms_acknowledged'
  order by ae.occurred_at desc limit 1;
  if found then
    if owner_offer_event.actor_id = new.owner_id then
      owner_terms_found := true;
      content := jsonb_set(content, '{owner_offer_terms}', jsonb_build_object(
        'actor_id', owner_offer_event.actor_id,
        'acknowledged_at', owner_offer_event.occurred_at,
        'source_event_id', owner_offer_event.id
      ));
    end if;
  end if;

  content_text := content::text;

  insert into public.agreement_documents (
    agreement_id, schema_version, canonical_content, canonical_content_text,
    document_sha256
  ) values (
    new.id, '1.0', content, content_text,
    encode(extensions.digest(convert_to(content_text, 'UTF8'), 'sha256'), 'hex')
  );

  if owner_terms_found then
      perform private.append_agreement_evidence(new.id, 'owner_terms_published',
      owner_offer_event.actor_id,
      jsonb_build_object('source_audit_event_id', owner_offer_event.id,
        'source_audit_event_at', owner_offer_event.occurred_at),
      owner_offer_event.occurred_at);
  end if;

  -- The substitute's earlier acceptance is recorded before the institutional
  -- decision for groups requiring approval. Preserve its original event time.
  select ae.actor_id, ae.occurred_at into prior_acceptance
  from public.audit_events ae
  where ae.entity_type = 'substitution' and ae.entity_id = new.substitution_id
    and ae.event_type = 'substitution.confirmed_by_substitute'
  order by ae.occurred_at desc limit 1;
  if found then
    perform private.append_agreement_evidence(new.id, 'substitute_accepted',
      prior_acceptance.actor_id,
      jsonb_build_object('source_audit_event_at', prior_acceptance.occurred_at),
      prior_acceptance.occurred_at);
  end if;

  return new;
end;
$$;

create trigger create_agreement_dossier
after insert on public.shift_agreements
for each row execute function private.create_agreement_dossier();

create or replace function private.record_agreement_decision_evidence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  agreement_id uuid;
  mapped_type text;
begin
  if new.entity_type <> 'substitution' then return new; end if;
  mapped_type := case new.event_type
    when 'substitution.confirmed' then 'substitute_accepted'
    when 'substitution.approved' then 'institution_approved'
    else null
  end;
  if mapped_type is null then return new; end if;
  if (select auth.uid()) is null or new.actor_id is distinct from (select auth.uid()) then
    raise exception 'Evento do acordo deve corresponder à identidade autenticada';
  end if;

  select a.id into agreement_id from public.shift_agreements a
  where a.substitution_id = new.entity_id;
  if agreement_id is not null then
    perform private.append_agreement_evidence(agreement_id, mapped_type,
      new.actor_id, jsonb_build_object('source_audit_event_at', new.occurred_at),
      new.occurred_at);
    if new.event_type = 'substitution.confirmed' then
      perform private.append_agreement_evidence(agreement_id, 'document_generated',
        null, jsonb_build_object('schema_version', '1.0'));
    elsif new.event_type = 'substitution.approved' then
      perform private.append_agreement_evidence(agreement_id, 'document_generated',
        null, jsonb_build_object('schema_version', '1.0'));
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.require_offer_terms_acknowledgment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_offer public.shift_offers%rowtype;
  latest_owner_ack timestamptz;
begin
  if (select auth.uid()) is null or new.actor_id is distinct from (select auth.uid()) then
    raise exception 'Comando requer usuário autenticado';
  end if;
  if new.command in ('publish_offer', 'update_offer')
     and coalesce((new.payload->>'owner_terms_acknowledged')::boolean, false) = false then
    raise exception 'A oferta exige confirmação das condições informadas';
  end if;
  if new.command = 'select_candidate' then
    select o.* into selected_offer
    from public.shift_applications sa
    join public.shift_offers o on o.id = sa.offer_id
    where sa.id = new.target_id;
    if not found then raise exception 'Candidatura não encontrada'; end if;
    select max(ae.occurred_at) into latest_owner_ack
    from public.audit_events ae
    where ae.entity_type = 'shift_offer'
      and ae.entity_id = selected_offer.id
      and ae.event_type = 'shift_offer.terms_acknowledged'
      and ae.actor_id = selected_offer.owner_id;
    if latest_owner_ack is null or latest_owner_ack < selected_offer.updated_at then
      raise exception 'Titular precisa revisar as condições antes da seleção';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_offer_terms_acknowledgment
before insert on public.workflow_commands
for each row execute function private.require_offer_terms_acknowledgment();

create or replace function private.record_offer_terms_acknowledgment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or new.actor_id is distinct from (select auth.uid()) then
    raise exception 'Confirmação da oferta deve corresponder à identidade autenticada';
  end if;
  if new.command in ('publish_offer', 'update_offer') then
    insert into public.audit_events (
      actor_id, event_type, entity_type, entity_id, metadata
    ) values (
      new.actor_id, 'shift_offer.terms_acknowledged', 'shift_offer',
      new.result_id, jsonb_build_object(
        'command_id', new.id,
        'command', new.command,
        'acknowledged', true,
        'recording_method', 'authenticated_workflow_command'
      )
    );
  end if;
  return new;
end;
$$;

-- The core workflow trigger assigns result_id before this trigger runs.
create trigger zzzz_record_offer_terms_acknowledgment
before insert on public.workflow_commands
for each row execute function private.record_offer_terms_acknowledgment();

create trigger record_agreement_decision_evidence
after insert on public.audit_events
for each row execute function private.record_agreement_decision_evidence();

create or replace function private.prevent_agreement_evidence_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Documentos e evidências do acordo são imutáveis';
end;
$$;

create trigger agreement_documents_immutable
before update or delete on public.agreement_documents
for each row execute function private.prevent_agreement_evidence_mutation();
create trigger agreement_evidence_events_immutable
before update or delete on public.agreement_evidence_events
for each row execute function private.prevent_agreement_evidence_mutation();

revoke execute on function private.append_agreement_evidence(uuid, text, uuid, jsonb, timestamptz)
  from public, anon, authenticated;
revoke execute on function private.create_agreement_dossier()
  from public, anon, authenticated;
revoke execute on function private.record_agreement_decision_evidence()
  from public, anon, authenticated;
revoke execute on function private.require_offer_terms_acknowledgment()
  from public, anon, authenticated;
revoke execute on function private.record_offer_terms_acknowledgment()
  from public, anon, authenticated;
revoke execute on function private.prevent_agreement_evidence_mutation()
  from public, anon, authenticated;

comment on table public.agreement_documents is
  'Canonical versioned agreement content, exact serialized bytes and SHA-256 digest; renderable/printable from the stored content.';
comment on table public.agreement_evidence_events is
  'Append-only DB-timestamped hash chain of agreement generation, substitute acceptance and institutional approval.';
