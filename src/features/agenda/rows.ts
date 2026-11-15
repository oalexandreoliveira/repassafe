import type { AgendaShift } from "./model";
import type { AgendaKind } from "./schema";

/** Colunas lidas de public.agenda_entries (RLS: somente o autor). */
export const entryColumns =
  "id,kind,starts_at,ends_at,location,sector,value_cents,due_date,payment_method,counterparty,notes,settled_on,settled_cents,created_at,updated_at";

export type AgendaEntryRow = {
  id: string;
  kind: AgendaKind;
  starts_at: string;
  ends_at: string;
  location: string;
  sector: string;
  value_cents: number | null;
  due_date: string | null;
  payment_method: string;
  counterparty: string;
  notes: string;
  settled_on: string | null;
  settled_cents: number | null;
  created_at: string;
  updated_at: string;
};

/** "UTI · Hospital X" ou só o local, quando não há setor. */
export function entryTitle(entry: { sector: string; location: string }) {
  return entry.sector ? `${entry.sector} · ${entry.location}` : entry.location;
}

export function personalShift(entry: AgendaEntryRow): AgendaShift {
  return {
    key: `personal:${entry.id}`,
    source: "personal",
    id: entry.id,
    href: `/agenda/${entry.id}`,
    paymentHref: `/agenda/${entry.id}`,
    kind: entry.kind,
    startsAt: entry.starts_at,
    endsAt: entry.ends_at,
    title: entryTitle(entry),
    valueCents: entry.value_cents,
    dueDate: entry.due_date,
    counterparty: entry.counterparty,
    cancelled: false,
    settled: entry.settled_on !== null,
    settledCents: entry.settled_cents,
    reported: false,
  };
}
