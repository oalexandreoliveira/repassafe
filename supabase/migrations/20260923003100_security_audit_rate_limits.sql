create table private.rate_limit_buckets (
  namespace text not null,
  identifier_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (namespace, identifier_hash, window_started_at),
  check (char_length(namespace) between 2 and 80),
  check (identifier_hash ~ '^[a-f0-9]{64}$')
);

alter table private.rate_limit_buckets enable row level security;
revoke all on private.rate_limit_buckets from public, anon, authenticated;

create index rate_limit_buckets_expiry_idx
  on private.rate_limit_buckets (window_started_at);

create table public.rate_limit_checks (
  id uuid primary key default gen_random_uuid(),
  namespace text not null,
  identifier_hash text not null,
  max_requests smallint not null check (max_requests between 1 and 1000),
  window_seconds integer not null check (window_seconds between 10 and 86400)
);

alter table public.rate_limit_checks enable row level security;
revoke all on public.rate_limit_checks from public, anon, authenticated;
grant insert on public.rate_limit_checks to service_role;

create or replace function private.enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  bucket_start timestamptz;
  current_count integer;
begin
  if new.namespace !~ '^[a-z0-9_.:-]{2,80}$'
     or new.identifier_hash !~ '^[a-f0-9]{64}$'
     or new.max_requests not between 1 and 1000
     or new.window_seconds not between 10 and 86400 then
    raise exception 'Parâmetros de rate limiting inválidos';
  end if;

  bucket_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / new.window_seconds)
      * new.window_seconds
  );

  insert into private.rate_limit_buckets (
    namespace, identifier_hash, window_started_at, request_count, updated_at
  ) values (
    new.namespace, new.identifier_hash, bucket_start, 1, now()
  )
  on conflict (namespace, identifier_hash, window_started_at)
  do update set
    request_count = private.rate_limit_buckets.request_count + 1,
    updated_at = now()
  returning request_count into current_count;

  if current_count > new.max_requests then
    raise exception using
      errcode = 'P0001',
      message = 'rate_limit_exceeded',
      detail = jsonb_build_object(
        'retry_after_seconds',
        greatest(
          1,
          ceil(extract(epoch from bucket_start +
            make_interval(secs => new.window_seconds) - clock_timestamp()))
        )::integer
      )::text;
  end if;

  delete from private.rate_limit_buckets
  where window_started_at < now() - interval '2 days';

  -- The public table is a write-only command surface. It stores no identifiers.
  return null;
end;
$$;

create trigger enforce_rate_limit_before_insert
before insert on public.rate_limit_checks
for each row execute function private.enforce_rate_limit();

revoke execute on function private.enforce_rate_limit()
from public, anon, authenticated;

create or replace function private.prevent_audit_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'Eventos de auditoria são imutáveis';
end;
$$;

create trigger audit_events_immutable
before update or delete on public.audit_events
for each row execute function private.prevent_audit_mutation();

revoke execute on function private.prevent_audit_mutation()
from public, anon, authenticated;

comment on table private.rate_limit_buckets is
  'Fixed-window counters keyed only by salted SHA-256 identifiers.';
comment on table public.rate_limit_checks is
  'Service-role-only command surface. BEFORE trigger enforces limits and skips storage.';
