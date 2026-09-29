alter table public.shift_evaluations
  add column rubric_version integer not null default 1;

alter table public.shift_evaluations
  drop constraint shift_evaluations_scores_check;

alter table public.shift_evaluations
  add constraint shift_evaluations_scores_check check (
    jsonb_typeof(scores) = 'object'
    and (
      (rubric_version = 1
        and (scores - array['attendance', 'punctuality', 'communication', 'schedule_compliance', 'operational_requirements']) = '{}'::jsonb)
      or (rubric_version = 2 and (
        (evaluator_role = 'owner'
          and (scores - array['substitute_attendance', 'substitute_punctuality', 'substitute_communication', 'substitute_schedule_compliance', 'substitute_administrative_requirements']) = '{}'::jsonb)
        or (evaluator_role = 'substitute'
          and (scores - array['owner_information_clarity', 'owner_information_accuracy', 'owner_communication', 'owner_amount_compliance', 'owner_payment_timeliness']) = '{}'::jsonb)
      ))
    )
    and jsonb_object_length(scores) = 5
    and case
      when rubric_version = 1 then
        (scores->>'attendance') in ('1', '2', '3', '4', '5')
        and (scores->>'punctuality') in ('1', '2', '3', '4', '5')
        and (scores->>'communication') in ('1', '2', '3', '4', '5')
        and (scores->>'schedule_compliance') in ('1', '2', '3', '4', '5')
        and (scores->>'operational_requirements') in ('1', '2', '3', '4', '5')
      when evaluator_role = 'owner' then
        (scores->>'substitute_attendance') in ('1', '2', '3', '4', '5')
        and (scores->>'substitute_punctuality') in ('1', '2', '3', '4', '5')
        and (scores->>'substitute_communication') in ('1', '2', '3', '4', '5')
        and (scores->>'substitute_schedule_compliance') in ('1', '2', '3', '4', '5')
        and (scores->>'substitute_administrative_requirements') in ('1', '2', '3', '4', '5')
      else
        (scores->>'owner_information_clarity') in ('1', '2', '3', '4', '5')
        and (scores->>'owner_information_accuracy') in ('1', '2', '3', '4', '5')
        and (scores->>'owner_communication') in ('1', '2', '3', '4', '5')
        and (scores->>'owner_amount_compliance') in ('1', '2', '3', '4', '5')
        and (scores->>'owner_payment_timeliness') in ('1', '2', '3', '4', '5')
    end
  );

do $$
declare
  function_definition text;
  original_definition text;
  old_validation text := $old$    score_data := new.payload->'scores';
    if jsonb_typeof(score_data) <> 'object' or
       (select count(*) from jsonb_each(score_data)) <> 5 or
       not (score_data ?& array['attendance', 'punctuality', 'communication', 'schedule_compliance', 'operational_requirements']) or
       exists (select 1 from jsonb_each_text(score_data) as score(key, value)
         where score.key not in ('attendance', 'punctuality', 'communication', 'schedule_compliance', 'operational_requirements')
           or score.value !~ '^[1-5]$') then
      raise exception 'Avaliação inválida';
    end if;$old$;
  new_validation text := $new$    score_data := new.payload->'scores';
    if jsonb_typeof(score_data) <> 'object' or
       (select count(*) from jsonb_each(score_data)) <> 5 or
       not (score_data ?& case when evaluation_role = 'owner' then
         array['substitute_attendance', 'substitute_punctuality', 'substitute_communication', 'substitute_schedule_compliance', 'substitute_administrative_requirements']
       else
         array['owner_information_clarity', 'owner_information_accuracy', 'owner_communication', 'owner_amount_compliance', 'owner_payment_timeliness']
       end) or
       exists (select 1 from jsonb_each_text(score_data) as score(key, value)
         where score.value !~ '^[1-5]$') then
      raise exception 'Avaliação inválida';
    end if;$new$;
  old_insert text := $old$    insert into public.shift_evaluations
      (substitution_id, evaluator_id, evaluatee_id, evaluator_role, scores)
    values (selected_substitution.id, new.actor_id, evaluation_recipient, evaluation_role, score_data);$old$;
  new_insert text := $new$    insert into public.shift_evaluations
      (substitution_id, evaluator_id, evaluatee_id, evaluator_role, scores, rubric_version)
    values (selected_substitution.id, new.actor_id, evaluation_recipient, evaluation_role, score_data, 2);$new$;
begin
  select pg_get_functiondef('private.process_closure_command()'::regprocedure)
    into function_definition;
  original_definition := function_definition;
  function_definition := replace(function_definition, old_validation, new_validation);
  function_definition := replace(function_definition, old_insert, new_insert);
  if function_definition = original_definition
     or position(new_validation in function_definition) = 0
     or position(new_insert in function_definition) = 0 then
    raise exception 'Não foi possível atualizar a validação da rubrica de avaliação';
  end if;
  execute function_definition;
end;
$$;
