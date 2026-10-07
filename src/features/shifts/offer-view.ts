/**
 * Normalizes shift offer rows (with optional embedded group and institution)
 * into the shape the screens render. Pure presentation: no business rules.
 */
type Embedded<T> = T | T[] | null | undefined;

const one = <T>(value: Embedded<T>): T | undefined =>
  Array.isArray(value) ? value[0] : (value ?? undefined);

export type OfferRow = {
  id: string;
  owner_id: string;
  starts_at: string;
  ends_at: string;
  sector: string;
  status: string;
  value_cents?: number;
  payment_terms?: string;
  notes?: string | null;
  published_at?: string;
  group_id?: string | null;
  groups?: Embedded<{
    name: string;
    requires_approval?: boolean;
    institutions?: Embedded<{ name: string }>;
  }>;
};

export type OfferSummary = {
  id: string;
  ownerId: string;
  status: string;
  sector: string;
  startsAt: string;
  endsAt: string;
  valueCents?: number;
  paymentTerms?: string;
  notes?: string;
  publishedAt?: string;
  groupId?: string;
  /** Undefined for free offers ("Oferta livre"). */
  groupName?: string;
  institutionName?: string;
  requiresApproval: boolean;
};

export function toOfferSummary(row: OfferRow): OfferSummary {
  const group = one(row.groups);
  return {
    id: row.id,
    ownerId: row.owner_id,
    status: row.status,
    sector: row.sector,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    valueCents: row.value_cents,
    paymentTerms: row.payment_terms,
    notes: row.notes ?? undefined,
    publishedAt: row.published_at,
    groupId: row.group_id ?? undefined,
    groupName: group?.name,
    institutionName: one(group?.institutions)?.name,
    requiresApproval: Boolean(group?.requires_approval),
  };
}

/** "Setor · Hospital" (design/SCREENS.md); only the sector when the institution is unknown. */
export function offerTitle(
  offer: Pick<OfferSummary, "sector" | "institutionName">,
) {
  return offer.institutionName
    ? `${offer.sector} · ${offer.institutionName}`
    : offer.sector;
}

export function offerGroupLabel(offer: Pick<OfferSummary, "groupName">) {
  return offer.groupName ?? "Oferta livre";
}
