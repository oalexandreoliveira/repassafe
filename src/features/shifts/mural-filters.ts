import { dayKey } from "@/features/shifts/format";
import type { OfferSummary } from "@/features/shifts/offer-view";

/** Filtros opcionais do mural. Sem escolha explícita, mostra todos os períodos. */
export const muralFilters = [
  { id: "todos", label: "Todos os períodos" },
  { id: "semana", label: "Esta semana" },
  { id: "noturno", label: "Noturno" },
  { id: "uti", label: "UTI" },
  { id: "fim-de-semana", label: "Fim de semana" },
] as const;

export type MuralFilter = (typeof muralFilters)[number]["id"] | "todos";

export const defaultMuralFilter: MuralFilter = "todos";

export type MuralGroup = { id: string; name: string };
/** "todos", "livres", "grupos", or an active membership's group id. */
export function parseMuralGroup(
  value: string | undefined,
  groups: MuralGroup[],
) {
  return value === "livres" ||
    value === "grupos" ||
    groups.some((group) => group.id === value)
    ? value!
    : "todos";
}

export function muralHref(
  filter: MuralFilter,
  query?: string,
  group = "todos",
) {
  const params = new URLSearchParams();
  if (filter !== defaultMuralFilter) params.set("filtro", filter);
  if (query) params.set("q", query);
  if (group !== "todos") params.set("grupo", group);
  const search = params.toString();
  return search ? `/plantoes?${search}` : "/plantoes";
}

export function parseMuralFilter(value: string | undefined): MuralFilter {
  if (value === "todos") return "todos";
  return muralFilters.some((filter) => filter.id === value)
    ? (value as MuralFilter)
    : defaultMuralFilter;
}

const timeZone = "America/Fortaleza";
const hourFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone,
  hour: "numeric",
  hourCycle: "h23",
});
const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone,
  weekday: "short",
});

/** Comparação sem acento e sem caixa ("uti" encontra "UTI Adulto"). */
export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

const weekMs = 7 * 24 * 60 * 60 * 1000;

function matchesFilter(offer: OfferSummary, filter: MuralFilter, now: Date) {
  const start = new Date(offer.startsAt);
  switch (filter) {
    case "todos":
      return true;
    case "semana":
      return start.getTime() - now.getTime() < weekMs;
    case "noturno": {
      const hour = Number(hourFormatter.format(start));
      return hour >= 18 || hour < 6;
    }
    case "uti":
      return /\buti\b/.test(normalizeText(offer.sector));
    case "fim-de-semana":
      return ["Sat", "Sun"].includes(weekdayFormatter.format(start));
  }
}

export function filterMuralOffers(
  offers: OfferSummary[],
  {
    filter,
    query,
    group = "todos",
    now,
  }: { filter: MuralFilter; query?: string; group?: string; now: Date },
) {
  const needle = query ? normalizeText(query) : "";
  return offers.filter(
    (offer) =>
      ["open_normal", "open_emergency"].includes(offer.status) &&
      new Date(offer.startsAt) > now &&
      (group === "todos" ||
        (group === "livres"
          ? !offer.groupId
          : group === "grupos"
            ? !!offer.groupId
            : offer.groupId === group)) &&
      matchesFilter(offer, filter, now) &&
      (!needle ||
        [offer.sector, offer.groupName, offer.institutionName].some(
          (field) => field && normalizeText(field).includes(needle),
        )),
  );
}

/** Agrupa por dia (no fuso do produto), preservando a ordem de entrada. */
export function groupByDay<T>(items: T[], startOf: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = dayKey(startOf(item));
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.values()];
}
