-- Offers can either belong to an institutional group or be published openly
-- to every approved professional. Group offers retain their existing isolation.
alter table public.shift_offers alter column group_id drop not null;
alter table public.substitutions alter column group_id drop not null;
alter table public.shift_agreements alter column group_id drop not null;

-- Keep the workflow's authorization and state transitions in the database,
-- while allowing NULL group_id only for explicitly free offers.
do $$
declare
  definition text;
  original text;
begin
  select pg_get_functiondef('private.process_workflow_command()'::regprocedure)
    into definition;
  original := definition;
  definition := replace(definition,
    'where id = (new.payload->>''group_id'')::uuid and active;',
    'where id = nullif(new.payload->>''group_id'', '''')::uuid and active;');
  definition := replace(definition,
    E'if not found or not exists (\n      select 1 from public.group_memberships gm\n      where gm.group_id = selected_group.id\n        and gm.profile_id = new.actor_id and gm.active\n    ) then',
    E'if new.payload->>''group_id'' is not null and (not found or not exists (\n      select 1 from public.group_memberships gm\n      where gm.group_id = selected_group.id\n        and gm.profile_id = new.actor_id and gm.active\n    )) then');
  definition := replace(definition,
    E'if not exists (\n      select 1 from public.group_memberships gm\n      where gm.group_id = selected_offer.group_id\n        and gm.profile_id = new.actor_id and gm.active\n    ) then',
    E'if selected_offer.group_id is not null and not exists (\n      select 1 from public.group_memberships gm\n      where gm.group_id = selected_offer.group_id\n        and gm.profile_id = new.actor_id and gm.active\n    ) then');
  definition := replace(definition,
    'if requires_approval then', 'if coalesce(requires_approval, false) then');
  definition := replace(definition,
    E'if not found or actor_profile.status <> ''approved'' then\n    raise exception ''O perfil precisa estar aprovado'';\n  end if;',
    E'if not found or actor_profile.status <> ''approved'' then\n    raise exception ''O perfil precisa estar aprovado'';\n  end if;\n  if actor_profile.role = ''admin'' then\n    raise exception ''Administradores não podem operar como profissionais'';\n  end if;');
  if definition = original
     or position('if not found or not exists (' in definition) > 0
     or position('if not exists (' in definition) > 0
     or position('if requires_approval then' in definition) > 0
     or position('actor_profile.role = ''admin''' in definition) = 0 then
    raise exception 'Não foi possível atualizar o fluxo para ofertas livres';
  end if;
  execute definition;
end;
$$;

drop policy "eligible members and related users read shift offers"
  on public.shift_offers;
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
    or public.is_current_user_shift_applicant(shift_offers.id)
  )
);

create or replace function private.notify_core_workflow_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  offer_row public.shift_offers%rowtype;
  application_row public.shift_applications%rowtype;
  substitution_row public.substitutions%rowtype;
begin
  if new.event_type = 'shift_offer.published' then
    select * into offer_row from public.shift_offers where id = new.entity_id;
    insert into public.notifications (recipient_id, event_type, title, body, href)
      select p.id, 'offer.published', 'Novo plantão disponível',
        case when offer_row.group_id is null
          then 'Uma nova oferta livre está disponível.'
          else 'Uma nova oferta foi publicada no seu grupo.'
        end,
        '/plantoes/' || offer_row.id
      from public.profiles p
      left join public.group_memberships gm
        on gm.group_id = offer_row.group_id and gm.profile_id = p.id and gm.active
      where p.status = 'approved' and p.role <> 'admin'
        and p.id <> new.actor_id
        and (offer_row.group_id is null or gm.profile_id is not null);
  elsif new.event_type = 'shift_application.created' then
    select * into application_row from public.shift_applications where id = new.entity_id;
    select * into offer_row from public.shift_offers where id = application_row.offer_id;
    insert into public.notifications (recipient_id, event_type, title, body, href)
      values (offer_row.owner_id, 'application.created', 'Nova candidatura recebida',
        'Um profissional manifestou interesse no plantão.', '/plantoes/' || offer_row.id);
  elsif new.event_type in (
    'substitution.selected', 'substitution.declined',
    'substitution.confirmed_by_substitute', 'substitution.confirmed',
    'substitution.approved', 'substitution.rejected'
  ) then
    select * into substitution_row from public.substitutions where id = new.entity_id;
    if not found then return new; end if;
    select * into offer_row from public.shift_offers where id = substitution_row.offer_id;
    if new.event_type = 'substitution.selected' then
      insert into public.notifications (recipient_id, event_type, title, body, href)
        values (substitution_row.substitute_id, 'substitution.selected', 'Você foi selecionado',
          'Revise as condições e responda dentro do prazo.', '/plantoes/' || offer_row.id);
    elsif new.event_type = 'substitution.confirmed_by_substitute'
       and substitution_row.group_id is not null then
      insert into public.notifications (recipient_id, event_type, title, body, href)
        select gm.profile_id, 'approval.pending', 'Aprovação institucional pendente',
          'Uma substituição aguarda sua decisão.', '/plantoes/' || offer_row.id
        from public.group_memberships gm where gm.group_id = substitution_row.group_id
          and gm.active and gm.role = 'approver';
      insert into public.notifications (recipient_id, event_type, title, body, href)
        values (substitution_row.owner_id, 'approval.pending', 'Repasse aguardando aprovação',
          'O substituto confirmou as condições; falta a decisão institucional.', '/plantoes/' || offer_row.id);
    elsif new.event_type = 'substitution.confirmed_by_substitute' then
      insert into public.notifications (recipient_id, event_type, title, body, href)
        values (substitution_row.owner_id, 'substitution.confirmed_by_substitute',
          'Substituto confirmou o repasse', 'O acordo foi registrado.',
          '/plantoes/' || offer_row.id);
    else
      insert into public.notifications (recipient_id, event_type, title, body, href)
        select recipient_id, new.event_type,
          case new.event_type
            when 'substitution.confirmed' then 'Repasse confirmado'
            when 'substitution.approved' then 'Repasse aprovado'
            when 'substitution.rejected' then 'Repasse rejeitado'
            else 'Candidato recusou o repasse'
          end,
          case new.event_type
            when 'substitution.confirmed' then 'O acordo foi registrado.'
            when 'substitution.approved' then 'A instituição aprovou o repasse.'
            when 'substitution.rejected' then 'A instituição rejeitou o repasse.'
            else 'A oferta voltou a permitir nova seleção.'
          end,
          '/plantoes/' || offer_row.id
        from (values (substitution_row.owner_id), (substitution_row.substitute_id)) recipients(recipient_id)
        where recipient_id <> new.actor_id;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function private.notify_core_workflow_event()
  from public, anon, authenticated;

-- Agreement content clearly records the absence of an institution/group.
do $$
declare
  definition text;
  original text;
begin
  select pg_get_functiondef('private.create_agreement_dossier()'::regprocedure)
    into definition;
  original := definition;
  definition := replace(definition,
    E'''group'', jsonb_build_object(''id'', new.group_id, ''name'', group_name,\n      ''institution_name'', institution_name)',
    E'''group'', case when new.group_id is null then null else jsonb_build_object(\n      ''id'', new.group_id, ''name'', group_name,\n      ''institution_name'', institution_name) end');
  if definition = original then
    raise exception 'Não foi possível atualizar o dossiê para ofertas livres';
  end if;
  execute definition;
end;
$$;

comment on column public.shift_offers.group_id is
  'NULL identifica oferta livre visível a todos os perfis aprovados; preenchido identifica oferta restrita ao grupo.';
