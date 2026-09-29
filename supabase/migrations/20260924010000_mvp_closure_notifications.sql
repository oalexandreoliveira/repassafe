create type public.completion_status as enum (
  'pending_confirmation',
  'completed',
  'disputed'
);

create type public.occurrence_status as enum ('open', 'closed');

create type public.closure_command_type as enum (
  'report_completion',
  'confirm_completion',
  'dispute_completion',
  'cancel_confirmed_substitution',
  'substitute_withdrawal',
  'review_occurrence'
);

alter table public.substitutions
  add column cancellation_reason text
  check (cancellation_reason is null or char_length(cancellation_reason) between 10 and 2000);

create table public.shift_completions (
  id uuid primary key default gen_random_uuid(),
  substitution_id uuid not null unique references public.substitutions(id),
  reported_by uuid not null references public.profiles(id),
  status public.completion_status not null default 'pending_confirmation',
  reported_at timestamptz not null default now(),
  confirmed_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.shift_occurrences (
  id uuid primary key default gen_random_uuid(),
  substitution_id uuid not null references public.substitutions(id),
  opened_by uuid not null references public.profiles(id),
  category text not null check (category in (
    'late_cancellation', 'substitute_withdrawal', 'completion_dispute', 'other'
  )),
  description text not null check (char_length(description) between 10 and 2000),
  status public.occurrence_status not null default 'open',
  decision text check (decision is null or char_length(decision) <= 2000),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'open' and reviewed_at is null) or status = 'closed')
);

create table public.closure_commands (
  id uuid primary key,
  actor_id uuid not null default auth.uid() references public.profiles(id),
  command public.closure_command_type not null,
  target_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  result_id uuid,
  created_at timestamptz not null default now(),
  unique (actor_id, id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id),
  event_type text not null,
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 500),
  href text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index shift_occurrences_substitution_idx
  on public.shift_occurrences (substitution_id, created_at desc);
create index shift_occurrences_open_idx
  on public.shift_occurrences (created_at desc) where status = 'open';
create index notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);

alter table public.shift_completions enable row level security;
alter table public.shift_occurrences enable row level security;
alter table public.closure_commands enable row level security;
alter table public.notifications enable row level security;

revoke all on public.shift_completions, public.shift_occurrences,
  public.closure_commands, public.notifications from anon, authenticated;
grant select on public.shift_completions, public.shift_occurrences,
  public.notifications to authenticated;
grant select, insert on public.closure_commands to authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy "participants read completion"
on public.shift_completions for select to authenticated
using (exists (
  select 1 from public.substitutions s
  where s.id = shift_completions.substitution_id
    and (s.owner_id = (select auth.uid()) or s.substitute_id = (select auth.uid())
      or exists (select 1 from public.group_memberships gm
        where gm.group_id = s.group_id and gm.profile_id = (select auth.uid())
          and gm.active and gm.role = 'approver'))
));

create policy "participants and approvers read occurrences"
on public.shift_occurrences for select to authenticated
using (exists (
  select 1 from public.substitutions s
  where s.id = shift_occurrences.substitution_id
    and (s.owner_id = (select auth.uid()) or s.substitute_id = (select auth.uid())
      or exists (select 1 from public.group_memberships gm
        where gm.group_id = s.group_id and gm.profile_id = (select auth.uid())
          and gm.active and gm.role = 'approver'))
));

create policy "actors read own closure commands"
on public.closure_commands for select to authenticated
using (actor_id = (select auth.uid()));
create policy "actors submit closure commands"
on public.closure_commands for insert to authenticated
with check (actor_id = (select auth.uid()));

create policy "recipients read own notifications"
on public.notifications for select to authenticated
using (recipient_id = (select auth.uid()));
create policy "recipients mark own notifications read"
on public.notifications for update to authenticated
using (recipient_id = (select auth.uid()) and read_at is null)
with check (recipient_id = (select auth.uid()) and read_at is not null);

create or replace function private.process_closure_command()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_profile public.profiles%rowtype;
  selected_substitution public.substitutions%rowtype;
  selected_offer public.shift_offers%rowtype;
  selected_completion public.shift_completions%rowtype;
  selected_occurrence public.shift_occurrences%rowtype;
  occurrence_id uuid;
  reason_text text;
  occurrence_category text;
begin
  if auth.uid() is null or new.actor_id <> auth.uid() then
    raise exception 'Sessão inválida';
  end if;
  new.result_id := null;
  select * into actor_profile from public.profiles where id = auth.uid();
  if not found or actor_profile.status <> 'approved' then
    raise exception 'O perfil precisa estar aprovado';
  end if;

  if new.command = 'review_occurrence' then
    if actor_profile.role <> 'admin' then
      raise exception 'Somente administrador pode analisar ocorrência';
    end if;
    select * into selected_occurrence from public.shift_occurrences
      where id = new.target_id for update;
    if not found or selected_occurrence.status <> 'open' then
      raise exception 'Ocorrência indisponível';
    end if;
    reason_text := nullif(trim(new.payload->>'decision'), '');
    if reason_text is null then raise exception 'A decisão exige justificativa'; end if;
    update public.shift_occurrences set status = 'closed', decision = reason_text,
      reviewed_by = new.actor_id, reviewed_at = now(), updated_at = now()
      where id = selected_occurrence.id;
    new.result_id := selected_occurrence.id;
    insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
      values (new.actor_id, 'occurrence.reviewed', 'occurrence', selected_occurrence.id);
    insert into public.notifications (recipient_id, event_type, title, body, href)
      select recipients.recipient_id, 'occurrence.reviewed', 'Ocorrência analisada',
        'A análise administrativa foi registrada.', '/plantoes/' || s.offer_id
      from public.substitutions s
      cross join lateral (values (s.owner_id), (s.substitute_id)) recipients(recipient_id)
      where s.id = selected_occurrence.substitution_id
        and recipients.recipient_id <> new.actor_id;
    return new;
  end if;

  select * into selected_substitution from public.substitutions
    where id = new.target_id for update;
  if not found then raise exception 'Substituição não encontrada'; end if;
  select * into selected_offer from public.shift_offers
    where id = selected_substitution.offer_id for update;

  if new.command = 'report_completion' then
    if new.actor_id <> selected_substitution.substitute_id
       or selected_substitution.status <> 'confirmed'
       or selected_offer.ends_at > now() then
      raise exception 'Conclusão indisponível';
    end if;
    insert into public.shift_completions (substitution_id, reported_by)
      values (selected_substitution.id, new.actor_id)
      on conflict (substitution_id) do nothing
      returning id into new.result_id;
    if new.result_id is null then raise exception 'Conclusão já registrada'; end if;
    insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
      values (new.actor_id, 'completion.reported', 'completion', new.result_id);
    insert into public.notifications (recipient_id, event_type, title, body, href)
      values (selected_substitution.owner_id, 'completion.pending', 'Confirme a realização do plantão',
        'O substituto informou que o plantão foi realizado.', '/plantoes/' || selected_offer.id);

  elsif new.command in ('confirm_completion', 'dispute_completion') then
    select * into selected_completion from public.shift_completions
      where substitution_id = selected_substitution.id for update;
    if not found or selected_completion.status <> 'pending_confirmation'
       or (new.actor_id <> selected_substitution.owner_id and not exists (
         select 1 from public.group_memberships gm
         where gm.group_id = selected_substitution.group_id
           and gm.profile_id = new.actor_id and gm.active and gm.role = 'approver'
       )) then
      raise exception 'Confirmação de conclusão não autorizada';
    end if;
    if new.command = 'confirm_completion' then
      update public.shift_completions set status = 'completed', confirmed_by = new.actor_id,
        confirmed_at = now(), updated_at = now() where id = selected_completion.id;
      insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
        values (new.actor_id, 'completion.confirmed', 'completion', selected_completion.id);
      new.result_id := selected_completion.id;
      insert into public.notifications (recipient_id, event_type, title, body, href)
        values (selected_substitution.substitute_id, 'completion.confirmed', 'Plantão concluído',
          'A realização do plantão foi confirmada.', '/plantoes/' || selected_offer.id);
    else
      reason_text := nullif(trim(new.payload->>'reason'), '');
      if reason_text is null then raise exception 'Informe o motivo da divergência'; end if;
      update public.shift_completions set status = 'disputed', updated_at = now()
        where id = selected_completion.id;
      insert into public.shift_occurrences (substitution_id, opened_by, category, description)
        values (selected_substitution.id, new.actor_id, 'completion_dispute', reason_text)
        returning id into occurrence_id;
      insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
        values (new.actor_id, 'completion.disputed', 'completion', selected_completion.id);
      insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
        values (new.actor_id, 'occurrence.opened', 'occurrence', occurrence_id);
      new.result_id := occurrence_id;
      insert into public.notifications (recipient_id, event_type, title, body, href)
        values (selected_substitution.substitute_id, 'occurrence.opened', 'Divergência sobre o plantão',
          'Foi aberta uma ocorrência para análise administrativa.', '/plantoes/' || selected_offer.id);
      insert into public.notifications (recipient_id, event_type, title, body, href)
        select p.id, 'occurrence.opened', 'Ocorrência requer análise',
          'Uma divergência de conclusão requer análise administrativa.', '/admin'
        from public.profiles p where p.role = 'admin' and p.status = 'approved';
    end if;

  elsif new.command in ('cancel_confirmed_substitution', 'substitute_withdrawal') then
    if selected_substitution.status <> 'confirmed'
       or selected_offer.starts_at <= now()
       or exists (select 1 from public.shift_completions c
         where c.substitution_id = selected_substitution.id)
       or (new.command = 'cancel_confirmed_substitution'
         and new.actor_id <> selected_substitution.owner_id)
       or (new.command = 'substitute_withdrawal'
         and new.actor_id <> selected_substitution.substitute_id) then
      raise exception 'Cancelamento não autorizado';
    end if;
    reason_text := nullif(trim(new.payload->>'reason'), '');
    if reason_text is null then raise exception 'O cancelamento exige justificativa'; end if;
    update public.substitutions set status = 'cancelled',
      cancellation_reason = reason_text, updated_at = now()
      where id = selected_substitution.id;
    update public.shift_offers set status = 'cancelled_by_owner', updated_at = now()
      where id = selected_offer.id;
    occurrence_category := case
      when selected_offer.starts_at < now() + interval '48 hours'
        then 'late_cancellation'
      when new.command = 'substitute_withdrawal' then 'substitute_withdrawal'
      else null
    end;
    if occurrence_category is not null then
      insert into public.shift_occurrences (substitution_id, opened_by, category, description)
        values (selected_substitution.id, new.actor_id, occurrence_category, reason_text)
        returning id into occurrence_id;
    end if;
    insert into public.audit_events (actor_id, event_type, entity_type, entity_id, metadata)
      values (new.actor_id,
        case when new.command = 'substitute_withdrawal'
          then 'substitution.withdrawn_by_substitute' else 'substitution.cancelled' end,
        'substitution', selected_substitution.id,
        jsonb_build_object('occurrence_id', occurrence_id));
    new.result_id := selected_substitution.id;
    if occurrence_id is not null then
      insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
        values (new.actor_id, 'occurrence.opened', 'occurrence', occurrence_id);
    end if;
    insert into public.notifications (recipient_id, event_type, title, body, href)
      values
        (case when new.actor_id = selected_substitution.owner_id
          then selected_substitution.substitute_id else selected_substitution.owner_id end,
         case when occurrence_id is null then 'substitution.cancelled' else 'occurrence.opened' end,
         case when occurrence_id is null then 'Repasse cancelado' else 'Ocorrência aberta' end,
         case when occurrence_id is null then 'A substituição confirmada foi cancelada.'
           else 'O cancelamento gerou uma ocorrência para análise.' end,
         '/plantoes/' || selected_offer.id);
    insert into public.notifications (recipient_id, event_type, title, body, href)
      select gm.profile_id, 'substitution.cancelled', 'Repasse cancelado',
        'Uma substituição confirmada do seu grupo foi cancelada.', '/plantoes/' || selected_offer.id
      from public.group_memberships gm
      join public.groups g on g.id = gm.group_id and g.requires_approval
      where gm.group_id = selected_substitution.group_id
        and gm.active and gm.role = 'approver'
        and gm.profile_id <> new.actor_id;
    if occurrence_id is not null then
      insert into public.notifications (recipient_id, event_type, title, body, href)
        select gm.profile_id, 'occurrence.opened', 'Ocorrência requer análise',
          'Uma ocorrência do seu grupo requer análise administrativa.', '/plantoes/' || selected_offer.id
        from public.group_memberships gm
        where gm.group_id = selected_substitution.group_id and gm.active and gm.role = 'approver';
      insert into public.notifications (recipient_id, event_type, title, body, href)
        select p.id, 'occurrence.opened', 'Ocorrência requer análise',
          'Um cancelamento requer análise administrativa.', '/admin'
        from public.profiles p where p.role = 'admin' and p.status = 'approved';
    end if;
  end if;
  return new;
end;
$$;

create trigger process_closure_command
before insert on public.closure_commands
for each row execute function private.process_closure_command();
revoke execute on function private.process_closure_command() from public, anon, authenticated;

create or replace function private.notify_core_workflow_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  offer_row public.shift_offers%rowtype;
  application_row public.shift_applications%rowtype;
  substitution_row public.substitutions%rowtype;
begin
  if new.event_type = 'shift_offer.published' then
    select * into offer_row from public.shift_offers where id = new.entity_id;
    insert into public.notifications (recipient_id, event_type, title, body, href)
      select gm.profile_id, 'offer.published', 'Novo plantão disponível',
        'Uma nova oferta foi publicada no seu grupo.', '/plantoes/' || offer_row.id
      from public.group_memberships gm
      where gm.group_id = offer_row.group_id and gm.active
        and gm.profile_id <> new.actor_id;
  elsif new.event_type = 'shift_application.created' then
    select * into application_row from public.shift_applications where id = new.entity_id;
    select * into offer_row from public.shift_offers where id = application_row.offer_id;
    insert into public.notifications (recipient_id, event_type, title, body, href)
      values (offer_row.owner_id, 'application.created', 'Nova candidatura recebida',
        'Um profissional manifestou interesse no plantão.', '/plantoes/' || offer_row.id);
  elsif new.event_type in (
    'substitution.selected', 'substitution.declined',
    'substitution.confirmed_by_substitute', 'substitution.confirmed',
    'substitution.approved', 'substitution.rejected'
  ) then
    select * into substitution_row from public.substitutions where id = new.entity_id;
    if not found then return new; end if;
    select * into offer_row from public.shift_offers where id = substitution_row.offer_id;
    if new.event_type = 'substitution.selected' then
      insert into public.notifications (recipient_id, event_type, title, body, href)
        values (substitution_row.substitute_id, 'substitution.selected', 'Você foi selecionado',
          'Revise as condições e responda dentro do prazo.', '/plantoes/' || offer_row.id);
    elsif new.event_type = 'substitution.confirmed_by_substitute' then
      insert into public.notifications (recipient_id, event_type, title, body, href)
        select gm.profile_id, 'approval.pending', 'Aprovação institucional pendente',
          'Uma substituição aguarda sua decisão.', '/plantoes/' || offer_row.id
        from public.group_memberships gm where gm.group_id = substitution_row.group_id
          and gm.active and gm.role = 'approver';
      insert into public.notifications (recipient_id, event_type, title, body, href)
        values (substitution_row.owner_id, 'approval.pending', 'Repasse aguardando aprovação',
          'O substituto confirmou as condições; falta a decisão institucional.', '/plantoes/' || offer_row.id);
    else
      insert into public.notifications (recipient_id, event_type, title, body, href)
        select recipient_id, new.event_type,
          case new.event_type
            when 'substitution.confirmed' then 'Repasse confirmado'
            when 'substitution.approved' then 'Repasse aprovado'
            when 'substitution.rejected' then 'Repasse rejeitado'
            else 'Candidato recusou o repasse'
          end,
          case new.event_type
            when 'substitution.confirmed' then 'O acordo foi registrado.'
            when 'substitution.approved' then 'A instituição aprovou o repasse.'
            when 'substitution.rejected' then 'A instituição rejeitou o repasse.'
            else 'A oferta voltou a permitir nova seleção.'
          end,
          '/plantoes/' || offer_row.id
        from (values (substitution_row.owner_id), (substitution_row.substitute_id)) recipients(recipient_id)
        where recipient_id <> new.actor_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger notify_core_workflow_event
after insert on public.audit_events
for each row execute function private.notify_core_workflow_event();
revoke execute on function private.notify_core_workflow_event() from public, anon, authenticated;

create or replace function private.prevent_closure_record_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Registros de conclusão e ocorrência são imutáveis no MVP';
end;
$$;

create trigger shift_completions_immutable
before delete on public.shift_completions
for each row execute function private.prevent_closure_record_mutation();
create trigger shift_occurrences_no_delete
before delete on public.shift_occurrences
for each row execute function private.prevent_closure_record_mutation();
create trigger notifications_no_delete
before delete on public.notifications
for each row execute function private.prevent_closure_record_mutation();
revoke execute on function private.prevent_closure_record_mutation() from public, anon, authenticated;

comment on table public.notifications is
  'In-app transactional notifications for MVP closure and occurrence events; persisted workflow state remains authoritative.';
