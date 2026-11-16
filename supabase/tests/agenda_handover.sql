begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();

-- 1: médico que repassa o próprio plantão · 2: colega · 3: médico sem relação
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
select ('98000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','repasse'||n||'@test.invalid',now(),'{}','{}' from generate_series(1,3) n;
insert into public.profiles(id,display_name,role,status,crm_number,crm_state,verification_valid_until) values
  ('98000000-0000-4000-8000-000000000001','Repasse dono','doctor','approved','981001','MA',now()+interval '300 days'),
  ('98000000-0000-4000-8000-000000000002','Repasse colega','doctor','approved','981002','MA',now()+interval '300 days'),
  ('98000000-0000-4000-8000-000000000003','Repasse terceiro','doctor','approved','981003','MA',now()+interval '300 days');
insert into private.registration_drafts(user_id,civil_name,cpf,birth_date,phone,data)
select ('98000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'Pessoa Repasse '||n,'9312345600'||n,'1990-01-01','+559898100000'||n,'{"practicesMedicine":"yes"}' from generate_series(1,3) n;

create function pg_temp.actor(n integer) returns void language sql as $$
  select set_config('request.jwt.claims',jsonb_build_object('sub','98000000-0000-4000-8000-'||lpad(n::text,12,'0'),'role','authenticated')::text,true)::text::void;
$$;
create function pg_temp.today() returns date language sql as $$ select (now() at time zone 'America/Fortaleza')::date $$;
create function pg_temp.entry(kind text) returns jsonb language sql as $$
  select jsonb_build_object('kind',kind,'location','Hospital sintético','sector','UTI','value_cents',200000,
    'shifts',jsonb_build_array(jsonb_build_object(
      'starts_at',((pg_temp.today()+10)::text||'T19:00:00-03:00')::timestamptz,
      'ends_at',((pg_temp.today()+11)::text||'T07:00:00-03:00')::timestamptz,
      'due_date',(pg_temp.today()+70)::text)));
$$;
create function pg_temp.link() returns text language sql as $$
  select coalesce(handover_offer_id::text,'-')||'/'||coalesce(handover_agreement_id::text,'-')
  from public.agenda_entries where id=current_setting('test.own')::uuid;
$$;

select ok(not has_table_privilege('authenticated','public.agenda_entries','update'),'clients cannot write the link directly');
select ok(not has_function_privilege('anon','public.agenda_link_handover(uuid,uuid,uuid)','execute'),'anonymous sessions cannot link');

-- Anotações do médico 1 e ofertas de 1 e de 2
select pg_temp.actor(1);
set local role authenticated;
select set_config('test.own',(public.agenda_command(gen_random_uuid(),'create',null,pg_temp.entry('own'))->'ids'->>0),true);
select set_config('test.took',(public.agenda_command(gen_random_uuid(),'create',null,pg_temp.entry('took'))->'ids'->>0),true);
reset role;
insert into public.shift_offers(id,owner_id,starts_at,ends_at,sector,value_cents,payment_terms,status) values
  ('98000000-0000-4000-8000-000000000101','98000000-0000-4000-8000-000000000001',now()+interval '10 days',now()+interval '10 days 12 hours','UTI',150000,'Pix','open_normal'),
  ('98000000-0000-4000-8000-000000000102','98000000-0000-4000-8000-000000000002',now()+interval '10 days',now()+interval '10 days 12 hours','UTI',150000,'Pix','open_normal');

select pg_temp.actor(1);
set local role authenticated;
select throws_ok($$select public.agenda_link_handover(current_setting('test.own')::uuid)$$,'P0001','Ação inválida','a link needs an offer or an agreement');
select throws_ok($$select public.agenda_link_handover(current_setting('test.own')::uuid,'98000000-0000-4000-8000-000000000101','98000000-0000-4000-8000-000000000101')$$,'P0001','Ação inválida','a link cannot name both');
select throws_ok($$select public.agenda_link_handover(current_setting('test.own')::uuid,'98000000-0000-4000-8000-000000000102')$$,'P0001','Repasse indisponível','someone else''s offer cannot be linked');
select throws_ok($$select public.agenda_link_handover(current_setting('test.took')::uuid,'98000000-0000-4000-8000-000000000101')$$,'P0001','Só um plantão próprio pode ser repassado','only own shifts are handed over');
select lives_ok($$select public.agenda_link_handover(current_setting('test.own')::uuid,'98000000-0000-4000-8000-000000000101')$$,'author links the published offer');
select is(pg_temp.link(),'98000000-0000-4000-8000-000000000101/-','offer link saved');
select lives_ok($$select public.agenda_command(null,'update',current_setting('test.own')::uuid,pg_temp.entry('own'))$$,'author edits the entry');
select is(pg_temp.link(),'98000000-0000-4000-8000-000000000101/-','editing keeps the link');
reset role;

-- Terceiro não liga nem lê a anotação alheia
select pg_temp.actor(3);
set local role authenticated;
select throws_ok($$select public.agenda_link_handover(current_setting('test.own')::uuid,'98000000-0000-4000-8000-000000000101')$$,'P0001','Plantão indisponível','outsider cannot link someone else''s entry');
reset role;

-- Acordo registrado: 1 repassa e paga; outro acordo em que 1 assume
select pg_temp.actor(1);
set local role authenticated;
select set_config('test.passing',public.external_agreement_command(gen_random_uuid(),'create',null,jsonb_build_object(
  'creator_role','owner','recipient_email','repasse2@test.invalid','location','Hospital sintético','sector','UTI',
  'starts_at',((pg_temp.today()+10)::text||'T19:00:00-03:00'),'ends_at',((pg_temp.today()+11)::text||'T07:00:00-03:00'),
  'value_cents',150000,'due_date',(pg_temp.today()+40)::text,'payment_method','Pix','accepted',true))::text,true);
select set_config('test.taking',public.external_agreement_command(gen_random_uuid(),'create',null,jsonb_build_object(
  'creator_role','substitute','recipient_email','repasse2@test.invalid','location','Hospital sintético','sector','UTI',
  'starts_at',((pg_temp.today()+12)::text||'T07:00:00-03:00'),'ends_at',((pg_temp.today()+12)::text||'T19:00:00-03:00'),
  'value_cents',150000,'due_date',(pg_temp.today()+40)::text,'payment_method','Pix','accepted',true))::text,true);
select throws_ok($$select public.agenda_link_handover(current_setting('test.own')::uuid,null,current_setting('test.taking')::uuid)$$,'P0001','Repasse indisponível','an agreement where the author takes the shift is not a handover');
select lives_ok($$select public.agenda_link_handover(current_setting('test.own')::uuid,null,current_setting('test.passing')::uuid)$$,'author links the registered agreement');
select is(pg_temp.link(),'-/'||current_setting('test.passing'),'a new handover replaces the previous link');
reset role;

-- O colega é parte do acordo, mas a anotação continua só do autor
select pg_temp.actor(2);
set local role authenticated;
select is((select count(*)::int from public.agenda_entries),0,'colleague reads no entry of the author');
select throws_ok($$select public.agenda_link_handover(current_setting('test.own')::uuid,null,current_setting('test.passing')::uuid)$$,'P0001','Plantão indisponível','colleague cannot change the link');
reset role;

-- Excluir a anotação não altera o acordo
select pg_temp.actor(1);
set local role authenticated;
select lives_ok($$select public.agenda_command(null,'delete',current_setting('test.own')::uuid,'{}')$$,'author deletes the entry');
reset role;
select is((select status from public.external_agreements where id=current_setting('test.passing')::uuid),'pending_acceptance','the agreement is untouched');

select * from finish();
rollback;
