begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();

-- 1: médica com análise pendente (recebe) · 2: médico aprovado (paga) · 3: médico sem vínculo com os registros · 4: médico suspenso
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
select ('97000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'authenticated','authenticated','lembrete'||n||'@test.invalid',now(),'{}','{}' from generate_series(1,4) n;
insert into public.profiles(id,display_name,role,status,crm_number,crm_state,verification_valid_until) values
  ('97000000-0000-4000-8000-000000000001','Lembrete pendente','doctor','pending','971001','MA',null),
  ('97000000-0000-4000-8000-000000000002','Lembrete aprovado','doctor','approved','971002','MA',now()+interval '300 days'),
  ('97000000-0000-4000-8000-000000000003','Lembrete terceiro','doctor','approved','971003','MA',now()+interval '300 days'),
  ('97000000-0000-4000-8000-000000000004','Lembrete suspenso','doctor','suspended','971004','MA',null);
insert into private.registration_drafts(user_id,civil_name,cpf,birth_date,phone,data)
select ('97000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'Pessoa Lembrete '||n,'9600000000'||n,'1990-01-01','+559897100000'||n,'{"practicesMedicine":"yes"}' from generate_series(1,2) n;

create function pg_temp.actor(n integer) returns void language sql as $$
  select set_config('request.jwt.claims',jsonb_build_object('sub','97000000-0000-4000-8000-'||lpad(n::text,12,'0'),'role','authenticated')::text,true)::text::void;
$$;
create function pg_temp.today() returns date language sql as $$ select (now() at time zone 'America/Fortaleza')::date $$;
-- Plantão às 7h (UTC−3) daqui a 5 dias; data-limite configurável em dias após o plantão.
create function pg_temp.entry(kind text, due_after integer, reminder jsonb) returns jsonb language sql as $$
  select jsonb_build_object('kind',kind,'location','Hospital sintético','sector','UTI','value_cents',180000,
    'counterparty','Cooperativa sintética','reminder',reminder,'shifts',jsonb_build_array(jsonb_build_object(
      'starts_at',((pg_temp.today()+5)::text||'T07:00:00-03:00')::timestamptz,
      'ends_at',((pg_temp.today()+5)::text||'T19:00:00-03:00')::timestamptz,
      'due_date',(pg_temp.today()+5+due_after)::text)));
$$;
create function pg_temp.titles(n integer) returns text[] language sql as $$
  select coalesce(array_agg(title order by title),'{}') from public.notifications
  where recipient_id=('97000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid and event_type='agenda.payment_reminder';
$$;
create function pg_temp.cron_scheduled() returns boolean language plpgsql as $$
begin
  if to_regclass('cron.job') is null then return true; end if;
  return exists(select 1 from cron.job where jobname='agenda-payment-reminders' and schedule='0 11 * * *'
    and command='select private.agenda_send_reminders()');
end;
$$;

select ok(pg_temp.cron_scheduled(),'daily job runs at 11h UTC (8h in Fortaleza)');
select ok(not has_table_privilege('authenticated','private.agenda_reminder_deliveries','select'),'delivery log is not readable by clients');
select ok(not has_table_privilege('authenticated','public.agenda_record_reminders','insert')
  and not has_table_privilege('anon','public.agenda_record_reminders','select')
  and not has_table_privilege('service_role','public.agenda_record_reminders','select'),'record reminders are written only through the command');
select ok(not has_function_privilege('authenticated','private.agenda_send_reminders(date)','execute'),'clients cannot trigger reminders');

-- Anotações da médica 1: vencimento no dia D = hoje + 15
select pg_temp.actor(1);
set local role authenticated;
select set_config('test.lead',(public.agenda_command(gen_random_uuid(),'create',null,pg_temp.entry('own',10,'{"enabled":true,"lead_days":3,"repeat_days":7}'))->'ids'->>0),true);
select set_config('test.pay',(public.agenda_command(gen_random_uuid(),'create',null,pg_temp.entry('passed',10,'{"enabled":true,"lead_days":0,"repeat_days":0}'))->'ids'->>0),true);
select lives_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.entry('took',10,'{"enabled":false,"lead_days":0,"repeat_days":7}'))$$,'reminder can be turned off');
select throws_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.entry('own',10,'{"lead_days":2}'))$$,'P0001','Lembrete inválido','only offered lead times are accepted');
select throws_ok($$select public.agenda_command(gen_random_uuid(),'create',null,pg_temp.entry('own',10,'{"repeat_days":"x"}'))$$,'P0001','Lembrete inválido','malformed repetition rejected');
select is((select reminder_lead_days||'/'||reminder_repeat_days||'/'||reminder_enabled from public.agenda_entries where id=current_setting('test.lead')::uuid),'3/7/true','reminder settings are saved with the entry');
reset role;

select is(private.agenda_send_reminders(pg_temp.today()+11),0,'nothing before the lead time');
select is(private.agenda_send_reminders(pg_temp.today()+12),1,'first notice on the lead day');
select is(pg_temp.titles(1),array['Pagamento a receber vence em 3 dias'],'lead notice states days left');
select is(private.agenda_send_reminders(pg_temp.today()+12),0,'running twice on the same day sends nothing new');
select is(private.agenda_send_reminders(pg_temp.today()+13),0,'no notice between lead and due date');
select is(private.agenda_send_reminders(pg_temp.today()+15),2,'due day notifies both the receivable and the payable');
select ok('Pagamento a fazer vence hoje' = any(pg_temp.titles(1)) and 'Pagamento a receber vence hoje' = any(pg_temp.titles(1)),'due day wording by direction');
select is(private.agenda_send_reminders(pg_temp.today()+21),0,'weekly repetition waits seven days');
select is(private.agenda_send_reminders(pg_temp.today()+22),1,'overdue receivable repeats weekly; payable without repetition does not');
select ok('Pagamento a receber está vencido' = any(pg_temp.titles(1)),'overdue wording');
select is(private.agenda_send_reminders(pg_temp.today()+15+200),1,'one catch-up notice after a long pause');
select is(private.agenda_send_reminders(pg_temp.today()+15+300),0,'repetition stops 182 days after the due date');
select ok(not exists(select 1 from public.notifications where event_type='agenda.payment_reminder'
  and (title||body) ~ '(R\$|1\.800|Cooperativa|sintético)'),'notices carry no value, names or place');
select ok(not exists(select 1 from public.notifications where event_type='agenda.payment_reminder' and href !~ '^/agenda/'),'notices open the agenda');

-- Marcar recebido encerra os avisos
select pg_temp.actor(1);
set local role authenticated;
select lives_ok($$select public.agenda_command(null,'settle',current_setting('test.lead')::uuid,jsonb_build_object('settled_on',pg_temp.today(),'settled_cents',180000))$$,'author marks as received');
reset role;
delete from private.agenda_reminder_deliveries where record_id=current_setting('test.lead')::uuid;
select is(private.agenda_send_reminders(pg_temp.today()+29),0,'settled entries are never reminded');

-- Conta suspensa não recebe avisos
insert into public.agenda_entries(owner_id,request_id,request_index,kind,starts_at,ends_at,location,due_date)
values ('97000000-0000-4000-8000-000000000004',gen_random_uuid(),0,'own',now(),now()+interval '12 hours','Hospital',pg_temp.today());
select is(private.agenda_send_reminders(pg_temp.today()),0,'suspended accounts get no reminders');

-- Acordo registrado: 1 assume e recebe, 2 repassa e paga
select pg_temp.actor(1);
set local role authenticated;
select set_config('test.external',public.external_agreement_command(gen_random_uuid(),'create',null,jsonb_build_object(
  'creator_role','substitute','recipient_email','lembrete2@test.invalid','location','Hospital sintético','sector','Enfermaria',
  'starts_at',((pg_temp.today()+3)::text||'T07:00:00-03:00'),'ends_at',((pg_temp.today()+3)::text||'T19:00:00-03:00'),
  'value_cents',140000,'due_date',(pg_temp.today()+40)::text,'payment_method','Pix','accepted',true))::text,true);
reset role;
select pg_temp.actor(2);
set local role authenticated;
select lives_ok($$select public.external_agreement_command(gen_random_uuid(),'accept',current_setting('test.external')::uuid,
  jsonb_build_object('accepted',true,'terms_hash',(select terms_hash from public.external_agreements where id=current_setting('test.external')::uuid)))$$,'colleague confirms the agreement');
reset role;
select is(private.agenda_send_reminders(pg_temp.today()+40),2,'registered agreements are reminded by default to both parties');
select is(pg_temp.titles(2),array['Pagamento a fazer vence hoje'],'payer gets a payable notice');
select ok(exists(select 1 from public.notifications where recipient_id='97000000-0000-4000-8000-000000000001'
  and href='/agenda/pagamento/acordo/'||current_setting('test.external')),'receiver notice opens the agenda payment page');
select pg_temp.actor(2);
set local role authenticated;
select lives_ok($$select public.external_agreement_command(gen_random_uuid(),'payment',current_setting('test.external')::uuid,jsonb_build_object('amount_cents',140000,'paid_on',pg_temp.today()))$$,'payer reports the payment');
reset role;
select is(private.agenda_send_reminders(pg_temp.today()+47),1,'after reporting, only the receiver is reminded');
select ok('Pagamento informado: confirme se recebeu' = any(pg_temp.titles(1)),'receiver is asked to confirm');

-- Preferência pessoal sobre o acordo
select pg_temp.actor(1);
set local role authenticated;
select lives_ok($$select public.agenda_command(null,'record_reminder',current_setting('test.external')::uuid,'{"source":"registered","reminder":{"enabled":false}}')$$,'party turns the agreement reminder off');
select is((select count(*)::int from public.agenda_record_reminders),1,'party reads own preference');
reset role;
select is(private.agenda_send_reminders(pg_temp.today()+54),0,'disabled agreement reminder stops');
select pg_temp.actor(3);
set local role authenticated;
select throws_ok($$select public.agenda_command(null,'record_reminder',current_setting('test.external')::uuid,'{"source":"registered","reminder":{"enabled":true}}')$$,'P0001','Registro indisponível','outsider cannot set reminders on others agreements');
select is((select count(*)::int from public.agenda_record_reminders),0,'outsider reads no preferences');
reset role;

-- Repasse do mural: 2 repassou e paga, 1 assumiu e recebe; outro repasse foi cancelado
insert into public.shift_offers(id,owner_id,starts_at,ends_at,sector,value_cents,payment_terms,status,payment_due_date) values
  ('97000000-0000-4000-8000-000000000101','97000000-0000-4000-8000-000000000002',now()-interval '20 days',now()-interval '19 days 12 hours','UTI',150000,'Pix','closed_confirmed',pg_temp.today()+60),
  ('97000000-0000-4000-8000-000000000102','97000000-0000-4000-8000-000000000002',now()-interval '18 days',now()-interval '17 days 12 hours','UTI',150000,'Pix','closed_confirmed',pg_temp.today()+60);
insert into public.shift_applications(id,offer_id,candidate_id,candidate_display_name) values
  ('97000000-0000-4000-8000-000000000201','97000000-0000-4000-8000-000000000101','97000000-0000-4000-8000-000000000001','Lembrete pendente'),
  ('97000000-0000-4000-8000-000000000202','97000000-0000-4000-8000-000000000102','97000000-0000-4000-8000-000000000001','Lembrete pendente');
insert into public.substitutions(id,offer_id,application_id,owner_id,substitute_id,status,confirmation_deadline) values
  ('97000000-0000-4000-8000-000000000301','97000000-0000-4000-8000-000000000101','97000000-0000-4000-8000-000000000201','97000000-0000-4000-8000-000000000002','97000000-0000-4000-8000-000000000001','confirmed',now()),
  ('97000000-0000-4000-8000-000000000302','97000000-0000-4000-8000-000000000102','97000000-0000-4000-8000-000000000202','97000000-0000-4000-8000-000000000002','97000000-0000-4000-8000-000000000001','cancelled',now());
insert into public.shift_agreements(id,substitution_id,offer_id,owner_id,substitute_id,snapshot)
select ('97000000-0000-4000-8000-00000000040'||n)::uuid,('97000000-0000-4000-8000-00000000030'||n)::uuid,('97000000-0000-4000-8000-00000000010'||n)::uuid,
  '97000000-0000-4000-8000-000000000002','97000000-0000-4000-8000-000000000001',
  jsonb_build_object('starts_at',now()-interval '20 days','ends_at',now()-interval '19 days 12 hours','sector','UTI','value_cents',150000)
from generate_series(1,2) n;
select is((select payment_due_date from public.shift_agreements where id='97000000-0000-4000-8000-000000000401'),pg_temp.today()+60,'agreement keeps the offer deadline');
select is(private.agenda_send_reminders(pg_temp.today()+60),2,'mural agreement reminds both parties; cancelled one is skipped');
select ok(exists(select 1 from public.notifications where recipient_id='97000000-0000-4000-8000-000000000002'
  and href='/agenda/pagamento/repasse/97000000-0000-4000-8000-000000000401' and title='Pagamento a fazer vence hoje'),'payer notice for the mural agreement');
select ok(not exists(select 1 from public.notifications where href like '%97000000-0000-4000-8000-000000000402'),'cancelled substitution is never reminded');
select pg_temp.actor(3);
set local role authenticated;
select throws_ok($$select public.agenda_command(null,'record_reminder','97000000-0000-4000-8000-000000000401','{"source":"mural","reminder":{"enabled":false}}')$$,'P0001','Registro indisponível','outsider cannot change a mural reminder');
reset role;

-- Avisos ficam na central: nenhum entra na fila de e-mails críticos
select ok(not exists(select 1 from public.notification_email_deliveries d join public.notifications n on n.id=d.notification_id
  where n.event_type='agenda.payment_reminder'),'reminders are not e-mailed');

select * from finish();
rollback;
