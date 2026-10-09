begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(7);

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data)
values
  ('98000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner@shift-end.test', '{}', '{}'),
  ('98000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'substitute@shift-end.test', '{}', '{}');
insert into public.profiles (id, display_name, role, status) values
  ('98000000-0000-0000-0000-000000000001', 'Owner', 'doctor', 'approved'),
  ('98000000-0000-0000-0000-000000000002', 'Substitute', 'doctor', 'approved');

insert into public.shift_offers (id, owner_id, starts_at, ends_at, sector, value_cents, payment_terms, status)
values
  ('98000000-0000-0000-0000-000000000010', '98000000-0000-0000-0000-000000000001',
    now() - interval '12 hours', now() - interval '1 minute', 'Emergência', 10000, 'Transferência', 'closed_confirmed'),
  ('98000000-0000-0000-0000-000000000020', '98000000-0000-0000-0000-000000000001',
    now() - interval '1 hour', now() + interval '6 hours', 'Emergência', 10000, 'Transferência', 'closed_confirmed');
insert into public.shift_applications (id, offer_id, candidate_id, candidate_display_name)
values
  ('98000000-0000-0000-0000-000000000011', '98000000-0000-0000-0000-000000000010',
    '98000000-0000-0000-0000-000000000002', 'Substitute'),
  ('98000000-0000-0000-0000-000000000021', '98000000-0000-0000-0000-000000000020',
    '98000000-0000-0000-0000-000000000002', 'Substitute');
insert into public.substitutions (id, offer_id, application_id, owner_id, substitute_id, status, confirmation_deadline)
values
  ('98000000-0000-0000-0000-000000000012', '98000000-0000-0000-0000-000000000010',
    '98000000-0000-0000-0000-000000000011', '98000000-0000-0000-0000-000000000001',
    '98000000-0000-0000-0000-000000000002', 'confirmed', now()),
  ('98000000-0000-0000-0000-000000000022', '98000000-0000-0000-0000-000000000020',
    '98000000-0000-0000-0000-000000000021', '98000000-0000-0000-0000-000000000001',
    '98000000-0000-0000-0000-000000000002', 'confirmed', now());

select is(private.notify_shift_end(), 1, 'only the shift whose journey ended is processed');
select is((select count(*) from public.notifications
  where recipient_id = '98000000-0000-0000-0000-000000000002'
    and event_type = 'shift.ended_register_completion'), 1::bigint,
  'substitute is asked to register completion');
select is((select count(*) from public.notifications
  where recipient_id = '98000000-0000-0000-0000-000000000001'
    and event_type like 'shift.ended_%'), 0::bigint,
  'owner is not notified at shift end');
select is(private.notify_shift_end(), 0, 'second run is idempotent');
select is((select count(*) from public.notifications
  where event_type like 'shift.ended_%'), 1::bigint, 'no duplicate notifications');
select is((select end_notified_at is null from public.substitutions
  where id = '98000000-0000-0000-0000-000000000022'), true,
  'ongoing shift is not notified');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"98000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}', true);
select throws_ok($sql$insert into public.closure_commands (id, command, target_id, payload)
  values (gen_random_uuid(), 'report_completion', '98000000-0000-0000-0000-000000000012', '{}')$sql$,
  'P0001', 'Somente o médico que assumiu o plantão registra a finalização',
  'owner cannot register completion first');
reset role;

select * from finish();
rollback;
