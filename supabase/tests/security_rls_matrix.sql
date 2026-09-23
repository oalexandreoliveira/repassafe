begin;
select plan(17);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner@test.local', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'candidate@test.local', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'approver@test.local', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'outsider@test.local', '', now(), '{}', '{}', now(), now());

insert into public.profiles (id, display_name, status, role) values
  ('10000000-0000-0000-0000-000000000001', 'Owner', 'approved', 'doctor'),
  ('10000000-0000-0000-0000-000000000002', 'Candidate', 'approved', 'doctor'),
  ('10000000-0000-0000-0000-000000000003', 'Approver', 'approved', 'approver'),
  ('10000000-0000-0000-0000-000000000004', 'Outsider', 'approved', 'doctor');

insert into public.institutions (id, name) values
  ('20000000-0000-0000-0000-000000000001', 'Hospital Teste'),
  ('20000000-0000-0000-0000-000000000002', 'Hospital Externo');
insert into public.groups (id, institution_id, name) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Grupo Teste'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Grupo Externo');
insert into public.group_memberships (group_id, profile_id, role) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'doctor'),
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'doctor'),
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'approver'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'doctor');

insert into public.shift_offers (
  id, group_id, owner_id, starts_at, ends_at, sector, value_cents,
  payment_terms, status
) values (
  '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  now() + interval '5 days', now() + interval '5 days 12 hours',
  'UTI', 120000, '30 dias', 'open_normal'
);
insert into public.shift_applications (
  id, offer_id, candidate_id, candidate_display_name, status
) values (
  '50000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002', 'Candidate', 'confirmed'
);
update public.shift_offers
set status = 'closed_confirmed',
    selected_application_id = '50000000-0000-0000-0000-000000000001'
where id = '40000000-0000-0000-0000-000000000001';
insert into public.substitutions (
  id, offer_id, application_id, group_id, owner_id, substitute_id, status,
  confirmation_deadline, substitute_confirmed_at
) values (
  '60000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002', 'confirmed', now(), now()
);
insert into public.shift_agreements (
  id, substitution_id, offer_id, group_id, owner_id, substitute_id, snapshot
) values (
  '70000000-0000-0000-0000-000000000001',
  '60000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002', '{}'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select is((select count(*) from public.shift_offers), 1::bigint, 'owner reads group offer');
select is((select count(*) from public.shift_applications), 1::bigint, 'owner reads applications to own offer');
select is((select count(*) from public.substitutions), 1::bigint, 'owner reads substitution');
select is((select count(*) from public.shift_agreements), 1::bigint, 'owner reads agreement');
select throws_ok('delete from public.audit_events', '42501', 'owner cannot delete audit');

select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is((select count(*) from public.shift_offers), 1::bigint, 'candidate reads eligible offer');
select is((select count(*) from public.shift_applications), 1::bigint, 'candidate reads own application');
select is((select count(*) from public.substitutions), 1::bigint, 'substitute reads substitution');
select is((select count(*) from public.shift_agreements), 1::bigint, 'substitute reads agreement');

select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select is((select count(*) from public.substitutions), 1::bigint, 'approver reads group substitution');
select is((select count(*) from public.shift_agreements), 1::bigint, 'approver reads group agreement');

select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
select is((select count(*) from public.shift_offers), 0::bigint, 'outsider cannot read other group offer');
select is((select count(*) from public.shift_applications), 0::bigint, 'outsider cannot read application');
select is((select count(*) from public.substitutions), 0::bigint, 'outsider cannot read substitution');
select is((select count(*) from public.shift_agreements), 0::bigint, 'outsider cannot read agreement');

set local role anon;
select throws_ok('select * from public.shift_offers', '42501', 'anonymous cannot read offers');
select throws_ok('insert into public.rate_limit_checks (namespace, identifier_hash, max_requests, window_seconds) values (''test'', repeat(''a'', 64), 1, 60)', '42501', 'anonymous cannot invoke rate limiter');

select * from finish();
rollback;
