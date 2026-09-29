create table private.registration_drafts (
  user_id uuid primary key references auth.users(id),
  civil_name text not null default '',
  cpf text unique check (cpf is null or cpf ~ '^[0-9]{11}$'),
  birth_date date check (birth_date >= date '1900-01-01' and birth_date < current_date),
  phone text unique check (phone is null or phone ~ '^\+55[1-9][0-9]9[0-9]{8}$'),
  data jsonb not null default '{}',
  revision integer not null default 0,
  state text not null default 'incomplete' check (state in ('incomplete','submitted','changes_requested','approved','rejected')),
  photo_path text,
  correction_fields jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
create table private.registration_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  revision integer not null,
  snapshot jsonb not null,
  submitted_at timestamptz not null default now(),
  unique(user_id, revision)
);
create index registration_submissions_user_idx on private.registration_submissions(user_id, submitted_at desc);
create table private.legal_acceptances (
  user_id uuid not null references auth.users(id),
  document text not null check (document in ('terms','privacy')),
  version text not null,
  content_hash text not null check (length(content_hash) = 64),
  accepted_at timestamptz not null default now(),
  primary key(user_id, document, version)
);
create table private.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  contact_email text not null,
  category text not null check (category in ('support','privacy')),
  message text not null check (length(message) between 10 and 4000),
  response text,
  state text not null default 'open' check (state in ('open','answered','closed')),
  created_at timestamptz not null default now(),
  answered_at timestamptz
);
create index support_requests_user_idx on private.support_requests(user_id);
create table private.registration_decisions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id),
  actor_id uuid not null references auth.users(id), revision integer not null,
  outcome text not null, fields jsonb not null default '{}', internal_notes text,
  crm_evidence jsonb, rqe_verified boolean not null default false, decided_at timestamptz not null default now()
);
create index registration_decisions_user_idx on private.registration_decisions(user_id,decided_at desc);
create index registration_decisions_actor_idx on private.registration_decisions(actor_id);
alter table private.registration_decisions enable row level security;
revoke all on private.registration_decisions from public,anon,authenticated;
grant all on private.registration_decisions to service_role;
alter table private.registration_drafts enable row level security;
alter table private.registration_submissions enable row level security;
alter table private.legal_acceptances enable row level security;
alter table private.support_requests enable row level security;
revoke all on private.registration_drafts, private.registration_submissions, private.legal_acceptances, private.support_requests from public, anon, authenticated;
grant all on private.registration_drafts, private.registration_submissions, private.legal_acceptances, private.support_requests to service_role;

alter table public.profiles add column verification_valid_until timestamptz,
  add column photo_path text,
  add column specialty text,
  add column rqe text,
  add column rqe_verified boolean not null default false;
update public.profiles set verification_valid_until = coalesce(verified_at, now()) + interval '90 days' where status = 'approved' and role = 'doctor';
-- Critical identity edits require a versioned submission, even through direct REST.
revoke update on public.profiles from authenticated;

create function public.registration_queue() returns jsonb
language sql security definer set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(d) order by d.updated_at),'[]'::jsonb) from private.registration_drafts d;
$$;
create function public.registration_review(target_user uuid, reviewer uuid, expected_revision integer, decision text, corrections jsonb, internal_notes text, evidence jsonb, verified_rqe boolean, validity_days integer) returns void
language plpgsql security definer set search_path = '' as $$
declare draft private.registration_drafts%rowtype; medical boolean;
begin
  if not exists(select 1 from public.administrative_access where user_id=reviewer and active) then raise exception 'Sem concessão administrativa'; end if;
  if decision not in ('approved','changes_requested','rejected','suspended') or validity_days not between 1 and 365 then raise exception 'Decisão inválida'; end if;
  select * into draft from private.registration_drafts where user_id=target_user for update;
  if not found or draft.revision<>expected_revision or draft.state not in ('submitted','approved','changes_requested') or not exists(select 1 from private.registration_submissions where user_id=target_user and revision=expected_revision) then raise exception 'Cadastro desatualizado ou não enviado'; end if;
  medical:=draft.data->>'practicesMedicine'='yes';
  if decision='approved' and medical and (evidence->>'outcome' is distinct from 'active' or evidence->>'crmNumber' is distinct from draft.data->>'crmNumber' or evidence->>'crmState' is distinct from draft.data->>'crmState' or length(coalesce(evidence->>'source',''))<5) then raise exception 'Evidência CRM incompatível'; end if;
  if decision='changes_requested' and (jsonb_typeof(corrections)<>'object' or corrections='{}'::jsonb) then raise exception 'Indique campos e motivos'; end if;
  if verified_rqe and (nullif(draft.data->>'rqe','') is null or not medical or length(coalesce(evidence->>'rqeSource',''))<5) then raise exception 'RQE ou evidência específica ausente'; end if;
  insert into private.registration_decisions(user_id,actor_id,revision,outcome,fields,internal_notes,crm_evidence,rqe_verified)
    values(target_user,reviewer,draft.revision,decision,corrections,internal_notes,evidence,verified_rqe);
  update private.registration_drafts set state=case when decision='suspended' then 'rejected' else decision end,correction_fields=corrections,updated_at=now() where user_id=target_user;
  update public.profiles set status=decision::public.profile_status,verification_notes=case when decision='changes_requested' then 'Revise os campos indicados no cadastro e envie sua resposta.' else null end,
    verified_by=case when decision='approved' then reviewer else null end,verified_at=case when decision='approved' then now() else null end,
    verification_valid_until=case when decision='approved' and medical then now()+make_interval(days=>validity_days) else null end,rqe_verified=verified_rqe where id=target_user;
  insert into public.audit_events(actor_id,event_type,entity_type,entity_id,metadata) values(reviewer,'registration.reviewed','profile',target_user,jsonb_build_object('revision',draft.revision,'outcome',decision));
  insert into public.notifications(recipient_id,event_type,title,body,href) values(target_user,'registration.reviewed','Seu cadastro foi analisado','Confira a decisão e os próximos passos no cadastro.','/cadastro/completar');
end;
$$;
revoke all on function public.registration_queue(),public.registration_review(uuid,uuid,integer,text,jsonb,text,jsonb,boolean,integer) from public,anon,authenticated;
grant execute on function public.registration_queue(),public.registration_review(uuid,uuid,integer,text,jsonb,text,jsonb,boolean,integer) to service_role;

create function public.registration_read(target_user uuid) returns jsonb
language sql security definer set search_path = '' as $$
  select jsonb_build_object('draft', (select to_jsonb(d) from private.registration_drafts d where d.user_id=target_user),
    'submissions', coalesce((select jsonb_agg(to_jsonb(s) order by s.submitted_at desc) from private.registration_submissions s where s.user_id=target_user), '[]'::jsonb),
    'acceptances', coalesce((select jsonb_agg(to_jsonb(a)) from private.legal_acceptances a where a.user_id=target_user), '[]'::jsonb),
    'decisions', coalesce((select jsonb_agg(jsonb_build_object('revision',r.revision,'outcome',r.outcome,'fields',r.fields,'decided_at',r.decided_at,'rqe_verified',r.rqe_verified) order by r.decided_at desc) from private.registration_decisions r where r.user_id=target_user),'[]'::jsonb));
$$;

create function public.registration_save(target_user uuid, draft_data jsonb, expected_revision integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare next_revision integer;
begin
  insert into private.registration_drafts(user_id) values(target_user) on conflict do nothing;
  update private.registration_drafts set civil_name=draft_data->>'civilName', cpf=nullif(draft_data->>'cpf',''),
    birth_date=nullif(draft_data->>'birthDate','')::date, phone=nullif(draft_data->>'phone',''), data=draft_data,
    revision=revision+1, state='incomplete', updated_at=now()
    where user_id=target_user and revision=expected_revision returning revision into next_revision;
  if next_revision is null then raise exception 'Cadastro modificado em outra sessão' using errcode='40001'; end if;
  return next_revision;
end;
$$;

create function public.registration_accept(target_user uuid, document_version text, terms_hash text, privacy_hash text) returns void
language sql security definer set search_path = '' as $$
  insert into private.legal_acceptances(user_id,document,version,content_hash)
  values(target_user,'terms',document_version,terms_hash),(target_user,'privacy',document_version,privacy_hash)
  on conflict do nothing;
$$;

create function public.registration_submit(target_user uuid, expected_revision integer) returns void
language plpgsql security definer set search_path = '' as $$
declare draft private.registration_drafts%rowtype; medical boolean;
begin
  select * into draft from private.registration_drafts where user_id=target_user for update;
  if not found or draft.revision<>expected_revision then raise exception 'Cadastro desatualizado'; end if;
  if exists(select 1 from private.registration_submissions where user_id=target_user and revision=expected_revision) then return; end if;
  if not exists(select 1 from auth.users where id=target_user and email_confirmed_at is not null) then raise exception 'Confirme seu e-mail'; end if;
  if draft.cpf is null or draft.birth_date is null or draft.phone is null or draft.photo_path is null or length(draft.civil_name)<3 then raise exception 'Complete a identificação e a foto'; end if;
  if (select count(*) from private.legal_acceptances where user_id=target_user and version='2026-09-29')<>2 then raise exception 'Aceite os documentos atuais'; end if;
  medical := draft.data->>'practicesMedicine'='yes';
  if medical and (coalesce(draft.data->>'crmNumber','') !~ '^[0-9]{4,12}$' or coalesce(draft.data->>'crmState','') not in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')) then raise exception 'Complete o CRM e a UF'; end if;
  insert into private.registration_submissions(user_id,revision,snapshot) values(target_user,draft.revision,to_jsonb(draft) || jsonb_build_object('previous_profile',(select to_jsonb(p) from public.profiles p where p.id=target_user)));
  insert into public.profiles(id,display_name,role,status,crm_number,crm_state,specialty,rqe,photo_path)
    values(target_user,draft.data->>'displayName',case when medical then 'doctor'::public.app_role else 'approver'::public.app_role end,'pending',
      case when medical then draft.data->>'crmNumber' end,case when medical then draft.data->>'crmState' end,
      nullif(draft.data->>'specialty',''),nullif(draft.data->>'rqe',''),draft.photo_path)
    on conflict(id) do update set display_name=excluded.display_name,role=excluded.role,status='pending',crm_number=excluded.crm_number,crm_state=excluded.crm_state,
      specialty=excluded.specialty,rqe=excluded.rqe,rqe_verified=false,photo_path=excluded.photo_path,verification_valid_until=null,verified_at=null,verified_by=null;
  update private.registration_drafts set state='submitted',updated_at=now() where user_id=target_user;
  insert into public.audit_events(actor_id,event_type,entity_type,entity_id,metadata) values(target_user,'registration.submitted','profile',target_user,jsonb_build_object('revision',draft.revision));
end;
$$;

create function public.registration_photo(target_user uuid, object_path text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if object_path is not null and object_path not like target_user::text || '/%' then raise exception 'Foto inválida'; end if;
  insert into private.registration_drafts(user_id,photo_path) values(target_user,object_path)
    on conflict(user_id) do update set photo_path=excluded.photo_path,revision=registration_drafts.revision+1,state='incomplete',updated_at=now();
end;
$$;

create function public.support_create(target_user uuid, email text, request_category text, request_message text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare request_id uuid;
begin
  insert into private.support_requests(user_id,contact_email,category,message) values(target_user,email,request_category,request_message) returning id into request_id;
  return request_id;
end;
$$;
create function public.support_list(target_user uuid) returns jsonb
language sql security definer set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(r) order by created_at desc),'[]'::jsonb) from private.support_requests r where target_user is null or user_id=target_user;
$$;
create function public.support_answer(request_id uuid, reply text) returns void
language sql security definer set search_path = '' as $$
  update private.support_requests set response=reply,state='answered',answered_at=now() where id=request_id;
$$;

revoke all on function public.registration_read(uuid),public.registration_save(uuid,jsonb,integer),public.registration_accept(uuid,text,text,text),public.registration_submit(uuid,integer),public.registration_photo(uuid,text),public.support_create(uuid,text,text,text),public.support_list(uuid),public.support_answer(uuid,text) from public,anon,authenticated;
grant execute on function public.registration_read(uuid),public.registration_save(uuid,jsonb,integer),public.registration_accept(uuid,text,text,text),public.registration_submit(uuid,integer),public.registration_photo(uuid,text),public.support_create(uuid,text,text,text),public.support_list(uuid),public.support_answer(uuid,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('profile-photos','profile-photos',false,2097152,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;

-- Expiration blocks new commitments; existing evidence and history remain readable.
do $$
declare definition text; marker text := '  new.result_id := null;';
begin
  definition := replace(pg_get_functiondef('private.process_workflow_command()'::regprocedure),chr(13),'');
  if position(marker in definition)=0 then raise exception 'Fluxo de publicação incompatível'; end if;
  definition := replace(definition,marker,marker || E'\n  if new.command in (''publish_offer'',''apply_to_offer'') and not exists (select 1 from public.profiles where id=auth.uid() and role=''doctor'' and status=''approved'' and verification_valid_until>now()) then raise exception ''Revalide seu cadastro profissional''; end if;');
  execute definition;
end;
$$;
