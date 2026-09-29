begin;
select plan(12);

select has_table('public', 'shift_offers', 'shift offers exist');
select has_table('public', 'shift_applications', 'applications exist');
select has_table('public', 'substitutions', 'substitutions exist');
select has_table('public', 'shift_agreements', 'agreements exist');
select has_table('public', 'workflow_commands', 'workflow commands exist');
select ok(
  not has_table_privilege('anon', 'public.shift_offers', 'select'),
  'anonymous users cannot list offers'
);
select ok(
  has_table_privilege('authenticated', 'public.workflow_commands', 'insert'),
  'authenticated users can submit workflow commands'
);
select ok(
  not has_table_privilege('authenticated', 'public.shift_offers', 'update'),
  'clients cannot update offers directly'
);
select ok(
  exists(select 1 from pg_policies where schemaname = 'public'
    and tablename = 'shift_offers' and cmd = 'SELECT'),
  'offer read policy exists'
);
select ok(
  exists(select 1 from pg_trigger where tgname = 'process_workflow_command'),
  'atomic workflow trigger exists'
);
select ok(
  exists(select 1 from pg_trigger where tgname = 'shift_agreements_immutable'),
  'agreement immutability trigger exists'
);
select ok(
  not has_function_privilege('authenticated',
    'private.process_workflow_command()', 'execute'),
  'private transition function is not directly callable'
);

select * from finish();
rollback;
