create type public.profile_status as enum (
  'pending',
  'approved',
  'changes_requested',
  'rejected',
  'suspended'
);

create type public.group_role as enum ('doctor', 'approver');

alter table public.profiles
  add column contact_email text,
  add column crm_number text,
  add column crm_state text,
  add column status public.profile_status not null default 'pending',
  add column verification_notes text,
  add column verified_at timestamptz,
  add column verified_by uuid references public.profiles(id);

alter table public.institutions
  add column active boolean not null default true;

alter table public.groups
  add column requires_approval boolean not null default true;

alter table public.group_memberships
  add column role public.group_role not null default 'doctor',
  add column created_at timestamptz not null default now();

create unique index profiles_crm_unique_idx
  on public.profiles (upper(crm_state), crm_number)
  where crm_state is not null and crm_number is not null;
create index profiles_status_idx on public.profiles (status, created_at);
create index group_memberships_group_active_idx
  on public.group_memberships (group_id, active);

drop policy "own profile read" on public.profiles;
create policy "own profile read"
on public.profiles for select
to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()));

create policy "own profile update"
on public.profiles for update
to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()))
with check ((select auth.uid()) is not null and id = (select auth.uid()));

drop policy "own memberships read" on public.group_memberships;
create policy "own memberships read"
on public.group_memberships for select
to authenticated
using (
  (select auth.uid()) is not null
  and profile_id = (select auth.uid())
  and active
);

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, crm_number, crm_state) on public.profiles to authenticated;

revoke all on public.institutions, public.groups, public.group_memberships
from anon, authenticated;
grant select on public.institutions, public.groups, public.group_memberships
to authenticated;

comment on column public.profiles.status is
  'Administrative verification status. Clients cannot update this column.';
comment on column public.profiles.verification_notes is
  'Administrative notes. Never include patient information.';
