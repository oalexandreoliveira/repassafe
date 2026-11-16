begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();

-- Documentos versão 2026-11-15: o envio do cadastro exige os dois aceites da versão
-- atual; a versão 2026-09-29 só vale durante a transição (até 16/11/2026 0h em Fortaleza).
insert into auth.users(id,aud,role,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data)
select ('96000000-0000-0000-0000-00000000000'||n)::uuid,'authenticated','authenticated','legal'||n||'@registration.test',now(),'{}','{}' from generate_series(1,3) n;

create function pg_temp.prepare(n integer, cpf text, phone text) returns void language sql as $$
  select public.registration_save(('96000000-0000-0000-0000-00000000000'||n)::uuid,
    jsonb_build_object('civilName','Pessoa Legal '||n,'displayName','Dra Legal '||n,'cpf',cpf,'birthDate','1990-01-01',
      'phone',phone,'practicesMedicine','yes','crmNumber','9600'||n,'crmState','MA'),0)::text::void;
  select public.registration_photo(('96000000-0000-0000-0000-00000000000'||n)::uuid,'96000000-0000-0000-0000-00000000000'||n||'/foto');
$$;
select pg_temp.prepare(1,'52998224725','+5598991000001');
select pg_temp.prepare(2,'11144477735','+5598991000002');
select pg_temp.prepare(3,'39053344705','+5598991000003');

select public.registration_accept('96000000-0000-0000-0000-000000000001','2020-01-01',repeat('a',64),repeat('b',64));
select throws_ok($$select public.registration_submit('96000000-0000-0000-0000-000000000001',2)$$,'P0001','Aceite os documentos atuais','unknown version is not accepted');

insert into private.legal_acceptances(user_id,document,version,content_hash)
values('96000000-0000-0000-0000-000000000002','terms','2026-11-15',repeat('c',64));
select throws_ok($$select public.registration_submit('96000000-0000-0000-0000-000000000002',2)$$,'P0001','Aceite os documentos atuais','both documents must be accepted');
select public.registration_accept('96000000-0000-0000-0000-000000000002','2026-11-15',repeat('c',64),repeat('d',64));
select lives_ok($$select public.registration_submit('96000000-0000-0000-0000-000000000002',2)$$,'current version of both documents allows submission');

select public.registration_accept('96000000-0000-0000-0000-000000000003','2026-09-29',repeat('e',64),repeat('f',64));
create function pg_temp.old_version_submits() returns boolean language plpgsql as $$
begin
  perform public.registration_submit('96000000-0000-0000-0000-000000000003',2);
  return true;
exception when others then
  return false;
end;
$$;
select is(pg_temp.old_version_submits(), now() < timestamptz '2026-11-16 03:00:00+00',
  'previous version is accepted only during the transition window');

select * from finish();
rollback;
