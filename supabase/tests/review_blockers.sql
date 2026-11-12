-- Regressão da revisão independente de 10/11/2026 (itens 1, 2, 3, 6 e 16).
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(41);

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
select ('b1000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'authenticated', 'authenticated',
  'bloqueio' || n || '@test.invalid', now(), '{}', '{}'
from generate_series(1, 8) n;
-- 1 titular (também aprovador do grupo), 2 substituto, 3 aprovador, 4 outro candidato.
insert into public.profiles (id, display_name, role, status, crm_number, crm_state, verification_valid_until)
select ('b1000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'Bloqueio ' || n,
  case when n = 3 then 'approver'::public.app_role else 'doctor'::public.app_role end,
  'approved', case when n = 3 then null else '9300' || n end, case when n = 3 then null else 'MA' end,
  now() + interval '90 days'
from generate_series(1, 4) n;
insert into private.registration_drafts (user_id, civil_name, cpf, birth_date, phone, data)
select ('b1000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'Pessoa Bloqueio ' || n,
  '9300000000' || n, '1990-01-01', '+559896666666' || n, '{"practicesMedicine":"yes"}'
from generate_series(1, 2) n;
insert into public.administrative_access (user_id, reason)
values ('b1000000-0000-4000-8000-000000000005', 'Equipe de validação cadastral');
insert into public.institutions (id, name) values ('b1000000-0000-4000-8000-000000000100', 'Instituição de teste');
insert into public.groups (id, institution_id, name, requires_approval)
values ('b1000000-0000-4000-8000-000000000101', 'b1000000-0000-4000-8000-000000000100', 'Grupo com aprovação', true);
insert into public.group_memberships (group_id, profile_id, role) values
  ('b1000000-0000-4000-8000-000000000101', 'b1000000-0000-4000-8000-000000000001', 'approver'),
  ('b1000000-0000-4000-8000-000000000101', 'b1000000-0000-4000-8000-000000000002', 'doctor'),
  ('b1000000-0000-4000-8000-000000000101', 'b1000000-0000-4000-8000-000000000003', 'approver'),
  ('b1000000-0000-4000-8000-000000000101', 'b1000000-0000-4000-8000-000000000004', 'doctor');

create function pg_temp.act(n integer) returns void language sql as $$
  select set_config('request.jwt.claims',
    '{"sub":"b1000000-0000-4000-8000-' || lpad(n::text, 12, '0') || '","role":"authenticated"}', true);
$$;
create function pg_temp.person(n integer) returns uuid language sql as $$
  select ('b1000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid;
$$;
-- Publica como 1, candidata 2 e seleciona; devolve a substituição aguardando o aceite.
create function pg_temp.selected() returns uuid language plpgsql as $$
declare offer uuid; application uuid; result uuid;
begin
  perform pg_temp.act(1);
  insert into public.workflow_commands (id, actor_id, command, payload)
  values (gen_random_uuid(), pg_temp.person(1), 'publish_offer', jsonb_build_object(
    'group_id', 'b1000000-0000-4000-8000-000000000101', 'starts_at', now() + interval '5 days',
    'ends_at', now() + interval '5 days 12 hours', 'sector', 'UTI', 'value_cents', 120000,
    'payment_terms', 'Pix', 'payment_due_date', (current_date + 30)::text,
    'owner_terms_acknowledged', true))
  returning result_id into offer;
  perform pg_temp.act(2);
  insert into public.workflow_commands (id, actor_id, command, target_id)
  values (gen_random_uuid(), pg_temp.person(2), 'apply_to_offer', offer)
  returning result_id into application;
  perform pg_temp.act(1);
  insert into public.workflow_commands (id, actor_id, command, target_id)
  values (gen_random_uuid(), pg_temp.person(1), 'select_candidate', application)
  returning result_id into result;
  return result;
end; $$;
create function pg_temp.pending_approval() returns uuid language plpgsql as $$
declare result uuid := pg_temp.selected();
begin
  perform pg_temp.act(2);
  insert into public.workflow_commands (id, actor_id, command, target_id, payload)
  values (gen_random_uuid(), pg_temp.person(2), 'confirm_substitution', result,
    '{"accepted":true,"terms_acknowledged":true}');
  return result;
end; $$;
create function pg_temp.command(actor integer, name text, target uuid, body jsonb) returns void language plpgsql as $$
begin
  perform pg_temp.act(actor);
  insert into public.workflow_commands (id, actor_id, command, target_id, payload)
  values (gen_random_uuid(), pg_temp.person(actor), name::public.workflow_command_type, target, body);
end; $$;
create function pg_temp.closure(actor integer, name text, target uuid, body jsonb) returns void language plpgsql as $$
begin
  perform pg_temp.act(actor);
  insert into public.closure_commands (id, actor_id, command, target_id, payload)
  values (gen_random_uuid(), pg_temp.person(actor), name::public.closure_command_type, target, body);
end; $$;
create temp table flow (name text primary key, substitution uuid);
grant all on flow to public;

-- Item 1: suspensão, rejeição e a exceção de análise pendente ------------------------
select public.registration_save(pg_temp.person(6), '{"civilName":"Suspensa Teste","displayName":"Dra Suspensa","cpf":"39053344705","birthDate":"1990-01-01","phone":"+5511912345678","practicesMedicine":"yes","crmNumber":"754321","crmState":"SP"}', 0);
select public.registration_photo(pg_temp.person(6), pg_temp.person(6)::text || '/foto');
select public.registration_accept(pg_temp.person(6), '2026-09-29', repeat('a', 64), repeat('b', 64));
select public.registration_submit(pg_temp.person(6), 2);
select ok(private.external_eligible(pg_temp.person(6)), 'first-time pending registration keeps the direct-agreement exception');
select public.registration_review(pg_temp.person(6), pg_temp.person(5), 2, 'suspended', '{}', 'suspensão registrada', '{}', false, 90);
select public.registration_save(pg_temp.person(6), '{"civilName":"Suspensa Teste","displayName":"Dra Suspensa","cpf":"39053344705","birthDate":"1990-01-01","phone":"+5511912345678","practicesMedicine":"yes","crmNumber":"754321","crmState":"SP"}', 2);
select lives_ok($$select public.registration_submit(pg_temp.person(6), 3)$$, 'suspended account can still ask for a new review');
select is((select status::text from public.profiles where id = pg_temp.person(6)), 'suspended', 'resubmission does not lift a suspension');
select is((select state from private.registration_drafts where user_id = pg_temp.person(6)), 'submitted', 'resubmission of a suspended account reaches the review queue');
select ok(not private.external_eligible(pg_temp.person(6)), 'suspended account stays ineligible for direct agreements');
select lives_ok($$select public.registration_review(pg_temp.person(6), pg_temp.person(5), 3, 'approved', '{}', 'reabilitação', '{"outcome":"active","crmNumber":"754321","crmState":"SP","source":"CFM consulta"}', false, 90)$$, 'staff decision reinstates a suspended account');
select ok(private.external_eligible(pg_temp.person(6)), 'reinstated account is eligible again');

select public.registration_save(pg_temp.person(7), '{"civilName":"Rejeitada Teste","displayName":"Dra Rejeitada","cpf":"11144477735","birthDate":"1990-01-01","phone":"+5521912345678","practicesMedicine":"yes","crmNumber":"754322","crmState":"SP"}', 0);
select public.registration_photo(pg_temp.person(7), pg_temp.person(7)::text || '/foto');
select public.registration_accept(pg_temp.person(7), '2026-09-29', repeat('a', 64), repeat('b', 64));
select public.registration_submit(pg_temp.person(7), 2);
select public.registration_review(pg_temp.person(7), pg_temp.person(5), 2, 'rejected', '{}', 'CRM não localizado', '{}', false, 90);
select public.registration_save(pg_temp.person(7), '{"civilName":"Rejeitada Teste","displayName":"Dra Rejeitada","cpf":"11144477735","birthDate":"1990-01-01","phone":"+5521912345678","practicesMedicine":"yes","crmNumber":"754322","crmState":"SP"}', 2);
select public.registration_submit(pg_temp.person(7), 3);
select is((select status::text from public.profiles where id = pg_temp.person(7)), 'pending', 'rejected account may resubmit for review');
select ok(not private.external_eligible(pg_temp.person(7)), 'pending after a rejection does not use the direct-agreement exception');

-- Item 6 e reconferência do titular no aceite ----------------------------------------
insert into flow values ('aceite', pg_temp.selected());
update public.profiles set verification_valid_until = now() - interval '1 second' where id = pg_temp.person(2);
select throws_ok($$select pg_temp.command(2, 'confirm_substitution', (select substitution from flow where name = 'aceite'), '{"accepted":"yes","terms_acknowledged":true}')$$,
  'P0001', 'O candidato precisa revalidar o cadastro profissional', 'string acceptance cannot skip the substitute revalidation');
select throws_ok($$select pg_temp.command(2, 'confirm_substitution', (select substitution from flow where name = 'aceite'), '{"accepted":true,"terms_acknowledged":true}')$$,
  'P0001', 'O candidato precisa revalidar o cadastro profissional', 'boolean acceptance is still revalidated');
update public.profiles set verification_valid_until = now() + interval '90 days' where id = pg_temp.person(2);
update public.profiles set status = 'suspended' where id = pg_temp.person(1);
select throws_ok($$select pg_temp.command(2, 'confirm_substitution', (select substitution from flow where name = 'aceite'), '{"accepted":true,"terms_acknowledged":true}')$$,
  'P0001', 'Quem repassa precisa revalidar o cadastro profissional', 'acceptance rechecks the owner');
update public.profiles set status = 'approved' where id = pg_temp.person(1);
select lives_ok($$select pg_temp.command(2, 'confirm_substitution', (select substitution from flow where name = 'aceite'), '{"accepted":true,"terms_acknowledged":true}')$$,
  'valid parties confirm the conditions');
select is((select status::text from public.substitutions where id = (select substitution from flow where name = 'aceite')),
  'pending_institutional_approval', 'group with approval waits for the decision');

-- Item 2: segregação, partes habilitadas e prazo da decisão --------------------------
select throws_ok($$select pg_temp.command(1, 'decide_substitution', (select substitution from flow where name = 'aceite'), '{"approved":true}')$$,
  'P0001', 'Uma parte do repasse não pode registrar a decisão institucional', 'owner who is an approver cannot approve the own handover');
select throws_ok($$select pg_temp.command(1, 'decide_substitution', (select substitution from flow where name = 'aceite'), '{"approved":false}')$$,
  'P0001', 'Uma parte do repasse não pode registrar a decisão institucional', 'owner who is an approver cannot reject the own handover either');
update public.profiles set status = 'suspended' where id = pg_temp.person(2);
select throws_ok($$select pg_temp.command(3, 'decide_substitution', (select substitution from flow where name = 'aceite'), '{"approved":true}')$$,
  'P0001', 'O candidato precisa revalidar o cadastro profissional', 'approval rechecks the substitute');
update public.profiles set status = 'approved' where id = pg_temp.person(2);
update public.shift_offers set starts_at = now() - interval '1 hour', ends_at = now() + interval '11 hours'
  where id = (select offer_id from public.substitutions where id = (select substitution from flow where name = 'aceite'));
select throws_ok($$select pg_temp.command(3, 'decide_substitution', (select substitution from flow where name = 'aceite'), '{"approved":true}')$$,
  'P0001', 'O plantão já começou; a aprovação não pode mais ser registrada', 'approval is refused after the shift started');
update public.shift_offers set starts_at = now() + interval '5 days', ends_at = now() + interval '5 days 12 hours'
  where id = (select offer_id from public.substitutions where id = (select substitution from flow where name = 'aceite'));
select lives_ok($$select pg_temp.command(3, 'decide_substitution', (select substitution from flow where name = 'aceite'), '{"approved":true}')$$,
  'independent approver approves eligible parties before the shift');
select is((select count(*)::int from public.shift_agreements where substitution_id = (select substitution from flow where name = 'aceite')),
  1, 'approved handover creates the agreement');

-- Item 3: a pendência expira no início do plantão ------------------------------------
insert into flow values ('prazo', pg_temp.pending_approval());
update public.shift_offers set starts_at = now() - interval '1 minute', ends_at = now() + interval '12 hours'
  where id = (select offer_id from public.substitutions where id = (select substitution from flow where name = 'prazo'));
select set_config('request.jwt.claims', '{}', true);
select lives_ok($$select private.expire_stale_shift_workflows()$$, 'expiry job runs');
select is((select status::text from public.substitutions where id = (select substitution from flow where name = 'prazo')),
  'cancelled', 'undecided approval ends when the shift starts');
select is((select o.status::text from public.shift_offers o join public.substitutions s on s.offer_id = o.id
  where s.id = (select substitution from flow where name = 'prazo')), 'expired', 'offer of an undecided approval expires');
select is((select count(*)::int from public.notifications n join public.substitutions s on n.href = '/plantoes/' || s.offer_id
  where s.id = (select substitution from flow where name = 'prazo') and n.title = 'Aprovação não decidida a tempo'),
  3, 'both parties and the independent approver are told about the undecided approval');
select is((select count(*)::int from public.audit_events where entity_id = (select substitution from flow where name = 'prazo')
  and event_type = 'substitution.approval_expired'), 1, 'undecided approval is audited');
select is((select count(*)::int from public.shift_agreements where substitution_id = (select substitution from flow where name = 'prazo')),
  0, 'undecided approval never becomes an agreement');

-- Item 3: as partes retiram o pedido enquanto aguardam -------------------------------
insert into flow values ('desistencia', pg_temp.pending_approval());
select lives_ok($$select pg_temp.closure(2, 'substitute_withdrawal', (select substitution from flow where name = 'desistencia'), '{"reason":"Não poderei assumir este plantão."}')$$,
  'substitute withdraws while the approval is pending');
select is((select o.status::text from public.shift_offers o join public.substitutions s on s.offer_id = o.id
  where s.id = (select substitution from flow where name = 'desistencia')), 'open_normal', 'withdrawal before approval returns the offer to the board');
select is((select a.status::text from public.shift_applications a join public.substitutions s on s.application_id = a.id
  where s.id = (select substitution from flow where name = 'desistencia')), 'withdrawn', 'withdrawn application is recorded');
select is((select count(*)::int from public.shift_occurrences where substitution_id = (select substitution from flow where name = 'desistencia')),
  0, 'withdrawal before approval opens no occurrence');
select pg_temp.act(4);
insert into public.workflow_commands (id, actor_id, command, target_id)
select gen_random_uuid(), pg_temp.person(4), 'apply_to_offer', offer_id
from public.substitutions where id = (select substitution from flow where name = 'desistencia');
select lives_ok($$select pg_temp.command(1, 'select_candidate', (select a.id from public.shift_applications a
  join public.substitutions s on s.offer_id = a.offer_id
  where s.id = (select substitution from flow where name = 'desistencia') and a.candidate_id = pg_temp.person(4)), '{}')$$,
  'owner selects another candidate after the withdrawal');

insert into flow values ('cancelamento', pg_temp.pending_approval());
select lives_ok($$select pg_temp.closure(1, 'cancel_confirmed_substitution', (select substitution from flow where name = 'cancelamento'), '{"reason":"A escala mudou e não preciso mais repassar."}')$$,
  'owner withdraws the request while the approval is pending');
select is((select o.status::text from public.shift_offers o join public.substitutions s on s.offer_id = o.id
  where s.id = (select substitution from flow where name = 'cancelamento')), 'cancelled_by_owner', 'owner withdrawal cancels the offer');
select is((select a.status::text from public.shift_applications a join public.substitutions s on s.application_id = a.id
  where s.id = (select substitution from flow where name = 'cancelamento')), 'invalidated', 'application of a cancelled request is invalidated');

-- Item 2 no registro direto: a parte não aprova o próprio acordo ---------------------
select pg_temp.act(1);
create temp table direct as select public.external_agreement_command(gen_random_uuid(), 'create', null, jsonb_build_object(
  'creator_role', 'owner', 'recipient_email', 'bloqueio2@test.invalid', 'group_id', 'b1000000-0000-4000-8000-000000000101',
  'location', 'Hospital de teste', 'sector', 'UTI', 'starts_at', now() + interval '2 days', 'ends_at', now() + interval '3 days',
  'value_cents', 100000, 'due_date', current_date + 10, 'payment_method', 'Pix', 'accepted', true)) as id;
grant all on direct to public;
select pg_temp.act(2);
select public.external_agreement_command(gen_random_uuid(), 'accept', (select id from direct),
  jsonb_build_object('accepted', true, 'terms_hash', (select terms_hash from public.external_agreements where id = (select id from direct))));
select pg_temp.act(1);
select throws_ok($$select public.external_agreement_command(gen_random_uuid(), 'approve', (select id from direct), '{}')$$,
  'P0001', 'Uma parte do acordo não pode registrar a decisão institucional', 'party cannot approve the own direct agreement');
select pg_temp.act(3);
select lives_ok($$select public.external_agreement_command(gen_random_uuid(), 'approve', (select id from direct), '{}')$$,
  'independent approver approves the direct agreement');
select is((select status from public.external_agreements where id = (select id from direct)), 'confirmed', 'approved direct agreement is confirmed');

-- Item 16: nova seleção depois de uma recusa ------------------------------------------
insert into flow values ('recusa', pg_temp.selected());
select pg_temp.command(2, 'confirm_substitution', (select substitution from flow where name = 'recusa'), '{"accepted":false}');
-- Dentro de uma transação now() é constante; em produção a recusa grava updated_at
-- depois da confirmação das condições feita na publicação.
update public.shift_offers set updated_at = now() + interval '1 hour'
  where id = (select offer_id from public.substitutions where id = (select substitution from flow where name = 'recusa'));
select is((select terms_changed_at from public.shift_offers o join public.substitutions s on s.offer_id = o.id
  where s.id = (select substitution from flow where name = 'recusa')), now(), 'state changes do not move the terms timestamp');
select pg_temp.act(4);
insert into public.workflow_commands (id, actor_id, command, target_id)
select gen_random_uuid(), pg_temp.person(4), 'apply_to_offer', offer_id
from public.substitutions where id = (select substitution from flow where name = 'recusa');
select lives_ok($$select pg_temp.command(1, 'select_candidate', (select a.id from public.shift_applications a
  join public.substitutions s on s.offer_id = a.offer_id
  where s.id = (select substitution from flow where name = 'recusa') and a.candidate_id = pg_temp.person(4)), '{}')$$,
  'owner selects another candidate after a decline');

-- Condições alteradas depois da confirmação continuam exigindo nova confirmação.
insert into flow values ('condicoes', pg_temp.selected());
select pg_temp.command(2, 'confirm_substitution', (select substitution from flow where name = 'condicoes'), '{"accepted":false}');
alter table public.shift_offers disable trigger shift_offers_terms_changed_at;
update public.shift_offers set terms_changed_at = now() - interval '1 day'
  where id = (select offer_id from public.substitutions where id = (select substitution from flow where name = 'condicoes'));
alter table public.shift_offers enable trigger shift_offers_terms_changed_at;
update public.shift_offers set value_cents = value_cents + 100
  where id = (select offer_id from public.substitutions where id = (select substitution from flow where name = 'condicoes'));
select is((select terms_changed_at from public.shift_offers o join public.substitutions s on s.offer_id = o.id
  where s.id = (select substitution from flow where name = 'condicoes')), now(), 'changing a condition moves the terms timestamp');
alter table public.shift_offers disable trigger shift_offers_terms_changed_at;
update public.shift_offers set terms_changed_at = now() + interval '1 second'
  where id = (select offer_id from public.substitutions where id = (select substitution from flow where name = 'condicoes'));
alter table public.shift_offers enable trigger shift_offers_terms_changed_at;
select pg_temp.act(4);
insert into public.workflow_commands (id, actor_id, command, target_id)
select gen_random_uuid(), pg_temp.person(4), 'apply_to_offer', offer_id
from public.substitutions where id = (select substitution from flow where name = 'condicoes');
select throws_ok($$select pg_temp.command(1, 'select_candidate', (select a.id from public.shift_applications a
  join public.substitutions s on s.offer_id = a.offer_id
  where s.id = (select substitution from flow where name = 'condicoes') and a.candidate_id = pg_temp.person(4)), '{}')$$,
  'P0001', 'Titular precisa revisar as condições antes da seleção', 'conditions changed after the acknowledgment still block the selection');

select * from finish();
rollback;
