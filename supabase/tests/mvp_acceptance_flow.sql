begin;
select plan(37);
create temporary table acceptance_existing_audit as select id from public.audit_events;

create temporary table acceptance_ids (
  name text primary key,
  id uuid not null
);
grant select on acceptance_ids to authenticated;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner@acceptance.local', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'candidate@acceptance.local', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'approver@acceptance.local', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'competitor@acceptance.local', '', now(), '{}', '{}', now(), now());

insert into public.profiles (id, display_name, status, role) values
  ('11000000-0000-0000-0000-000000000001', 'Owner Acceptance', 'approved', 'doctor'),
  ('11000000-0000-0000-0000-000000000002', 'Candidate Acceptance', 'approved', 'doctor'),
  ('11000000-0000-0000-0000-000000000003', 'Approver Acceptance', 'approved', 'approver'),
  ('11000000-0000-0000-0000-000000000004', 'Competitor Acceptance', 'approved', 'doctor');

update public.profiles set verification_valid_until = now() + interval '90 days' where id::text like '11000000-%' and role = 'doctor';

insert into public.institutions (id, name) values
  ('21000000-0000-0000-0000-000000000001', 'Hospital Acceptance');

insert into public.groups (id, institution_id, name, requires_approval) values
  ('31000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 'Sem aprovação', false),
  ('31000000-0000-0000-0000-000000000002', '21000000-0000-0000-0000-000000000001', 'Com aprovação', true);

insert into public.group_memberships (group_id, profile_id, role)
select group_id, profile_id, membership_role
from (values
  ('31000000-0000-0000-0000-000000000001'::uuid, '11000000-0000-0000-0000-000000000001'::uuid, 'doctor'::public.group_role),
  ('31000000-0000-0000-0000-000000000001'::uuid, '11000000-0000-0000-0000-000000000002'::uuid, 'doctor'::public.group_role),
  ('31000000-0000-0000-0000-000000000001'::uuid, '11000000-0000-0000-0000-000000000004'::uuid, 'doctor'::public.group_role),
  ('31000000-0000-0000-0000-000000000002'::uuid, '11000000-0000-0000-0000-000000000001'::uuid, 'doctor'::public.group_role),
  ('31000000-0000-0000-0000-000000000002'::uuid, '11000000-0000-0000-0000-000000000002'::uuid, 'doctor'::public.group_role),
  ('31000000-0000-0000-0000-000000000002'::uuid, '11000000-0000-0000-0000-000000000003'::uuid, 'approver'::public.group_role)
) memberships(group_id, profile_id, membership_role);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
insert into public.workflow_commands (id, command, payload) values (
  '41000000-0000-0000-0000-000000000001', 'publish_offer',
  jsonb_build_object(
    'group_id', '31000000-0000-0000-0000-000000000001',
    'starts_at', now() + interval '5 days',
    'ends_at', now() + interval '5 days 12 hours',
    'sector', 'UTI', 'value_cents', 120000,
    'payment_due_date', (current_date + 40)::text, 'payment_terms', '30 dias', 'notes', 'Fluxo sem aprovação',
    'owner_terms_acknowledged', true
  )
);
reset role;
insert into acceptance_ids select 'offer_without_approval', result_id
from public.workflow_commands where id = '41000000-0000-0000-0000-000000000001';
select is(
  (select status::text from public.shift_offers where id = (select id from acceptance_ids where name = 'offer_without_approval')),
  'open_normal',
  'owner publishes a normal offer'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
insert into public.workflow_commands (id, command, target_id) values (
  '41000000-0000-0000-0000-000000000002', 'apply_to_offer',
  (select id from acceptance_ids where name = 'offer_without_approval')
);
reset role;
insert into acceptance_ids select 'application_without_approval', result_id
from public.workflow_commands where id = '41000000-0000-0000-0000-000000000002';
select is(
  (select status::text from public.shift_applications where id = (select id from acceptance_ids where name = 'application_without_approval')),
  'active',
  'candidate applies to the offer'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
insert into public.workflow_commands (id, command, target_id) values (
  '41000000-0000-0000-0000-000000000003', 'apply_to_offer',
  (select id from acceptance_ids where name = 'offer_without_approval')
);
reset role;
insert into acceptance_ids select 'competing_application', result_id
from public.workflow_commands where id = '41000000-0000-0000-0000-000000000003';

select is(jsonb_array_length(public.offer_candidate_profiles((select id from acceptance_ids where name='offer_without_approval'),'11000000-0000-0000-0000-000000000001')),2,'owner sees individual professional projections');
select is(public.offer_candidate_profiles((select id from acceptance_ids where name='offer_without_approval'),'11000000-0000-0000-0000-000000000004'),'[]'::jsonb,'candidate cannot inspect competitors through projection');
select ok(not has_function_privilege('authenticated','public.offer_candidate_profiles(uuid,uuid)','execute'),'client cannot impersonate owner in projection');
update public.profiles set verification_valid_until=now()-interval '1 second' where id='11000000-0000-0000-0000-000000000002';
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select throws_ok($$insert into public.workflow_commands(command,target_id,payload) values('select_candidate',(select id from acceptance_ids where name='application_without_approval'),'{"confirmation_minutes":30}')$$,'P0001','O candidato precisa revalidar o cadastro profissional','expired candidate cannot be selected');
update public.profiles set verification_valid_until=now()+interval '90 days' where id='11000000-0000-0000-0000-000000000002';


set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
insert into public.workflow_commands (id, command, target_id, payload) values (
  '41000000-0000-0000-0000-000000000004', 'select_candidate',
  (select id from acceptance_ids where name = 'application_without_approval'),
  '{"confirmation_minutes":30}'
);
reset role;
insert into acceptance_ids select 'substitution_without_approval', result_id
from public.workflow_commands where id = '41000000-0000-0000-0000-000000000004';
select is(
  (select status::text from public.substitutions where id = (select id from acceptance_ids where name = 'substitution_without_approval')),
  'pending_substitute_confirmation',
  'selection waits for substitute confirmation'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select throws_ok(
  format(
    'insert into public.workflow_commands (id, command, target_id) values (%L, %L, %L)',
    '41000000-0000-0000-0000-000000000005',
    'select_candidate',
    (select id from acceptance_ids where name = 'competing_application')
  ),
  'P0001',
  'Seleção não autorizada',
  'a competing selection cannot create a second live substitution'
);
reset role;
select is(
  (select count(*) from public.substitutions where offer_id = (select id from acceptance_ids where name = 'offer_without_approval') and status in ('pending_substitute_confirmation', 'pending_institutional_approval', 'confirmed')),
  1::bigint,
  'there is only one live substitution per offer'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
insert into public.workflow_commands (id, command, target_id, payload) values (
  '41000000-0000-0000-0000-000000000006', 'confirm_substitution',
  (select id from acceptance_ids where name = 'substitution_without_approval'),
  '{"accepted":true,"terms_acknowledged":true}'
);
reset role;
select is(
  (select status::text from public.substitutions where id = (select id from acceptance_ids where name = 'substitution_without_approval')),
  'confirmed',
  'substitution without institutional approval is confirmed'
);
select is(
  (select status::text from public.shift_offers where id = (select id from acceptance_ids where name = 'offer_without_approval')),
  'closed_confirmed',
  'offer closes after confirmation'
);
select is(
  (select count(*) from public.shift_agreements where offer_id = (select id from acceptance_ids where name = 'offer_without_approval')),
  1::bigint,
  'immutable agreement is created without institutional approval'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select throws_ok(
  format(
    'insert into public.workflow_commands (id, command, target_id) values (%L, %L, %L)',
    '41000000-0000-0000-0000-000000000007',
    'cancel_offer',
    (select id from acceptance_ids where name = 'offer_without_approval')
  ),
  'P0001',
  'A oferta não pode mais ser cancelada',
  'owner cannot cancel after confirmation'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
insert into public.workflow_commands (id, command, payload) values (
  '42000000-0000-0000-0000-000000000001', 'publish_offer',
  jsonb_build_object(
    'group_id', '31000000-0000-0000-0000-000000000002',
    'starts_at', now() + interval '6 days',
    'ends_at', now() + interval '6 days 12 hours',
    'sector', 'Emergência', 'value_cents', 150000,
    'payment_due_date', (current_date + 40)::text, 'payment_terms', '30 dias', 'notes', 'Fluxo com aprovação',
    'owner_terms_acknowledged', true
  )
);
reset role;
insert into acceptance_ids select 'offer_with_approval', result_id
from public.workflow_commands where id = '42000000-0000-0000-0000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
insert into public.workflow_commands (id, command, target_id) values (
  '42000000-0000-0000-0000-000000000002', 'apply_to_offer',
  (select id from acceptance_ids where name = 'offer_with_approval')
);
reset role;
insert into acceptance_ids select 'application_with_approval', result_id
from public.workflow_commands where id = '42000000-0000-0000-0000-000000000002';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
insert into public.workflow_commands (id, command, target_id) values (
  '42000000-0000-0000-0000-000000000003', 'select_candidate',
  (select id from acceptance_ids where name = 'application_with_approval')
);
reset role;
insert into acceptance_ids select 'substitution_with_approval', result_id
from public.workflow_commands where id = '42000000-0000-0000-0000-000000000003';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
insert into public.workflow_commands (id, command, target_id, payload) values (
  '42000000-0000-0000-0000-000000000004', 'confirm_substitution',
  (select id from acceptance_ids where name = 'substitution_with_approval'),
  '{"accepted":true,"terms_acknowledged":true}'
);
reset role;
select is(
  (select status::text from public.substitutions where id = (select id from acceptance_ids where name = 'substitution_with_approval')),
  'pending_institutional_approval',
  'confirmation waits for institutional approval when configured'
);
select is(
  (select count(*) from public.shift_agreements where offer_id = (select id from acceptance_ids where name = 'offer_with_approval')),
  0::bigint,
  'agreement is not created before institutional approval'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
insert into public.workflow_commands (id, command, target_id, payload) values (
  '42000000-0000-0000-0000-000000000005', 'decide_substitution',
  (select id from acceptance_ids where name = 'substitution_with_approval'),
  '{"approved":true}'
);
reset role;
select is(
  (select status::text from public.substitutions where id = (select id from acceptance_ids where name = 'substitution_with_approval')),
  'confirmed',
  'institutional approver confirms substitution'
);
select is(
  (select count(*) from public.shift_agreements where offer_id = (select id from acceptance_ids where name = 'offer_with_approval')),
  1::bigint,
  'agreement is created after institutional approval'
);
select is(
  (select snapshot->>'approved_by' from public.shift_agreements where offer_id = (select id from acceptance_ids where name = 'offer_with_approval')),
  '11000000-0000-0000-0000-000000000003',
  'agreement records the institutional approver'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
insert into public.workflow_commands (id, command, payload) values (
  '43000000-0000-0000-0000-000000000001', 'publish_offer',
  jsonb_build_object(
    'group_id', '31000000-0000-0000-0000-000000000001',
    'starts_at', now() + interval '7 days',
    'ends_at', now() + interval '7 days 12 hours',
    'sector', 'Clínica', 'value_cents', 90000,
    'payment_due_date', (current_date + 40)::text, 'payment_terms', '15 dias', 'notes', 'Cancelamento',
    'owner_terms_acknowledged', true
  )
);
reset role;
insert into acceptance_ids select 'offer_to_cancel', result_id
from public.workflow_commands where id = '43000000-0000-0000-0000-000000000001';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
insert into public.workflow_commands (id, command, target_id) values (
  '43000000-0000-0000-0000-000000000002', 'apply_to_offer',
  (select id from acceptance_ids where name = 'offer_to_cancel')
);
reset role;
insert into acceptance_ids select 'application_to_cancel', result_id
from public.workflow_commands where id = '43000000-0000-0000-0000-000000000002';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
insert into public.workflow_commands (id, command, target_id) values (
  '43000000-0000-0000-0000-000000000003', 'cancel_offer',
  (select id from acceptance_ids where name = 'offer_to_cancel')
);
reset role;
select is(
  (select status::text from public.shift_offers where id = (select id from acceptance_ids where name = 'offer_to_cancel')),
  'cancelled_by_owner',
  'owner cancels an open offer'
);
select is(
  (select status::text from public.shift_applications where id = (select id from acceptance_ids where name = 'application_to_cancel')),
  'invalidated',
  'cancellation invalidates active applications'
);

select throws_ok(
  format(
    'update public.shift_agreements set snapshot = %L::jsonb where offer_id = %L',
    '{"changed":true}',
    (select id from acceptance_ids where name = 'offer_without_approval')
  ),
  'P0001',
  'Acordos confirmados são imutáveis',
  'confirmed agreements are immutable'
);
select is(
  (select count(*) from public.audit_events where id not in (select id from acceptance_existing_audit)),
  16::bigint,
  'all successful critical transitions are audited'
);
select is(
  (select count(*) from public.audit_events where actor_id is null and id not in (select id from acceptance_existing_audit)),
  0::bigint,
  'every audit event records its actor'
);
select ok(
  exists(
    select 1 from public.audit_events
    where event_type = 'substitution.approved'
      and actor_id = '11000000-0000-0000-0000-000000000003'
  ),
  'institutional decision is attributed to the approver'
);


select is((select count(*)::integer from public.agreement_email_deliveries where recipient_id::text like '11000000-%'),4,'each confirmed agreement queues exactly two party emails');
select is((select payment_due_date from public.shift_agreements where offer_id=(select id from acceptance_ids where name='offer_without_approval')),current_date+40,'deadline is preserved in the agreement');
select ok(not has_function_privilege('authenticated','public.record_agreement_payment(uuid,uuid,uuid,text,jsonb)','execute'),'clients cannot impersonate payment actors');
select ok(not has_table_privilege('authenticated','public.agreement_payment_events','insert'),'clients cannot insert payment events directly');
select ok(not has_table_privilege('service_role','public.agreement_payment_events','UPDATE,DELETE,TRUNCATE'),'service worker cannot rewrite payment history');
select ok(not has_table_privilege('authenticated','public.agreement_email_deliveries','SELECT'),'clients cannot inspect email recipients or attempts');
select lives_ok($$select public.record_agreement_payment('11000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001',(select id from public.shift_agreements where offer_id=(select id from acceptance_ids where name='offer_without_approval')),'payment',jsonb_build_object('paid_on',current_date,'amount_cents',120000))$$,'owner reports full payment');
select lives_ok($$select public.record_agreement_payment('11000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001',(select id from public.shift_agreements where offer_id=(select id from acceptance_ids where name='offer_without_approval')),'payment',jsonb_build_object('paid_on',current_date,'amount_cents',120000))$$,'same request is idempotent');
select is((select count(*)::integer from public.agreement_payment_events where request_id='91000000-0000-0000-0000-000000000001'),1,'retry creates only one event');
select throws_ok($$select public.record_agreement_payment('11000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000002',(select id from public.shift_agreements where offer_id=(select id from acceptance_ids where name='offer_without_approval')),'receive','{"accepted":true}')$$,'P0001','Somente quem recebe pode confirmar o recebimento integral','payer cannot confirm receipt');
select lives_ok($$select public.record_agreement_payment('11000000-0000-0000-0000-000000000002','91000000-0000-0000-0000-000000000003',(select id from public.shift_agreements where offer_id=(select id from acceptance_ids where name='offer_without_approval')),'receive','{"accepted":true}')$$,'beneficiary confirms receipt');
select throws_ok($$update public.agreement_payment_events set description='altered record' where request_id='91000000-0000-0000-0000-000000000001'$$,'P0001','Acordos confirmados são imutáveis','payment event is immutable');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select is((select count(*)::integer from public.agreement_payment_events),0,'unrelated candidate cannot read payment history');
reset role;

select * from finish();
rollback;
