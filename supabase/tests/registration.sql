begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(20);
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data) values
('98000000-0000-0000-0000-000000000001','authenticated','authenticated','doctor@registration.test',now(),'{}','{}'),
('98000000-0000-0000-0000-000000000002','authenticated','authenticated','other@registration.test',now(),'{}','{}'),
('98000000-0000-0000-0000-000000000003','authenticated','authenticated','reviewer@registration.test',now(),'{}','{}');
insert into public.administrative_access(user_id,reason) values('98000000-0000-0000-0000-000000000003','Equipe de validação cadastral');

select lives_ok($$select public.registration_save('98000000-0000-0000-0000-000000000001','{"civilName":"Teste Civil","displayName":"Dra Teste","cpf":"52998224725","birthDate":"1990-01-01","phone":"+5511987654321","practicesMedicine":"yes","crmNumber":"54321","crmState":"SP"}',0)$$,'draft saves without creating clinical profile');
select is((select count(*)::int from public.profiles where id='98000000-0000-0000-0000-000000000001'),0,'draft grants no professional identity');
select throws_ok($$select public.registration_save('98000000-0000-0000-0000-000000000001','{}',0)$$,'40001','Cadastro modificado em outra sessão','stale revision cannot overwrite draft');
select throws_ok($$select public.registration_save('98000000-0000-0000-0000-000000000002','{"civilName":"Outro","cpf":"52998224725"}',0)$$,'23505',null,'CPF uniqueness enforced in database');
select throws_ok($$select public.registration_save('98000000-0000-0000-0000-000000000002','{"civilName":"Outro","phone":"+5511987654321"}',0)$$,'23505',null,'phone uniqueness enforced in database');
select throws_ok($$select public.registration_submit('98000000-0000-0000-0000-000000000001',1)$$,'P0001','Complete a identificação e a foto','incomplete submission is rejected');
select public.registration_photo('98000000-0000-0000-0000-000000000001','98000000-0000-0000-0000-000000000001/test-photo');
select throws_ok($$select public.registration_submit('98000000-0000-0000-0000-000000000001',2)$$,'P0001','Aceite os documentos atuais','submission requires current legal versions');
select public.registration_accept('98000000-0000-0000-0000-000000000001','2026-09-29',repeat('a',64),repeat('b',64));
select lives_ok($$select public.registration_submit('98000000-0000-0000-0000-000000000001',2)$$,'complete medical submission succeeds');
select lives_ok($$select public.registration_submit('98000000-0000-0000-0000-000000000001',2)$$,'retry is idempotent');
select is((select count(*)::int from private.registration_submissions where user_id='98000000-0000-0000-0000-000000000001'),1,'submitted snapshot is preserved once');
select throws_ok($$select public.registration_review('98000000-0000-0000-0000-000000000001','98000000-0000-0000-0000-000000000003',2,'approved','{}','interno','{"outcome":"active","crmNumber":"00000","crmState":"SP","source":"CFM consulta"}',false,90)$$,'P0001','Evidência CRM incompatível','mismatched evidence cannot approve');
select lives_ok($$select public.registration_review('98000000-0000-0000-0000-000000000001','98000000-0000-0000-0000-000000000003',2,'approved','{}','nota interna protegida','{"outcome":"active","crmNumber":"54321","crmState":"SP","source":"CFM consulta"}',false,90)$$,'independent staff approves exact submitted version');
select ok((select verification_valid_until>now()+interval '89 days' and not rqe_verified and verification_notes is null from public.profiles where id='98000000-0000-0000-0000-000000000001'),'approval has validity without inferred RQE or leaked notes');
set local role authenticated;
select throws_ok($$select public.registration_read('98000000-0000-0000-0000-000000000001')$$,'42501',null,'direct REST cannot read private registration');
select throws_ok($$update public.profiles set crm_number='99999' where id='98000000-0000-0000-0000-000000000001'$$,'42501',null,'direct client cannot alter verified identity');
reset role;
update public.profiles set verification_valid_until=now()-interval '1 second' where id='98000000-0000-0000-0000-000000000001';
select set_config('request.jwt.claims','{"sub":"98000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select throws_ok($$insert into public.workflow_commands(actor_id,command,payload) values('98000000-0000-0000-0000-000000000001','publish_offer','{"owner_terms_acknowledged":true}')$$,'P0001','Revalide seu cadastro profissional','expired verification blocks publication in database');
select throws_ok($$insert into public.workflow_commands(actor_id,command,payload) values('98000000-0000-0000-0000-000000000001','apply_to_offer','{}')$$,'P0001','Revalide seu cadastro profissional','expired verification blocks candidacy in database');
select lives_ok($$select public.registration_save('98000000-0000-0000-0000-000000000002','{"civilName":"Aprovador Teste","displayName":"Aprovador Teste","cpf":"11144477735","birthDate":"1990-01-01","phone":"+5521987654321","practicesMedicine":"no"}',0)$$,'nonmedical approver saves identity without CRM');
select public.registration_photo('98000000-0000-0000-0000-000000000002','98000000-0000-0000-0000-000000000002/test-photo');
select public.registration_accept('98000000-0000-0000-0000-000000000002','2026-09-29',repeat('a',64),repeat('b',64));
select public.registration_submit('98000000-0000-0000-0000-000000000002',2);
select lives_ok($$select public.registration_review('98000000-0000-0000-0000-000000000002','98000000-0000-0000-0000-000000000003',2,'approved','{}','aprovação da identidade','{}',false,90)$$,'nonmedical approver is verified without fictional medical registration');
select is((select count(*)::int from public.group_memberships where profile_id='98000000-0000-0000-0000-000000000002'),0,'identity approval does not grant institution membership');
select * from finish();
rollback;
