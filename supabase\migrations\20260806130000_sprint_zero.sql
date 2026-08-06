create type public.app_role as enum ('doctor','approver','admin');
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text not null, role public.app_role not null default 'doctor', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.institutions (id uuid primary key default gen_random_uuid(), name text not null, created_at timestamptz not null default now());
create table public.groups (id uuid primary key default gen_random_uuid(), institution_id uuid not null references public.institutions(id), name text not null, active boolean not null default true, created_at timestamptz not null default now());
create table public.group_memberships (id uuid primary key default gen_random_uuid(), group_id uuid not null references public.groups(id), profile_id uuid not null references public.profiles(id), active boolean not null default true, unique(group_id,profile_id));
create table public.audit_events (id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id), event_type text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}', occurred_at timestamptz not null default now());
create index groups_institution_id_idx on public.groups (institution_id);
create index group_memberships_profile_id_idx on public.group_memberships (profile_id) where active;
create index audit_events_actor_id_idx on public.audit_events (actor_id) where actor_id is not null;
create index audit_events_entity_idx on public.audit_events (entity_type, entity_id, occurred_at desc);
alter table public.profiles enable row level security; alter table public.institutions enable row level security; alter table public.groups enable row level security; alter table public.group_memberships enable row level security; alter table public.audit_events enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id=(select auth.uid()));
create policy "own memberships read" on public.group_memberships for select to authenticated using (profile_id=(select auth.uid()));
create policy "member groups read" on public.groups for select to authenticated using (exists(select 1 from public.group_memberships gm where gm.group_id=groups.id and gm.profile_id=(select auth.uid()) and gm.active));
create policy "member institutions read" on public.institutions for select to authenticated using (exists(select 1 from public.groups g join public.group_memberships gm on gm.group_id=g.id where g.institution_id=institutions.id and gm.profile_id=(select auth.uid()) and gm.active));
revoke all on public.profiles, public.institutions, public.groups, public.group_memberships, public.audit_events from anon, authenticated;
grant select on public.profiles, public.institutions, public.groups, public.group_memberships to authenticated;
comment on table public.audit_events is 'Append-only audit foundation; writes occur through trusted server paths.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'professional-documents',
  'professional-documents',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

