-- The RLS helper must not be exposed as a PostgREST RPC in the public schema.
create or replace function private.is_current_user_shift_applicant(offer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.shift_applications sa
    where sa.offer_id = $1 and sa.candidate_id = (select auth.uid())
  );
$$;

drop policy "eligible members and approved users read shift offers"
  on public.shift_offers;
revoke all on function public.is_current_user_shift_applicant(uuid)
  from public, anon, authenticated;
drop function public.is_current_user_shift_applicant(uuid);
grant usage on schema private to authenticated;
grant execute on function private.is_current_user_shift_applicant(uuid)
  to authenticated;

create policy "eligible members and approved users read shift offers"
on public.shift_offers for select to authenticated
using (
  (select auth.uid()) is not null
  and (
    owner_id = (select auth.uid())
    or (
      group_id is null
      and exists (
        select 1 from public.profiles p
        where p.id = (select auth.uid()) and p.status = 'approved'
          and p.role <> 'admin'
      )
    )
    or exists (
      select 1
      from public.group_memberships gm
      join public.profiles p on p.id = gm.profile_id
      where gm.group_id = shift_offers.group_id
        and gm.profile_id = (select auth.uid())
        and gm.active and p.status = 'approved'
    )
    or private.is_current_user_shift_applicant(shift_offers.id)
  )
);

-- Make the static audit reflect final schema state, not revoked historical grants.
revoke all on public.agreement_evidence_events from public, anon, authenticated;
