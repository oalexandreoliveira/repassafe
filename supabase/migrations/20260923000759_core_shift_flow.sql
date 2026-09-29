create type public.shift_offer_status as enum (
  'open_normal',
  'open_emergency',
  'selection_in_progress',
  'closed_confirmed',
  'cancelled_by_owner',
  'cancelled_admin',
  'expired'
);

create type public.shift_application_status as enum (
  'active',
  'withdrawn',
  'selected_pending_confirmation',
  'confirmed',
  'declined',
  'confirmation_expired',
  'not_selected',
  'invalidated'
);

create type public.substitution_status as enum (
  'pending_substitute_confirmation',
  'pending_institutional_approval',
  'confirmed',
  'rejected_institutionally',
  'cancelled'
);

create type public.workflow_command_type as enum (
  'publish_offer',
  'update_offer',
  'cancel_offer',
  'apply_to_offer',
  'withdraw_application',
  'select_candidate',
  'confirm_substitution',
  'decide_substitution'
);

create table public.shift_offers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id),
  owner_id uuid not null references public.profiles(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  sector text not null check (char_length(sector) between 2 and 120),
  value_cents integer not null check (value_cents >= 0),
  payment_terms text not null check (char_length(payment_terms) between 2 and 300),
  notes text check (notes is null or char_length(notes) <= 1000),
  status public.shift_offer_status not null,
  selected_application_id uuid,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.shift_applications (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.shift_offers(id),
  candidate_id uuid not null references public.profiles(id),
  candidate_display_name text not null,
  status public.shift_application_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offer_id, candidate_id)
);

alter table public.shift_offers
  add constraint shift_offers_selected_application_fk
  foreign key (selected_application_id)
  references public.shift_applications(id);

create table public.substitutions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.shift_offers(id),
  application_id uuid not null unique references public.shift_applications(id),
  group_id uuid not null references public.groups(id),
  owner_id uuid not null references public.profiles(id),
  substitute_id uuid not null references public.profiles(id),
  status public.substitution_status not null,
  confirmation_deadline timestamptz not null,
  selected_at timestamptz not null default now(),
  substitute_confirmed_at timestamptz,
  institutional_decided_at timestamptz,
  institutional_decided_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shift_agreements (
  id uuid primary key default gen_random_uuid(),
  substitution_id uuid not null unique references public.substitutions(id),
  offer_id uuid not null unique references public.shift_offers(id),
  group_id uuid not null references public.groups(id),
  owner_id uuid not null references public.profiles(id),
  substitute_id uuid not null references public.profiles(id),
  snapshot jsonb not null,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.workflow_commands (
  id uuid primary key,
  actor_id uuid not null default auth.uid() references public.profiles(id),
  command public.workflow_command_type not null,
  target_id uuid,
  payload jsonb not null default '{}'::jsonb,
  result_id uuid,
  created_at timestamptz not null default now(),
  unique (actor_id, id)
);

create index shift_offers_group_status_start_idx
  on public.shift_offers (group_id, status, starts_at);
create index shift_offers_owner_idx on public.shift_offers (owner_id, created_at desc);
create index shift_applications_candidate_idx
  on public.shift_applications (candidate_id, created_at desc);
create index shift_applications_offer_status_idx
  on public.shift_applications (offer_id, status);
create index substitutions_participants_idx
  on public.substitutions (owner_id, substitute_id, created_at desc);
create index substitutions_group_status_idx
  on public.substitutions (group_id, status);
create unique index substitutions_one_live_offer_idx
  on public.substitutions (offer_id)
  where status in (
    'pending_substitute_confirmation',
    'pending_institutional_approval',
    'confirmed'
  );

alter table public.shift_offers enable row level security;
alter table public.shift_applications enable row level security;
alter table public.substitutions enable row level security;
alter table public.shift_agreements enable row level security;
alter table public.workflow_commands enable row level security;

revoke all on public.shift_offers, public.shift_applications,
  public.substitutions, public.shift_agreements, public.workflow_commands
from anon, authenticated;

grant select on public.shift_offers, public.shift_applications,
  public.substitutions, public.shift_agreements to authenticated;
grant select, insert on public.workflow_commands to authenticated;

create policy "eligible members read shift offers"
on public.shift_offers for select to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1
    from public.group_memberships gm
    join public.profiles p on p.id = gm.profile_id
    where gm.group_id = shift_offers.group_id
      and gm.profile_id = (select auth.uid())
      and gm.active
      and p.status = 'approved'
  )
);

create policy "participants read applications"
on public.shift_applications for select to authenticated
using (
  (select auth.uid()) is not null
  and (
    candidate_id = (select auth.uid())
    or exists (
      select 1 from public.shift_offers o
      where o.id = shift_applications.offer_id
        and o.owner_id = (select auth.uid())
    )
  )
);

create policy "participants and approvers read substitutions"
on public.substitutions for select to authenticated
using (
  (select auth.uid()) is not null
  and (
    owner_id = (select auth.uid())
    or substitute_id = (select auth.uid())
    or exists (
      select 1 from public.group_memberships gm
      where gm.group_id = substitutions.group_id
        and gm.profile_id = (select auth.uid())
        and gm.active
        and gm.role = 'approver'
    )
  )
);

create policy "participants and approvers read agreements"
on public.shift_agreements for select to authenticated
using (
  (select auth.uid()) is not null
  and (
    owner_id = (select auth.uid())
    or substitute_id = (select auth.uid())
    or exists (
      select 1 from public.group_memberships gm
      where gm.group_id = shift_agreements.group_id
        and gm.profile_id = (select auth.uid())
        and gm.active
        and gm.role = 'approver'
    )
  )
);

create policy "actors read own workflow commands"
on public.workflow_commands for select to authenticated
using (
  (select auth.uid()) is not null
  and actor_id = (select auth.uid())
);

create policy "actors submit own workflow commands"
on public.workflow_commands for insert to authenticated
with check (
  (select auth.uid()) is not null
  and actor_id = (select auth.uid())
);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.prevent_agreement_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Acordos confirmados são imutáveis';
end;
$$;

create trigger shift_agreements_immutable
before update or delete on public.shift_agreements
for each row execute function private.prevent_agreement_mutation();

create or replace function private.process_workflow_command()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_profile public.profiles%rowtype;
  selected_group public.groups%rowtype;
  selected_offer public.shift_offers%rowtype;
  selected_application public.shift_applications%rowtype;
  selected_substitution public.substitutions%rowtype;
  existing_application_id uuid;
  confirmation_minutes integer;
  next_offer_status public.shift_offer_status;
  requires_approval boolean;
begin
  if auth.uid() is null or new.actor_id <> auth.uid() then
    raise exception 'Sessão inválida';
  end if;

  new.result_id := null;

  select * into actor_profile
  from public.profiles
  where id = auth.uid();

  if not found or actor_profile.status <> 'approved' then
    raise exception 'O perfil precisa estar aprovado';
  end if;

  update public.substitutions s
  set status = 'cancelled', updated_at = now()
  where s.status = 'pending_substitute_confirmation'
    and s.confirmation_deadline <= now();

  update public.shift_applications a
  set status = 'confirmation_expired', updated_at = now()
  from public.substitutions s
  where s.application_id = a.id
    and s.status = 'cancelled'
    and a.status = 'selected_pending_confirmation';

  update public.shift_offers o
  set status = case
        when o.starts_at <= now() then 'expired'::public.shift_offer_status
        when o.starts_at <= now() + interval '48 hours' then 'open_emergency'::public.shift_offer_status
        else 'open_normal'::public.shift_offer_status
      end,
      selected_application_id = null,
      updated_at = now()
  from public.substitutions s
  where s.offer_id = o.id
    and s.status = 'cancelled'
    and o.status = 'selection_in_progress';

  update public.shift_offers
  set status = 'expired', updated_at = now()
  where status in ('open_normal', 'open_emergency')
    and starts_at <= now();

  if new.command = 'publish_offer' then
    select * into selected_group
    from public.groups
    where id = (new.payload->>'group_id')::uuid and active;

    if not found or not exists (
      select 1 from public.group_memberships gm
      where gm.group_id = selected_group.id
        and gm.profile_id = new.actor_id and gm.active
    ) then
      raise exception 'Vínculo ativo com o grupo é obrigatório';
    end if;

    if (new.payload->>'starts_at')::timestamptz <= now()
       or (new.payload->>'ends_at')::timestamptz <= (new.payload->>'starts_at')::timestamptz then
      raise exception 'Período do plantão inválido';
    end if;

    next_offer_status := case
      when (new.payload->>'starts_at')::timestamptz <= now() + interval '48 hours'
        then 'open_emergency'::public.shift_offer_status
      else 'open_normal'::public.shift_offer_status
    end;

    insert into public.shift_offers (
      group_id, owner_id, starts_at, ends_at, sector, value_cents,
      payment_terms, notes, status
    ) values (
      selected_group.id,
      new.actor_id,
      (new.payload->>'starts_at')::timestamptz,
      (new.payload->>'ends_at')::timestamptz,
      trim(new.payload->>'sector'),
      (new.payload->>'value_cents')::integer,
      trim(new.payload->>'payment_terms'),
      nullif(trim(new.payload->>'notes'), ''),
      next_offer_status
    ) returning id into new.result_id;

    insert into public.audit_events (actor_id, event_type, entity_type, entity_id, metadata)
    values (new.actor_id, 'shift_offer.published', 'shift_offer', new.result_id,
      jsonb_build_object('status', next_offer_status, 'group_id', selected_group.id));

  elsif new.command = 'update_offer' then
    select * into selected_offer from public.shift_offers
    where id = new.target_id for update;
    if not found or selected_offer.owner_id <> new.actor_id then
      raise exception 'Oferta não encontrada';
    end if;
    if selected_offer.status not in ('open_normal', 'open_emergency')
       or exists (select 1 from public.shift_applications where offer_id = selected_offer.id) then
      raise exception 'A oferta só pode ser editada antes da primeira candidatura';
    end if;
    if (new.payload->>'starts_at')::timestamptz <= now()
       or (new.payload->>'ends_at')::timestamptz <= (new.payload->>'starts_at')::timestamptz then
      raise exception 'Período do plantão inválido';
    end if;
    next_offer_status := case
      when (new.payload->>'starts_at')::timestamptz <= now() + interval '48 hours'
        then 'open_emergency'::public.shift_offer_status
      else 'open_normal'::public.shift_offer_status
    end;
    update public.shift_offers set
      starts_at = (new.payload->>'starts_at')::timestamptz,
      ends_at = (new.payload->>'ends_at')::timestamptz,
      sector = trim(new.payload->>'sector'),
      value_cents = (new.payload->>'value_cents')::integer,
      payment_terms = trim(new.payload->>'payment_terms'),
      notes = nullif(trim(new.payload->>'notes'), ''),
      status = next_offer_status,
      updated_at = now()
    where id = selected_offer.id;
    new.result_id := selected_offer.id;
    insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
    values (new.actor_id, 'shift_offer.updated', 'shift_offer', selected_offer.id);

  elsif new.command = 'cancel_offer' then
    select * into selected_offer from public.shift_offers
    where id = new.target_id for update;
    if not found or selected_offer.owner_id <> new.actor_id then
      raise exception 'Oferta não encontrada';
    end if;
    if selected_offer.status not in ('open_normal', 'open_emergency') then
      raise exception 'A oferta não pode mais ser cancelada';
    end if;
    update public.shift_offers set status = 'cancelled_by_owner', updated_at = now()
    where id = selected_offer.id;
    update public.shift_applications set status = 'invalidated', updated_at = now()
    where offer_id = selected_offer.id and status = 'active';
    new.result_id := selected_offer.id;
    insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
    values (new.actor_id, 'shift_offer.cancelled', 'shift_offer', selected_offer.id);

  elsif new.command = 'apply_to_offer' then
    select * into selected_offer from public.shift_offers
    where id = new.target_id for update;
    if not found or selected_offer.status not in ('open_normal', 'open_emergency')
       or selected_offer.starts_at <= now() then
      raise exception 'Oferta indisponível';
    end if;
    if selected_offer.owner_id = new.actor_id then
      raise exception 'O responsável não pode se candidatar ao próprio plantão';
    end if;
    if not exists (
      select 1 from public.group_memberships gm
      where gm.group_id = selected_offer.group_id
        and gm.profile_id = new.actor_id and gm.active
    ) then
      raise exception 'Candidato sem vínculo ativo com o grupo';
    end if;
    select id into existing_application_id
    from public.shift_applications
    where offer_id = selected_offer.id and candidate_id = new.actor_id;
    if existing_application_id is not null then
      new.result_id := existing_application_id;
    else
      insert into public.shift_applications (
        offer_id, candidate_id, candidate_display_name
      ) values (
        selected_offer.id, new.actor_id, actor_profile.display_name
      ) returning id into new.result_id;
      insert into public.audit_events (actor_id, event_type, entity_type, entity_id,
        metadata)
      values (new.actor_id, 'shift_application.created', 'shift_application',
        new.result_id, jsonb_build_object('offer_id', selected_offer.id));
    end if;

  elsif new.command = 'withdraw_application' then
    select * into selected_application from public.shift_applications
    where id = new.target_id for update;
    if not found or selected_application.candidate_id <> new.actor_id then
      raise exception 'Candidatura não encontrada';
    end if;
    if selected_application.status <> 'active' then
      raise exception 'A candidatura não pode mais ser retirada';
    end if;
    update public.shift_applications set status = 'withdrawn', updated_at = now()
    where id = selected_application.id;
    new.result_id := selected_application.id;
    insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
    values (new.actor_id, 'shift_application.withdrawn', 'shift_application', selected_application.id);

  elsif new.command = 'select_candidate' then
    select * into selected_application from public.shift_applications
    where id = new.target_id for update;
    if not found or selected_application.status <> 'active' then
      raise exception 'Candidatura indisponível';
    end if;
    select * into selected_offer from public.shift_offers
    where id = selected_application.offer_id for update;
    if selected_offer.owner_id <> new.actor_id
       or selected_offer.status not in ('open_normal', 'open_emergency') then
      raise exception 'Seleção não autorizada';
    end if;
    confirmation_minutes := least(greatest(
      coalesce((new.payload->>'confirmation_minutes')::integer, 30), 5
    ), 1440);
    update public.shift_applications
    set status = 'selected_pending_confirmation', updated_at = now()
    where id = selected_application.id;
    update public.shift_offers
    set status = 'selection_in_progress', selected_application_id = selected_application.id,
      updated_at = now()
    where id = selected_offer.id;
    insert into public.substitutions (
      offer_id, application_id, group_id, owner_id, substitute_id, status,
      confirmation_deadline
    ) values (
      selected_offer.id, selected_application.id, selected_offer.group_id,
      selected_offer.owner_id, selected_application.candidate_id,
      'pending_substitute_confirmation', now() + make_interval(mins => confirmation_minutes)
    ) returning id into new.result_id;
    insert into public.audit_events (actor_id, event_type, entity_type, entity_id,
      metadata)
    values (new.actor_id, 'substitution.selected', 'substitution', new.result_id,
      jsonb_build_object('offer_id', selected_offer.id,
        'confirmation_minutes', confirmation_minutes));

  elsif new.command = 'confirm_substitution' then
    select * into selected_substitution from public.substitutions
    where id = new.target_id for update;
    if not found or selected_substitution.substitute_id <> new.actor_id
       or selected_substitution.status <> 'pending_substitute_confirmation'
       or selected_substitution.confirmation_deadline <= now() then
      raise exception 'Confirmação indisponível';
    end if;
    select * into selected_offer from public.shift_offers
    where id = selected_substitution.offer_id for update;
    if coalesce((new.payload->>'accepted')::boolean, false) = false then
      update public.substitutions set status = 'cancelled', updated_at = now()
      where id = selected_substitution.id;
      update public.shift_applications set status = 'declined', updated_at = now()
      where id = selected_substitution.application_id;
      next_offer_status := case
        when selected_offer.starts_at <= now() then 'expired'::public.shift_offer_status
        when selected_offer.starts_at <= now() + interval '48 hours' then 'open_emergency'::public.shift_offer_status
        else 'open_normal'::public.shift_offer_status
      end;
      update public.shift_offers set status = next_offer_status,
        selected_application_id = null, updated_at = now()
      where id = selected_offer.id;
      insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
      values (new.actor_id, 'substitution.declined', 'substitution', selected_substitution.id);
    else
      select requires_approval into requires_approval
      from public.groups where id = selected_substitution.group_id;
      update public.shift_applications set status = 'confirmed', updated_at = now()
      where id = selected_substitution.application_id;
      if requires_approval then
        update public.substitutions
        set status = 'pending_institutional_approval',
          substitute_confirmed_at = now(), updated_at = now()
        where id = selected_substitution.id;
        insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
        values (new.actor_id, 'substitution.confirmed_by_substitute', 'substitution', selected_substitution.id);
      else
        update public.substitutions
        set status = 'confirmed', substitute_confirmed_at = now(), updated_at = now()
        where id = selected_substitution.id;
        update public.shift_offers set status = 'closed_confirmed', updated_at = now()
        where id = selected_offer.id;
        update public.shift_applications set status = 'not_selected', updated_at = now()
        where offer_id = selected_offer.id and id <> selected_substitution.application_id
          and status = 'active';
        insert into public.shift_agreements (
          substitution_id, offer_id, group_id, owner_id, substitute_id, snapshot
        ) values (
          selected_substitution.id, selected_offer.id, selected_offer.group_id,
          selected_offer.owner_id, selected_substitution.substitute_id,
          jsonb_build_object('starts_at', selected_offer.starts_at,
            'ends_at', selected_offer.ends_at, 'sector', selected_offer.sector,
            'value_cents', selected_offer.value_cents,
            'payment_terms', selected_offer.payment_terms,
            'owner_id', selected_offer.owner_id,
            'substitute_id', selected_substitution.substitute_id,
            'confirmed_at', now())
        );
        insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
        values (new.actor_id, 'substitution.confirmed', 'substitution', selected_substitution.id);
      end if;
    end if;
    new.result_id := selected_substitution.id;

  elsif new.command = 'decide_substitution' then
    select * into selected_substitution from public.substitutions
    where id = new.target_id for update;
    if actor_profile.role = 'admin'
       or not found
       or selected_substitution.status <> 'pending_institutional_approval'
       or not exists (
         select 1 from public.group_memberships gm
         where gm.group_id = selected_substitution.group_id
           and gm.profile_id = new.actor_id and gm.active and gm.role = 'approver'
       ) then
      raise exception 'Decisão institucional não autorizada';
    end if;
    select * into selected_offer from public.shift_offers
    where id = selected_substitution.offer_id for update;
    if coalesce((new.payload->>'approved')::boolean, false) then
      update public.substitutions
      set status = 'confirmed', institutional_decided_at = now(),
        institutional_decided_by = new.actor_id, updated_at = now()
      where id = selected_substitution.id;
      update public.shift_offers set status = 'closed_confirmed', updated_at = now()
      where id = selected_offer.id;
      update public.shift_applications set status = 'not_selected', updated_at = now()
      where offer_id = selected_offer.id and id <> selected_substitution.application_id
        and status = 'active';
      insert into public.shift_agreements (
        substitution_id, offer_id, group_id, owner_id, substitute_id, snapshot
      ) values (
        selected_substitution.id, selected_offer.id, selected_offer.group_id,
        selected_offer.owner_id, selected_substitution.substitute_id,
        jsonb_build_object('starts_at', selected_offer.starts_at,
          'ends_at', selected_offer.ends_at, 'sector', selected_offer.sector,
          'value_cents', selected_offer.value_cents,
          'payment_terms', selected_offer.payment_terms,
          'owner_id', selected_offer.owner_id,
          'substitute_id', selected_substitution.substitute_id,
          'confirmed_at', now(), 'approved_by', new.actor_id)
      );
      insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
      values (new.actor_id, 'substitution.approved', 'substitution', selected_substitution.id);
    else
      update public.substitutions
      set status = 'rejected_institutionally', institutional_decided_at = now(),
        institutional_decided_by = new.actor_id, updated_at = now()
      where id = selected_substitution.id;
      update public.shift_applications set status = 'invalidated', updated_at = now()
      where id = selected_substitution.application_id;
      next_offer_status := case
        when selected_offer.starts_at <= now() then 'expired'::public.shift_offer_status
        when selected_offer.starts_at <= now() + interval '48 hours' then 'open_emergency'::public.shift_offer_status
        else 'open_normal'::public.shift_offer_status
      end;
      update public.shift_offers set status = next_offer_status,
        selected_application_id = null, updated_at = now()
      where id = selected_offer.id;
      insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
      values (new.actor_id, 'substitution.rejected', 'substitution', selected_substitution.id);
    end if;
    new.result_id := selected_substitution.id;
  else
    raise exception 'Comando não suportado';
  end if;

  return new;
end;
$$;

create trigger process_workflow_command
before insert on public.workflow_commands
for each row execute function private.process_workflow_command();

revoke execute on function private.prevent_agreement_mutation() from public, anon, authenticated;
revoke execute on function private.process_workflow_command() from public, anon, authenticated;

comment on table public.workflow_commands is
  'Append-only idempotent command log. State transitions run atomically in a private trigger.';
comment on table public.shift_agreements is
  'Immutable snapshot created only after the complete confirmation workflow.';
