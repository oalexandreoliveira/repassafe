alter type public.closure_command_type add value 'submit_evaluation';

alter table public.shift_completions
  add column reported_by_owner boolean not null default false;

create table public.shift_evaluations (
  id uuid primary key default gen_random_uuid(),
  substitution_id uuid not null references public.substitutions(id),
  evaluator_id uuid not null references public.profiles(id),
  evaluatee_id uuid not null references public.profiles(id),
  evaluator_role text not null check (evaluator_role in ('owner', 'substitute')),
  scores jsonb not null check (
    jsonb_typeof(scores) = 'object'
    and (scores - array['attendance', 'punctuality', 'communication', 'schedule_compliance', 'operational_requirements']) = '{}'::jsonb
    and (scores->>'attendance') in ('1', '2', '3', '4', '5')
    and (scores->>'punctuality') in ('1', '2', '3', '4', '5')
    and (scores->>'communication') in ('1', '2', '3', '4', '5')
    and (scores->>'schedule_compliance') in ('1', '2', '3', '4', '5')
    and (scores->>'operational_requirements') in ('1', '2', '3', '4', '5')
  ),
  created_at timestamptz not null default now(),
  unique (substitution_id, evaluator_id),
  check (evaluator_id <> evaluatee_id)
);

alter table public.shift_evaluations enable row level security;
revoke all on public.shift_evaluations from public, anon, authenticated;
grant select on public.shift_evaluations to authenticated;

create policy "evaluators read own evaluation and recipient sees anonymized aggregate only"
on public.shift_evaluations for select to authenticated
using (evaluator_id = (select auth.uid()));

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
  evaluation_role text;
  evaluation_recipient uuid;
  score_data jsonb;
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
    if (new.actor_id <> selected_substitution.substitute_id
        and new.actor_id <> selected_substitution.owner_id)
       or selected_substitution.status <> 'confirmed'
       or selected_offer.ends_at > now() then
      raise exception 'Conclusão indisponível';
    end if;
    insert into public.shift_completions (substitution_id, reported_by, reported_by_owner)
      values (selected_substitution.id, new.actor_id,
        new.actor_id = selected_substitution.owner_id)
      on conflict (substitution_id) do nothing returning id into new.result_id;
    if new.result_id is null then raise exception 'Conclusão já registrada'; end if;
    insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
      values (new.actor_id, 'completion.reported', 'completion', new.result_id);
    insert into public.notifications (recipient_id, event_type, title, body, href)
      values (
        case when new.actor_id = selected_substitution.owner_id
          then selected_substitution.substitute_id else selected_substitution.owner_id end,
        'completion.pending', 'Confirme a realização do plantão',
        case when new.actor_id = selected_substitution.owner_id
          then 'O titular informou que o plantão foi realizado.'
          else 'O substituto informou que o plantão foi realizado.' end,
        '/plantoes/' || selected_offer.id);

  elsif new.command = 'confirm_completion' then
    select * into selected_completion from public.shift_completions
      where substitution_id = selected_substitution.id for update;
    if not found or selected_completion.status <> 'pending_confirmation'
       or (selected_completion.reported_by_owner
         and new.actor_id <> selected_substitution.substitute_id
         and not exists (select 1 from public.group_memberships gm
           where gm.group_id = selected_substitution.group_id
             and gm.profile_id = new.actor_id and gm.active and gm.role = 'approver'))
       or (not selected_completion.reported_by_owner
         and new.actor_id <> selected_substitution.owner_id
         and not exists (select 1 from public.group_memberships gm
           where gm.group_id = selected_substitution.group_id
             and gm.profile_id = new.actor_id and gm.active and gm.role = 'approver')) then
      raise exception 'Confirmação de conclusão não autorizada';
    end if;
    update public.shift_completions set status = 'completed', confirmed_by = new.actor_id,
      confirmed_at = now(), updated_at = now() where id = selected_completion.id;
    insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
      values (new.actor_id, 'completion.confirmed', 'completion', selected_completion.id);
    new.result_id := selected_completion.id;
    insert into public.notifications (recipient_id, event_type, title, body, href)
      values (case when new.actor_id = selected_substitution.owner_id
          then selected_substitution.substitute_id else selected_substitution.owner_id end,
        'completion.confirmed', 'Plantão concluído',
        'A realização do plantão foi confirmada.', '/plantoes/' || selected_offer.id);

  elsif new.command = 'dispute_completion' then
    select * into selected_completion from public.shift_completions
      where substitution_id = selected_substitution.id for update;
    if not found or selected_completion.status <> 'pending_confirmation'
       or (selected_completion.reported_by_owner
         and new.actor_id <> selected_substitution.substitute_id
         and not exists (select 1 from public.group_memberships gm
           where gm.group_id = selected_substitution.group_id
             and gm.profile_id = new.actor_id and gm.active and gm.role = 'approver'))
       or (not selected_completion.reported_by_owner
         and new.actor_id <> selected_substitution.owner_id
         and not exists (select 1 from public.group_memberships gm
           where gm.group_id = selected_substitution.group_id
             and gm.profile_id = new.actor_id and gm.active and gm.role = 'approver')) then
      raise exception 'Confirmação de conclusão não autorizada';
    end if;
    reason_text := nullif(trim(new.payload->>'reason'), '');
    if reason_text is null then raise exception 'Informe o motivo da divergência'; end if;
    update public.shift_completions set status = 'disputed', updated_at = now()
      where id = selected_completion.id;
    insert into public.shift_occurrences (substitution_id, opened_by, category, description)
      values (selected_substitution.id, new.actor_id, 'completion_dispute', reason_text)
      returning id into occurrence_id;
    insert into public.audit_events (actor_id, event_type, entity_type, entity_id)
      values (new.actor_id, 'completion.disputed', 'completion', selected_completion.id),
        (new.actor_id, 'occurrence.opened', 'occurrence', occurrence_id);
    new.result_id := occurrence_id;
    insert into public.notifications (recipient_id, event_type, title, body, href)
      select recipients.recipient_id, 'occurrence.opened', 'Divergência sobre o plantão',
        'Foi aberta uma ocorrência para análise administrativa.', '/plantoes/' || selected_offer.id
      from (values (selected_substitution.owner_id), (selected_substitution.substitute_id)) recipients(recipient_id)
      where recipients.recipient_id <> new.actor_id;
    insert into public.notifications (recipient_id, event_type, title, body, href)
      select p.id, 'occurrence.opened', 'Ocorrência requer análise',
        'Uma divergência de conclusão requer análise administrativa.', '/admin'
      from public.profiles p where p.role = 'admin' and p.status = 'approved';

  elsif new.command = 'submit_evaluation' then
    if selected_substitution.status <> 'confirmed' then
      raise exception 'Somente substituições concluídas podem ser avaliadas';
    end if;
    select * into selected_completion from public.shift_completions
      where substitution_id = selected_substitution.id and status = 'completed';
    if not found then raise exception 'Somente substituições concluídas podem ser avaliadas'; end if;
    if new.actor_id = selected_substitution.owner_id then
      evaluation_role := 'owner';
      evaluation_recipient := selected_substitution.substitute_id;
    elsif new.actor_id = selected_substitution.substitute_id then
      evaluation_role := 'substitute';
      evaluation_recipient := selected_substitution.owner_id;
    else
      raise exception 'Somente as partes podem avaliar';
    end if;
    score_data := new.payload->'scores';
    if jsonb_typeof(score_data) <> 'object' or
       (select count(*) from jsonb_each(score_data)) <> 5 or
       not (score_data ?& array['attendance', 'punctuality', 'communication', 'schedule_compliance', 'operational_requirements']) or
       exists (select 1 from jsonb_each_text(score_data) as score(key, value)
         where score.key not in ('attendance', 'punctuality', 'communication', 'schedule_compliance', 'operational_requirements')
           or score.value !~ '^[1-5]$') then
      raise exception 'Avaliação inválida';
    end if;
    insert into public.shift_evaluations
      (substitution_id, evaluator_id, evaluatee_id, evaluator_role, scores)
    values (selected_substitution.id, new.actor_id, evaluation_recipient, evaluation_role, score_data);
    new.result_id := selected_substitution.id;
    insert into public.audit_events (actor_id, event_type, entity_type, entity_id, metadata)
      values (new.actor_id, 'evaluation.submitted', 'substitution', selected_substitution.id,
        jsonb_build_object('evaluator_role', evaluation_role));
    insert into public.notifications (recipient_id, event_type, title, body, href)
      values (evaluation_recipient, 'evaluation.received', 'Avaliação registrada',
        'Uma avaliação da transação foi registrada.', '/plantoes/' || selected_offer.id);

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
      when selected_offer.starts_at < now() + interval '48 hours' then 'late_cancellation'
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
        and gm.active and gm.role = 'approver' and gm.profile_id <> new.actor_id;
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

