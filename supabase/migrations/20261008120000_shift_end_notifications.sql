-- Regra de negócio: ao término da jornada do plantão, apenas o médico que
-- assumiu é notificado para registrar a finalização. O titular (que repassou)
-- só é notificado, para confirmar, depois que o substituto registrar (aviso
-- `completion.pending` de `report_completion`); o titular não registra primeiro.

alter table public.substitutions
  add column end_notified_at timestamptz;

create index substitutions_end_notification_idx
  on public.substitutions (offer_id)
  where status = 'confirmed' and end_notified_at is null;

create or replace function private.notify_shift_end()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  due record;
  processed integer := 0;
begin
  for due in
    select s.id, s.owner_id, s.substitute_id, s.offer_id
    from public.substitutions s
    join public.shift_offers o on o.id = s.offer_id
    where s.status = 'confirmed'
      and s.end_notified_at is null
      and o.ends_at <= now()
      and not exists (
        select 1 from public.shift_completions c where c.substitution_id = s.id
      )
    order by o.ends_at, s.id
    for update of s skip locked
  loop
    update public.substitutions
    set end_notified_at = now()
    where id = due.id and end_notified_at is null;
    if not found then continue; end if;

    insert into public.notifications (recipient_id, event_type, title, body, href)
    values
      (due.substitute_id, 'shift.ended_register_completion',
        'Plantão encerrado: registre a finalização',
        'A jornada do plantão terminou. Registre a finalização para que o titular a confirme.',
        '/plantoes/' || due.offer_id);
    insert into public.audit_events (actor_id, event_type, entity_type, entity_id, metadata)
    values (null, 'substitution.shift_ended_notified', 'substitution', due.id,
      jsonb_build_object('offer_id', due.offer_id));

    processed := processed + 1;
  end loop;
  return processed;
end;
$$;
revoke execute on function private.notify_shift_end()
  from public, anon, authenticated;

create or replace function private.require_substitute_to_report_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.command = 'report_completion' and exists (
    select 1 from public.substitutions s
    where s.id = new.target_id and s.owner_id = new.actor_id
  ) then
    raise exception 'Somente o médico que assumiu o plantão registra a finalização';
  end if;
  return new;
end;
$$;
revoke execute on function private.require_substitute_to_report_completion()
  from public, anon, authenticated;

-- Fires before private.process_closure_command (triggers run alphabetically).
create trigger a_require_substitute_to_report_completion
before insert on public.closure_commands
for each row execute function private.require_substitute_to_report_completion();

do $$
declare
  current_job record;
begin
  for current_job in
    select jobid from cron.job where jobname = 'notify-shift-end'
  loop
    perform cron.unschedule(current_job.jobid);
  end loop;
  perform cron.schedule(
    'notify-shift-end',
    '* * * * *',
    'select private.notify_shift_end()'
  );
end;
$$;

comment on function private.notify_shift_end() is
  'At shift end, asks the substitute to register completion; idempotent via substitutions.end_notified_at.';
