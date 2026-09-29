begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(20);

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
values
  ('99000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'staff@isolation.test', '{}', '{}'),
  ('99000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'owner@isolation.test', '{}', '{}'),
  ('99000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'substitute@isolation.test', '{}', '{}'),
  ('99000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'dual@isolation.test', '{}', '{}'),
  ('99000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'legacy@isolation.test', '{}', '{}');
insert into public.profiles (id, display_name, role, status) values
  ('99000000-0000-0000-0000-000000000002', 'Owner', 'doctor', 'approved'),
  ('99000000-0000-0000-0000-000000000003', 'Substitute', 'doctor', 'approved'),
  ('99000000-0000-0000-0000-000000000004', 'Suspended professional', 'doctor', 'suspended'),
  ('99000000-0000-0000-0000-000000000005', 'Legacy role without grant', 'admin', 'approved');
insert into public.administrative_access (user_id, reason) values
  ('99000000-0000-0000-0000-000000000001', 'Equipe de teste administrativo'),
  ('99000000-0000-0000-0000-000000000004', 'Equipe de teste administrativo');
select is((select count(*) from public.profiles where id = '99000000-0000-0000-0000-000000000001'),
  0::bigint, 'staff entitlement does not create a medical profile');
select is((select count(*) from public.audit_events where entity_id = '99000000-0000-0000-0000-000000000001'
  and event_type = 'administration.access_granted'), 1::bigint, 'grant is audited');

insert into public.shift_offers (id, owner_id, starts_at, ends_at, sector, value_cents, payment_terms, status)
values ('99000000-0000-0000-0000-000000000010', '99000000-0000-0000-0000-000000000002',
  now() - interval '2 days', now() - interval '1 day', 'Emergência', 10000, 'Transferência', 'closed_confirmed');
insert into public.shift_applications (id, offer_id, candidate_id, candidate_display_name)
values ('99000000-0000-0000-0000-000000000011', '99000000-0000-0000-0000-000000000010',
  '99000000-0000-0000-0000-000000000003', 'Substitute');
insert into public.substitutions (id, offer_id, application_id, owner_id, substitute_id, status, confirmation_deadline)
values ('99000000-0000-0000-0000-000000000012', '99000000-0000-0000-0000-000000000010',
  '99000000-0000-0000-0000-000000000011', '99000000-0000-0000-0000-000000000002',
  '99000000-0000-0000-0000-000000000003', 'cancelled', now());
insert into public.shift_occurrences (id, substitution_id, opened_by, category, description)
values ('99000000-0000-0000-0000-000000000013', '99000000-0000-0000-0000-000000000012',
  '99000000-0000-0000-0000-000000000002', 'other', 'Ocorrência de teste de isolamento');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"99000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}', true);
select is((select count(user_id) from public.administrative_access), 1::bigint, 'staff can discover own entitlement before MFA');
select throws_ok('select reason from public.administrative_access', '42501', null, 'staff cannot read internal entitlement reasons');
select throws_ok('update public.administrative_access set active = false', '42501', null, 'client cannot revoke or grant staff access');
select throws_ok($sql$insert into public.administrative_access (user_id, reason)
  values ('99000000-0000-0000-0000-000000000002', 'Autopromoção proibida')$sql$,
  '42501', null, 'client cannot self-promote');
select throws_ok($sql$insert into public.closure_commands (id, command, target_id, payload)
  values (gen_random_uuid(), 'review_occurrence', '99000000-0000-0000-0000-000000000013', '{"decision":"Análise de teste concluída"}')$sql$,
  'P0001', 'Acesso administrativo requer MFA', 'database denies staff review at aal1');

select set_config('request.jwt.claims', '{"sub":"99000000-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}', true);
select is((select count(user_id) from public.administrative_access), 0::bigint, 'professional cannot discover other staff');
select throws_ok($sql$insert into public.closure_commands (id, command, target_id, payload)
  values (gen_random_uuid(), 'review_occurrence', '99000000-0000-0000-0000-000000000013', '{"decision":"Análise de teste concluída"}')$sql$,
  'P0001', 'Acesso administrativo requer MFA', 'MFA alone does not grant management');
select set_config('request.jwt.claims', '{"sub":"99000000-0000-0000-0000-000000000005","role":"authenticated","aal":"aal2"}', true);
select throws_ok($sql$insert into public.closure_commands (id, command, target_id, payload)
  values (gen_random_uuid(), 'review_occurrence', '99000000-0000-0000-0000-000000000013', '{"decision":"Análise de teste concluída"}')$sql$,
  'P0001', 'Acesso administrativo requer MFA', 'legacy profile role does not substitute an independent grant');

select set_config('request.jwt.claims', '{"sub":"99000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}', true);
select lives_ok($sql$insert into public.closure_commands (id, command, target_id, payload)
  values (gen_random_uuid(), 'review_occurrence', '99000000-0000-0000-0000-000000000013', '{"decision":"Análise de teste concluída"}')$sql$,
  'staff without CRM/profile can review an occurrence at aal2');
select throws_ok($sql$insert into public.closure_commands (id, command, target_id, payload)
  values (gen_random_uuid(), 'report_completion', '99000000-0000-0000-0000-000000000012', '{}')$sql$,
  'P0001', 'O perfil precisa estar aprovado', 'staff grant does not confer medical completion rights');

reset role;
select is((select reviewed_by from public.shift_occurrences where id = '99000000-0000-0000-0000-000000000013'),
  '99000000-0000-0000-0000-000000000001'::uuid, 'occurrence records Auth identity as reviewer');
select is((select count(*) from public.audit_events where actor_id = '99000000-0000-0000-0000-000000000001'
  and event_type = 'occurrence.reviewed'), 1::bigint, 'staff without medical profile is recorded in audit');
insert into public.crm_verifications (profile_id, verified_by, crm_number_checked, crm_state_checked, outcome, source)
values ('99000000-0000-0000-0000-000000000002', '99000000-0000-0000-0000-000000000001', '12345', 'MA', 'verified', 'Fonte oficial de teste');
select is((select count(*) from public.crm_verifications where verified_by = '99000000-0000-0000-0000-000000000001'),
  1::bigint, 'CRM verifier can be staff without professional profile');
select ok((select active from public.administrative_access where user_id = '99000000-0000-0000-0000-000000000004'),
  'suspended professional status does not change staff entitlement');
update public.administrative_access set active = false, reason = 'Revogação administrativa de teste'
where user_id = '99000000-0000-0000-0000-000000000001';
select is((select count(*) from public.audit_events where entity_id = '99000000-0000-0000-0000-000000000001'
  and event_type = 'administration.access_revoked'), 1::bigint, 'revocation is audited');
select throws_ok($sql$delete from public.administrative_access
  where user_id = '99000000-0000-0000-0000-000000000001'$sql$,
  'P0001', 'Revogue a concessão sem excluir seu histórico', 'staff access history cannot be deleted');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"99000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}', true);
select throws_ok($sql$insert into public.closure_commands (id, command, target_id, payload)
  values (gen_random_uuid(), 'review_occurrence', '99000000-0000-0000-0000-000000000013', '{"decision":"Nova análise não autorizada"}')$sql$,
  'P0001', 'Acesso administrativo requer MFA', 'revocation takes effect with an existing aal2 JWT');
reset role;
set local role anon;
select throws_ok('select user_id, active from public.administrative_access', '42501', null, 'anonymous callers cannot discover staff');
reset role;
select * from finish();
rollback;
