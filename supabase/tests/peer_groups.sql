begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

-- 1 cria o grupo; 2 entra por convite; 3 é removido; 4 tem cadastro pendente.
insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
select ('98000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'authenticated', 'authenticated',
  'peer' || n || '@test.invalid', now(), '{}', '{}'
from generate_series(1, 4) n;
insert into public.profiles (id, display_name, role, status, verification_valid_until)
select ('98000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'Colega ' || n, 'doctor',
  case when n = 4 then 'pending' else 'approved' end::public.profile_status,
  case when n = 4 then null else now() + interval '90 days' end
from generate_series(1, 4) n;

create function pg_temp.actor(n integer) returns void language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object('sub',
    '98000000-0000-4000-8000-' || lpad(n::text, 12, '0'), 'role', 'authenticated')::text, true)::text::void;
$$;
create function pg_temp.person(n integer) returns uuid language sql as $$
  select ('98000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid;
$$;
create function pg_temp.token(c text) returns text language sql as $$ select repeat(c, 43); $$;

select ok(not has_function_privilege('anon', 'public.group_command(uuid,text,uuid,jsonb)', 'execute'),
  'anonymous cannot run group commands');
select ok(not has_table_privilege('authenticated', 'public.group_invites', 'select'),
  'invite hashes are not readable by clients');
select ok(not has_table_privilege('authenticated', 'public.groups', 'insert'),
  'clients cannot insert groups directly');

-- Criação
select pg_temp.actor(4);
set local role authenticated;
select throws_ok($$select public.group_command(gen_random_uuid(), 'create', null, '{"name":"Plantonistas UTI"}')$$,
  'P0001', 'Somente médicos com cadastro aprovado e vigente podem criar grupos', 'pending profile cannot create');
reset role;

select pg_temp.actor(1);
set local role authenticated;
select throws_ok($$select public.group_command(gen_random_uuid(), 'create', null, '{"name":"  a "}')$$,
  'P0001', 'Informe um nome de 3 a 80 caracteres', 'name length is enforced');
select set_config('test.group', (public.group_command('98000000-0000-4000-8000-000000000101', 'create', null,
  '{"name":"  Plantonistas   UTI  "}')->>'group_id'), true);
select is(public.group_command('98000000-0000-4000-8000-000000000101', 'create', null,
  '{"name":"  Plantonistas   UTI  "}')->>'group_id', current_setting('test.group'), 'create retry is idempotent');
select throws_ok($$select public.group_command('98000000-0000-4000-8000-000000000101', 'create', null, '{"name":"Outro"}')$$,
  'P0001', 'Comando já utilizado com outros dados', 'same request cannot change data');
select is(public.group_context(current_setting('test.group')::uuid)->>'role', 'manager', 'creator manages the group');
select is(public.group_context()->'groups'->0->>'kind', 'peer', 'group list shows the peer kind');
reset role;

select results_eq(
  format('select kind::text, institution_id is null, requires_approval, name from public.groups where id = %L',
    current_setting('test.group')),
  $$values ('peer', true, false, 'Plantonistas UTI')$$,
  'peer group has no institution nor approval and a normalized name');
select throws_ok(format('update public.groups set kind = %L where id = %L', 'institutional', current_setting('test.group')),
  'P0001', 'O tipo e a autoria do grupo são imutáveis', 'kind cannot change');
select throws_ok(format('insert into public.group_memberships (group_id, profile_id, role) values (%L, %L, %L)',
    current_setting('test.group'), pg_temp.person(3), 'approver'),
  'P0001', 'Grupos de colegas não têm aprovadores institucionais', 'peer groups never get approvers');
insert into public.institutions (id, name) values ('98100000-0000-4000-8000-000000000001', 'Hospital Teste');
insert into public.groups (id, institution_id, name) values
  ('98200000-0000-4000-8000-000000000001', '98100000-0000-4000-8000-000000000001', 'Institucional Teste');
select throws_ok($$insert into public.group_memberships (group_id, profile_id, role)
    values ('98200000-0000-4000-8000-000000000001', '98000000-0000-4000-8000-000000000001', 'manager')$$,
  'P0001', 'Grupos institucionais são geridos pela administração', 'institutional groups never get managers');
select throws_ok($$insert into public.groups (name, kind, created_by, requires_approval)
    values ('Exige aprovação', 'peer', '98000000-0000-4000-8000-000000000001', true)$$,
  '23514', null, 'peer groups cannot require institutional approval');

-- Convites
select pg_temp.actor(1);
set local role authenticated;
select throws_ok(format($$select public.group_command(gen_random_uuid(), 'invite', %L, '{"token":"curto","validity_days":7}')$$,
    current_setting('test.group')),
  'P0001', 'Convite inválido', 'token format is enforced');
select throws_ok(format($$select public.group_command(gen_random_uuid(), 'invite', %L, jsonb_build_object('token', pg_temp.token('a'), 'validity_days', 3))$$,
    current_setting('test.group')),
  'P0001', 'Escolha a validade do convite', 'validity is limited to 1, 7 or 30 days');
select set_config('test.invite_a', public.group_command(gen_random_uuid(), 'invite', current_setting('test.group')::uuid,
  jsonb_build_object('token', pg_temp.token('a'), 'validity_days', 7))->>'invite_id', true);
select is(jsonb_array_length(public.group_context(current_setting('test.group')::uuid)->'invites'), 1,
  'manager sees the active invite');
reset role;
select ok((select token_hash <> pg_temp.token('a') and token_hash ~ '^[0-9a-f]{64}$'
  from public.group_invites where id = current_setting('test.invite_a')::uuid), 'only the token hash is stored');

select pg_temp.actor(4);
set local role authenticated;
select is(public.group_invite_preview(pg_temp.token('a'))->>'status', 'ineligible', 'pending profile sees it cannot join');
select throws_ok($$select public.group_command(gen_random_uuid(), 'join', null, jsonb_build_object('token', pg_temp.token('a')))$$,
  'P0001', 'Seu cadastro precisa estar aprovado e vigente para entrar no grupo', 'pending profile cannot join');
reset role;

select pg_temp.actor(2);
set local role authenticated;
select is(public.group_invite_preview(pg_temp.token('z'))->>'status', 'unavailable', 'unknown token reveals nothing');
select is(public.group_invite_preview(pg_temp.token('a'))->>'status', 'open', 'eligible doctor can join');
select is(public.group_invite_preview(pg_temp.token('a'))->>'manager_name', 'Colega 1', 'preview names the manager');
select is((public.group_command(gen_random_uuid(), 'join', null, jsonb_build_object('token', pg_temp.token('a')))->>'already_member')::boolean,
  false, 'doctor joins with the invite');
select is((public.group_command(gen_random_uuid(), 'join', null, jsonb_build_object('token', pg_temp.token('a')))->>'already_member')::boolean,
  true, 'joining again keeps a single membership');
select is(public.group_context(current_setting('test.group')::uuid)->>'role', 'doctor', 'joiner is a regular member');
select is(jsonb_array_length(public.group_context(current_setting('test.group')::uuid)->'members'), 2, 'members see each other');
select ok(public.group_context(current_setting('test.group')::uuid)->'invites' is null, 'members do not see invites');
select throws_ok(format($$select public.group_command(gen_random_uuid(), 'invite', %L, jsonb_build_object('token', pg_temp.token('b'), 'validity_days', 7))$$,
    current_setting('test.group')),
  'P0001', 'Somente o gestor do grupo pode fazer isso', 'members cannot invite');
reset role;
select is((select use_count from public.group_invites where id = current_setting('test.invite_a')::uuid), 1, 'invite counts one use');
select is((select count(*)::int from public.notifications where recipient_id = pg_temp.person(1) and event_type = 'group.member_joined'), 1,
  'manager is notified once');

-- Remoção: o convite antigo não readmite; um convite novo, sim.
select pg_temp.actor(3);
set local role authenticated;
select lives_ok($$select public.group_command(gen_random_uuid(), 'join', null, jsonb_build_object('token', pg_temp.token('a')))$$, 'third doctor joins');
reset role;
select pg_temp.actor(1);
set local role authenticated;
select lives_ok(format($$select public.group_command(gen_random_uuid(), 'remove_member', %L, jsonb_build_object('profile_id', %L))$$,
  current_setting('test.group'), pg_temp.person(3)), 'manager removes a member');
reset role;
select pg_temp.actor(3);
set local role authenticated;
select is(public.group_context(current_setting('test.group')::uuid), null, 'removed member loses access');
select throws_ok($$select public.group_command(gen_random_uuid(), 'join', null, jsonb_build_object('token', pg_temp.token('a')))$$,
  'P0001', 'Convite indisponível', 'removed member cannot reuse an older invite');
reset role;
select pg_temp.actor(1);
set local role authenticated;
select lives_ok(format($$select public.group_command(gen_random_uuid(), 'invite', %L, jsonb_build_object('token', pg_temp.token('c'), 'validity_days', 1))$$,
  current_setting('test.group')), 'manager issues a new invite');
select lives_ok(format($$select public.group_command(gen_random_uuid(), 'revoke_invite', %L, jsonb_build_object('invite_id', %L))$$,
  current_setting('test.group'), current_setting('test.invite_a')), 'manager revokes the first invite');
reset role;
select pg_temp.actor(3);
set local role authenticated;
select lives_ok($$select public.group_command(gen_random_uuid(), 'join', null, jsonb_build_object('token', pg_temp.token('c')))$$,
  'removed member returns with a newer invite');
reset role;
select pg_temp.actor(4);
set local role authenticated;
select is(public.group_invite_preview(pg_temp.token('a'))->>'status', 'unavailable', 'revoked invite is unavailable');
reset role;

-- Plantão no grupo de colegas: visível só a membros e registrado sem aprovação.
select pg_temp.actor(1);
set local role authenticated;
insert into public.workflow_commands (id, command, payload) values ('98300000-0000-4000-8000-000000000001', 'publish_offer',
  jsonb_build_object('group_id', current_setting('test.group'), 'starts_at', now() + interval '5 days',
    'ends_at', now() + interval '5 days 12 hours', 'sector', 'UTI', 'value_cents', 120000,
    'payment_terms', '30 dias', 'notes', 'Grupo de colegas', 'owner_terms_acknowledged', true));
reset role;
select set_config('test.offer', (select result_id::text from public.workflow_commands where id = '98300000-0000-4000-8000-000000000001'), true);
select pg_temp.actor(4);
set local role authenticated;
select is((select count(*)::int from public.shift_offers where id = current_setting('test.offer')::uuid), 0, 'outsiders cannot see the offer');
reset role;
select pg_temp.actor(2);
set local role authenticated;
select is((select count(*)::int from public.shift_offers where id = current_setting('test.offer')::uuid), 1, 'members see the offer');
insert into public.workflow_commands (id, command, target_id) values
  ('98300000-0000-4000-8000-000000000002', 'apply_to_offer', current_setting('test.offer')::uuid);
reset role;
select set_config('test.application', (select result_id::text from public.workflow_commands where id = '98300000-0000-4000-8000-000000000002'), true);
select pg_temp.actor(1);
set local role authenticated;
select throws_ok(format($$select public.group_command(gen_random_uuid(), 'archive', %L, '{}')$$, current_setting('test.group')),
  'P0001', 'Conclua ou cancele os plantões abertos do grupo antes de arquivar', 'open offers block archiving');
insert into public.workflow_commands (id, command, target_id, payload) values
  ('98300000-0000-4000-8000-000000000003', 'select_candidate',
   current_setting('test.application')::uuid,
   '{"confirmation_minutes":30}');
reset role;
select set_config('test.substitution', (select result_id::text from public.workflow_commands where id = '98300000-0000-4000-8000-000000000003'), true);
select pg_temp.actor(2);
set local role authenticated;
insert into public.workflow_commands (id, command, target_id, payload) values
  ('98300000-0000-4000-8000-000000000004', 'confirm_substitution',
   current_setting('test.substitution')::uuid,
   '{"accepted":true,"terms_acknowledged":true}');
reset role;
select is((select status::text from public.substitutions
  where id = current_setting('test.substitution')::uuid),
  'confirmed', 'peer group agreement is registered without institutional approval');
select ok(exists(select 1 from public.agreement_documents d
  where to_jsonb(d)::text like '%' || current_setting('test.offer') || '%'
    and to_jsonb(d)::text like '%"group": {"id": "' || current_setting('test.group') || '", "name": "Plantonistas UTI", "institution_name": null}%'),
  'agreement document names the peer group without an institution');

-- Gestão: transferir, sair e arquivar.
select pg_temp.actor(1);
set local role authenticated;
select throws_ok(format($$select public.group_command(gen_random_uuid(), 'leave', %L, '{}')$$, current_setting('test.group')),
  'P0001', 'Transfira a gestão antes de sair do grupo', 'manager cannot abandon members');
select lives_ok(format($$select public.group_command(gen_random_uuid(), 'transfer', %L, jsonb_build_object('profile_id', %L))$$,
  current_setting('test.group'), pg_temp.person(2)), 'manager transfers the group');
select is(public.group_context(current_setting('test.group')::uuid)->>'role', 'doctor', 'former manager becomes a member');
select lives_ok(format($$select public.group_command(gen_random_uuid(), 'leave', %L, '{}')$$, current_setting('test.group')),
  'former manager can leave');
reset role;
select pg_temp.actor(2);
set local role authenticated;
select is(public.group_context(current_setting('test.group')::uuid)->>'role', 'manager', 'new manager is in charge');
select lives_ok(format($$select public.group_command(gen_random_uuid(), 'archive', %L, '{}')$$, current_setting('test.group')),
  'manager archives the group without open offers');
select throws_ok(format($$select public.group_command(gen_random_uuid(), 'rename', %L, '{"name":"Novo nome"}')$$, current_setting('test.group')),
  'P0001', 'Este grupo está arquivado', 'archived groups are read-only');
reset role;
select is((select count(*)::int from public.audit_events where entity_id = current_setting('test.group')::uuid
  and event_type like 'group.%'), 11, 'every group change is audited');

select * from finish();
rollback;
