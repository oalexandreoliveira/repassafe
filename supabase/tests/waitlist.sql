begin;
select plan(9);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.waitlist_entries'::regclass),
  'waitlist has row level security enabled'
);
select ok(
  not has_table_privilege('anon', 'public.waitlist_entries', 'select')
    and not has_table_privilege('anon', 'public.waitlist_entries', 'insert'),
  'anon cannot read or write the waitlist'
);
select ok(
  not has_table_privilege('authenticated', 'public.waitlist_entries', 'select')
    and not has_table_privilege('authenticated', 'public.waitlist_entries', 'insert'),
  'authenticated cannot read or write the waitlist'
);
select ok(
  has_table_privilege('service_role', 'public.waitlist_entries', 'insert'),
  'service role can register contacts'
);

select lives_ok(
  $$insert into public.waitlist_entries (name, email, interest, state)
    values ('Marina Alves', 'marina@example.com', 'ambos', 'MA')$$,
  'a valid contact is accepted'
);
select throws_ok(
  $$insert into public.waitlist_entries (name, email, interest)
    values ('Outra Pessoa', 'MARINA@example.com', 'repassar')$$,
  '23505', null, 'e-mail is unique regardless of case'
);
select throws_ok(
  $$insert into public.waitlist_entries (name, email, interest)
    values ('Marina Alves', 'outro@example.com', 'qualquer')$$,
  '23514', null, 'unknown interest is rejected'
);
select throws_ok(
  $$insert into public.waitlist_entries (name, email, interest, state)
    values ('Marina Alves', 'uf@example.com', 'ambos', 'xx')$$,
  '23514', null, 'state must be two uppercase letters'
);
select throws_ok(
  $$insert into public.waitlist_entries (name, email, interest)
    values ('Al', 'curto@example.com', 'ambos')$$,
  '23514', null, 'name below the minimum length is rejected'
);

select * from finish();
rollback;
