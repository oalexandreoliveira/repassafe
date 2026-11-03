-- US-1003: avisos críticos por e-mail, derivados das notificações internas.
-- O estado persistido segue como fonte de verdade; a fila nasce na mesma transação
-- e o envio ocorre depois, sem que uma falha do provedor desfaça o evento de origem.
create table public.notification_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id),
  dedupe_key text not null unique,
  template text not null check (template in (
    'selected', 'candidates', 'approval_pending', 'selection_declined',
    'confirmation_expired', 'approval_rejected', 'cancelled', 'registration_reviewed'
  )),
  recipient_id uuid not null references auth.users(id),
  recipient_email text not null,
  href text not null,
  -- Depois deste instante o aviso perde sentido e não é enviado. Fica dentro da
  -- janela de 24 horas da chave de idempotência do Resend.
  expires_at timestamptz not null,
  state text not null default 'pending' check (state in (
    'pending', 'sending', 'sent', 'failed', 'uncertain', 'expired'
  )),
  attempts integer not null default 0,
  first_attempt_at timestamptz,
  attempted_at timestamptz,
  provider_id text,
  last_error text,
  message jsonb,
  created_at timestamptz not null default now()
);
create index notification_email_due_idx
  on public.notification_email_deliveries (expires_at)
  where state in ('pending', 'sending', 'failed');
create index notification_email_notification_idx
  on public.notification_email_deliveries (notification_id);
create index notification_email_recipient_idx
  on public.notification_email_deliveries (recipient_id);

alter table public.notification_email_deliveries enable row level security;
-- Os privilégios padrão do Supabase dão ao service_role DELETE e TRUNCATE em tabelas novas.
revoke all on public.notification_email_deliveries from public, anon, authenticated, service_role;
grant select on public.notification_email_deliveries to service_role;
grant update (state, attempts, first_attempt_at, attempted_at, provider_id, last_error, message)
  on public.notification_email_deliveries to service_role;

create function private.queue_critical_notification_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Só converte identificadores bem formados: esta fila nunca aborta o evento de origem.
  uuid_suffix constant text := '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$';
  offer_row public.shift_offers%rowtype;
  template_name text;
  dedupe text := new.id::text;
  send_until timestamptz := now() + interval '23 hours';
begin
  if new.event_type = 'registration.reviewed' then
    template_name := 'registration_reviewed';
  elsif new.event_type = 'external_agreement.accepted' then
    -- As partes já acompanham o próprio convite; só a aprovação depende de terceiro.
    if exists (
      select 1
      from public.external_agreements a
      join public.group_memberships gm on gm.group_id = a.group_id
      where a.id = substring(new.href from '^/acordos/registrados/' || uuid_suffix)::uuid
        and a.status = 'pending_approval'
        and gm.profile_id = new.recipient_id and gm.active and gm.role = 'approver'
    ) then
      template_name := 'approval_pending';
    end if;
  elsif new.event_type in (
    'application.created', 'substitution.selected', 'approval.pending',
    'substitution.declined', 'substitution.confirmation_expired',
    'substitution.rejected', 'substitution.cancelled', 'occurrence.opened'
  ) then
    select * into offer_row from public.shift_offers
      where id = substring(new.href from '^/plantoes/' || uuid_suffix)::uuid;
    if not found then return new; end if;
    template_name := case new.event_type
      when 'application.created' then 'candidates'
      when 'substitution.selected' then 'selected'
      when 'substitution.declined' then 'selection_declined'
      when 'substitution.rejected' then 'approval_rejected'
      when 'substitution.cancelled' then 'cancelled'
      -- O titular só acompanha; quem decide é o aprovador.
      when 'approval.pending' then
        case when new.recipient_id <> offer_row.owner_id then 'approval_pending' end
      -- Quem pode agir após o prazo é o titular, escolhendo outra candidatura.
      when 'substitution.confirmation_expired' then
        case when new.recipient_id = offer_row.owner_id then 'confirmation_expired' end
      -- Desistência e cancelamento tardio chegam à outra parte só por esta linha.
      -- As demais ocorrências são análise administrativa, não aviso de cancelamento.
      when 'occurrence.opened' then
        case when new.title = 'Ocorrência aberta' then 'cancelled' end
    end;
    if template_name = 'candidates' then
      -- No máximo um e-mail por hora por oferta; cada candidatura segue visível no app.
      dedupe := 'candidates/' || offer_row.id || '/' || new.recipient_id || '/'
        || floor(extract(epoch from new.created_at) / 3600)::bigint;
    elsif template_name = 'cancelled' then
      dedupe := 'cancelled/' || offer_row.id || '/' || new.recipient_id;
    elsif template_name = 'selected' then
      select s.confirmation_deadline into send_until
      from public.substitutions s
      where s.offer_id = offer_row.id
        and s.substitute_id = new.recipient_id
        and s.status = 'pending_substitute_confirmation';
      if not found then return new; end if;
    end if;
  end if;

  if template_name is null then return new; end if;

  insert into public.notification_email_deliveries (
    notification_id, dedupe_key, template, recipient_id, recipient_email, href, expires_at
  )
  select new.id, dedupe, template_name, u.id, u.email, new.href, send_until
  from auth.users u
  where u.id = new.recipient_id
    and u.email is not null
    and u.email_confirmed_at is not null
    and u.deleted_at is null
  on conflict (dedupe_key) do nothing;
  return new;
end;
$$;

create trigger queue_critical_notification_email
after insert on public.notifications
for each row execute function private.queue_critical_notification_email();
revoke all on function private.queue_critical_notification_email() from public, anon, authenticated;

comment on table public.notification_email_deliveries is
  'Fila de avisos críticos por e-mail (US-1003). Sem dados do plantão: resumo mínimo e link autenticado.';
