begin;
select plan(9);

select lives_ok(
  $$insert into public.rate_limit_checks (namespace, identifier_hash, max_requests, window_seconds) values ('test.login', repeat('a', 64), 2, 60)$$,
  'first request is accepted'
);
select lives_ok(
  $$insert into public.rate_limit_checks (namespace, identifier_hash, max_requests, window_seconds) values ('test.login', repeat('a', 64), 2, 60)$$,
  'second request is accepted'
);
select throws_ok(
  $$insert into public.rate_limit_checks (namespace, identifier_hash, max_requests, window_seconds) values ('test.login', repeat('a', 64), 2, 60)$$,
  'P0001', 'rate_limit_exceeded', 'request above limit is rejected'
);
select is(
  (select request_count from private.rate_limit_buckets
    where namespace = 'test.login' and identifier_hash = repeat('a', 64)),
  2,
  'rejected attempt does not corrupt the counter'
);
select is((select count(*) from public.rate_limit_checks), 0::bigint,
  'command surface stores no identifier');
insert into public.audit_events (event_type, entity_type)
values ('security.test', 'security_control');
select throws_ok(
  $$update public.audit_events set event_type = 'tampered'$$,
  'P0001', 'Eventos de auditoria são imutáveis', 'audit cannot be updated'
);
select ok(
  not has_function_privilege('authenticated', 'private.enforce_rate_limit()', 'execute'),
  'authenticated cannot call privileged rate limiter directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.rate_limit_checks', 'insert'),
  'authenticated cannot write rate limit commands'
);
select ok(
  has_table_privilege('service_role', 'public.rate_limit_checks', 'insert'),
  'service role can invoke rate limiting command surface'
);

select * from finish();
rollback;
