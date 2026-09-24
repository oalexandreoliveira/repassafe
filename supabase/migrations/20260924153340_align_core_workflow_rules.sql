-- The platform distinguishes doctors from administrators. Keep the DB command
-- boundary authoritative even when a Server Action is invoked directly.
create or replace function private.prevent_admin_workflow_commands()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.profiles p
    where p.id = new.actor_id and p.role = 'admin'
  ) then
    raise exception 'Administrador não pode operar como médico';
  end if;
  return new;
end;
$$;

create trigger prevent_admin_workflow_commands
before insert on public.workflow_commands
for each row execute function private.prevent_admin_workflow_commands();
revoke execute on function private.prevent_admin_workflow_commands()
  from public, anon, authenticated;

create or replace function private.enforce_confirmation_business_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.command = 'select_candidate' then
    -- The published MVP rule fixes this window at 30 minutes. Ignore any
    -- client-supplied override before the core transition reads the payload.
    new.payload := new.payload - 'confirmation_minutes';
  elsif new.command = 'confirm_substitution'
        and coalesce((new.payload->>'accepted')::boolean, false)
        and coalesce((new.payload->>'terms_acknowledged')::boolean, false) = false then
    raise exception 'A confirmação exige aceite explícito das condições';
  end if;
  return new;
end;
$$;

create trigger enforce_confirmation_business_rules
before insert on public.workflow_commands
for each row execute function private.enforce_confirmation_business_rules();
revoke execute on function private.enforce_confirmation_business_rules()
  from public, anon, authenticated;

-- Record and notify a confirmation timeout regardless of which path updates
-- the substitution (the periodic job or the next workflow command).
create or replace function private.notify_expired_substitute_confirmation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  offer_row public.shift_offers%rowtype;
begin
  if old.status = 'pending_substitute_confirmation'
     and new.status = 'cancelled'
     and old.confirmation_deadline <= now() then
    select * into offer_row from public.shift_offers where id = new.offer_id;
    insert into public.audit_events (actor_id, event_type, entity_type, entity_id, metadata)
    values (null, 'substitution.confirmation_expired', 'substitution', new.id,
      jsonb_build_object('offer_id', new.offer_id, 'reason', 'deadline_expired'));
    insert into public.notifications (recipient_id, event_type, title, body, href)
    values
      (new.owner_id, 'substitution.confirmation_expired', 'Prazo de confirmação encerrado',
        'O candidato não confirmou dentro do prazo e a oferta voltou a ficar disponível.',
        '/plantoes/' || offer_row.id),
      (new.substitute_id, 'substitution.confirmation_expired', 'Prazo de confirmação encerrado',
        'O prazo para confirmar este repasse terminou.', '/plantoes/' || offer_row.id);
  end if;
  return new;
end;
$$;

create trigger notify_expired_substitute_confirmation
after update of status on public.substitutions
for each row execute function private.notify_expired_substitute_confirmation();
revoke execute on function private.notify_expired_substitute_confirmation()
  from public, anon, authenticated;

create or replace function private.record_confirmation_expiry_funnel_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_group_id uuid;
begin
  if new.event_type <> 'substitution.confirmation_expired'
     or new.entity_type <> 'substitution' then
    return new;
  end if;
  select group_id into selected_group_id
  from public.substitutions where id = new.entity_id;
  insert into public.pilot_funnel_events (
    source_audit_event_id, event_type, group_id, occurred_at
  ) values (
    new.id, 'substitution_cancelled', selected_group_id, new.occurred_at
  ) on conflict (source_audit_event_id) do nothing;
  return new;
end;
$$;

create trigger record_confirmation_expiry_funnel_event
after insert on public.audit_events
for each row execute function private.record_confirmation_expiry_funnel_event();
revoke execute on function private.record_confirmation_expiry_funnel_event()
  from public, anon, authenticated;

create index substitutions_confirmation_deadline_idx
  on public.substitutions (confirmation_deadline)
  where status = 'pending_substitute_confirmation';

-- Run at minute precision so statuses, audit, notifications and funnel data do
-- not depend on someone submitting a later command.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create or replace function private.expire_stale_shift_workflows()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  stale record;
  offer_row public.shift_offers%rowtype;
  processed integer := 0;
  next_status public.shift_offer_status;
begin
  for stale in
    select s.id, s.offer_id, s.application_id
    from public.substitutions s
    where s.status = 'pending_substitute_confirmation'
      and s.confirmation_deadline <= now()
    order by s.confirmation_deadline, s.id
    for update skip locked
  loop
    select * into offer_row
    from public.shift_offers
    where id = stale.offer_id
    for update;

    update public.substitutions
    set status = 'cancelled', updated_at = now()
    where id = stale.id
      and status = 'pending_substitute_confirmation'
      and confirmation_deadline <= now();
    if not found then continue; end if;

    update public.shift_applications
    set status = 'confirmation_expired', updated_at = now()
    where id = stale.application_id
      and status = 'selected_pending_confirmation';

    next_status := case
      when offer_row.starts_at <= now() then 'expired'::public.shift_offer_status
      when offer_row.starts_at <= now() + interval '48 hours'
        then 'open_emergency'::public.shift_offer_status
      else 'open_normal'::public.shift_offer_status
    end;
    update public.shift_offers
    set status = next_status, selected_application_id = null, updated_at = now()
    where id = stale.offer_id and status = 'selection_in_progress';

    processed := processed + 1;
  end loop;

  update public.shift_offers
  set status = 'expired', updated_at = now()
  where status in ('open_normal', 'open_emergency') and starts_at <= now();

  return processed;
end;
$$;
revoke execute on function private.expire_stale_shift_workflows()
  from public, anon, authenticated;

do $$
declare
  current_job record;
begin
  for current_job in
    select jobid from cron.job where jobname = 'expire-stale-shift-workflows'
  loop
    perform cron.unschedule(current_job.jobid);
  end loop;
  perform cron.schedule(
    'expire-stale-shift-workflows',
    '* * * * *',
    'select private.expire_stale_shift_workflows()'
  );
end;
$$;

comment on function private.expire_stale_shift_workflows() is
  'Expires timed-out confirmations and started offers; emits audit, notifications, and funnel events.';
