-- Direct agreements are private invitations, never marketplace offers.
create table public.external_agreements (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id),
  creator_role text not null check (creator_role in ('owner','substitute')),
  recipient_email text not null check (recipient_email = lower(trim(recipient_email)) and length(recipient_email) between 3 and 254 and recipient_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  recipient_id uuid references public.profiles(id),
  owner_id uuid references public.profiles(id),
  substitute_id uuid references public.profiles(id),
  group_id uuid references public.groups(id),
  requires_approval boolean not null default false,
  location text not null check (length(trim(location)) between 3 and 240),
  sector text not null check (length(trim(sector)) between 2 and 120),
  starts_at timestamptz not null check (isfinite(starts_at)),
  ends_at timestamptz not null check (isfinite(ends_at) and ends_at > starts_at),
  value_cents integer not null check (value_cents between 1 and 999999999),
  due_date date not null check (isfinite(due_date)),
  payment_method text not null check (length(trim(payment_method)) between 2 and 120),
  notes text not null default '' check (length(notes) <= 1000),
  status text not null default 'pending_acceptance' check (status in ('pending_acceptance','pending_approval','confirmed','declined','rejected','cancelled')),
  terms jsonb not null,
  terms_hash text not null,
  snapshot jsonb,
  document_text text,
  document_hash text,
  recipient_accepted_at timestamptz,
  approved_by uuid references public.profiles(id),
  confirmed_at timestamptz,
  received_at timestamptz,
  created_at timestamptz not null default now(),
  check (owner_id is null or substitute_id is null or owner_id <> substitute_id),
  check (recipient_id is null or recipient_id <> creator_id)
);
create index external_agreements_creator_idx on public.external_agreements(creator_id,created_at desc);
create index external_agreements_recipient_email_idx on public.external_agreements(recipient_email);
create index external_agreements_recipient_idx on public.external_agreements(recipient_id);
create index external_agreements_owner_idx on public.external_agreements(owner_id);
create index external_agreements_substitute_idx on public.external_agreements(substitute_id);
create index external_agreements_group_idx on public.external_agreements(group_id,status);
create index external_agreements_approver_idx on public.external_agreements(approved_by);

create table public.external_agreement_events (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references public.external_agreements(id),
  sequence integer not null,
  actor_id uuid not null references auth.users(id),
  kind text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  previous_hash text,
  canonical_text text not null,
  event_hash text not null,
  unique(agreement_id,sequence)
);
create index external_agreement_events_actor_idx on public.external_agreement_events(actor_id);
create table private.external_agreement_requests (
  actor_id uuid not null references auth.users(id),
  request_id uuid not null,
  request_hash text not null,
  result_id uuid not null references public.external_agreements(id),
  created_at timestamptz not null default now(),
  primary key(actor_id,request_id)
);
create index external_agreement_requests_result_idx on private.external_agreement_requests(result_id);
alter table public.external_agreements enable row level security;
alter table public.external_agreement_events enable row level security;
alter table private.external_agreement_requests enable row level security;
revoke all on public.external_agreements from public, anon, authenticated;
revoke all on public.external_agreement_events from public, anon, authenticated;
revoke all on private.external_agreement_requests from public, anon, authenticated;
grant select on public.external_agreements,public.external_agreement_events to authenticated;
grant all on public.external_agreements,public.external_agreement_events,private.external_agreement_requests to service_role;

create function private.external_eligible(person uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p join auth.users u on u.id=p.id
    join private.registration_drafts d on d.user_id=p.id
    where p.id=person and p.role='doctor' and p.status in ('pending','approved')
      and (p.status='pending' or p.verification_valid_until>now())
      and u.email_confirmed_at is not null and u.deleted_at is null
      and (u.banned_until is null or u.banned_until<now())
      and length(trim(d.civil_name))>=3 and d.cpf is not null and d.birth_date is not null
      and d.phone is not null and d.data->>'practicesMedicine'='yes'
      and p.crm_number ~ '^[0-9]{4,12}$' and p.crm_state in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')
  );
$$;
create function private.external_member(group_ref uuid,person uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select group_ref is null or exists(select 1 from public.group_memberships m join public.groups g on g.id=m.group_id join public.institutions i on i.id=g.institution_id where m.group_id=group_ref and m.profile_id=person and m.active and g.active and i.active);
$$;
create function private.external_approver(group_ref uuid,person uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select group_ref is not null and exists(select 1 from public.group_memberships m join public.profiles p on p.id=m.profile_id
    where m.group_id=group_ref and m.profile_id=person and m.active and m.role='approver' and p.status='approved' and private.external_member(group_ref,person));
$$;
create function private.external_can_read(agreement_ref uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.external_agreements a where a.id=agreement_ref and (
    auth.uid() in (a.creator_id,a.recipient_id)
    or (a.recipient_id is null and exists(select 1 from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null and lower(u.email)=a.recipient_email)
      and private.external_member(a.group_id,auth.uid()))
    or private.external_approver(a.group_id,auth.uid())
  ));
$$;
revoke all on function private.external_eligible(uuid),private.external_member(uuid,uuid),private.external_approver(uuid,uuid),private.external_can_read(uuid) from public,anon,authenticated;
grant execute on function private.external_can_read(uuid) to authenticated;
create policy "external agreement audiences" on public.external_agreements for select to authenticated using(private.external_can_read(id));
create policy "external agreement event audiences" on public.external_agreement_events for select to authenticated using(private.external_can_read(agreement_id));

create function private.external_guard() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op='DELETE' or tg_table_name='external_agreement_events' then raise exception 'Registro imutável'; end if;
  if (to_jsonb(new)-array['recipient_id','owner_id','substitute_id','status','snapshot','document_text','document_hash','recipient_accepted_at','approved_by','confirmed_at','received_at'])
    is distinct from (to_jsonb(old)-array['recipient_id','owner_id','substitute_id','status','snapshot','document_text','document_hash','recipient_accepted_at','approved_by','confirmed_at','received_at'])
    then raise exception 'Condições imutáveis'; end if;
  if old.document_hash is not null and (new.snapshot is distinct from old.snapshot or new.document_text is distinct from old.document_text or new.document_hash is distinct from old.document_hash
    or new.owner_id is distinct from old.owner_id or new.substitute_id is distinct from old.substitute_id or new.confirmed_at is distinct from old.confirmed_at)
    then raise exception 'Documento imutável'; end if;
  return new;
end;
$$;
revoke all on function private.external_guard() from public,anon,authenticated;
create trigger external_agreement_terms_immutable before update or delete on public.external_agreements for each row execute function private.external_guard();
create trigger external_agreement_events_immutable before update or delete on public.external_agreement_events for each row execute function private.external_guard();

create function private.external_person(person uuid) returns jsonb language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('id',id,'name',display_name,'crm',crm_number,'uf',crm_state,'status',status,'valid_until',verification_valid_until) from public.profiles where id=person;
$$;
create function private.external_context(agreement_ref uuid) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb; a public.external_agreements%rowtype;
begin
  if auth.uid() is null then raise exception 'Sessão inválida'; end if;
  result:=jsonb_build_object('eligible',private.external_eligible(auth.uid()),'groups',coalesce((select jsonb_agg(jsonb_build_object('id',g.id,'name',g.name)) from public.groups g join public.group_memberships m on m.group_id=g.id where m.profile_id=auth.uid() and m.active and private.external_member(g.id,auth.uid())),'[]'::jsonb));
  if agreement_ref is not null and private.external_can_read(agreement_ref) then
    select * into a from public.external_agreements where id=agreement_ref;
    result:=result || jsonb_build_object('owner',private.external_person(a.owner_id),'substitute',private.external_person(a.substitute_id),'isApprover',private.external_approver(a.group_id,auth.uid()));
    if a.recipient_id is null and exists(select 1 from auth.users where id=auth.uid() and lower(email)=a.recipient_email and email_confirmed_at is not null) then
      result:=result || jsonb_build_object(case when a.creator_role='owner' then 'substitute' else 'owner' end,private.external_person(auth.uid()));
    end if;
  end if;
  return result;
end;
$$;
create function public.external_agreement_context(agreement_ref uuid default null) returns jsonb language sql security invoker set search_path = '' as $$ select private.external_context(agreement_ref); $$;
revoke all on function private.external_person(uuid),private.external_context(uuid),public.external_agreement_context(uuid) from public,anon,authenticated;
grant execute on function private.external_context(uuid),public.external_agreement_context(uuid) to authenticated;

create function private.external_command(request_ref uuid,operation text,agreement_ref uuid,input jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
 actor uuid:=auth.uid(); a public.external_agreements%rowtype; result uuid; fingerprint text; prior private.external_agreement_requests%rowtype;
 my_email text; event_payload jsonb:='{}'::jsonb; event_kind text; seq integer; prev text; canonical text; doc jsonb;
 receipt text; payment_date date; amount integer; group_ref uuid; approval boolean;
begin
 if actor is null or request_ref is null or operation is null or input is null then raise exception 'Sessão ou comando inválido'; end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
 fingerprint:=encode(extensions.digest(jsonb_build_object('operation',operation,'agreement',agreement_ref,'input',input)::text,'sha256'),'hex');
 select * into prior from private.external_agreement_requests where actor_id=actor and request_id=request_ref;
 if found then
   if prior.request_hash<>fingerprint then raise exception 'Comando já utilizado com outros dados'; end if;
   return prior.result_id;
 end if;
 if (select count(*) from private.external_agreement_requests where actor_id=actor and created_at>now()-interval '1 minute')>=30 then raise exception 'Aguarde um minuto antes de tentar novamente'; end if;
 select lower(email) into my_email from auth.users where id=actor and email_confirmed_at is not null and deleted_at is null and (banned_until is null or banned_until<now());
 if my_email is null then raise exception 'Confirme seu e-mail'; end if;
 if operation='create' then
   if not private.external_eligible(actor) then raise exception 'Complete seu cadastro para registrar o acordo'; end if;
   if input->>'accepted' is distinct from 'true' then raise exception 'Confirme as condições'; end if;
   if input->>'creator_role' is null or input->>'creator_role' not in ('owner','substitute') then raise exception 'Informe seu papel'; end if;
   if lower(trim(input->>'recipient_email'))=my_email then raise exception 'Convide outro profissional'; end if;
   group_ref:=nullif(input->>'group_id','')::uuid;
   if not private.external_member(group_ref,actor) then raise exception 'Vínculo de grupo necessário'; end if;
   if group_ref is not null then select requires_approval into approval from public.groups where id=group_ref; end if;
   if (input->>'starts_at')::timestamptz<=now() then raise exception 'O plantão precisa estar no futuro'; end if;
   if (input->>'due_date')::date<(now() at time zone 'America/Fortaleza')::date then raise exception 'Informe uma data-limite futura'; end if;
   insert into public.external_agreements(creator_id,creator_role,recipient_email,owner_id,substitute_id,group_id,requires_approval,location,sector,starts_at,ends_at,value_cents,due_date,payment_method,notes,terms,terms_hash)
   values(actor,input->>'creator_role',lower(trim(input->>'recipient_email')),case when input->>'creator_role'='owner' then actor end,case when input->>'creator_role'='substitute' then actor end,
     group_ref,coalesce(approval,false),trim(input->>'location'),trim(input->>'sector'),(input->>'starts_at')::timestamptz,(input->>'ends_at')::timestamptz,(input->>'value_cents')::integer,(input->>'due_date')::date,trim(input->>'payment_method'),coalesce(input->>'notes',''),'{}','') returning * into a;
   -- The INSERT trigger binds both accepts to the same canonical terms.
   result:=a.id; event_kind:='created'; event_payload:=jsonb_build_object('terms_hash',a.terms_hash,'role',a.creator_role,'deadline_independent_of_hospital',true);
 else
   select * into a from public.external_agreements where id=agreement_ref for update;
   if not found or not private.external_can_read(a.id) then raise exception 'Registro indisponível'; end if;
   result:=a.id;
   if operation in ('accept','decline','approve','reject') and a.starts_at<=now() then raise exception 'O prazo de confirmação terminou'; end if;
   if operation in ('accept','decline') then
     if a.status<>'pending_acceptance' or a.creator_id=actor or my_email<>a.recipient_email then raise exception 'Convite indisponível para esta conta'; end if;
     if operation='accept' then
       if a.due_date<(now() at time zone 'America/Fortaleza')::date then raise exception 'A data-limite passou. Solicite um novo convite'; end if;
       if not private.external_eligible(actor) or not private.external_eligible(a.creator_id) then raise exception 'As duas partes precisam completar o cadastro'; end if;
       if not private.external_member(a.group_id,actor) or not private.external_member(a.group_id,a.creator_id) then raise exception 'As duas partes precisam de vínculo ativo no grupo'; end if;
       if input->>'accepted' is distinct from 'true' or input->>'terms_hash' is distinct from a.terms_hash then raise exception 'Revise e aceite as condições atuais'; end if;
       update public.external_agreements set recipient_id=actor,owner_id=case when creator_role='owner' then creator_id else actor end,
         substitute_id=case when creator_role='substitute' then creator_id else actor end,recipient_accepted_at=now(),
         status=case when requires_approval or exists(select 1 from public.groups g where g.id=a.group_id and g.requires_approval) then 'pending_approval' else 'confirmed' end where id=a.id returning * into a;
       event_kind:='accepted'; event_payload:=jsonb_build_object('terms_hash',a.terms_hash);
     else
       update public.external_agreements set recipient_id=actor,status='declined' where id=a.id returning * into a;
       event_kind:='declined';
     end if;
   elsif operation in ('approve','reject') then
     if a.status<>'pending_approval' or not private.external_approver(a.group_id,actor) then raise exception 'Aprovação institucional indisponível'; end if;
     if not private.external_member(a.group_id,a.owner_id) or not private.external_member(a.group_id,a.substitute_id) then raise exception 'Vínculo de grupo necessário'; end if;
     if operation='approve' and (not private.external_eligible(a.owner_id) or not private.external_eligible(a.substitute_id)) then raise exception 'Cadastro das partes indisponível'; end if;
     update public.external_agreements set approved_by=actor,status=case when operation='approve' then 'confirmed' else 'rejected' end where id=a.id returning * into a;
     event_kind:=case when operation='approve' then 'approved' else 'rejected' end;
   elsif operation='cancel' then
     if actor<>a.creator_id or a.status not in ('pending_acceptance','pending_approval') then raise exception 'Somente convites pendentes podem ser cancelados'; end if;
     update public.external_agreements set status='cancelled' where id=a.id returning * into a; event_kind:='cancelled';
   elsif operation='payment' then
     if a.status<>'confirmed' or actor is distinct from a.owner_id or a.received_at is not null then raise exception 'Pagamento indisponível'; end if;
     amount:=(input->>'amount_cents')::integer; payment_date:=(input->>'paid_on')::date; receipt:=nullif(input->>'receipt_path','');
     if amount is null or amount<>a.value_cents then raise exception 'Informe o valor total do acordo'; end if;
     if payment_date is null or not isfinite(payment_date) or payment_date>(now() at time zone 'America/Fortaleza')::date then raise exception 'Data de pagamento inválida'; end if;
     if receipt is not null and (receipt not like a.id::text||'/'||actor::text||'/%' or not exists(select 1 from storage.objects where bucket_id='agreement-receipts' and name=receipt and owner_id=actor::text)) then raise exception 'Comprovante inválido'; end if;
     event_kind:='payment_reported'; event_payload:=jsonb_build_object('amount_cents',amount,'paid_on',payment_date,'receipt_path',receipt);
   elsif operation='receive' then
     if a.status<>'confirmed' or actor is distinct from a.substitute_id or a.received_at is not null or input->>'accepted' is distinct from 'true' then raise exception 'Confirmação de recebimento indisponível'; end if;
     update public.external_agreements set received_at=now() where id=a.id returning * into a; event_kind:='received'; event_payload:=jsonb_build_object('amount_cents',a.value_cents);
   elsif operation='dispute' then
     if a.status<>'confirmed' or actor not in (a.owner_id,a.substitute_id) or length(trim(coalesce(input->>'description',''))) not between 10 and 2000 then raise exception 'Descreva a divergência (10 a 2000 caracteres)'; end if;
     event_kind:='disputed'; event_payload:=jsonb_build_object('description',trim(input->>'description'));
   else raise exception 'Comando inválido'; end if;
   if a.status='confirmed' and a.document_hash is null then
     doc:=jsonb_build_object('version',1,'origin','external','id',a.id,'terms',a.terms,'terms_hash',a.terms_hash,
       'owner',private.external_person(a.owner_id),'substitute',private.external_person(a.substitute_id),'creator_accepted_at',a.created_at,
       'recipient_accepted_at',a.recipient_accepted_at,'approved_by',a.approved_by,'confirmed_at',now());
     update public.external_agreements set snapshot=doc,document_text=doc::text,document_hash=encode(extensions.digest(doc::text,'sha256'),'hex'),confirmed_at=now() where id=a.id returning * into a;
   end if;
 end if;
 select sequence,event_hash into seq,prev from public.external_agreement_events where agreement_id=a.id order by sequence desc limit 1;
 seq:=coalesce(seq,0)+1;
 canonical:=jsonb_build_object('agreement_id',a.id,'sequence',seq,'actor_id',actor,'kind',event_kind,'payload',event_payload,'created_at',now(),'previous_hash',prev,'document_hash',a.document_hash)::text;
 insert into public.external_agreement_events(agreement_id,sequence,actor_id,kind,payload,previous_hash,canonical_text,event_hash)
 values(a.id,seq,actor,event_kind,event_payload,prev,canonical,encode(extensions.digest(canonical,'sha256'),'hex'));
 insert into private.external_agreement_requests(actor_id,request_id,request_hash,result_id) values(actor,request_ref,fingerprint,result);
 insert into public.audit_events(actor_id,event_type,entity_type,entity_id,metadata) values(actor,'external_agreement.'||event_kind,'external_agreement',a.id,jsonb_build_object('sequence',seq));
 insert into public.notifications(recipient_id,event_type,title,body,href)
 select distinct person,'external_agreement.'||event_kind,'Atualização no acordo','Há uma atualização no registro do plantão. Abra o acordo para conferir.','/acordos/registrados/'||a.id
 from (
   select a.creator_id person union select a.recipient_id union
   select p.id from public.profiles p join auth.users u on u.id=p.id where a.recipient_id is null and lower(u.email)=a.recipient_email and u.email_confirmed_at is not null union
   select m.profile_id from public.group_memberships m where a.status='pending_approval' and m.group_id=a.group_id and m.active and m.role='approver'
 ) people where person is not null and person<>actor;
 return result;
end;
$$;
create function private.external_terms() returns trigger language plpgsql set search_path = '' as $$
begin
 new.terms:=jsonb_build_object('creator_role',new.creator_role,'recipient_email',new.recipient_email,'group_id',new.group_id,'requires_approval',new.requires_approval,
  'location',new.location,'sector',new.sector,'starts_at',new.starts_at,'ends_at',new.ends_at,'value_cents',new.value_cents,'due_date',new.due_date,
  'payment_method',new.payment_method,'notes',new.notes,'deadline_independent_of_hospital',true);
 new.terms_hash:=encode(extensions.digest(new.terms::text,'sha256'),'hex'); return new;
end;
$$;
create trigger external_agreement_canonical_terms before insert on public.external_agreements for each row execute function private.external_terms();
create function public.external_agreement_command(request_ref uuid,operation text,agreement_ref uuid default null,input jsonb default '{}') returns uuid
language sql security invoker set search_path = '' as $$ select private.external_command(request_ref,operation,agreement_ref,input); $$;
revoke all on function private.external_terms(),private.external_command(uuid,text,uuid,jsonb),public.external_agreement_command(uuid,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function private.external_command(uuid,text,uuid,jsonb),public.external_agreement_command(uuid,text,uuid,jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('agreement-receipts','agreement-receipts',false,4194304,array['image/jpeg','image/png','application/pdf']);
create function private.external_receipt_access(object_name text,writing boolean) returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists(select 1 from public.external_agreements a where a.id::text=split_part(object_name,'/',1) and (
   (writing and a.owner_id=auth.uid() and a.status='confirmed' and a.received_at is null and split_part(object_name,'/',2)=auth.uid()::text)
   or (not writing and auth.uid() in (a.owner_id,a.substitute_id) and exists(select 1 from public.external_agreement_events e where e.agreement_id=a.id and e.payload->>'receipt_path'=object_name))
 ));
$$;
revoke all on function private.external_receipt_access(text,boolean) from public,anon,authenticated;
grant execute on function private.external_receipt_access(text,boolean) to authenticated;
create policy "payer uploads receipt" on storage.objects for insert to authenticated with check(bucket_id='agreement-receipts' and private.external_receipt_access(name,true));
create policy "parties read recorded receipt" on storage.objects for select to authenticated using(bucket_id='agreement-receipts' and private.external_receipt_access(name,false));
-- No UPDATE/DELETE policy: already recorded evidence cannot be replaced by clients.
