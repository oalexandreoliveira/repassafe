import Link from "next/link";
import { listShiftWorkspace } from "@/lib/shifts/data";
import {
  applicationStatusLabels,
  formatCurrency,
  formatDateTime,
  offerStatusLabels,
  substitutionStatusLabels,
} from "@/features/shifts/schemas";

export default async function ShiftsPage() {
  const { identity, offers, applications, substitutions } =
    await listShiftWorkspace();
  const applicationByOffer = new Map(
    applications.map((application) => [application.offer_id, application]),
  );
  const substitutionByOffer = new Map(
    substitutions.map((substitution) => [substitution.offer_id, substitution]),
  );

  return (
    <main className="shell dashboard">
      <header className="dashboard-header">
        <Link href="/painel" className="brand">
          <span aria-hidden="true">R</span> Repassafe
        </Link>
        <Link className="button button-primary" href="/plantoes/novo">
          Publicar plantão
        </Link>
      </header>
      <section className="dashboard-title">
        <div>
          <p className="eyebrow">Central de repasses</p>
          <h1>Plantões disponíveis</h1>
          <p className="form-help">Horários exibidos no fuso de Fortaleza.</p>
        </div>
      </section>
      <div className="shift-list">
        {offers.length ? (
          offers.map((offer) => {
            const group = Array.isArray(offer.groups)
              ? offer.groups[0]
              : offer.groups;
            const application = applicationByOffer.get(offer.id);
            const substitution = substitutionByOffer.get(offer.id);
            return (
              <article className="card shift-card" key={offer.id}>
                <div className="shift-card-heading">
                  <div>
                    <p className="eyebrow">{group?.name ?? "Grupo"}</p>
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
                {application ? (
                  <p className="status">
                    {applicationStatusLabels[application.status]}
                  </p>
                ) : null}
                {substitution ? (
                  <p className="status">
                    {substitutionStatusLabels[substitution.status]}
                  </p>
                ) : null}
                <Link
                  className="button button-secondary"
                  href={`/plantoes/${offer.id}`}
                >
                  {offer.owner_id === identity.userId
                    ? "Gerenciar"
                    : "Ver detalhes"}
                </Link>
              </article>
            );
          })
        ) : (
          <section className="card empty-state">
            <h2>Nenhum plantão disponível agora</h2>
            <p>
              Publique uma necessidade ou volte quando houver novas ofertas.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
