begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(6);

-- Exercise the actual production constraint without unrelated agreement fixtures.
create temporary table evaluation_score_probe (
  scores jsonb not null,
  rubric_version integer not null,
  evaluator_role text not null
);
do $$
declare definition text;
begin
  select pg_get_constraintdef(oid) into definition from pg_constraint
    where conrelid = 'public.shift_evaluations'::regclass
      and conname = 'shift_evaluations_scores_check';
  execute 'alter table evaluation_score_probe add constraint scores_check ' || definition;
end;
$$;

select lives_ok($$insert into evaluation_score_probe values ('{"attendance":1,"punctuality":2,"communication":3,"schedule_compliance":4,"operational_requirements":5}',1,'owner')$$, 'legacy rubric accepts all five scores');
select throws_ok($$insert into evaluation_score_probe values ('{"attendance":1,"punctuality":2,"communication":3,"schedule_compliance":4}',1,'owner')$$, '23514', null, 'missing score is rejected rather than accepted as null');
select lives_ok($$insert into evaluation_score_probe values ('{"substitute_attendance":1,"substitute_punctuality":2,"substitute_communication":3,"substitute_schedule_compliance":4,"substitute_administrative_requirements":5}',2,'owner')$$, 'owner rubric accepts complete scores');
select lives_ok($$insert into evaluation_score_probe values ('{"owner_information_clarity":1,"owner_information_accuracy":2,"owner_communication":3,"owner_amount_compliance":4,"owner_payment_timeliness":5}',2,'substitute')$$, 'substitute rubric accepts complete scores');
select throws_ok($$insert into evaluation_score_probe values ('{"attendance":1,"punctuality":2,"communication":3,"schedule_compliance":4,"operational_requirements":5,"extra":1}',1,'owner')$$, '23514', null, 'unknown score is rejected');
select throws_ok($$insert into evaluation_score_probe values ('{"attendance":0,"punctuality":2,"communication":3,"schedule_compliance":4,"operational_requirements":5}',1,'owner')$$, '23514', null, 'out of range score is rejected');
select * from finish();
rollback;
