-- Revisão independente de 10/11/2026 (docs/reviews/revisao-independente-fable-2026-11-10.md).
-- Item 1: suspensão não é desfeita pelo reenvio do cadastro.
-- Item 2: decisão institucional com segregação, partes habilitadas e antes do início.
-- Item 3: aprovação pendente expira no início do plantão e pode ser retirada pelas partes.
-- Item 6: a reconferência no aceite usa a mesma conversão booleana do fluxo central.

-- Item 1 -----------------------------------------------------------------------------
-- O reenvio de uma conta suspensa entra na fila de análise sem alterar a situação do
-- perfil; só uma decisão da equipe encerra a suspensão.
do $$
declare
  definition text;
  original text;
begin
  definition := replace(
    pg_get_functiondef('public.registration_submit(uuid,integer)'::regprocedure), chr(13), '');
  original := definition;
  definition := replace(definition,
    'role=excluded.role,status=''pending'',',
    'role=excluded.role,status=case when profiles.status=''suspended'' then profiles.status else ''pending''::public.profile_status end,');
  if definition = original then
    raise exception 'Envio de cadastro incompatível com a preservação da suspensão';
  end if;
  execute definition;
end;
$$;

-- A exceção do registro direto para análise pendente vale para quem ainda não teve
-- decisão negativa. Depois de uma rejeição ou suspensão, só a aprovação habilita.
create or replace function private.external_eligible(person uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p join auth.users u on u.id=p.id
    join private.registration_drafts d on d.user_id=p.id
    where p.id=person and p.role='doctor' and p.status in ('pending','approved')
      and (p.status='pending' or p.verification_valid_until>now())
      and (p.status='approved' or not exists (
        select 1 from private.registration_decisions r
        where r.user_id=p.id and r.outcome in ('rejected','suspended')))
      and u.email_confirmed_at is not null and u.deleted_at is null
      and (u.banned_until is null or u.banned_until<now())
      and length(trim(d.civil_name))>=3 and d.cpf is not null and d.birth_date is not null
      and d.phone is not null and d.data->>'practicesMedicine'='yes'
      and p.crm_number ~ '^[0-9]{4,12}$' and p.crm_state in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')
  );
$$;
revoke all on function private.external_eligible(uuid) from public, anon, authenticated;

-- Itens 2 e 6 ------------------------------------------------------------------------
create or replace function private.feedback_workflow_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  due date;
  candidate uuid;
  owner_ref uuid;
  pending public.substitutions%rowtype;
begin
 if new.command in ('publish_offer','update_offer') then
   if coalesce(new.payload->>'payment_due_date','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'Informe uma data-limite de pagamento'; end if;
   due:=(new.payload->>'payment_due_date')::date;
   if not isfinite(due) or due < (now() at time zone 'America/Fortaleza')::date then raise exception 'Data-limite de pagamento inválida'; end if;
   new.payload := jsonb_set(new.payload,'{payment_terms}',to_jsonb('Quem repassa paga a quem assume até ' || to_char(due,'DD/MM/YYYY') || '. A data-limite vale mesmo se o hospital atrasar o pagamento. ' || coalesce(new.payload->>'payment_terms','')));
   if length(new.payload->>'payment_terms')>300 then raise exception 'Reduza as condições adicionais de pagamento'; end if;
 end if;
 if new.command='select_candidate' then
   select candidate_id into candidate from public.shift_applications where id=new.target_id;
 elsif new.command='confirm_substitution' and coalesce((new.payload->>'accepted')::boolean,false) then
   -- Mesma conversão do fluxo central: "yes", "t" e "1" também são aceite.
   select substitute_id,owner_id into candidate,owner_ref from public.substitutions where id=new.target_id;
 elsif new.command='decide_substitution' then
   select * into pending from public.substitutions where id=new.target_id;
   -- Só quem pode decidir recebe respostas sobre a situação das partes.
   if found and pending.status='pending_institutional_approval' and exists(
     select 1 from public.group_memberships gm where gm.group_id=pending.group_id
       and gm.profile_id=new.actor_id and gm.active and gm.role='approver') then
     if new.actor_id in (pending.owner_id,pending.substitute_id) then
       raise exception 'Uma parte do repasse não pode registrar a decisão institucional';
     end if;
     if coalesce((new.payload->>'approved')::boolean,false) then
       if exists(select 1 from public.shift_offers o where o.id=pending.offer_id and o.starts_at<=now()) then
         raise exception 'O plantão já começou; a aprovação não pode mais ser registrada';
       end if;
       candidate:=pending.substitute_id; owner_ref:=pending.owner_id;
     end if;
   end if;
 end if;
 if candidate is not null and not exists(select 1 from public.profiles where id=candidate and status='approved' and role='doctor' and verification_valid_until>now()) then raise exception 'O candidato precisa revalidar o cadastro profissional'; end if;
 if owner_ref is not null and not exists(select 1 from public.profiles where id=owner_ref and status='approved' and role='doctor' and verification_valid_until>now()) then raise exception 'Quem repassa precisa revalidar o cadastro profissional'; end if;
 return new;
end; $$;
revoke all on function private.feedback_workflow_guard() from public, anon, authenticated;

-- Registro direto: quem é parte do acordo não registra a decisão institucional.
do $$
declare
  definition text;
  original text;
  gate text := 'if a.status<>''pending_approval'' or not private.external_approver(a.group_id,actor) then raise exception ''Aprovação institucional indisponível''; end if;';
begin
  definition := replace(
    pg_get_functiondef('private.external_command(uuid,text,uuid,jsonb)'::regprocedure), chr(13), '');
  original := definition;
  definition := replace(definition, gate,
    gate || E'\n     if actor in (a.owner_id,a.substitute_id) then raise exception ''Uma parte do acordo não pode registrar a decisão institucional''; end if;');
  if definition = original then
    raise exception 'Registro direto incompatível com a segregação da aprovação';
  end if;
  execute definition;
end;
$$;

-- Item 3 -----------------------------------------------------------------------------
-- Titular e substituto podem retirar o pedido enquanto a coordenação não decide. A
-- desistência do substituto devolve a oferta ao mural; a do titular cancela a oferta.
-- Sem acordo confirmado não há ocorrência.
do $$
declare
  definition text;
  step text;
  old_gate text := E'    if selected_substitution.status <> ''confirmed''\n       or selected_offer.starts_at <= now()';
  new_gate text := E'    if selected_substitution.status not in (''confirmed'', ''pending_institutional_approval'')\n       or selected_offer.starts_at <= now()';
  old_offer text := E'    update public.shift_offers set status = ''cancelled_by_owner'', updated_at = now()\n      where id = selected_offer.id;\n    occurrence_category := case\n';
  new_offer text := $new$    if selected_substitution.status = 'pending_institutional_approval' then
      update public.shift_applications
        set status = case when new.command = 'substitute_withdrawal'
            then 'withdrawn' else 'invalidated' end::public.shift_application_status,
          updated_at = now()
        where id = selected_substitution.application_id;
    end if;
    update public.shift_offers set
        status = case
          when selected_substitution.status = 'pending_institutional_approval'
               and new.command = 'substitute_withdrawal' then
            case when selected_offer.starts_at <= now() + interval '48 hours'
              then 'open_emergency' else 'open_normal' end
          else 'cancelled_by_owner'
        end::public.shift_offer_status,
        selected_application_id = case
          when selected_substitution.status = 'pending_institutional_approval' then null
          else selected_application_id end,
        updated_at = case
          when selected_substitution.status = 'pending_institutional_approval'
               and new.command = 'substitute_withdrawal' then updated_at
          else now() end
      where id = selected_offer.id;
    occurrence_category := case
      when selected_substitution.status = 'pending_institutional_approval' then null
$new$;
begin
  definition := replace(
    pg_get_functiondef('private.process_closure_command()'::regprocedure), chr(13), '');
  step := replace(definition, old_gate, new_gate);
  if step = definition then raise exception 'Fluxo de cancelamento incompatível (estado)'; end if;
  definition := step;
  step := replace(definition, old_offer, new_offer);
  if step = definition then raise exception 'Fluxo de cancelamento incompatível (oferta)'; end if;
  definition := step;
  step := replace(definition,
    '''A substituição confirmada foi cancelada.''',
    '''O repasse foi cancelado por uma das partes.''');
  if step = definition then raise exception 'Fluxo de cancelamento incompatível (aviso à parte)'; end if;
  definition := step;
  step := replace(definition,
    '''Uma substituição confirmada do seu grupo foi cancelada.''',
    '''Um repasse do seu grupo foi cancelado por uma das partes.''');
  if step = definition then raise exception 'Fluxo de cancelamento incompatível (aviso ao grupo)'; end if;
  execute step;
end;
$$;

-- A pendência de aprovação termina no início do plantão: ninguém fica comprometido
-- por uma decisão que não veio, e as partes e os aprovadores são avisados.
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

  for stale in
    select s.id, s.offer_id, s.application_id, s.owner_id, s.substitute_id, s.group_id
    from public.substitutions s
    join public.shift_offers o on o.id = s.offer_id
    where s.status = 'pending_institutional_approval'
      and o.starts_at <= now()
    order by o.starts_at, s.id
    for update of s skip locked
  loop
    update public.substitutions
    set status = 'cancelled', updated_at = now(),
      cancellation_reason = 'A aprovação institucional não foi decidida até o início do plantão.'
    where id = stale.id and status = 'pending_institutional_approval';
    if not found then continue; end if;

    update public.shift_applications
    set status = 'invalidated', updated_at = now()
    where id = stale.application_id and status = 'confirmed';

    update public.shift_offers
    set status = 'expired', selected_application_id = null, updated_at = now()
    where id = stale.offer_id and status = 'selection_in_progress';

    insert into public.audit_events (actor_id, event_type, entity_type, entity_id, metadata)
    values (null, 'substitution.approval_expired', 'substitution', stale.id,
      jsonb_build_object('offer_id', stale.offer_id, 'reason', 'shift_started_without_decision'));
    insert into public.notifications (recipient_id, event_type, title, body, href)
    select recipient_id, 'substitution.cancelled', 'Aprovação não decidida a tempo',
      'A coordenação não decidiu até o início do plantão. O repasse não foi confirmado.',
      '/plantoes/' || stale.offer_id
    from (values (stale.owner_id), (stale.substitute_id)) recipients(recipient_id);
    insert into public.notifications (recipient_id, event_type, title, body, href)
    select gm.profile_id, 'substitution.cancelled', 'Aprovação não decidida a tempo',
      'Um repasse do seu grupo começou sem decisão e foi encerrado sem confirmação.',
      '/plantoes/' || stale.offer_id
    from public.group_memberships gm
    where gm.group_id = stale.group_id and gm.active and gm.role = 'approver'
      and gm.profile_id not in (stale.owner_id, stale.substitute_id);

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

comment on function private.expire_stale_shift_workflows() is
  'Expires timed-out confirmations, approvals left undecided at shift start, and started offers; emits audit and notifications.';
