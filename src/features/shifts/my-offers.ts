/** Abas de S07 a partir do estado da oferta (canceladas e expiradas ficam no histórico). */
export type OwnOfferTab = "abertos" | "andamento" | "registrados";

export const ownOfferTabs: { id: OwnOfferTab; label: string }[] = [
  { id: "abertos", label: "Abertos" },
  { id: "andamento", label: "Andamento" },
  { id: "registrados", label: "Registrados" },
];

export function ownOfferTab(status: string): OwnOfferTab | null {
  if (status === "open_normal" || status === "open_emergency") return "abertos";
  if (status === "selection_in_progress") return "andamento";
  if (status === "closed_confirmed") return "registrados";
  return null;
}

export function parseOwnOfferTab(value: string | undefined): OwnOfferTab {
  return ownOfferTabs.some((tab) => tab.id === value)
    ? (value as OwnOfferTab)
    : "abertos";
}
