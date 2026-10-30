-- Integridade da evidência documental (Etapa 1 do plano de adequação).
-- Cobre TC-001/TC-002 (parte SQL), TC-004 e TC-011 (negativo, ADR-011).
-- Casos marcados TODO descrevem controles do backlog P0-04 que ainda NÃO existem;
-- eles não quebram a suíte, mas passam a falhar como "TODO passed" quando o
-- controle for implementado, lembrando de remover a marcação.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(31);

insert into auth.users (id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
select ('e1000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'authenticated', 'authenticated',
  'integridade' || n || '@test.invalid', now(), '{}', '{}'
from generate_series(1, 5) n;
insert into public.profiles (id, display_name, role, status, crm_number, crm_state, verification_valid_until)
select ('e1000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'Integridade ' || n,
  case when n = 4 then 'approver'::public.app_role else 'doctor'::public.app_role end,
  'approved', '9200' || n, 'MA', now() + interval '90 days'
from generate_series(1, 5) n;
insert into private.registration_drafts (user_id, civil_name, cpf, birth_date, phone, data)
select ('e1000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid, 'Pessoa Integridade ' || n,
  '9200000000' || n, '1990-01-01', '+559897777777' || n, '{"practicesMedicine":"yes"}'
from generate_series(1, 5) n;

insert into public.institutions (id, name) values ('e1000000-0000-4000-8000-000000000100', 'Instituição de teste');
insert into public.groups (id, institution_id, name, requires_approval)
values ('e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000100', 'Grupo de teste', false);
insert into public.group_memberships (group_id, profile_id, role)
values ('e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000001', 'doctor'),
       ('e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000002', 'doctor');
insert into public.shift_offers (id, group_id, owner_id, starts_at, ends_at, sector, value_cents, payment_terms, status)
values ('e1000000-0000-4000-8000-000000000200', 'e1000000-0000-4000-8000-000000000101',
  'e1000000-0000-4000-8000-000000000001', now() + interval '5 days', now() + interval '5 days 12 hours',
  'UTI', 120000, '30 dias', 'closed_confirmed');
insert into public.shift_applications (id, offer_id, candidate_id, candidate_display_name, status)
values ('e1000000-0000-4000-8000-000000000300', 'e1000000-0000-4000-8000-000000000200',
  'e1000000-0000-4000-8000-000000000002', 'Integridade 2', 'confirmed');
insert into public.substitutions (id, offer_id, application_id, group_id, owner_id, substitute_id, status,
  confirmation_deadline, substitute_confirmed_at)
values ('e1000000-0000-4000-8000-000000000400', 'e1000000-0000-4000-8000-000000000200',
  'e1000000-0000-4000-8000-000000000300', 'e1000000-0000-4000-8000-000000000101',
  'e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'confirmed', now(), now());

select set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
insert into public.shift_agreements (id, substitution_id, offer_id, group_id, owner_id, substitute_id, snapshot)
values ('e1000000-0000-4000-8000-000000000500', 'e1000000-0000-4000-8000-000000000400',
  'e1000000-0000-4000-8000-000000000200', 'e1000000-0000-4000-8000-000000000101',
  'e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002',
  '{"value_cents":120000,"payment_terms":"30 dias"}');
select private.append_agreement_evidence('e1000000-0000-4000-8000-000000000500', 'document_generated', null, '{}');
select set_config('request.jwt.claims', '{}', true);

-- Documento canônico e cadeia.
select is((select count(*)::int from public.agreement_documents where agreement_id = 'e1000000-0000-4000-8000-000000000500'),
  1, 'dossier document is generated with the agreement');
select ok((select document_sha256 = encode(extensions.digest(convert_to(canonical_content_text, 'UTF8'), 'sha256'), 'hex')
  from public.agreement_documents where agreement_id = 'e1000000-0000-4000-8000-000000000500'),
  'document hash matches stored canonical text');
select ok((select event_sha256 = encode(extensions.digest(convert_to(event_content, 'UTF8'), 'sha256'), 'hex')
  from public.agreement_evidence_events where agreement_id = 'e1000000-0000-4000-8000-000000000500' limit 1),
  'event hash matches stored event content');

-- TC-001: tentativas de alterar conteúdo aceito (privilégio de dono da tabela).
select throws_ok($$update public.agreement_documents set canonical_content_text = 'x'
  where agreement_id = 'e1000000-0000-4000-8000-000000000500'$$, 'P0001', 'Documentos e evidências do acordo são imutáveis',
  'document text cannot be updated');
select throws_ok($$update public.agreement_documents set document_sha256 = repeat('0', 64)
  where agreement_id = 'e1000000-0000-4000-8000-000000000500'$$, 'P0001', 'Documentos e evidências do acordo são imutáveis',
  'document hash cannot be updated');
select throws_ok($$delete from public.agreement_documents
  where agreement_id = 'e1000000-0000-4000-8000-000000000500'$$, 'P0001', 'Documentos e evidências do acordo são imutáveis',
  'document cannot be deleted');
select throws_ok($$update public.agreement_evidence_events set event_content = 'x'
  where agreement_id = 'e1000000-0000-4000-8000-000000000500'$$, 'P0001', 'Documentos e evidências do acordo são imutáveis',
  'evidence event cannot be updated');
select throws_ok($$delete from public.agreement_evidence_events
  where agreement_id = 'e1000000-0000-4000-8000-000000000500'$$, 'P0001', 'Documentos e evidências do acordo são imutáveis',
  'evidence event cannot be deleted');
select throws_ok($$update public.shift_agreements set snapshot = '{"value_cents":1}'
  where id = 'e1000000-0000-4000-8000-000000000500'$$, 'P0001', 'Acordos confirmados são imutáveis',
  'agreement snapshot cannot be updated');

-- Privilégios: clientes e service_role não escrevem nas tabelas de evidência do fluxo A.
select ok(not has_table_privilege('authenticated', 'public.agreement_documents', 'insert')
  and not has_table_privilege('authenticated', 'public.agreement_documents', 'update')
  and not has_table_privilege('authenticated', 'public.agreement_documents', 'delete'),
  'authenticated cannot write agreement documents');
select ok(not has_table_privilege('authenticated', 'public.agreement_evidence_events', 'insert')
  and not has_table_privilege('authenticated', 'public.agreement_evidence_events', 'update')
  and not has_table_privilege('authenticated', 'public.agreement_evidence_events', 'delete'),
  'authenticated cannot write evidence events');
select ok(not has_table_privilege('authenticated', 'public.agreement_evidence_events', 'truncate')
  and not has_table_privilege('authenticated', 'public.agreement_evidence_events', 'references')
  and not has_table_privilege('authenticated', 'public.agreement_evidence_events', 'trigger'),
  'authenticated has no destructive or structural privileges on evidence events');
select ok(not has_table_privilege('anon', 'public.agreement_evidence_events', 'select'),
  'anonymous clients cannot read evidence events');
select ok((select relrowsecurity from pg_class where oid = 'public.agreement_evidence_events'::regclass),
  'evidence events remain protected by RLS');
-- Achado da auditoria: os privilégios padrão do Supabase concedem ALL (inclusive
-- TRUNCATE) ao service_role em toda tabela de public; o "grant select" da migração
-- não restringe isso. UPDATE/DELETE seguem bloqueados pelos gatilhos, TRUNCATE não.
select todo_start('P0-04: service_role mantém UPDATE/DELETE/TRUNCATE nas tabelas de evidência do fluxo A');
select ok(not has_table_privilege('service_role', 'public.agreement_documents', 'update')
  and not has_table_privilege('service_role', 'public.agreement_evidence_events', 'update')
  and not has_table_privilege('service_role', 'public.agreement_documents', 'truncate')
  and not has_table_privilege('service_role', 'public.agreement_evidence_events', 'truncate'),
  'service_role cannot update or truncate flow A evidence tables');
select todo_end();

-- TC-002 (parte SQL): a adulteração de bytes é detectável por recálculo.
-- Um papel com privilégio pode desativar o gatilho; o controle detectivo é o hash.
alter table public.agreement_documents disable trigger agreement_documents_immutable;
update public.agreement_documents set canonical_content_text = canonical_content_text || ' '
  where agreement_id = 'e1000000-0000-4000-8000-000000000500';
alter table public.agreement_documents enable trigger agreement_documents_immutable;
select isnt((select document_sha256 from public.agreement_documents where agreement_id = 'e1000000-0000-4000-8000-000000000500'),
  (select encode(extensions.digest(convert_to(canonical_content_text, 'UTF8'), 'sha256'), 'hex')
   from public.agreement_documents where agreement_id = 'e1000000-0000-4000-8000-000000000500'),
  'one extra byte in the canonical text is detected by hash recomputation');

-- TC-004: terceiros não leem documento nem eventos.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000005","role":"authenticated"}', true);
select is((select count(*)::int from public.agreement_documents where agreement_id = 'e1000000-0000-4000-8000-000000000500'), 0, 'outsider cannot read agreement documents');
-- A2: privilégio de tabela e leituras reais sob RLS, sem service_role.
select ok(has_table_privilege('authenticated', 'public.agreement_evidence_events', 'select'),
  'parties can read the evidence trail used by /acordos/[id]');
select is((select count(*)::int from public.agreement_evidence_events where agreement_id = 'e1000000-0000-4000-8000-000000000500'),
  0, 'outsider cannot read evidence events');
select set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select is((select count(*)::int from public.agreement_documents where agreement_id = 'e1000000-0000-4000-8000-000000000500'), 1, 'substitute reads own agreement document');
select ok((select count(*) > 0 from public.agreement_evidence_events where agreement_id = 'e1000000-0000-4000-8000-000000000500'),
  'substitute reads own evidence events');
select set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select ok((select count(*) > 0 from public.agreement_evidence_events where agreement_id = 'e1000000-0000-4000-8000-000000000500'),
  'owner reads own evidence events');
reset role;
insert into public.group_memberships (group_id, profile_id, role) values
  ('e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000004', 'approver'),
  ('e1000000-0000-4000-8000-000000000101', 'e1000000-0000-4000-8000-000000000005', 'doctor');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
select ok((select count(*) > 0 from public.agreement_evidence_events where agreement_id = 'e1000000-0000-4000-8000-000000000500'),
  'active group approver reads evidence events');
reset role;
update public.group_memberships set active = false where group_id = 'e1000000-0000-4000-8000-000000000101'
  and profile_id = 'e1000000-0000-4000-8000-000000000004';
set local role authenticated;
select is((select count(*)::int from public.agreement_evidence_events where agreement_id = 'e1000000-0000-4000-8000-000000000500'),
  0, 'inactive approver cannot read evidence events');
select set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000005","role":"authenticated"}', true);
select is((select count(*)::int from public.agreement_evidence_events where agreement_id = 'e1000000-0000-4000-8000-000000000500'),
  0, 'group membership alone does not expose evidence events');
reset role;
set local role anon;
select throws_ok($$select * from public.agreement_evidence_events$$, '42501',
  'permission denied for table agreement_evidence_events', 'anonymous evidence query is denied');
reset role;

-- TC-011 (negativo, ADR-011): só pessoa natural médica elegível pode ser parte.
select set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select is(public.external_agreement_context()->>'eligible', 'false', 'non-doctor role is not eligible to be a party');
select throws_ok($$select public.external_agreement_command(gen_random_uuid(), 'create', null, jsonb_build_object(
  'creator_role', 'owner', 'recipient_email', 'integridade1@test.invalid', 'location', 'Local', 'sector', 'UTI',
  'starts_at', now() + interval '2 days', 'ends_at', now() + interval '3 days', 'value_cents', 100000,
  'due_date', current_date + 10, 'payment_method', 'Pix', 'accepted', true))$$,
  'P0001', 'Complete seu cadastro para registrar o acordo', 'non-doctor role cannot create an agreement');
reset role;
select ok(not exists (select 1 from information_schema.columns where table_schema = 'public'
  and table_name = 'external_agreements' and column_name in ('company_id', 'cnpj', 'legal_representative_id')),
  'no legal-entity party columns exist on agreements (ADR-011)');

-- Backlog P0-04 (controles ainda inexistentes; TODO não quebra a suíte).
select todo_start('P0-04: service_role ainda tem UPDATE em external_agreements');
select ok(not has_table_privilege('service_role', 'public.external_agreements', 'update'),
  'service_role cannot update external agreements directly');
select todo_end();
insert into public.external_agreements (id, creator_id, creator_role, recipient_email, recipient_id, owner_id, substitute_id, location, sector, starts_at, ends_at, value_cents, due_date, payment_method, terms, terms_hash, status, confirmed_at)
values ('e1000000-0000-4000-8000-000000000600', 'e1000000-0000-4000-8000-000000000001', 'owner', 'integridade2@test.invalid', 'e1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-000000000001', 'e1000000-0000-4000-8000-000000000002', 'Local', 'UTI', now() + interval '2 days', now() + interval '3 days', 100000, current_date + 10, 'Pix', '{}', '', 'confirmed', now());
select todo_start('P0-04: acordo externo confirmado ainda pode mudar de status por papel privilegiado');
select throws_ok($$update public.external_agreements set status = 'cancelled' where id = 'e1000000-0000-4000-8000-000000000600'$$,
  'P0001', null, 'confirmed external agreement status is terminal');
select todo_end();

select * from finish();
rollback;
