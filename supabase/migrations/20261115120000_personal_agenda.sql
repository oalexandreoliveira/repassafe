-- Agenda pessoal (docs/product/personal-agenda.md, etapa 1).
-- Anotações privadas de plantões e pagamentos do próprio médico. Não são
-- acordos: não têm aceite de terceiros, não notificam ninguém, não geram
-- auditoria com conteúdo e são legíveis apenas pelo autor.
create table public.agenda_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null,
  request_index smallint not null check (request_index between 0 and 30),
  kind text not null check (kind in ('own','took','passed')),
  starts_at timestamptz not null check (isfinite(starts_at)),
  ends_at timestamptz not null check (isfinite(ends_at)),
  location text not null check (location = trim(location) and length(location) between 2 and 160),
  sector text not null default '' check (sector = trim(sector) and length(sector) <= 120),
  value_cents integer check (value_cents between 1 and 999999999),
  due_date date check (isfinite(due_date)),
  payment_method text not null default '' check (payment_method = trim(payment_method) and length(payment_method) <= 120),
  counterparty text not null default '' check (counterparty = trim(counterparty) and length(counterparty) <= 120),
  notes text not null default '' check (length(notes) <= 1000),
  settled_on date check (isfinite(settled_on)),
  settled_cents integer check (settled_cents between 1 and 999999999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, request_id, request_index),
  check (ends_at > starts_at and ends_at <= starts_at + interval '48 hours'),
  check (due_date is null or due_date >= (starts_at at time zone 'America/Fortaleza')::date),
  check ((settled_on is null) = (settled_cents is null))
);
create index agenda_entries_owner_start_idx on public.agenda_entries (owner_id, starts_at);
create index agenda_entries_owner_due_idx on public.agenda_entries (owner_id, due_date) where due_date is not null;

alter table public.agenda_entries enable row level security;
revoke all on public.agenda_entries from public, anon, authenticated, service_role;
grant select on public.agenda_entries to authenticated;
-- Somente o autor lê. Aprovadores, administração e service_role não têm
-- política nem grant: a agenda não é evidência nem objeto de operação.
create policy "authors read own agenda" on public.agenda_entries
  for select to authenticated using (owner_id = (select auth.uid()));

-- Médicos com identificação enviada, inclusive com análise pendente ou em
-- correção. A agenda não concede habilitação, vínculo nem autorização.
create function private.agenda_eligible(person uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.profiles p
    where p.id = person and p.role = 'doctor'
      and p.status in ('pending','approved','changes_requested')
  );
$$;

create function private.agenda_command(request_ref uuid, operation text, entry_ref uuid, input jsonb)
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
  entry public.agenda_entries%rowtype;
  existing integer;
begin
  if actor is null then raise exception 'Sessão inválida'; end if;
  if not private.agenda_eligible(actor) then raise exception 'Agenda indisponível para esta conta'; end if;
  if operation is null or operation not in ('create','update','delete','settle','unsettle') then
    raise exception 'Ação inválida';
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
      ) then
        raise exception 'Comando já utilizado com outros dados';
      end if;
    else
      if (select count(*) from public.agenda_entries where owner_id = actor) + jsonb_array_length(shifts) > 3000 then
        raise exception 'Limite de anotações atingido';
      end if;
      insert into public.agenda_entries(
        owner_id, request_id, request_index, kind, starts_at, ends_at, location, sector,
        value_cents, due_date, payment_method, counterparty, notes
      )
      select actor, request_ref, (s.ordinality - 1)::smallint, v_kind,
        (s.value->>'starts_at')::timestamptz, (s.value->>'ends_at')::timestamptz,
        v_location, v_sector, v_value, nullif(s.value->>'due_date', '')::date,
        v_method, v_counterparty, v_notes
      from jsonb_array_elements(shifts) with ordinality s(value, ordinality);
    end if;
    return jsonb_build_object('ids', (
      select jsonb_agg(id order by request_index) from public.agenda_entries
      where owner_id = actor and request_id = request_ref
    ));
  end if;

  if operation = 'delete' then
    delete from public.agenda_entries where id = entry_ref and owner_id = actor;
    return jsonb_build_object('deleted', found);
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

create function public.agenda_command(request_ref uuid, operation text, entry_ref uuid default null, input jsonb default '{}')
returns jsonb language sql security invoker set search_path = '' as $$
  select private.agenda_command(request_ref, operation, entry_ref, input);
$$;

revoke all on function private.agenda_eligible(uuid), private.agenda_command(uuid,text,uuid,jsonb), public.agenda_command(uuid,text,uuid,jsonb) from public, anon, authenticated;
grant execute on function private.agenda_command(uuid,text,uuid,jsonb), public.agenda_command(uuid,text,uuid,jsonb) to authenticated;
