-- Revisão independente de 10/11/2026, item 16.
-- A seleção exigia que a confirmação das condições pelo titular não fosse anterior a
-- shift_offers.updated_at. Recusa, expiração do aceite e rejeição institucional também
-- gravam updated_at, então a oferta voltava ao mural sem que o titular pudesse
-- escolher outra candidatura. A comparação passa a usar um carimbo próprio, alterado
-- apenas quando as condições mudam.
alter table public.shift_offers add column terms_changed_at timestamptz;

-- Ofertas existentes: a última confirmação do titular vale para as condições atuais,
-- porque a edição só é permitida antes da primeira candidatura e sempre reconfirma.
update public.shift_offers o
set terms_changed_at = coalesce((
  select max(ae.occurred_at) from public.audit_events ae
  where ae.entity_type = 'shift_offer' and ae.entity_id = o.id
    and ae.event_type = 'shift_offer.terms_acknowledged' and ae.actor_id = o.owner_id
), o.published_at);

alter table public.shift_offers
  alter column terms_changed_at set default now(),
  alter column terms_changed_at set not null;

comment on column public.shift_offers.terms_changed_at is
  'Última alteração das condições da oferta. Mudanças de estado não alteram este carimbo.';

create function private.touch_offer_terms()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.group_id, new.starts_at, new.ends_at, new.sector, new.value_cents,
      new.payment_terms, new.payment_due_date, new.notes)
     is distinct from
     (old.group_id, old.starts_at, old.ends_at, old.sector, old.value_cents,
      old.payment_terms, old.payment_due_date, old.notes) then
    new.terms_changed_at := now();
  else
    new.terms_changed_at := old.terms_changed_at;
  end if;
  return new;
end;
$$;
revoke all on function private.touch_offer_terms() from public, anon, authenticated;

create trigger shift_offers_terms_changed_at
before update on public.shift_offers
for each row execute function private.touch_offer_terms();

create or replace function private.require_offer_terms_acknowledgment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_offer public.shift_offers%rowtype;
  latest_owner_ack timestamptz;
begin
  if (select auth.uid()) is null or new.actor_id is distinct from (select auth.uid()) then
    raise exception 'Comando requer usuário autenticado';
  end if;
  if new.command in ('publish_offer', 'update_offer')
     and coalesce((new.payload->>'owner_terms_acknowledged')::boolean, false) = false then
    raise exception 'A oferta exige confirmação das condições informadas';
  end if;
  if new.command = 'select_candidate' then
    select o.* into selected_offer
    from public.shift_applications sa
    join public.shift_offers o on o.id = sa.offer_id
    where sa.id = new.target_id;
    if not found then raise exception 'Candidatura não encontrada'; end if;
    select max(ae.occurred_at) into latest_owner_ack
    from public.audit_events ae
    where ae.entity_type = 'shift_offer'
      and ae.entity_id = selected_offer.id
      and ae.event_type = 'shift_offer.terms_acknowledged'
      and ae.actor_id = selected_offer.owner_id;
    if latest_owner_ack is null or latest_owner_ack < selected_offer.terms_changed_at then
      raise exception 'Titular precisa revisar as condições antes da seleção';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function private.require_offer_terms_acknowledgment()
  from public, anon, authenticated;
