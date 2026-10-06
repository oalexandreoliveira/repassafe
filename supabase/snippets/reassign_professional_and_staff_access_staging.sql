-- One-time data correction for repassafe-staging only. Before running, add
-- three SET LOCAL values immediately after BEGIN using UUIDs read privately
-- from this project's Auth/profiles. Keep real UUIDs out of version control.
--
-- select set_config('repassafe.target_profile_id', '<profile UUID>', true);
-- select set_config('repassafe.authorizer_id', '<Alexandre Auth UUID>', true);
-- select set_config('repassafe.new_admin_id', '<replacement Admin Auth UUID>', true);
begin;

do $$
declare
  target_user_id uuid := nullif(current_setting('repassafe.target_profile_id', true), '')::uuid;
  authorizer_id uuid := nullif(current_setting('repassafe.authorizer_id', true), '')::uuid;
  new_admin_id uuid := nullif(current_setting('repassafe.new_admin_id', true), '')::uuid;
  target_count integer;
  changed_membership record;
  profile_changed boolean;
  previous_role text;
  previous_status text;
begin
  if target_user_id is null or authorizer_id is null or new_admin_id is null then
    raise exception 'Defina os três UUIDs privados antes de executar';
  end if;

  select count(*)
    into target_count
  from public.profiles
  where id = target_user_id and role in ('admin', 'doctor');

  if target_count <> 1 then
    raise exception 'O perfil profissional informado não existe ou tem outro papel';
  end if;

  if not exists (select 1 from auth.users where id = authorizer_id)
     or not exists (select 1 from auth.users where id = new_admin_id) then
    raise exception 'Autorizador e novo Admin devem existir no Supabase Auth';
  end if;

  if new_admin_id = target_user_id or new_admin_id = authorizer_id then
    raise exception 'As identidades do novo Admin, do profissional e do autorizador devem ser distintas';
  end if;

  -- The built-in administrative-access trigger records the stated authorizer.
  perform set_config('request.jwt.claim.sub', authorizer_id::text, true);

  insert into public.administrative_access (user_id, granted_by, reason)
  values (
    new_admin_id,
    authorizer_id,
    'isolamento entre perfil de gestão e de usuário'
  )
  on conflict (user_id) do update
  set active = true,
      granted_by = excluded.granted_by,
      reason = excluded.reason
  where administrative_access.active is distinct from true
     or administrative_access.granted_by is distinct from excluded.granted_by
     or administrative_access.reason is distinct from excluded.reason;

  for changed_membership in
    update public.group_memberships
    set active = false
    where profile_id = target_user_id and active
    returning id, role
  loop
    insert into public.audit_events (
      actor_id, event_type, entity_type, entity_id, metadata
    ) values (
      authorizer_id,
      'membership.deactivated',
      'group_membership',
      changed_membership.id,
      jsonb_build_object(
        'role', changed_membership.role,
        'active', false,
        'reason', 'Isolamento entre perfil de gestão e de usuário'
      )
    );
  end loop;

  update public.administrative_access
  set active = false,
      reason = 'isolamento entre perfil de gestão e de usuário'
  where user_id = target_user_id and active;

  select role::text, status::text
  into previous_role, previous_status
  from public.profiles
  where id = target_user_id;

  update public.profiles
  set role = 'doctor',
      status = 'pending',
      verified_by = null,
      verified_at = null,
      verification_valid_until = null,
      verification_notes = 'Aguardando revisão profissional independente pelo Admin do Repassafe.',
      updated_at = now()
  where id = target_user_id
    and (
      role <> 'doctor'
      or status <> 'pending'
      or verified_by is not null
      or verified_at is not null
      or verification_valid_until is not null
      or verification_notes is distinct from 'Aguardando revisão profissional independente pelo Admin do Repassafe.'
    )
  returning true into profile_changed;

  if profile_changed then
    insert into public.audit_events (
      actor_id, event_type, entity_type, entity_id, metadata
    ) values (
      authorizer_id,
      'profile.role_corrected',
      'profile',
      target_user_id,
      jsonb_build_object(
        'previous_role', previous_role,
        'role', 'doctor',
        'previous_status', previous_status,
        'status', 'pending',
        'reason', 'Isolamento entre perfil de gestão e de usuário'
      )
    );
  end if;
end;
$$;

commit;
