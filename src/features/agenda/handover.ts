import type { Handover } from "./model";
import type { AgendaEntryRow } from "./rows";

/**
 * "Repassar este plantão" (etapa 3): leva data, horário, local e setor de
 * "Meu plantão" para "Publicar plantão" ou "Registrar acordo". Valor e
 * condições do repasse são definidos no próprio fluxo, que mantém a sua
 * validação.
 */

/** "2026-10-12T19:00" no fuso de Fortaleza (UTC−3, sem horário de verão). */
export function fortalezaLocal(iso: string) {
  return new Date(Date.parse(iso) - 3 * 3_600_000).toISOString().slice(0, 16);
}

export function handoverPrefill(
  entry: Pick<AgendaEntryRow, "starts_at" | "ends_at" | "location" | "sector">,
) {
  const startsAt = fortalezaLocal(entry.starts_at);
  const endsAt = fortalezaLocal(entry.ends_at);
  return {
    startsAt,
    endsAt,
    date: startsAt.slice(0, 10),
    start: startsAt.slice(11),
    end: endsAt.slice(11),
    location: entry.location,
    sector: entry.sector,
  };
}

/** Só "Meu plantão" futuro e sem repasse em andamento ou confirmado. */
export function canHandOver(
  entry: Pick<AgendaEntryRow, "kind" | "starts_at">,
  handover: Handover | undefined,
  now: number,
) {
  return entry.kind === "own" && Date.parse(entry.starts_at) > now && !handover;
}

const normalized = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** Grupo cuja instituição (ou o próprio nome) coincide com o local anotado. */
export function matchGroup(
  groups: { id: string; name: string; institutionName?: string }[],
  location: string,
) {
  const target = normalized(location);
  return groups.find((group) =>
    [group.institutionName, group.name].some(
      (name) => name && normalized(name) === target,
    ),
  )?.id;
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Campo oculto dos fluxos de repasse; qualquer outro valor é ignorado. */
export function handoverEntryId(value: FormDataEntryValue | null) {
  return typeof value === "string" && uuidPattern.test(value) ? value : null;
}
