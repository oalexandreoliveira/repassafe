import "server-only";
import { redirect } from "next/navigation";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { monthBounds, type AgendaShift } from "@/features/agenda/model";
import {
  entryColumns,
  personalShift,
  type AgendaEntryRow,
} from "@/features/agenda/rows";
import {
  defaultReminder,
  type ReminderSettings,
} from "@/features/agenda/schema";

/** Status que mantêm a agenda: análise pendente, aprovada ou em correção. */
const agendaStatuses = ["pending", "approved", "changes_requested"];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A agenda é pessoal: exige atuação médica e identificação enviada, mas não
 * aprovação cadastral. Não concede habilitação, vínculo nem autorização.
 */
export async function requireAgendaUser() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");
  const { data: profile } = await identity.supabase
    .from("profiles")
    .select("display_name,status,role,verification_valid_until")
    .eq("id", identity.userId)
    .maybeSingle();
  if (!profile) redirect("/cadastro/completar");
  if (profile.role !== "doctor" || !agendaStatuses.includes(profile.status))
    redirect("/painel");
  // Publicar continua exigindo aprovação com verificação vigente.
  const canPublish =
    profile.status === "approved" &&
    !!profile.verification_valid_until &&
    Date.parse(profile.verification_valid_until) > Date.now();
  return { ...identity, profile, canPublish };
}

export type AgendaIdentity = Awaited<ReturnType<typeof requireAgendaUser>>;

/** Hora atual em Fortaleza (UTC−3, sem horário de verão). */
export function fortalezaHour(now = new Date()) {
  return (now.getUTCHours() + 21) % 24;
}

export type AppSource = "mural" | "registered";

/** Tela da agenda para o pagamento de um registro do app. */
export function appPaymentPath(source: AppSource, id: string) {
  return `/agenda/pagamento/${source === "mural" ? "repasse" : "acordo"}/${id}`;
}

export function parseAppSource(segment: string): AppSource | null {
  return segment === "repasse"
    ? "mural"
    : segment === "acordo"
      ? "registered"
      : null;
}

type Named = { name: string } | { name: string }[] | null;
const first = <T>(value: T | T[] | null): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : value;

const muralColumns =
  "id,offer_id,substitution_id,owner_id,substitute_id,snapshot,payment_due_date,groups(name,institutions(name))";
const registeredColumns =
  "id,location,sector,starts_at,ends_at,value_cents,due_date,received_at,owner_id,external_agreement_events(kind)";

type MuralRow = {
  id: string;
  offer_id: string;
  substitution_id: string;
  owner_id: string;
  substitute_id: string;
  snapshot: unknown;
  payment_due_date: string | null;
  groups: unknown;
};
type RegisteredRow = {
  id: string;
  location: string;
  sector: string;
  starts_at: string;
  ends_at: string;
  value_cents: number;
  due_date: string;
  received_at: string | null;
  owner_id: string | null;
  external_agreement_events: { kind: string }[] | null;
};

function snapshotOf(row: MuralRow) {
  const snapshot = row.snapshot as Record<string, unknown>;
  return {
    startsAt: String(snapshot.starts_at),
    endsAt: String(snapshot.ends_at),
    sector: String(snapshot.sector ?? ""),
    valueCents:
      typeof snapshot.value_cents === "number" ? snapshot.value_cents : null,
  };
}

function muralShift(
  row: MuralRow,
  userId: string,
  context: { cancelled: boolean; kinds?: Set<string>; hasDocument: boolean },
): AgendaShift {
  const group = first(row.groups as Named | Named[]) as {
    name: string;
    institutions?: Named;
  } | null;
  const institution = first(group?.institutions ?? null);
  const place = institution?.name ?? group?.name ?? "Oferta livre";
  const snapshot = snapshotOf(row);
  return {
    key: `mural:${row.id}`,
    source: "mural",
    id: row.id,
    href: context.hasDocument
      ? `/acordos/${row.id}`
      : `/plantoes/${row.offer_id}`,
    paymentHref: appPaymentPath("mural", row.id),
    kind: row.owner_id === userId ? "passed" : "took",
    startsAt: snapshot.startsAt,
    endsAt: snapshot.endsAt,
    title: snapshot.sector ? `${snapshot.sector} · ${place}` : place,
    valueCents: snapshot.valueCents,
    dueDate: row.payment_due_date,
    counterparty: "",
    cancelled: context.cancelled,
    settled: context.kinds?.has("receive") ?? false,
    settledCents: null,
    reported: context.kinds?.has("payment") ?? false,
  };
}

function registeredShift(row: RegisteredRow, userId: string): AgendaShift {
  return {
    key: `registered:${row.id}`,
    source: "registered",
    id: row.id,
    href: `/acordos/registrados/${row.id}`,
    paymentHref: appPaymentPath("registered", row.id),
    kind: row.owner_id === userId ? "passed" : "took",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    title: `${row.sector} · ${row.location}`,
    valueCents: row.value_cents,
    dueDate: row.due_date,
    counterparty: "",
    cancelled: false,
    settled: row.received_at !== null,
    settledCents: null,
    reported: (row.external_agreement_events ?? []).some(
      (event) => event.kind === "payment_reported",
    ),
  };
}

/** Situação, eventos de pagamento e documento dos repasses do mural. */
async function muralContext(identity: AgendaIdentity, rows: MuralRow[]) {
  const { supabase } = identity;
  const ids = rows.map((row) => row.id);
  const [substitutions, events, documents] = ids.length
    ? await Promise.all([
        supabase
          .from("substitutions")
          .select("id,status")
          .in(
            "id",
            rows.map((row) => row.substitution_id),
          ),
        supabase
          .from("agreement_payment_events")
          .select("agreement_id,kind")
          .in("agreement_id", ids),
        supabase
          .from("agreement_documents")
          .select("agreement_id")
          .in("agreement_id", ids),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ];
  const cancelled = new Set(
    (substitutions.data ?? [])
      .filter((row) => row.status === "cancelled")
      .map((row) => row.id),
  );
  const eventKinds = new Map<string, Set<string>>();
  for (const event of events.data ?? []) {
    const kinds = eventKinds.get(event.agreement_id) ?? new Set<string>();
    kinds.add(event.kind);
    eventKinds.set(event.agreement_id, kinds);
  }
  const withDocument = new Set(
    (documents.data ?? []).map((row) => row.agreement_id),
  );
  return {
    shiftFor: (row: MuralRow) =>
      muralShift(row, identity.userId, {
        cancelled: cancelled.has(row.substitution_id),
        kinds: eventKinds.get(row.id),
        hasDocument: withDocument.has(row.id),
      }),
    failed: Boolean(substitutions.error || events.error || documents.error),
  };
}

/** Lê o mês: anotações pessoais e registros do app em que o usuário é parte. */
export async function loadAgendaShifts(
  identity: AgendaIdentity,
  month: string,
): Promise<{ shifts: AgendaShift[]; failed: boolean }> {
  const { supabase, userId } = identity;
  const bounds = monthBounds(month);
  // Instantes comparados como datas: o snapshot e as colunas usam formatos ISO diferentes.
  const inMonth = (startsAt: string, dueDate: string | null) =>
    (Date.parse(startsAt) >= Date.parse(bounds.startIso) &&
      Date.parse(startsAt) < Date.parse(bounds.endIso)) ||
    (dueDate !== null &&
      dueDate >= bounds.firstDay &&
      dueDate < bounds.nextFirstDay);
  const party = `owner_id.eq.${userId},substitute_id.eq.${userId}`;

  const [personal, agreements, external] = await Promise.all([
    supabase
      .from("agenda_entries")
      .select(entryColumns)
      .or(
        `and(starts_at.gte."${bounds.startIso}",starts_at.lt."${bounds.endIso}"),and(due_date.gte.${bounds.firstDay},due_date.lt.${bounds.nextFirstDay})`,
      )
      .order("starts_at")
      .limit(1000),
    supabase.from("shift_agreements").select(muralColumns).or(party).limit(500),
    supabase
      .from("external_agreements")
      .select(registeredColumns)
      .eq("status", "confirmed")
      .or(party)
      .limit(500),
  ]);

  const muralRows = ((agreements.data ?? []) as MuralRow[]).filter((row) =>
    inMonth(snapshotOf(row).startsAt, row.payment_due_date),
  );
  const mural = await muralContext(identity, muralRows);

  const shifts: AgendaShift[] = [
    ...((personal.data ?? []) as AgendaEntryRow[]).map(personalShift),
    ...muralRows.map(mural.shiftFor),
    ...((external.data ?? []) as RegisteredRow[])
      .filter((row) => inMonth(row.starts_at, row.due_date))
      .map((row) => registeredShift(row, userId)),
  ];

  return {
    shifts,
    failed: Boolean(
      personal.error || agreements.error || external.error || mural.failed,
    ),
  };
}

export async function loadAgendaEntry(identity: AgendaIdentity, id: string) {
  if (!uuidPattern.test(id)) return null;
  const { data, error } = await identity.supabase
    .from("agenda_entries")
    .select(entryColumns)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o plantão.");
  return data as AgendaEntryRow | null;
}

export type AppPayment = {
  shift: AgendaShift;
  /** Acompanhamento do pagamento nas telas do acordo. */
  trackingHref: string;
  reminder: ReminderSettings;
};

/**
 * Um repasse do mural ou acordo registrado confirmado em que o usuário é
 * parte, com a preferência pessoal de lembrete (padrão quando não há).
 */
export async function loadAppPayment(
  identity: AgendaIdentity,
  source: AppSource,
  id: string,
): Promise<AppPayment | null> {
  if (!uuidPattern.test(id)) return null;
  const { supabase, userId } = identity;
  const party = `owner_id.eq.${userId},substitute_id.eq.${userId}`;
  const [record, preference] = await Promise.all([
    source === "mural"
      ? supabase
          .from("shift_agreements")
          .select(muralColumns)
          .eq("id", id)
          .or(party)
          .maybeSingle()
      : supabase
          .from("external_agreements")
          .select(registeredColumns)
          .eq("id", id)
          .eq("status", "confirmed")
          .or(party)
          .maybeSingle(),
    supabase
      .from("agenda_record_reminders")
      .select("enabled,lead_days,repeat_days")
      .eq("source", source)
      .eq("record_id", id)
      .maybeSingle(),
  ]);
  if (record.error || preference.error)
    throw new Error("Não foi possível carregar o pagamento.");
  if (!record.data) return null;
  const reminder: ReminderSettings = preference.data
    ? {
        enabled: preference.data.enabled,
        leadDays: preference.data.lead_days,
        repeatDays: preference.data.repeat_days,
      }
    : defaultReminder;
  if (source === "mural") {
    const row = record.data as MuralRow;
    const context = await muralContext(identity, [row]);
    if (context.failed)
      throw new Error("Não foi possível carregar o pagamento.");
    return {
      shift: context.shiftFor(row),
      trackingHref: `/acordos/${row.id}/pagamento`,
      reminder,
    };
  }
  const row = record.data as RegisteredRow;
  return {
    shift: registeredShift(row, userId),
    trackingHref: `/acordos/registrados/${row.id}`,
    reminder,
  };
}
