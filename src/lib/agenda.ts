import "server-only";
import { redirect } from "next/navigation";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { monthBounds, type AgendaShift } from "@/features/agenda/model";
import {
  entryColumns,
  personalShift,
  type AgendaEntryRow,
} from "@/features/agenda/rows";
import type { AgendaKind } from "@/features/agenda/schema";

/** Status que mantêm a agenda: análise pendente, aprovada ou em correção. */
const agendaStatuses = ["pending", "approved", "changes_requested"];

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

type Named = { name: string } | { name: string }[] | null;
const first = <T>(value: T | T[] | null): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : value;

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
    supabase
      .from("shift_agreements")
      .select(
        "id,offer_id,substitution_id,owner_id,substitute_id,snapshot,payment_due_date,groups(name,institutions(name))",
      )
      .or(party)
      .limit(500),
    supabase
      .from("external_agreements")
      .select(
        "id,location,sector,starts_at,ends_at,value_cents,due_date,received_at,owner_id,external_agreement_events(kind)",
      )
      .eq("status", "confirmed")
      .or(party)
      .limit(500),
  ]);

  const shiftAgreements = (agreements.data ?? [])
    .map((agreement) => {
      const snapshot = agreement.snapshot as Record<string, unknown>;
      return {
        ...agreement,
        startsAt: String(snapshot.starts_at),
        endsAt: String(snapshot.ends_at),
        sector: String(snapshot.sector ?? ""),
        valueCents:
          typeof snapshot.value_cents === "number"
            ? snapshot.value_cents
            : null,
      };
    })
    .filter((agreement) =>
      inMonth(agreement.startsAt, agreement.payment_due_date),
    );
  const ids = shiftAgreements.map((agreement) => agreement.id);
  const substitutionIds = shiftAgreements.map(
    (agreement) => agreement.substitution_id,
  );
  const [substitutions, events, documents] = ids.length
    ? await Promise.all([
        supabase
          .from("substitutions")
          .select("id,status")
          .in("id", substitutionIds),
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

  const shifts: AgendaShift[] = [
    ...((personal.data ?? []) as AgendaEntryRow[]).map(personalShift),
    ...shiftAgreements.map((agreement): AgendaShift => {
      const group = first(agreement.groups as Named | Named[]) as {
        name: string;
        institutions?: Named;
      } | null;
      const institution = first(group?.institutions ?? null);
      const place = institution?.name ?? group?.name ?? "Oferta livre";
      const kinds = eventKinds.get(agreement.id);
      return {
        key: `mural:${agreement.id}`,
        source: "mural",
        id: agreement.id,
        href: withDocument.has(agreement.id)
          ? `/acordos/${agreement.id}`
          : `/plantoes/${agreement.offer_id}`,
        paymentHref: `/acordos/${agreement.id}/pagamento`,
        kind: (agreement.owner_id === userId
          ? "passed"
          : "took") satisfies AgendaKind,
        startsAt: agreement.startsAt,
        endsAt: agreement.endsAt,
        title: agreement.sector ? `${agreement.sector} · ${place}` : place,
        valueCents: agreement.valueCents,
        dueDate: agreement.payment_due_date,
        counterparty: "",
        cancelled: cancelled.has(agreement.substitution_id),
        settled: kinds?.has("receive") ?? false,
        settledCents: null,
        reported: kinds?.has("payment") ?? false,
      };
    }),
    ...(external.data ?? [])
      .filter((agreement) => inMonth(agreement.starts_at, agreement.due_date))
      .map((agreement): AgendaShift => ({
        key: `registered:${agreement.id}`,
        source: "registered",
        id: agreement.id,
        href: `/acordos/registrados/${agreement.id}`,
        paymentHref: `/acordos/registrados/${agreement.id}`,
        kind: agreement.owner_id === userId ? "passed" : "took",
        startsAt: agreement.starts_at,
        endsAt: agreement.ends_at,
        title: `${agreement.sector} · ${agreement.location}`,
        valueCents: agreement.value_cents,
        dueDate: agreement.due_date,
        counterparty: "",
        cancelled: false,
        settled: agreement.received_at !== null,
        settledCents: null,
        reported: (agreement.external_agreement_events ?? []).some(
          (event) => event.kind === "payment_reported",
        ),
      })),
  ];

  return {
    shifts,
    failed: Boolean(
      personal.error ||
      agreements.error ||
      external.error ||
      substitutions.error ||
      events.error ||
      documents.error,
    ),
  };
}

export async function loadAgendaEntry(identity: AgendaIdentity, id: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    return null;
  const { data, error } = await identity.supabase
    .from("agenda_entries")
    .select(entryColumns)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o plantão.");
  return data as AgendaEntryRow | null;
}
