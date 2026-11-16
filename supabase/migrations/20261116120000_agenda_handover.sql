-- Agenda pessoal, etapa 3 (docs/product/personal-agenda.md): "Repassar este
-- plantão". A anotação "Meu plantão" guarda a oferta publicada ou o acordo
-- registrado criado a partir dela. Quando o repasse é confirmado, a agenda
-- mostra um único plantão, repassado, com os dois pagamentos: receber da
-- instituição (a anotação) e pagar ao colega (o registro do app).
--
-- O vínculo é só do autor: a anotação continua invisível ao colega, aos
-- aprovadores e à administração, e o registro do app não muda.
alter table public.agenda_entries
  add column handover_offer_id uuid references public.shift_offers(id) on delete set null,
  add column handover_agreement_id uuid references public.external_agreements(id) on delete set null,
  add constraint agenda_entries_single_handover
    check (handover_offer_id is null or handover_agreement_id is null);
create index agenda_entries_handover_offer_idx on public.agenda_entries (handover_offer_id)
  where handover_offer_id is not null;
create index agenda_entries_handover_agreement_idx on public.agenda_entries (handover_agreement_id)
  where handover_agreement_id is not null;

-- Liga a anotação ao repasse que o próprio autor criou: oferta em que ele é o
-- dono ou acordo registrado em que ele repassa. Um novo repasse substitui o
-- vínculo anterior (oferta cancelada ou acordo recusado, por exemplo).
create function private.agenda_link_handover(entry_ref uuid, offer_ref uuid, agreement_ref uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  entry public.agenda_entries%rowtype;
begin
  if actor is null then raise exception 'Sessão inválida'; end if;
  if not private.agenda_eligible(actor) then raise exception 'Agenda indisponível para esta conta'; end if;
  if (offer_ref is null) = (agreement_ref is null) then raise exception 'Ação inválida'; end if;
  select * into entry from public.agenda_entries where id = entry_ref and owner_id = actor for update;
  if not found then raise exception 'Plantão indisponível'; end if;
  if entry.kind <> 'own' then raise exception 'Só um plantão próprio pode ser repassado'; end if;
  if offer_ref is not null and not exists (
    select 1 from public.shift_offers o where o.id = offer_ref and o.owner_id = actor
  ) then
    raise exception 'Repasse indisponível';
  end if;
  if agreement_ref is not null and not exists (
    select 1 from public.external_agreements a
    where a.id = agreement_ref and a.creator_id = actor and a.owner_id = actor
  ) then
    raise exception 'Repasse indisponível';
  end if;
  update public.agenda_entries
    set handover_offer_id = offer_ref, handover_agreement_id = agreement_ref, updated_at = now()
    where id = entry.id;
  return jsonb_build_object('id', entry.id);
end;
$$;

create function public.agenda_link_handover(entry_ref uuid, offer_ref uuid default null, agreement_ref uuid default null)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.agenda_link_handover(entry_ref, offer_ref, agreement_ref);
$$;

revoke all on function private.agenda_link_handover(uuid,uuid,uuid), public.agenda_link_handover(uuid,uuid,uuid)
  from public, anon, authenticated;
grant execute on function private.agenda_link_handover(uuid,uuid,uuid), public.agenda_link_handover(uuid,uuid,uuid)
  to authenticated;
