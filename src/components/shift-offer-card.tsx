import Link from "next/link";
import type { ReactNode } from "react";
import {
  formatCurrency,
  formatDateTime,
  offerStatusLabels,
} from "@/features/shifts/schemas";

export function ShiftOfferCard({
  offer,
  groupName,
  isOwner,
  children,
}: {
  offer: {
    id: string;
    sector: string;
    status: string;
    starts_at: string;
    ends_at: string;
    value_cents: number;
  };
  groupName?: string;
  isOwner: boolean;
  children?: ReactNode;
}) {
  return (
    <article className="card shift-card">
      <div className="shift-card-heading">
        <div>
          <p className="eyebrow">{groupName ?? "Oferta livre"}</p>
          <h2>{offer.sector}</h2>
        </div>
        <span className={`status status-${offer.status}`}>
          {offerStatusLabels[offer.status] ?? offer.status}
        </span>
      </div>
      <dl className="facts">
        <div>
          <dt>Início</dt>
          <dd>{formatDateTime(offer.starts_at)}</dd>
        </div>
        <div>
          <dt>Término</dt>
          <dd>{formatDateTime(offer.ends_at)}</dd>
        </div>
        <div>
          <dt>Valor</dt>
          <dd>{formatCurrency(offer.value_cents)}</dd>
        </div>
      </dl>
      {children}
      <Link className="button button-secondary" href={`/plantoes/${offer.id}`}>
        {isOwner ? "Gerenciar" : "Ver detalhes"}
      </Link>
    </article>
  );
}
