-- Lista de espera do piloto: contato mínimo, sem dados de pacientes e sem acesso do cliente.
create table public.waitlist_entries (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(name) between 3 and 120),
 email text not null check (length(email) between 5 and 254),
 interest text not null check (interest in ('repassar','assumir','ambos')),
 specialty text check (length(specialty) between 2 and 80),
 state text check (state ~ '^[A-Z]{2}$'),
 consented_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create unique index waitlist_entries_email_idx on public.waitlist_entries (lower(email));
alter table public.waitlist_entries enable row level security;
revoke all on public.waitlist_entries from public, anon, authenticated;
grant select, insert, delete on public.waitlist_entries to service_role;
