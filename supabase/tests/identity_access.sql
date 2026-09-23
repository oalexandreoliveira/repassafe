begin;
select plan(9);

select has_column('public', 'profiles', 'status', 'profiles has verification status');
select has_column('public', 'profiles', 'crm_number', 'profiles has CRM number');
select has_column('public', 'groups', 'requires_approval', 'groups configure approval');
select has_column('public', 'group_memberships', 'role', 'memberships have a role');
select ok(
  not has_table_privilege('anon', 'public.profiles', 'select'),
  'anonymous users cannot read profiles'
);
select ok(
  has_table_privilege('authenticated', 'public.profiles', 'select'),
  'authenticated users may request profiles through RLS'
);
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'display_name', 'update'),
  'users may update their display name'
);
select ok(
  not has_column_privilege('authenticated', 'public.profiles', 'status', 'update'),
  'users cannot update verification status'
);
select ok(
  exists(
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'own profile update'
      and cmd = 'UPDATE'
  ),
  'profiles update policy exists'
);

select * from finish();
rollback;
