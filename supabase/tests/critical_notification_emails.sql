-- US-1003: quais notificações internas viram e-mail, para quem e até quando.
-- Exercita os comandos reais do fluxo em vez de inserir na fila.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(35);

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
select ('9a000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'authenticated', 'authenticated',
  'pessoa' || n || '@critical.test', case when n <> 5 then now() end, '{}', '{}'
from generate_series(1, 5) n;
-- 1 titular, 2 e 3 candidatos, 4 aprovador, 5 e-mail não confirmado.
insert into public.profiles (id, display_name, role, status, crm_number, crm_state, verification_valid_until)
select ('9a000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'Pessoa ' || n,
  case when n = 4 then 'approver' else 'doctor' end::public.app_role, 'approved', '98100' || n, 'MA', now() + interval '90 days'
from generate_series(1, 5) n;
insert into private.registration_drafts (user_id, civil_name, cpf, birth_date, phone, data)
select ('9a000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'Pessoa ' || n, '9810000000' || n, '1990-01-01',
  '+559897777777' || n, '{"practicesMedicine":"yes"}'
from generate_series(1, 3) n;
insert into public.institutions (id, name) values ('9a000000-0000-4000-8000-000000000100', 'Instituição sintética');
insert into public.groups (id, institution_id, name, requires_approval)
values ('9a000000-0000-4000-8000-000000000101', '9a000000-0000-4000-8000-000000000100', 'Com aprovação', true);
insert into public.group_memberships (group_id, profile_id, role)
select '9a000000-0000-4000-8000-000000000101', ('9a000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
  case when n = 4 then 'approver' else 'doctor' end::public.group_role
from unnest(array[1, 2, 4]) n;

create function pg_temp.person(n integer) returns uuid language sql as
  $$ select ('9a000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid $$;
create function pg_temp.run(actor integer, command_name text, target uuid default null, body jsonb default '{}', command_table text default 'workflow_commands')
returns uuid language plpgsql as $$
declare
  command_id uuid := gen_random_uuid();
  result uuid;
begin
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', pg_temp.person(actor), 'role', 'authenticated', 'aal', 'aal1')::text, true);
  set local role authenticated;
  execute format('insert into public.%I (id, command, target_id, payload) values (%L, %L, %L, %L)',
    command_table, command_id, command_name, target, body);
  reset role;
  execute format('select result_id from public.%I where id = %L', command_table, command_id) into result;
  return result;
end;
$$;
create function pg_temp.offer(starts_in interval, group_ref uuid default null) returns uuid language sql as $$
  select pg_temp.run(1, 'publish_offer', null, jsonb_strip_nulls(jsonb_build_object(
    'group_id', group_ref, 'starts_at', now() + starts_in, 'ends_at', now() + starts_in + interval '12 hours',
    'sector', 'UTI', 'value_cents', 120000, 'payment_due_date', (current_date + 40)::text,
    'payment_terms', '30 dias', 'notes', 'Sintético', 'owner_terms_acknowledged', true)));
$$;
create function pg_temp.confirmed(offer_id uuid, approve boolean default false) returns uuid language plpgsql as $$
declare substitution_id uuid;
begin
  substitution_id := pg_temp.run(1, 'select_candidate', pg_temp.run(2, 'apply_to_offer', offer_id));
  perform pg_temp.run(2, 'confirm_substitution', substitution_id, '{"accepted":true,"terms_acknowledged":true}');
  if approve then
    perform pg_temp.run(4, 'decide_substitution', substitution_id, '{"approved":true}');
  end if;
  return substitution_id;
end;
$$;
create function pg_temp.queued(person integer, template_name text, offer_id uuid default null) returns integer language sql as $$
  select count(*)::integer from public.notification_email_deliveries d
  where d.recipient_id = pg_temp.person(person) and d.template = template_name
    and (offer_id is null or d.href = '/plantoes/' || offer_id);
$$;

-- Publicação não vira e-mail: em oferta livre alcançaria todos os perfis aprovados.
select set_config('test.offer', pg_temp.offer(interval '5 days')::text, true);
select ok(
  exists (select 1 from public.notifications where event_type = 'offer.published' and href = '/plantoes/' || current_setting('test.offer')),
  'publishing still notifies inside the app');
select is(
  (select count(*)::integer from public.notification_email_deliveries d join public.notifications n on n.id = d.notification_id where n.event_type = 'offer.published'),
  0, 'publishing queues no email');

-- Candidaturas agrupadas por oferta.
select set_config('test.app2', pg_temp.run(2, 'apply_to_offer', current_setting('test.offer')::uuid)::text, true);
select set_config('test.app3', pg_temp.run(3, 'apply_to_offer', current_setting('test.offer')::uuid)::text, true);
select is(
  (select count(*)::integer from public.notifications where event_type = 'application.created' and href = '/plantoes/' || current_setting('test.offer')),
  2, 'each application stays visible in the app');
select is(pg_temp.queued(1, 'candidates', current_setting('test.offer')::uuid), 1, 'applications in the same hour queue one email');

-- Seleção: destinatário, endereço, link e validade igual ao prazo de confirmação.
select set_config('test.sub2', pg_temp.run(1, 'select_candidate', current_setting('test.app2')::uuid)::text, true);
select is(pg_temp.queued(2, 'selected'), 1, 'selected substitute gets an email');
select is(pg_temp.queued(3, 'selected'), 0, 'other candidates get no selection email');
select is(
  (select d.expires_at from public.notification_email_deliveries d where d.recipient_id = pg_temp.person(2) and d.template = 'selected'),
  (select s.confirmation_deadline from public.substitutions s where s.id = current_setting('test.sub2')::uuid),
  'selection email is valid only until the confirmation deadline');
select is(
  (select d.recipient_email || ' ' || d.href || ' ' || d.state from public.notification_email_deliveries d where d.recipient_id = pg_temp.person(2) and d.template = 'selected'),
  'pessoa2@critical.test /plantoes/' || current_setting('test.offer') || ' pending',
  'selection email targets the confirmed address and the offer link');

-- Recusa e expiração avisam quem pode escolher de novo.
select pg_temp.run(2, 'confirm_substitution', current_setting('test.sub2')::uuid, '{"accepted":false}');
select is(pg_temp.queued(1, 'selection_declined', current_setting('test.offer')::uuid), 1, 'owner learns the candidate declined');
select is(pg_temp.queued(2, 'selection_declined'), 0, 'the candidate who declined gets no email');
select set_config('test.sub3', pg_temp.run(1, 'select_candidate', current_setting('test.app3')::uuid)::text, true);
update public.substitutions set confirmation_deadline = now() - interval '1 minute' where id = current_setting('test.sub3')::uuid;
select private.expire_stale_shift_workflows();
select is(pg_temp.queued(1, 'confirmation_expired', current_setting('test.offer')::uuid), 1, 'owner learns the deadline passed');
select ok(
  exists (select 1 from public.notifications where recipient_id = pg_temp.person(3) and event_type = 'substitution.confirmation_expired'),
  'expired candidate is still told inside the app');
select is(pg_temp.queued(3, 'confirmation_expired'), 0, 'expired candidate has no action left, so no email');

-- Aprovação: quem decide recebe; o titular só acompanha pelo app.
select set_config('test.group_offer', pg_temp.offer(interval '6 days', '9a000000-0000-4000-8000-000000000101')::text, true);
select set_config('test.group_sub', pg_temp.confirmed(current_setting('test.group_offer')::uuid)::text, true);
select is(pg_temp.queued(4, 'approval_pending', current_setting('test.group_offer')::uuid), 1, 'approver gets the pending decision');
select ok(
  exists (select 1 from public.notifications where recipient_id = pg_temp.person(1) and event_type = 'approval.pending' and href = '/plantoes/' || current_setting('test.group_offer')),
  'owner still follows approval inside the app');
select is(pg_temp.queued(1, 'approval_pending'), 0, 'owner gets no approval email');
select pg_temp.run(4, 'decide_substitution', current_setting('test.group_sub')::uuid, '{"approved":false,"reason":"Motivo sintético"}');
select is(pg_temp.queued(1, 'approval_rejected', current_setting('test.group_offer')::uuid), 1, 'owner learns about the rejection');
select is(pg_temp.queued(2, 'approval_rejected', current_setting('test.group_offer')::uuid), 1, 'substitute learns about the rejection');

-- Cancelamento e desistência chegam à outra parte, mesmo quando viram ocorrência.
select set_config('test.cancel_offer', pg_temp.offer(interval '5 days')::text, true);
select pg_temp.run(1, 'cancel_confirmed_substitution', pg_temp.confirmed(current_setting('test.cancel_offer')::uuid), '{"reason":"Motivo sintético"}', 'closure_commands');
select is(pg_temp.queued(2, 'cancelled', current_setting('test.cancel_offer')::uuid), 1, 'substitute learns the owner cancelled');
select is(pg_temp.queued(1, 'cancelled', current_setting('test.cancel_offer')::uuid), 0, 'the person who cancelled gets no email');
select set_config('test.withdraw_offer', pg_temp.offer(interval '6 days', '9a000000-0000-4000-8000-000000000101')::text, true);
select pg_temp.run(2, 'substitute_withdrawal', pg_temp.confirmed(current_setting('test.withdraw_offer')::uuid, true), '{"reason":"Motivo sintético"}', 'closure_commands');
select is(pg_temp.queued(1, 'cancelled', current_setting('test.withdraw_offer')::uuid), 1, 'owner learns the substitute withdrew');
select is(pg_temp.queued(4, 'cancelled', current_setting('test.withdraw_offer')::uuid), 1, 'approver gets one email despite cancellation and occurrence notices');
select is(pg_temp.queued(2, 'cancelled', current_setting('test.withdraw_offer')::uuid), 0, 'the person who withdrew gets no email');

-- Acordo registrado direto: só o aprovador depende deste aviso.
select set_config('request.jwt.claims', jsonb_build_object('sub', pg_temp.person(1), 'role', 'authenticated')::text, true);
set local role authenticated;
select set_config('test.external', public.external_agreement_command(gen_random_uuid(), 'create', null, jsonb_build_object(
  'creator_role', 'owner', 'recipient_email', 'pessoa2@critical.test', 'group_id', '9a000000-0000-4000-8000-000000000101',
  'location', 'Hospital sintético', 'sector', 'UTI', 'starts_at', now() + interval '2 days', 'ends_at', now() + interval '3 days',
  'value_cents', 150000, 'due_date', current_date + 10, 'payment_method', 'Pix', 'accepted', true))::text, true);
reset role;
select set_config('request.jwt.claims', jsonb_build_object('sub', pg_temp.person(2), 'role', 'authenticated')::text, true);
set local role authenticated;
select public.external_agreement_command(gen_random_uuid(), 'accept', current_setting('test.external')::uuid,
  jsonb_build_object('accepted', true, 'terms_hash', (select terms_hash from public.external_agreements where id = current_setting('test.external')::uuid)));
reset role;
select is(
  (select count(*)::integer from public.notification_email_deliveries where recipient_id = pg_temp.person(4) and template = 'approval_pending' and href = '/acordos/registrados/' || current_setting('test.external')),
  1, 'approver of a directly registered agreement gets the pending decision');
select is(
  (select count(*)::integer from public.notification_email_deliveries where recipient_id = pg_temp.person(1) and href = '/acordos/registrados/' || current_setting('test.external')),
  0, 'the creator of a directly registered agreement gets no email');

-- Cadastro e condição de e-mail confirmado.
insert into public.notifications (recipient_id, event_type, title, body, href) values
  (pg_temp.person(3), 'registration.reviewed', 'Seu cadastro foi analisado', 'Confira.', '/cadastro/completar'),
  (pg_temp.person(5), 'registration.reviewed', 'Seu cadastro foi analisado', 'Confira.', '/cadastro/completar');
select is(
  (select d.expires_at from public.notification_email_deliveries d where d.recipient_id = pg_temp.person(3) and d.template = 'registration_reviewed'),
  now() + interval '23 hours', 'registration decision email stays inside the provider key window');
select is(pg_temp.queued(5, 'registration_reviewed'), 0, 'unconfirmed address never receives email');

-- Acesso restrito: sem leitura por clientes e sem reescrita de destinatário pelo serviço.
select ok(not has_table_privilege('authenticated', 'public.notification_email_deliveries', 'SELECT'), 'clients cannot inspect recipients or attempts');
select ok(not has_table_privilege('anon', 'public.notification_email_deliveries', 'SELECT'), 'anonymous cannot inspect the queue');
select ok(not has_table_privilege('service_role', 'public.notification_email_deliveries', 'INSERT,DELETE,TRUNCATE'), 'service worker cannot add or erase queue rows');
select ok(has_column_privilege('service_role', 'public.notification_email_deliveries', 'state', 'UPDATE'), 'service worker can record the attempt');
select ok(not has_column_privilege('service_role', 'public.notification_email_deliveries', 'recipient_email', 'UPDATE'), 'service worker cannot change the recipient');
set local role service_role;
select lives_ok($$update public.notification_email_deliveries
  set state = 'sent', attempts = attempts + 1, attempted_at = now(), first_attempt_at = now(), message = '{}', provider_id = 'p', last_error = null
  where recipient_id = '9a000000-0000-4000-8000-000000000003' and template = 'registration_reviewed'$$,
  'service worker claims and settles a row with the columns it was granted');
select is(
  (select state from public.notification_email_deliveries where recipient_id = '9a000000-0000-4000-8000-000000000003' and template = 'registration_reviewed'),
  'sent', 'service worker sees and updates the row despite row level security');
reset role;
-- Um link fora do formato não aborta a transação que gerou a notificação.
select lives_ok($$insert into public.notifications (recipient_id, event_type, title, body, href)
  values ('9a000000-0000-4000-8000-000000000001', 'substitution.selected', 'Sintético', 'Sintético', '/plantoes/------------------------------------')$$,
  'malformed link does not break the originating transaction');

select * from finish();
rollback;
