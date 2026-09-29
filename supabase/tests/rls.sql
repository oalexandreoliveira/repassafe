begin;
select plan(3);
select ok((select relrowsecurity from pg_class where oid='public.profiles'::regclass),'profiles has RLS');
select ok((select relrowsecurity from pg_class where oid='public.groups'::regclass),'groups has RLS');
select ok((select relrowsecurity from pg_class where oid='public.audit_events'::regclass),'audit has RLS');
select * from finish(); rollback;
