-- Feedback do piloto: projeções mínimas, prazo explícito e eventos financeiros.
alter table private.support_requests drop constraint support_requests_category_check;
alter table private.support_requests add constraint support_requests_category_check check (category in ('support','privacy','crm_review'));

create function public.offer_candidate_profiles(target_offer uuid, target_user uuid) returns jsonb
language sql security definer set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'crm',p.crm_number,'uf',p.crm_state,
 'specialty',p.specialty,'rqe',p.rqe,'rqe_verified',p.rqe_verified,
 'verified',p.status='approved' and p.role='doctor' and p.verification_valid_until>now(),
 'valid_until',p.verification_valid_until)), '[]'::jsonb)
 from public.profiles p join public.shift_applications a on a.candidate_id=p.id
 join public.shift_offers o on o.id=a.offer_id
 where o.id=target_offer and o.owner_id=target_user and a.status='active';
$$;
revoke all on function public.offer_candidate_profiles(uuid,uuid) from public,anon,authenticated;
grant execute on function public.offer_candidate_profiles(uuid,uuid) to service_role;

alter table public.shift_offers add column payment_due_date date check (isfinite(payment_due_date));
alter table public.shift_agreements add column payment_due_date date check (isfinite(payment_due_date));

create function private.feedback_workflow_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare due date; candidate uuid;
begin
 if new.command in ('publish_offer','update_offer') then
   if coalesce(new.payload->>'payment_due_date','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'Informe uma data-limite de pagamento'; end if;
   due:=(new.payload->>'payment_due_date')::date;
   if not isfinite(due) or due < (now() at time zone 'America/Fortaleza')::date then raise exception 'Data-limite de pagamento inválida'; end if;
   new.payload := jsonb_set(new.payload,'{payment_terms}',to_jsonb('Quem repassa paga a quem assume até ' || to_char(due,'DD/MM/YYYY') || '. A data-limite vale mesmo se o hospital atrasar o pagamento. ' || coalesce(new.payload->>'payment_terms','')));
   if length(new.payload->>'payment_terms')>300 then raise exception 'Reduza as condições adicionais de pagamento'; end if;
 end if;
 if new.command='select_candidate' then
   select candidate_id into candidate from public.shift_applications where id=new.target_id;
 elsif new.command='confirm_substitution' and new.payload->>'accepted'='true' then
   select substitute_id into candidate from public.substitutions where id=new.target_id;
 end if;
 if candidate is not null and not exists(select 1 from public.profiles where id=candidate and status='approved' and role='doctor' and verification_valid_until>now()) then raise exception 'O candidato precisa revalidar o cadastro profissional'; end if;
 return new;
end; $$;
create trigger aaa_feedback_workflow_guard before insert on public.workflow_commands for each row execute function private.feedback_workflow_guard();

create function private.feedback_workflow_terms() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if new.command in ('publish_offer','update_offer') then
   update public.shift_offers set payment_due_date=(new.payload->>'payment_due_date')::date where id=new.result_id;
 end if;
 return new;
end; $$;
create trigger zzz_feedback_workflow_terms before insert on public.workflow_commands for each row execute function private.feedback_workflow_terms();

create function private.feedback_agreement_terms() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 select payment_due_date into new.payment_due_date from public.shift_offers where id=new.offer_id;
 return new;
end; $$;
create trigger feedback_agreement_terms before insert on public.shift_agreements for each row execute function private.feedback_agreement_terms();

create table public.agreement_payment_events (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null,
 agreement_id uuid not null references public.shift_agreements(id),
 actor_id uuid not null references auth.users(id),
 kind text not null check(kind in ('payment','receive','dispute','source_delay')),
 paid_on date check(isfinite(paid_on)), amount_cents integer check(amount_cents>0),
 description text check(length(description) between 10 and 2000),
 created_at timestamptz not null default now(),
 unique(actor_id,request_id)
);
create index agreement_payment_events_agreement_idx on public.agreement_payment_events(agreement_id,created_at);
alter table public.agreement_payment_events enable row level security;
revoke all on public.agreement_payment_events from public,anon,authenticated;
grant select on public.agreement_payment_events to authenticated;
grant select on public.agreement_payment_events to service_role;
create policy "parties read payment events" on public.agreement_payment_events for select to authenticated using (
 exists(select 1 from public.shift_agreements a where a.id=agreement_id and (a.owner_id=(select auth.uid()) or a.substitute_id=(select auth.uid())))
);
create trigger payment_events_immutable before update or delete on public.agreement_payment_events for each row execute function private.prevent_agreement_mutation();

create function public.record_agreement_payment(target_user uuid, request_ref uuid, target_agreement uuid, operation text, input jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare a public.shift_agreements%rowtype; previous public.agreement_payment_events%rowtype; result uuid; description_value text; paid date; amount integer;
begin
 select * into a from public.shift_agreements where id=target_agreement for update;
 if not found or target_user is null or target_user not in (a.owner_id,a.substitute_id) then raise exception 'Registro indisponível'; end if;
 if request_ref is null or operation not in ('payment','receive','dispute','source_delay') then raise exception 'Ação inválida'; end if;
 description_value:=nullif(trim(input->>'description'),''); paid:=nullif(input->>'paid_on','')::date; amount:=nullif(input->>'amount_cents','')::integer;
 select * into previous from public.agreement_payment_events where actor_id=target_user and request_id=request_ref;
 if found then
   if previous.agreement_id<>target_agreement or previous.kind<>operation or previous.description is distinct from description_value or previous.paid_on is distinct from paid or previous.amount_cents is distinct from amount then raise exception 'Solicitação conflitante'; end if;
   return previous.id;
 end if;
 if operation='payment' and (target_user<>a.owner_id or paid is null or not isfinite(paid) or paid>(now() at time zone 'America/Fortaleza')::date or amount is distinct from (a.snapshot->>'value_cents')::integer) then raise exception 'Informe a data e o valor total do pagamento'; end if;
 if operation='receive' and (target_user<>a.substitute_id or input->>'accepted' is distinct from 'true') then raise exception 'Somente quem recebe pode confirmar o recebimento integral'; end if;
 if operation in ('payment','receive') and exists(select 1 from public.agreement_payment_events where agreement_id=a.id and kind='receive') then raise exception 'Recebimento já confirmado'; end if;
 if operation='source_delay' and target_user<>a.owner_id then raise exception 'Somente quem repassa pode relatar atraso da fonte'; end if;
 if operation in ('dispute','source_delay') and coalesce(length(description_value),0) not between 10 and 2000 then raise exception 'Descreva o ocorrido em 10 a 2.000 caracteres'; end if;
 insert into public.agreement_payment_events(request_id,agreement_id,actor_id,kind,paid_on,amount_cents,description)
 values(request_ref,a.id,target_user,operation,paid,amount,description_value) returning id into result;
 insert into public.notifications(recipient_id,event_type,title,body,href) values(case when target_user=a.owner_id then a.substitute_id else a.owner_id end,'agreement.payment','Atualização do pagamento','Consulte o relato e o acompanhamento do repasse.','/acordos/'||a.id||'/pagamento');
 insert into public.audit_events(actor_id,event_type,entity_type,entity_id,metadata) values(target_user,'agreement.payment.'||operation,'shift_agreement',a.id,jsonb_build_object('event_id',result));
 return result;
end; $$;
revoke all on function public.record_agreement_payment(uuid,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.record_agreement_payment(uuid,uuid,uuid,text,jsonb) to service_role;

-- Queue entries are created in the same transaction as the final agreement.
create table public.agreement_email_deliveries (
 id uuid primary key default gen_random_uuid(), source text not null check(source in ('shift','external')),
 agreement_id uuid not null, recipient_id uuid not null references auth.users(id), recipient_email text not null,
 href text not null, state text not null default 'pending' check(state in ('pending','sending','sent','failed','uncertain')),
 attempts integer not null default 0, first_attempt_at timestamptz, attempted_at timestamptz,
 provider_id text, last_error text, message jsonb, created_at timestamptz not null default now(),
 unique(source,agreement_id,recipient_id)
);
create index agreement_email_pending_idx on public.agreement_email_deliveries(state,created_at);
create index agreement_email_recipient_idx on public.agreement_email_deliveries(recipient_id);
alter table public.agreement_email_deliveries enable row level security;
revoke all on public.agreement_email_deliveries from public,anon,authenticated;
grant select, update on public.agreement_email_deliveries to service_role;
create function private.queue_agreement_emails() returns trigger
language plpgsql security definer set search_path = '' as $$
declare source_value text; link text;
begin
 if tg_table_name='external_agreements' then
   if new.status<>'confirmed' then return new; end if;
   source_value:='external'; link:='/acordos/registrados/'||new.id;
 else source_value:='shift'; link:='/acordos/'||new.id; end if;
 insert into public.agreement_email_deliveries(source,agreement_id,recipient_id,recipient_email,href)
 select source_value,new.id,u.id,u.email,link from auth.users u where u.id in (new.owner_id,new.substitute_id) and u.email_confirmed_at is not null
 on conflict(source,agreement_id,recipient_id) do nothing;
 return new;
end; $$;
create trigger queue_shift_agreement_emails after insert on public.shift_agreements for each row execute function private.queue_agreement_emails();
create trigger queue_external_agreement_emails after insert or update on public.external_agreements for each row execute function private.queue_agreement_emails();
revoke all on function private.feedback_workflow_guard(),private.feedback_workflow_terms(),private.feedback_agreement_terms(),private.queue_agreement_emails() from public,anon,authenticated;
