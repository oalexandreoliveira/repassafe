-- Agenda, etapa 2 (docs/product/personal-agenda.md): lembretes de pagamento.
-- Avisos só na central do app, uma vez por dia às 8h de Fortaleza. Primeiro
-- aviso no vencimento ou antes dele; depois, repetição até marcar recebido ou
-- pago, por no máximo 182 dias após o vencimento. O texto não leva valor nem
-- nomes. Lembretes são preferências pessoais: não alteram acordos.

alter table public.agenda_entries
  add column reminder_enabled boolean not null default true,
  add column reminder_lead_days smallint not null default 0 check (reminder_lead_days in (0,1,3,7)),
  add column reminder_repeat_days smallint not null default 7 check (reminder_repeat_days in (0,7,15));

-- Preferência pessoal sobre um repasse do mural ou acordo registrado.
-- Sem linha, vale o padrão: ligado, aviso no vencimento, repetição semanal.
create table public.agenda_record_reminders (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  source text not null check (source in ('mural','registered')),
  record_id uuid not null,
  enabled boolean not null default true,
  lead_days smallint not null default 0 check (lead_days in (0,1,3,7)),
  repeat_days smallint not null default 7 check (repeat_days in (0,7,15)),
  updated_at timestamptz not null default now(),
  primary key (owner_id, source, record_id)
);
alter table public.agenda_record_reminders enable row level security;
revoke all on public.agenda_record_reminders from public, anon, authenticated, service_role;
grant select on public.agenda_record_reminders to authenticated;
create policy "authors read own record reminders" on public.agenda_record_reminders
  for select to authenticated using (owner_id = (select auth.uid()));

-- Um envio por item e por data prevista: a rotina pode rodar de novo sem repetir avisos.
create table private.agenda_reminder_deliveries (
  owner_id uuid not null,
  source text not null check (source in ('personal','mural','registered')),
  record_id uuid not null,
  slot_date date not null,
  sent_at timestamptz not null default now(),
  primary key (owner_id, source, record_id, slot_date)
);
alter table private.agenda_reminder_deliveries enable row level security;
revoke all on private.agenda_reminder_deliveries from public, anon, authenticated, service_role;

-- Data prevista mais recente até run_date: antecedência, vencimento e repetições.
create function private.agenda_reminder_slot(due date, lead_days integer, repeat_days integer, run_date date)
returns date language sql immutable set search_path = '' as $$
  select case
    when due is null or run_date < due - lead_days then null
    when run_date < due then due - lead_days
    when repeat_days = 0 then due
    else due + (least(run_date - due, 182) / repeat_days) * repeat_days
  end;
$$;

-- Itens com pagamento em aberto e lembrete ligado, pela perspectiva de cada parte.
create function private.agenda_reminder_candidates()
returns table(owner_id uuid, source text, record_id uuid, direction text, due_date date,
  starts_at timestamptz, reported boolean, lead_days integer, repeat_days integer, href text)
language sql stable security definer set search_path = '' as $$
  select * from (
    select e.owner_id, 'personal'::text, e.id,
      case when e.kind = 'passed' then 'pay' else 'receive' end,
      e.due_date, e.starts_at, false,
      e.reminder_lead_days::integer, e.reminder_repeat_days::integer,
      '/agenda/' || e.id
    from public.agenda_entries e
    where e.due_date is not null and e.settled_on is null and e.reminder_enabled
    union all
    select p.party, 'mural', a.id, p.direction, a.payment_due_date,
      (a.snapshot->>'starts_at')::timestamptz,
      exists(select 1 from public.agreement_payment_events ev where ev.agreement_id = a.id and ev.kind = 'payment'),
      coalesce(r.lead_days, 0)::integer, coalesce(r.repeat_days, 7)::integer,
      '/agenda/pagamento/repasse/' || a.id
    from public.shift_agreements a
    join public.substitutions s on s.id = a.substitution_id and s.status <> 'cancelled'
    cross join lateral (values (a.owner_id, 'pay'), (a.substitute_id, 'receive')) p(party, direction)
    left join public.agenda_record_reminders r
      on r.owner_id = p.party and r.source = 'mural' and r.record_id = a.id
    where a.payment_due_date is not null
      and not exists(select 1 from public.agreement_payment_events ev where ev.agreement_id = a.id and ev.kind = 'receive')
      and coalesce(r.enabled, true)
    union all
    select p.party, 'registered', a.id, p.direction, a.due_date, a.starts_at,
      exists(select 1 from public.external_agreement_events ev where ev.agreement_id = a.id and ev.kind = 'payment_reported'),
      coalesce(r.lead_days, 0)::integer, coalesce(r.repeat_days, 7)::integer,
      '/agenda/pagamento/acordo/' || a.id
    from public.external_agreements a
    cross join lateral (values (a.owner_id, 'pay'), (a.substitute_id, 'receive')) p(party, direction)
    left join public.agenda_record_reminders r
      on r.owner_id = p.party and r.source = 'registered' and r.record_id = a.id
    where a.status = 'confirmed' and a.received_at is null and p.party is not null
      and coalesce(r.enabled, true)
  ) c(owner_id, source, record_id, direction, due_date, starts_at, reported, lead_days, repeat_days, href)
  -- Quem paga já fez sua parte ao informar o pagamento; quem recebe é lembrado de confirmar.
  where not (c.direction = 'pay' and c.reported)
    and private.agenda_eligible(c.owner_id);
$$;

create function private.agenda_send_reminders(run_date date default (now() at time zone 'America/Fortaleza')::date)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  item record;
  slot date;
  days integer;
  subject text;
  sent integer := 0;
begin
  for item in select * from private.agenda_reminder_candidates() loop
    slot := private.agenda_reminder_slot(item.due_date, item.lead_days, item.repeat_days, run_date);
    continue when slot is null;
    insert into private.agenda_reminder_deliveries(owner_id, source, record_id, slot_date)
      values (item.owner_id, item.source, item.record_id, slot)
      on conflict do nothing;
    continue when not found;
    days := item.due_date - run_date;
    subject := case when item.direction = 'pay' then 'Pagamento a fazer' else 'Pagamento a receber' end;
    insert into public.notifications(recipient_id, event_type, title, body, href) values (
      item.owner_id,
      'agenda.payment_reminder',
      case
        when item.direction = 'receive' and item.reported then 'Pagamento informado: confirme se recebeu'
        when days > 1 then subject || ' vence em ' || days || ' dias'
        when days = 1 then subject || ' vence amanhã'
        when days = 0 then subject || ' vence hoje'
        else subject || ' está vencido'
      end,
      'Plantão de ' || to_char(item.starts_at at time zone 'America/Fortaleza', 'DD/MM') || '. Confira na agenda.',
      item.href
    );
    sent := sent + 1;
  end loop;
  return sent;
end;
$$;

-- Comando da agenda: lembrete nas anotações e preferência sobre registros do app.
create or replace function private.agenda_command(request_ref uuid, operation text, entry_ref uuid, input jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  today date := (now() at time zone 'America/Fortaleza')::date;
  shifts jsonb := input->'shifts';
  item jsonb;
  shift_day date;
  v_kind text := input->>'kind';
  v_location text := trim(coalesce(input->>'location', ''));
  v_sector text := trim(coalesce(input->>'sector', ''));
  v_method text := trim(coalesce(input->>'payment_method', ''));
  v_counterparty text := trim(coalesce(input->>'counterparty', ''));
  v_notes text := trim(coalesce(input->>'notes', ''));
  v_value integer;
  v_start timestamptz;
  v_end timestamptz;
  v_due date;
  v_settled_on date;
  v_settled_cents integer;
  v_rem_enabled boolean;
  v_rem_lead smallint;
  v_rem_repeat smallint;
  v_source text;
  entry public.agenda_entries%rowtype;
  existing integer;
begin
  if actor is null then raise exception 'Sessão inválida'; end if;
  if not private.agenda_eligible(actor) then raise exception 'Agenda indisponível para esta conta'; end if;
  if operation is null or operation not in ('create','update','delete','settle','unsettle','record_reminder') then
    raise exception 'Ação inválida';
  end if;

  if operation in ('create','update','record_reminder') then
    begin
      v_rem_enabled := coalesce((input->'reminder'->>'enabled')::boolean, true);
      v_rem_lead := coalesce((input->'reminder'->>'lead_days')::smallint, 0);
      v_rem_repeat := coalesce((input->'reminder'->>'repeat_days')::smallint, 7);
    exception when others then
      raise exception 'Lembrete inválido';
    end;
    if v_rem_lead not in (0,1,3,7) or v_rem_repeat not in (0,7,15) then raise exception 'Lembrete inválido'; end if;
  end if;

  if operation = 'record_reminder' then
    v_source := input->>'source';
    if v_source = 'mural' then
      if not exists(select 1 from public.shift_agreements a where a.id = entry_ref and actor in (a.owner_id, a.substitute_id)) then
        raise exception 'Registro indisponível';
      end if;
    elsif v_source = 'registered' then
      if not exists(select 1 from public.external_agreements a where a.id = entry_ref and a.status = 'confirmed' and actor in (a.owner_id, a.substitute_id)) then
        raise exception 'Registro indisponível';
      end if;
    else
      raise exception 'Registro indisponível';
    end if;
    insert into public.agenda_record_reminders(owner_id, source, record_id, enabled, lead_days, repeat_days, updated_at)
      values (actor, v_source, entry_ref, v_rem_enabled, v_rem_lead, v_rem_repeat, now())
      on conflict (owner_id, source, record_id) do update
        set enabled = excluded.enabled, lead_days = excluded.lead_days,
            repeat_days = excluded.repeat_days, updated_at = now();
    return jsonb_build_object('id', entry_ref);
  end if;

  if operation in ('create','update') then
    if v_kind is null or v_kind not in ('own','took','passed') then raise exception 'Selecione o tipo do plantão'; end if;
    if length(v_location) not between 2 and 160 then raise exception 'Informe a instituição e o local'; end if;
    if length(v_sector) > 120 or length(v_method) > 120 or length(v_counterparty) > 120 or length(v_notes) > 1000 then
      raise exception 'Texto acima do limite';
    end if;
    begin
      v_value := nullif(input->>'value_cents', '')::integer;
    exception when others then
      raise exception 'Valor inválido';
    end;
    if v_value is not null and v_value not between 1 and 999999999 then raise exception 'Valor inválido'; end if;
    if jsonb_typeof(shifts) is distinct from 'array' or jsonb_array_length(shifts) not between 1 and 31 then
      raise exception 'Selecione de 1 a 31 datas';
    end if;
    if operation = 'update' and jsonb_array_length(shifts) <> 1 then raise exception 'Selecione uma data'; end if;
    for item in select value from jsonb_array_elements(shifts) loop
      begin
        v_start := (item->>'starts_at')::timestamptz;
        v_end := (item->>'ends_at')::timestamptz;
        v_due := nullif(item->>'due_date', '')::date;
      exception when others then
        raise exception 'Data ou horário inválido';
      end;
      if v_start is null or v_end is null or not isfinite(v_start) or not isfinite(v_end) then
        raise exception 'Data ou horário inválido';
      end if;
      if v_end <= v_start or v_end > v_start + interval '48 hours' then
        raise exception 'O término deve ser posterior ao início, em até 48 horas';
      end if;
      shift_day := (v_start at time zone 'America/Fortaleza')::date;
      if shift_day not between today - 730 and today + 400 then
        raise exception 'Escolha datas entre dois anos atrás e um ano à frente';
      end if;
      if v_due is not null and (not isfinite(v_due) or v_due < shift_day or v_due > shift_day + 365) then
        raise exception 'A data-limite deve ficar entre o dia do plantão e um ano depois';
      end if;
    end loop;
    if (select count(distinct (value->>'starts_at')::timestamptz) from jsonb_array_elements(shifts)) <> jsonb_array_length(shifts) then
      raise exception 'Datas repetidas';
    end if;
  end if;

  if operation = 'create' then
    if request_ref is null then raise exception 'Ação inválida'; end if;
    perform pg_advisory_xact_lock(hashtextextended(actor::text || ':' || request_ref::text, 0));
    select count(*) into existing from public.agenda_entries where owner_id = actor and request_id = request_ref;
    if existing > 0 then
      if existing <> jsonb_array_length(shifts) or exists (
        select 1
        from jsonb_array_elements(shifts) with ordinality s(value, ordinality)
        left join public.agenda_entries e
          on e.owner_id = actor and e.request_id = request_ref and e.request_index = s.ordinality - 1
        where e.id is null or e.kind <> v_kind or e.location <> v_location or e.sector <> v_sector
          or e.value_cents is distinct from v_value or e.payment_method <> v_method
          or e.counterparty <> v_counterparty or e.notes <> v_notes
          or e.starts_at <> (s.value->>'starts_at')::timestamptz
          or e.ends_at <> (s.value->>'ends_at')::timestamptz
          or e.due_date is distinct from nullif(s.value->>'due_date', '')::date
          or e.reminder_enabled <> v_rem_enabled or e.reminder_lead_days <> v_rem_lead
          or e.reminder_repeat_days <> v_rem_repeat
      ) then
        raise exception 'Comando já utilizado com outros dados';
      end if;
    else
      if (select count(*) from public.agenda_entries where owner_id = actor) + jsonb_array_length(shifts) > 3000 then
        raise exception 'Limite de anotações atingido';
      end if;
      insert into public.agenda_entries(
        owner_id, request_id, request_index, kind, starts_at, ends_at, location, sector,
        value_cents, due_date, payment_method, counterparty, notes,
        reminder_enabled, reminder_lead_days, reminder_repeat_days
      )
      select actor, request_ref, (s.ordinality - 1)::smallint, v_kind,
        (s.value->>'starts_at')::timestamptz, (s.value->>'ends_at')::timestamptz,
        v_location, v_sector, v_value, nullif(s.value->>'due_date', '')::date,
        v_method, v_counterparty, v_notes, v_rem_enabled, v_rem_lead, v_rem_repeat
      from jsonb_array_elements(shifts) with ordinality s(value, ordinality);
    end if;
    return jsonb_build_object('ids', (
      select jsonb_agg(id order by request_index) from public.agenda_entries
      where owner_id = actor and request_id = request_ref
    ));
  end if;

  if operation = 'delete' then
    delete from public.agenda_entries where id = entry_ref and owner_id = actor;
    if found then
      delete from private.agenda_reminder_deliveries
        where owner_id = actor and source = 'personal' and record_id = entry_ref;
      return jsonb_build_object('deleted', true);
    end if;
    return jsonb_build_object('deleted', false);
  end if;

  select * into entry from public.agenda_entries where id = entry_ref and owner_id = actor for update;
  if not found then raise exception 'Plantão indisponível'; end if;

  if operation = 'update' then
    item := shifts->0;
    update public.agenda_entries set
      kind = v_kind,
      starts_at = (item->>'starts_at')::timestamptz,
      ends_at = (item->>'ends_at')::timestamptz,
      due_date = nullif(item->>'due_date', '')::date,
      location = v_location,
      sector = v_sector,
      value_cents = v_value,
      payment_method = v_method,
      counterparty = v_counterparty,
      notes = v_notes,
      reminder_enabled = v_rem_enabled,
      reminder_lead_days = v_rem_lead,
      reminder_repeat_days = v_rem_repeat,
      updated_at = now()
    where id = entry.id;
    return jsonb_build_object('id', entry.id);
  end if;

  if operation = 'settle' then
    begin
      v_settled_on := (input->>'settled_on')::date;
      v_settled_cents := (input->>'settled_cents')::integer;
    exception when others then
      raise exception 'Informe a data e o valor';
    end;
    if v_settled_on is null or not isfinite(v_settled_on) or v_settled_on > today
      or v_settled_on < (entry.starts_at at time zone 'America/Fortaleza')::date - 365 then
      raise exception 'Informe uma data válida, até hoje';
    end if;
    if v_settled_cents is null or v_settled_cents not between 1 and 999999999 then
      raise exception 'Informe o valor';
    end if;
    update public.agenda_entries
      set settled_on = v_settled_on, settled_cents = v_settled_cents, updated_at = now()
      where id = entry.id;
    return jsonb_build_object('id', entry.id);
  end if;

  -- unsettle
  update public.agenda_entries set settled_on = null, settled_cents = null, updated_at = now() where id = entry.id;
  return jsonb_build_object('id', entry.id);
end;
$$;

revoke all on function private.agenda_reminder_slot(date,integer,integer,date),
  private.agenda_reminder_candidates(), private.agenda_send_reminders(date),
  private.agenda_command(uuid,text,uuid,jsonb)
  from public, anon, authenticated;
grant execute on function private.agenda_command(uuid,text,uuid,jsonb) to authenticated;

-- Rotina diária às 11h UTC (8h em Fortaleza, sem horário de verão).
do $$
declare
  current_job record;
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'pg_cron ausente: lembretes da agenda não agendados';
    return;
  end if;
  for current_job in select jobid from cron.job where jobname = 'agenda-payment-reminders' loop
    perform cron.unschedule(current_job.jobid);
  end loop;
  perform cron.schedule('agenda-payment-reminders', '0 11 * * *', 'select private.agenda_send_reminders()');
end;
$$;
