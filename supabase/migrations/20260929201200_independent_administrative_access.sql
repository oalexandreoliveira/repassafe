-- Management authorization belongs to an Auth identity, not a medical profile.
create table public.administrative_access (
  user_id uuid primary key references auth.users(id),
  active boolean not null default true,
  granted_by uuid references auth.users(id),
  reason text not null check (char_length(trim(reason)) between 10 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.administrative_access enable row level security;
revoke all on public.administrative_access from public, anon, authenticated;
grant select (user_id, active) on public.administrative_access to authenticated;
grant all on public.administrative_access to service_role;
create policy "identities read own administrative entitlement"
on public.administrative_access for select to authenticated
using (user_id = (select auth.uid()));
create index administrative_access_granted_by_idx
  on public.administrative_access (granted_by) where granted_by is not null;

-- Historical actors remain unchanged; new staff do not need a dummy CRM/profile.
alter table public.audit_events drop constraint audit_events_actor_id_fkey;
alter table public.audit_events add constraint audit_events_actor_id_fkey
  foreign key (actor_id) references auth.users(id);
alter table public.profiles drop constraint profiles_verified_by_fkey;
alter table public.profiles add constraint profiles_verified_by_fkey
  foreign key (verified_by) references auth.users(id);
alter table public.crm_verifications drop constraint crm_verifications_verified_by_fkey;
alter table public.crm_verifications add constraint crm_verifications_verified_by_fkey
  foreign key (verified_by) references auth.users(id);
alter table public.shift_occurrences drop constraint shift_occurrences_reviewed_by_fkey;
alter table public.shift_occurrences add constraint shift_occurrences_reviewed_by_fkey
  foreign key (reviewed_by) references auth.users(id);
alter table public.closure_commands drop constraint closure_commands_actor_id_fkey;
alter table public.closure_commands add constraint closure_commands_actor_id_fkey
  foreign key (actor_id) references auth.users(id);
alter table public.notifications drop constraint notifications_recipient_id_fkey;
alter table public.notifications add constraint notifications_recipient_id_fkey
  foreign key (recipient_id) references auth.users(id);

create function private.audit_administrative_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Revogue a concessão sem excluir seu histórico';
  end if;
  new.updated_at := now();
  insert into public.audit_events (actor_id, event_type, entity_type, entity_id, metadata)
  values (auth.uid(),
    case when tg_op = 'INSERT' then 'administration.access_granted'
      when new.active then 'administration.access_updated'
      else 'administration.access_revoked' end,
    'administrative_access', new.user_id,
    jsonb_build_object('active', new.active, 'reason', new.reason));
  return new;
end;
$$;
revoke all on function private.audit_administrative_access() from public, anon, authenticated;
create trigger audit_administrative_access
before insert or update or delete on public.administrative_access
for each row execute function private.audit_administrative_access();

-- One-time compatibility import. Subsequent professional decisions do not
-- grant or revoke staff access; revocation is an explicit staff operation.
insert into public.administrative_access (user_id, active, reason)
select id, status = 'approved', 'Migração do acesso administrativo legado'
from public.profiles where role = 'admin';

-- Review commands are the only closure commands allowed without a professional
-- profile. Recheck the entitlement and MFA in Postgres on every command.
do $$
declare
  definition text;
  old_gate text := $old$  select * into actor_profile from public.profiles where id = auth.uid();
  if not found or actor_profile.status <> 'approved' then
    raise exception 'O perfil precisa estar aprovado';
  end if;$old$;
  new_gate text := $new$  if new.command = 'review_occurrence' then
    if coalesce(auth.jwt()->>'aal', '') <> 'aal2'
       or not exists (select 1 from public.administrative_access a
         where a.user_id = auth.uid() and a.active) then
      raise exception 'Acesso administrativo requer MFA';
    end if;
  else
    select * into actor_profile from public.profiles where id = auth.uid();
    if not found or actor_profile.status <> 'approved' or actor_profile.role = 'admin' then
      raise exception 'O perfil precisa estar aprovado';
    end if;
  end if;$new$;
  old_review text := $old$    if actor_profile.role <> 'admin' then
      raise exception 'Somente administrador pode analisar ocorrência';
    end if;$old$;
begin
  definition := replace(pg_get_functiondef('private.process_closure_command()'::regprocedure), chr(13), '');
  old_gate := replace(old_gate, chr(13), '');
  old_review := replace(old_review, chr(13), '');
  if position(old_gate in definition) = 0 or position(old_review in definition) = 0 then
    raise exception 'Fluxo de conclusão incompatível com isolamento administrativo';
  end if;
  definition := replace(definition, old_gate, new_gate);
  definition := replace(definition, old_review, '');
  definition := replace(definition,
    'select p.id, ''occurrence.opened''', 'select p.user_id, ''occurrence.opened''');
  definition := replace(definition,
    'from public.profiles p where p.role = ''admin'' and p.status = ''approved'';',
    'from public.administrative_access p where p.active;');
  if position('Somente administrador pode analisar ocorrência' in definition) > 0
     or position('p.role = ''admin''' in definition) > 0 then
    raise exception 'Referência administrativa legada não removida';
  end if;
  execute definition;
end;
$$;

comment on table public.administrative_access is
  'Staff entitlements independent of medical profiles. Client read is limited to own user_id/active; all mutations use trusted audited operations.';
