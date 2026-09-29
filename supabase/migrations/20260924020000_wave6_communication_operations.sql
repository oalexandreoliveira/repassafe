create type public.crm_verification_outcome as enum (
  'verified',
  'verified_with_note',
  'name_divergence',
  'number_divergence',
  'status_incompatible',
  'rqe_not_found',
  'insufficient_information',
  'source_unavailable'
);

create table public.crm_verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id),
  verified_by uuid not null references public.profiles(id),
  crm_name_found text check (crm_name_found is null or char_length(crm_name_found) between 2 and 160),
  crm_number_checked text not null check (char_length(crm_number_checked) between 4 and 12),
  crm_state_checked text not null check (crm_state_checked ~ '^[A-Z]{2}$'),
  outcome public.crm_verification_outcome not null,
  source text not null check (char_length(source) between 2 and 240),
  checked_at timestamptz not null default now(),
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);

create index crm_verifications_profile_idx
  on public.crm_verifications (profile_id, checked_at desc);
alter table public.crm_verifications enable row level security;
revoke all on public.crm_verifications from public, anon, authenticated;
grant all on public.crm_verifications to service_role;

drop policy "eligible members read shift offers" on public.shift_offers;
create or replace function public.is_current_user_shift_applicant(offer_id uuid)
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
revoke all on function public.is_current_user_shift_applicant(uuid) from public, anon;
grant execute on function public.is_current_user_shift_applicant(uuid) to authenticated;

create policy "eligible members and related users read shift offers"
on public.shift_offers for select to authenticated
using (
  (select auth.uid()) is not null
  and (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.group_memberships gm
      join public.profiles p on p.id = gm.profile_id
      where gm.group_id = shift_offers.group_id
        and gm.profile_id = (select auth.uid())
        and gm.active and p.status = 'approved'
    )
    or public.is_current_user_shift_applicant(shift_offers.id)
  )
);

create or replace function private.notify_profile_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.event_type = 'profile.reviewed' and new.entity_id is not null then
    insert into public.notifications (recipient_id, event_type, title, body, href)
      select p.id, 'profile.reviewed',
        case p.status
          when 'approved' then 'Cadastro aprovado'
          when 'changes_requested' then 'Correção cadastral solicitada'
          when 'rejected' then 'Cadastro não aprovado'
          when 'suspended' then 'Acesso suspenso'
          else 'Cadastro atualizado'
        end,
        case p.status
          when 'approved' then 'Seu perfil foi verificado e aprovado.'
          when 'changes_requested' then 'Revise as orientações da equipe para corrigir seu cadastro.'
          when 'rejected' then 'A equipe registrou uma decisão sobre seu cadastro.'
          when 'suspended' then 'Consulte a equipe de suporte sobre o acesso à sua conta.'
          else 'O estado do seu cadastro foi atualizado.'
        end,
        '/painel'
      from public.profiles p where p.id = new.entity_id;
  end if;
  return new;
end;
$$;

create trigger notify_profile_review
after insert on public.audit_events
for each row execute function private.notify_profile_review();
revoke execute on function private.notify_profile_review() from public, anon, authenticated;

comment on table public.crm_verifications is
  'Restricted manual CRM check evidence. Access is limited to trusted administrative server actions.';
