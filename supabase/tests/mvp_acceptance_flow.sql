begin;
select plan(20);

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
    'payment_terms', '30 dias', 'notes', 'Fluxo sem aprovação',
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
    'payment_terms', '30 dias', 'notes', 'Fluxo com aprovação',
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
    'payment_terms', '15 dias', 'notes', 'Cancelamento',
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
  (select count(*) from public.audit_events),
  13::bigint,
  'all successful critical transitions are audited'
);
select is(
  (select count(*) from public.audit_events where actor_id is null),
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

select * from finish();
rollback;
