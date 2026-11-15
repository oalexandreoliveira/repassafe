begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();

-- 1: médico com análise pendente · 2: médico aprovado · 3: aprovador sem atuação médica · 4: médico suspenso
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
select ('98000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','agenda'||n||'@test.invalid',now(),'{}','{}' from generate_series(1,4) n;
insert into public.profiles(id,display_name,role,status,crm_number,crm_state) values
  ('98000000-0000-4000-8000-000000000001','Agenda pendente','doctor','pending','981001','MA'),
  ('98000000-0000-4000-8000-000000000002','Agenda aprovada','doctor','approved','981002','MA'),
  ('98000000-0000-4000-8000-000000000003','Agenda aprovador','approver','approved',null,null),
  ('98000000-0000-4000-8000-000000000004','Agenda suspensa','doctor','suspended','981004','MA');

create function pg_temp.actor(n integer) returns void language sql as $$
  select set_config('request.jwt.claims',jsonb_build_object('sub','98000000-0000-4000-8000-'||lpad(n::text,12,'0'),'role','authenticated')::text,true)::text::void;
$$;
-- Plantões às 19h (UTC−3) em dias relativos a hoje, com término às 07h do dia seguinte.
create function pg_temp.shift(day_offset integer, due_offset integer default null) returns jsonb language sql as $$
  select jsonb_build_object(
    'starts_at', ((current_date + day_offset)::text || 'T19:00:00-03:00')::timestamptz,
    'ends_at', ((current_date + day_offset + 1)::text || 'T07:00:00-03:00')::timestamptz,
    'due_date', case when due_offset is null then null else (current_date + day_offset + due_offset)::text end);
$$;
create function pg_temp.payload(shifts jsonb) returns jsonb language sql as $$
  select jsonb_build_object('kind','own','location','Hospital sintético','sector','UTI','value_cents',180000,
    'payment_method','Transferência','counterparty','Cooperativa sintética','notes','Passagem às 18h45.','shifts',shifts);
$$;

select ok((select relrowsecurity from pg_class where oid='public.agenda_entries'::regclass),'agenda has row level security');
select ok(not has_table_privilege('anon','public.agenda_entries','select'),'anonymous cannot read agenda');
select ok(not has_table_privilege('authenticated','public.agenda_entries','insert')
  and not has_table_privilege('authenticated','public.agenda_entries','update')
  and not has_table_privilege('authenticated','public.agenda_entries','delete'),'clients write only through the command');
select ok(not has_table_privilege('service_role','public.agenda_entries','select')
  and not has_table_privilege('service_role','public.agenda_entries','update'),'service role has no agenda access');
select ok(not has_function_privilege('anon','public.agenda_command(uuid,text,uuid,jsonb)','execute'),'anonymous cannot run agenda commands');

select pg_temp.actor(1);
set local role authenticated;
select is(jsonb_array_length(public.agenda_command('98000000-0000-4000-8000-000000000101','create',null,
  pg_temp.payload(jsonb_build_array(pg_temp.shift(-30,60),pg_temp.shift(-23,60),pg_temp.shift(5,60))))->'ids'),3,
  'pending doctor saves three dates at once, including past shifts');
select is((select count(*)::int from public.agenda_entries),3,'author reads own entries');
select is(public.agenda_command('98000000-0000-4000-8000-000000000101','create',null,
  pg_temp.payload(jsonb_build_array(pg_temp.shift(-30,60),pg_temp.shift(-23,60),pg_temp.shift(5,60))))->'ids',
  (select jsonb_agg(id order by request_index) from public.agenda_entries),'create retry is idempotent');
select is((select count(*)::int from public.agenda_entries),3,'retry does not duplicate entries');
select throws_ok($$select public.agenda_command('98000000-0000-4000-8000-000000000101','create',null,
  pg_temp.payload(jsonb_build_array(pg_temp.shift(-30,60),pg_temp.shift(-23,60),pg_temp.shift(5,90))))$$,
  'P0001','Comando já utilizado com outros dados','same request cannot change content');
select throws_ok($$insert into public.agenda_entries(owner_id,request_id,request_index,kind,starts_at,ends_at,location)
  values (auth.uid(),gen_random_uuid(),0,'own',now(),now()+interval '1 hour','Direto')$$,'42501',null,'direct insert is denied');
select throws_ok($$update public.agenda_entries set value_cents=1$$,'42501',null,'direct update is denied');

-- Validação no banco
select throws_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.payload(jsonb_build_array(pg_temp.shift(1)))||'{"kind":"other"}')$$,
  'P0001','Selecione o tipo do plantão','unknown kind rejected');
select throws_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.payload(jsonb_build_array(pg_temp.shift(1)))||'{"location":" "}')$$,
  'P0001','Informe a instituição e o local','location required');
select throws_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.payload(jsonb_build_array(pg_temp.shift(1)))||'{"value_cents":0}')$$,
  'P0001','Valor inválido','non-positive value rejected');
select throws_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.payload(jsonb_build_array(pg_temp.shift(1)))||'{"value_cents":"abc"}')$$,
  'P0001','Valor inválido','malformed value rejected');
select throws_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.payload(jsonb_build_array(pg_temp.shift(1)||jsonb_build_object('ends_at',(pg_temp.shift(1)->>'starts_at')))))$$,
  'P0001','O término deve ser posterior ao início, em até 48 horas','end must follow start');
select throws_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.payload(jsonb_build_array(pg_temp.shift(1,-1))))$$,
  'P0001','A data-limite deve ficar entre o dia do plantão e um ano depois','deadline cannot precede the shift');
select throws_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.payload(jsonb_build_array(pg_temp.shift(1)||'{"due_date":"infinity"}')))$$,
  'P0001','A data-limite deve ficar entre o dia do plantão e um ano depois','infinite deadline rejected');
select throws_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.payload(jsonb_build_array(pg_temp.shift(-800))))$$,
  'P0001','Escolha datas entre dois anos atrás e um ano à frente','dates are bounded');
select throws_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.payload(jsonb_build_array(pg_temp.shift(2),pg_temp.shift(2))))$$,
  'P0001','Datas repetidas','duplicate dates rejected');
select throws_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.payload((select jsonb_agg(pg_temp.shift(n)) from generate_series(1,32) n)))$$,
  'P0001','Selecione de 1 a 31 datas','batch size is limited');
select throws_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.payload(jsonb_build_array(pg_temp.shift(1)))||jsonb_build_object('notes',repeat('a',1001)))$$,
  'P0001','Texto acima do limite','notes are limited');

-- Marcar recebido e desfazer
select set_config('test.entry',(select id::text from public.agenda_entries where request_index=0),true);
select throws_ok($$select public.agenda_command(null,'settle',current_setting('test.entry')::uuid,jsonb_build_object('settled_on',(now() at time zone 'America/Fortaleza')::date+1,'settled_cents',170000))$$,
  'P0001','Informe uma data válida, até hoje','settlement cannot be in the future');
select lives_ok($$select public.agenda_command(null,'settle',current_setting('test.entry')::uuid,jsonb_build_object('settled_on',(now() at time zone 'America/Fortaleza')::date,'settled_cents',170000))$$,
  'author marks a different amount as received');
select is((select settled_cents from public.agenda_entries where id=current_setting('test.entry')::uuid),170000,'received amount is kept apart from the planned value');
select lives_ok($$select public.agenda_command(null,'unsettle',current_setting('test.entry')::uuid,'{}')$$,'author can undo the mark');
select ok((select settled_on is null and settled_cents is null from public.agenda_entries where id=current_setting('test.entry')::uuid),'undo clears both fields');

-- Edição
select lives_ok($$select public.agenda_command(null,'update',current_setting('test.entry')::uuid,
  pg_temp.payload(jsonb_build_array(pg_temp.shift(-30,90)))||'{"kind":"took","counterparty":"Colega sintético"}')$$,'author edits one entry');
select is((select kind||'|'||counterparty from public.agenda_entries where id=current_setting('test.entry')::uuid),'took|Colega sintético','edit is saved');
select throws_ok($$select public.agenda_command(null,'update',current_setting('test.entry')::uuid,
  pg_temp.payload(jsonb_build_array(pg_temp.shift(1),pg_temp.shift(2))))$$,'P0001','Selecione uma data','edit applies to a single entry');
reset role;

-- Outro médico não lê nem altera
select pg_temp.actor(2);
set local role authenticated;
select is((select count(*)::int from public.agenda_entries),0,'another doctor reads nothing');
select throws_ok($$select public.agenda_command(null,'settle',current_setting('test.entry')::uuid,jsonb_build_object('settled_on',current_date,'settled_cents',1))$$,
  'P0001','Plantão indisponível','another doctor cannot mark as received');
select throws_ok($$select public.agenda_command(null,'update',current_setting('test.entry')::uuid,pg_temp.payload(jsonb_build_array(pg_temp.shift(3))))$$,
  'P0001','Plantão indisponível','another doctor cannot edit');
select is(public.agenda_command(null,'delete',current_setting('test.entry')::uuid,'{}')->>'deleted','false','another doctor cannot delete');
reset role;
select is((select count(*)::int from public.agenda_entries where owner_id='98000000-0000-4000-8000-000000000001'),3,'entries survive outsider attempts');

-- Aprovador sem atuação médica e conta suspensa
select pg_temp.actor(3);
set local role authenticated;
select is((select count(*)::int from public.agenda_entries),0,'approver reads nothing');
select throws_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.payload(jsonb_build_array(pg_temp.shift(1))))$$,
  'P0001','Agenda indisponível para esta conta','approver without medical role has no agenda');
reset role;
select pg_temp.actor(4);
set local role authenticated;
select throws_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.payload(jsonb_build_array(pg_temp.shift(1))))$$,
  'P0001','Agenda indisponível para esta conta','suspended account cannot write');
reset role;

-- Privacidade: comandos da agenda não geram notificação nem auditoria
select is((select count(*)::int from public.notifications where recipient_id in
  ('98000000-0000-4000-8000-000000000001','98000000-0000-4000-8000-000000000002')),0,'agenda commands notify nobody');
select is((select count(*)::int from public.audit_events where actor_id='98000000-0000-4000-8000-000000000001'),0,'agenda content stays out of the audit trail');

-- Exclusão pelo autor
select pg_temp.actor(1);
set local role authenticated;
select is(public.agenda_command(null,'delete',current_setting('test.entry')::uuid,'{}')->>'deleted','true','author deletes an entry');
select is((select count(*)::int from public.agenda_entries),2,'other dates of the batch remain');
reset role;

select * from finish();
rollback;
