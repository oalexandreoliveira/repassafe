-- Grupos de colegas criados por médicos com cadastro aprovado e vigente.
-- Não têm instituição nem aprovação da coordenação e nunca concedem
-- autorização institucional: grupos institucionais, aprovadores e vínculos
-- institucionais continuam exclusivos da administração.

alter table public.groups
  add column kind public.group_kind not null default 'institutional',
  add column created_by uuid references public.profiles(id),
  alter column institution_id drop not null,
  add constraint groups_kind_institution_check
    check ((kind = 'institutional') = (institution_id is not null)),
  add constraint groups_peer_without_approval_check
    check (kind = 'institutional' or not requires_approval),
  add constraint groups_peer_creator_check
    check (kind = 'institutional' or created_by is not null),
  add constraint groups_peer_name_check
    check (kind = 'institutional' or char_length(btrim(name)) between 3 and 80);

create index groups_created_by_idx on public.groups (created_by)
  where created_by is not null;

comment on column public.groups.kind is
  'institutional: criado pela administração, com instituição e aprovadores. peer: criado por médico aprovado, sem instituição nem aprovação.';

alter table public.group_memberships
  add column ended_at timestamptz,
  add column ended_by uuid references public.profiles(id);

-- Um único gestor ativo por grupo de colegas; a transferência troca os papéis.
create unique index group_memberships_one_manager_idx
  on public.group_memberships (group_id)
  where role = 'manager' and active;

create function private.guard_group_kind()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.kind is distinct from old.kind
     or new.created_by is distinct from old.created_by then
    raise exception 'O tipo e a autoria do grupo são imutáveis';
  end if;
  return new;
end;
$$;

create trigger groups_kind_immutable
before update on public.groups
for each row execute function private.guard_group_kind();

-- O papel do vínculo precisa combinar com o tipo do grupo, inclusive para a
-- administração (service role).
create function private.guard_group_membership_role()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_kind public.group_kind;
begin
  select kind into target_kind from public.groups where id = new.group_id;
  if target_kind = 'peer' and new.role = 'approver' then
    raise exception 'Grupos de colegas não têm aprovadores institucionais';
  end if;
  if target_kind = 'institutional' and new.role = 'manager' then
    raise exception 'Grupos institucionais são geridos pela administração';
  end if;
  return new;
end;
$$;

create trigger group_membership_role_matches_kind
before insert or update of role, group_id on public.group_memberships
for each row execute function private.guard_group_membership_role();

revoke all on function private.guard_group_kind(),
  private.guard_group_membership_role() from public, anon, authenticated;

-- Convites por link. Só o hash do token é guardado; o link é exibido uma vez,
-- a quem o gerou.
create table public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  max_uses integer not null default 500 check (max_uses between 1 and 500),
  use_count integer not null default 0 check (use_count between 0 and max_uses),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index group_invites_group_idx
  on public.group_invites (group_id, created_at desc);
create index group_invites_created_by_idx on public.group_invites (created_by);

alter table public.group_invites enable row level security;
revoke all on public.group_invites from public, anon, authenticated;
grant all on public.group_invites to service_role;

create table private.group_command_requests (
  actor_id uuid not null references auth.users(id),
  request_id uuid not null,
  request_hash text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (actor_id, request_id)
);

create index group_command_requests_recent_idx
  on private.group_command_requests (actor_id, created_at desc);

alter table private.group_command_requests enable row level security;
revoke all on private.group_command_requests from public, anon, authenticated;

create function private.peer_group_eligible(person uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = person
      and p.role = 'doctor'
      and p.status = 'approved'
      and p.verification_valid_until > now()
  );
$$;

create function private.peer_group_role(group_ref uuid, person uuid)
returns public.group_role
language sql
stable
security definer
set search_path = ''
as $$
  select m.role from public.group_memberships m
  where m.group_id = group_ref and m.profile_id = person and m.active;
$$;

create function private.group_audit(
  actor uuid,
  event text,
  entity_type text,
  entity uuid,
  metadata jsonb default '{}'
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_events (actor_id, event_type, entity_type, entity_id, metadata)
  values (actor, event, entity_type, entity, metadata);
$$;

create function private.group_command(
  request_ref uuid,
  operation text,
  group_ref uuid,
  input jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  fingerprint text;
  prior private.group_command_requests%rowtype;
  target public.groups%rowtype;
  invite public.group_invites%rowtype;
  member public.group_memberships%rowtype;
  actor_role public.group_role;
  person uuid;
  clean_name text;
  validity integer;
  new_id uuid;
  result jsonb;
begin
  if actor is null or request_ref is null or operation is null or input is null then
    raise exception 'Sessão ou comando inválido';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('group:' || actor::text, 0));
  fingerprint := encode(extensions.digest(jsonb_build_object(
    'operation', operation, 'group', group_ref, 'input', input)::text, 'sha256'), 'hex');
  select * into prior from private.group_command_requests
    where actor_id = actor and request_id = request_ref;
  if found then
    if prior.request_hash <> fingerprint then
      raise exception 'Comando já utilizado com outros dados';
    end if;
    return prior.result;
  end if;
  if (select count(*) from private.group_command_requests
      where actor_id = actor and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'Aguarde um minuto antes de tentar novamente';
  end if;

  if operation = 'create' then
    if not private.peer_group_eligible(actor) then
      raise exception 'Somente médicos com cadastro aprovado e vigente podem criar grupos';
    end if;
    clean_name := regexp_replace(btrim(coalesce(input->>'name', '')), '\s+', ' ', 'g');
    if char_length(clean_name) not between 3 and 80 then
      raise exception 'Informe um nome de 3 a 80 caracteres';
    end if;
    if (select count(*) from public.group_memberships m
        join public.groups g on g.id = m.group_id
        where m.profile_id = actor and m.role = 'manager' and m.active and g.active) >= 10 then
      raise exception 'Você já gerencia 10 grupos ativos';
    end if;
    insert into public.groups (name, kind, created_by, requires_approval, active)
      values (clean_name, 'peer', actor, false, true)
      returning id into new_id;
    insert into public.group_memberships (group_id, profile_id, role, active)
      values (new_id, actor, 'manager', true);
    perform private.group_audit(actor, 'group.created', 'group', new_id,
      jsonb_build_object('kind', 'peer'));
    result := jsonb_build_object('group_id', new_id);

  elsif operation = 'join' then
    if not private.peer_group_eligible(actor) then
      raise exception 'Seu cadastro precisa estar aprovado e vigente para entrar no grupo';
    end if;
    if coalesce(input->>'token', '') !~ '^[A-Za-z0-9_-]{32,64}$' then
      raise exception 'Convite indisponível';
    end if;
    select * into invite from public.group_invites
      where token_hash = encode(extensions.digest(input->>'token', 'sha256'), 'hex')
      for update;
    if not found or invite.revoked_at is not null or invite.expires_at <= now()
       or invite.use_count >= invite.max_uses then
      raise exception 'Convite indisponível';
    end if;
    select * into target from public.groups where id = invite.group_id for update;
    if not target.active or target.kind <> 'peer' then
      raise exception 'Convite indisponível';
    end if;
    select * into member from public.group_memberships
      where group_id = target.id and profile_id = actor for update;
    if found and member.active then
      result := jsonb_build_object('group_id', target.id, 'already_member', true);
    else
      -- Quem foi removido pelo gestor só volta com um convite emitido depois.
      if found and member.ended_by is distinct from actor
         and member.ended_at >= invite.created_at then
        raise exception 'Convite indisponível';
      end if;
      if (select count(*) from public.group_memberships
          where group_id = target.id and active) >= 500 then
        raise exception 'O grupo atingiu o limite de 500 membros';
      end if;
      insert into public.group_memberships (group_id, profile_id, role, active)
        values (target.id, actor, 'doctor', true)
        on conflict (group_id, profile_id) do update
          set role = 'doctor', active = true, ended_at = null, ended_by = null;
      update public.group_invites set use_count = use_count + 1 where id = invite.id;
      insert into public.notifications (recipient_id, event_type, title, body, href)
        select m.profile_id, 'group.member_joined', 'Novo membro no grupo',
          left(coalesce((select display_name from public.profiles where id = actor), 'Um colega')
            || ' entrou em ' || target.name || '.', 500),
          '/grupos/' || target.id
        from public.group_memberships m
        where m.group_id = target.id and m.role = 'manager' and m.active
          and m.profile_id <> actor;
      perform private.group_audit(actor, 'group.member_joined', 'group', target.id,
        jsonb_build_object('invite_id', invite.id));
      result := jsonb_build_object('group_id', target.id, 'already_member', false);
    end if;

  else
    select * into target from public.groups where id = group_ref for update;
    actor_role := private.peer_group_role(group_ref, actor);
    if target.id is null or target.kind <> 'peer' or actor_role is null then
      raise exception 'Grupo indisponível';
    end if;
    if operation <> 'leave' and not target.active then
      raise exception 'Este grupo está arquivado';
    end if;
    if operation in ('rename', 'invite', 'revoke_invite', 'remove_member', 'transfer', 'archive')
       and actor_role <> 'manager' then
      raise exception 'Somente o gestor do grupo pode fazer isso';
    end if;

    if operation = 'rename' then
      clean_name := regexp_replace(btrim(coalesce(input->>'name', '')), '\s+', ' ', 'g');
      if char_length(clean_name) not between 3 and 80 then
        raise exception 'Informe um nome de 3 a 80 caracteres';
      end if;
      update public.groups set name = clean_name where id = target.id;
      perform private.group_audit(actor, 'group.renamed', 'group', target.id);
      result := jsonb_build_object('group_id', target.id);

    elsif operation = 'invite' then
      if coalesce(input->>'token', '') !~ '^[A-Za-z0-9_-]{32,64}$' then
        raise exception 'Convite inválido';
      end if;
      validity := case input->>'validity_days'
        when '1' then 1 when '7' then 7 when '30' then 30 end;
      if validity is null then
        raise exception 'Escolha a validade do convite';
      end if;
      if (select count(*) from public.group_invites
          where group_id = target.id and revoked_at is null
            and expires_at > now() and use_count < max_uses) >= 10 then
        raise exception 'Revogue um convite ativo antes de gerar outro';
      end if;
      -- clock_timestamp ordena convite e remoção mesmo dentro de uma transação.
      insert into public.group_invites (group_id, token_hash, created_by, expires_at, created_at)
        values (target.id, encode(extensions.digest(input->>'token', 'sha256'), 'hex'),
          actor, clock_timestamp() + make_interval(days => validity), clock_timestamp())
        returning * into invite;
      perform private.group_audit(actor, 'group.invite_created', 'group', target.id,
        jsonb_build_object('invite_id', invite.id, 'validity_days', validity));
      result := jsonb_build_object('group_id', target.id, 'invite_id', invite.id,
        'expires_at', invite.expires_at);

    elsif operation = 'revoke_invite' then
      update public.group_invites set revoked_at = coalesce(revoked_at, now())
        where id = nullif(input->>'invite_id', '')::uuid and group_id = target.id
        returning * into invite;
      if not found then raise exception 'Convite indisponível'; end if;
      perform private.group_audit(actor, 'group.invite_revoked', 'group', target.id,
        jsonb_build_object('invite_id', invite.id));
      result := jsonb_build_object('group_id', target.id);

    elsif operation in ('remove_member', 'transfer') then
      person := nullif(input->>'profile_id', '')::uuid;
      if person is null or person = actor then
        raise exception 'Escolha outro membro do grupo';
      end if;
      select * into member from public.group_memberships
        where group_id = target.id and profile_id = person and active for update;
      if not found then raise exception 'Membro indisponível'; end if;
      if operation = 'remove_member' then
        update public.group_memberships
          set active = false, ended_at = clock_timestamp(), ended_by = actor
          where id = member.id;
        insert into public.notifications (recipient_id, event_type, title, body, href)
          values (person, 'group.member_removed', 'Vínculo com grupo encerrado',
            left('O gestor encerrou seu vínculo com ' || target.name || '.', 500), '/grupos');
        perform private.group_audit(actor, 'group.member_removed', 'group', target.id,
          jsonb_build_object('profile_id', person));
      else
        if not private.peer_group_eligible(person) then
          raise exception 'O novo gestor precisa ter cadastro aprovado e vigente';
        end if;
        update public.group_memberships set role = 'doctor'
          where group_id = target.id and profile_id = actor;
        update public.group_memberships set role = 'manager' where id = member.id;
        insert into public.notifications (recipient_id, event_type, title, body, href)
          values (person, 'group.manager_transferred', 'Você agora é gestor do grupo',
            left('A gestão de ' || target.name || ' foi transferida para você.', 500),
            '/grupos/' || target.id);
        perform private.group_audit(actor, 'group.manager_transferred', 'group', target.id,
          jsonb_build_object('profile_id', person));
      end if;
      result := jsonb_build_object('group_id', target.id);

    elsif operation = 'leave' then
      if actor_role = 'manager' then
        if exists (select 1 from public.group_memberships
                   where group_id = target.id and active and profile_id <> actor) then
          raise exception 'Transfira a gestão antes de sair do grupo';
        end if;
        -- Último membro: sair arquiva o grupo, com a mesma regra do arquivamento.
        if exists (select 1 from public.shift_offers
                   where group_id = target.id
                     and status in ('open_normal', 'open_emergency', 'selection_in_progress')) then
          raise exception 'Conclua ou cancele os plantões abertos do grupo antes de arquivar';
        end if;
        update public.groups set active = false where id = target.id;
        update public.group_invites set revoked_at = now()
          where group_id = target.id and revoked_at is null;
      end if;
      update public.group_memberships
        set active = false, ended_at = now(), ended_by = actor
        where group_id = target.id and profile_id = actor;
      perform private.group_audit(actor, 'group.member_left', 'group', target.id);
      result := jsonb_build_object('group_id', target.id);

    elsif operation = 'archive' then
      if exists (select 1 from public.shift_offers
                 where group_id = target.id
                   and status in ('open_normal', 'open_emergency', 'selection_in_progress')) then
        raise exception 'Conclua ou cancele os plantões abertos do grupo antes de arquivar';
      end if;
      update public.groups set active = false where id = target.id;
      update public.group_invites set revoked_at = now()
        where group_id = target.id and revoked_at is null;
      perform private.group_audit(actor, 'group.archived', 'group', target.id);
      result := jsonb_build_object('group_id', target.id);

    else
      raise exception 'Operação inválida';
    end if;
  end if;

  insert into private.group_command_requests (actor_id, request_id, request_hash, result)
    values (actor, request_ref, fingerprint, result);
  return result;
end;
$$;

create function private.group_context(group_ref uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  target public.groups%rowtype;
  actor_role public.group_role;
  result jsonb;
begin
  if actor is null then raise exception 'Sessão inválida'; end if;
  if group_ref is null then
    return jsonb_build_object(
      'eligible', private.peer_group_eligible(actor),
      'groups', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', g.id,
          'name', g.name,
          'kind', g.kind,
          'active', g.active,
          'role', m.role,
          'requires_approval', g.requires_approval,
          'institution_name', i.name,
          'member_count', case when g.kind = 'peer' then (
            select count(*) from public.group_memberships x
            where x.group_id = g.id and x.active) end
        ) order by g.active desc, g.name)
        from public.group_memberships m
        join public.groups g on g.id = m.group_id
        left join public.institutions i on i.id = g.institution_id
        where m.profile_id = actor and m.active
      ), '[]'::jsonb)
    );
  end if;

  select * into target from public.groups where id = group_ref;
  actor_role := private.peer_group_role(group_ref, actor);
  if target.id is null or actor_role is null then return null; end if;

  result := jsonb_build_object(
    'eligible', private.peer_group_eligible(actor),
    'role', actor_role,
    'group', jsonb_build_object(
      'id', target.id,
      'name', target.name,
      'kind', target.kind,
      'active', target.active,
      'requires_approval', target.requires_approval,
      'created_at', target.created_at,
      'institution_name', (select name from public.institutions where id = target.institution_id)
    )
  );
  -- Só grupos de colegas expõem a lista de membros, e apenas nome de
  -- apresentação e situação da verificação profissional.
  if target.kind = 'peer' then
    result := result || jsonb_build_object('members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'profile_id', p.id,
        'display_name', p.display_name,
        'role', m.role,
        'verified', p.status = 'approved' and coalesce(p.verification_valid_until > now(), false),
        'is_self', p.id = actor,
        'joined_at', m.created_at
      ) order by (m.role = 'manager') desc, p.display_name)
      from public.group_memberships m
      join public.profiles p on p.id = m.profile_id
      where m.group_id = target.id and m.active
    ), '[]'::jsonb));
    if actor_role = 'manager' then
      result := result || jsonb_build_object(
        'invites', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', v.id,
            'created_at', v.created_at,
            'expires_at', v.expires_at,
            'use_count', v.use_count,
            'max_uses', v.max_uses
          ) order by v.created_at desc)
          from public.group_invites v
          where v.group_id = target.id and v.revoked_at is null
            and v.expires_at > now() and v.use_count < v.max_uses
        ), '[]'::jsonb),
        'open_offers', (
          select count(*) from public.shift_offers o
          where o.group_id = target.id
            and o.status in ('open_normal', 'open_emergency', 'selection_in_progress')
        )
      );
    end if;
  end if;
  return result;
end;
$$;

create function private.group_invite_preview(token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  invite public.group_invites%rowtype;
  target public.groups%rowtype;
begin
  if actor is null then raise exception 'Sessão inválida'; end if;
  if coalesce(token, '') !~ '^[A-Za-z0-9_-]{32,64}$' then
    return jsonb_build_object('status', 'unavailable');
  end if;
  select * into invite from public.group_invites
    where token_hash = encode(extensions.digest(token, 'sha256'), 'hex');
  if not found then return jsonb_build_object('status', 'unavailable'); end if;
  select * into target from public.groups where id = invite.group_id;
  if exists (select 1 from public.group_memberships
             where group_id = target.id and profile_id = actor and active) then
    return jsonb_build_object('status', 'member', 'group_id', target.id,
      'group_name', target.name);
  end if;
  if invite.revoked_at is not null or invite.expires_at <= now()
     or invite.use_count >= invite.max_uses or not target.active
     or target.kind <> 'peer' then
    return jsonb_build_object('status', 'unavailable');
  end if;
  return jsonb_build_object(
    'status', case when private.peer_group_eligible(actor) then 'open' else 'ineligible' end,
    'group_name', target.name,
    'manager_name', (
      select p.display_name from public.group_memberships m
      join public.profiles p on p.id = m.profile_id
      where m.group_id = target.id and m.role = 'manager' and m.active
    ),
    'member_count', (
      select count(*) from public.group_memberships
      where group_id = target.id and active
    ),
    'expires_at', invite.expires_at
  );
end;
$$;

create function public.group_command(
  request_ref uuid,
  operation text,
  group_ref uuid default null,
  input jsonb default '{}'
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$ select private.group_command(request_ref, operation, group_ref, input); $$;

create function public.group_context(group_ref uuid default null)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$ select private.group_context(group_ref); $$;

create function public.group_invite_preview(token text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$ select private.group_invite_preview(token); $$;

revoke all on function
  private.peer_group_eligible(uuid),
  private.peer_group_role(uuid, uuid),
  private.group_audit(uuid, text, text, uuid, jsonb),
  private.group_command(uuid, text, uuid, jsonb),
  private.group_context(uuid),
  private.group_invite_preview(text),
  public.group_command(uuid, text, uuid, jsonb),
  public.group_context(uuid),
  public.group_invite_preview(text)
from public, anon, authenticated;

grant execute on function
  private.group_command(uuid, text, uuid, jsonb),
  private.group_context(uuid),
  private.group_invite_preview(text),
  public.group_command(uuid, text, uuid, jsonb),
  public.group_context(uuid),
  public.group_invite_preview(text)
to authenticated;

-- Grupos de colegas não têm instituição: o vínculo para acordos externos
-- passa a aceitar grupos sem instituição, mantendo a exigência de instituição
-- ativa para grupos institucionais.
create or replace function private.external_member(group_ref uuid, person uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select group_ref is null or exists (
    select 1 from public.group_memberships m
    join public.groups g on g.id = m.group_id
    left join public.institutions i on i.id = g.institution_id
    where m.group_id = group_ref and m.profile_id = person and m.active
      and g.active and (g.institution_id is null or i.active)
  );
$$;

-- O documento do acordo registra o nome do grupo de colegas mesmo sem
-- instituição (institution_name fica nulo).
do $$
declare
  definition text;
  original text;
begin
  definition := replace(
    pg_get_functiondef('private.create_agreement_dossier()'::regprocedure),
    chr(13), '');
  original := definition;
  definition := replace(definition,
    'from public.groups g join public.institutions i on i.id = g.institution_id',
    'from public.groups g left join public.institutions i on i.id = g.institution_id');
  if definition = original then
    raise exception 'Não foi possível atualizar o dossiê para grupos de colegas';
  end if;
  execute definition;
end;
$$;
