import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  applyToOfferAction,
  cancelOfferAction,
  confirmSubstitutionAction,
  decideSubstitutionAction,
  selectCandidateAction,
  withdrawApplicationAction,
} from "@/app/plantoes/actions";
import {
  applicationStatusLabels,
  formatCurrency,
  formatDateTime,
  offerStatusLabels,
  substitutionStatusLabels,
} from "@/features/shifts/schemas";
import { getShiftDetails } from "@/lib/shifts/data";

export default async function ShiftDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getShiftDetails(id);
  if (!workspace) notFound();

  const {
    identity,
    offer,
    applications,
    substitutions,
    agreement,
    isApprover,
  } = workspace;
  const group = Array.isArray(offer.groups) ? offer.groups[0] : offer.groups;
  const isOwner = offer.owner_id === identity.userId;
  const ownApplication = applications.find(
    (application) => application.candidate_id === identity.userId,
  );
  const substitution = substitutions[0];
  const isOpen = ["open_normal", "open_emergency"].includes(offer.status);

  return (
    <main className="shell dashboard">
      <header className="dashboard-header">
        <Link href="/plantoes" className="brand">
          <span aria-hidden="true">R</span> Repassafe
        </Link>
        <span className={`status status-${offer.status}`}>
          {offerStatusLabels[offer.status] ?? offer.status}
        </span>
      </header>
      <section className="dashboard-title">
        <div>
          <p className="eyebrow">{group?.name ?? "Grupo"}</p>
          <h1>{offer.sector}</h1>
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="card">
          <h2>Dados do plantão</h2>
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
            <div>
              <dt>Pagamento</dt>
              <dd>{offer.payment_terms}</dd>
            </div>
          </dl>
          {offer.notes ? <p>{offer.notes}</p> : null}
          {isOwner && isOpen ? (
            <div className="actions">
              {applications.length === 0 ? (
                <Link
                  className="button button-secondary"
                  href={`/plantoes/${offer.id}/editar`}
                >
                  Editar
                </Link>
              ) : null}
              <form action={cancelOfferAction}>
                <input type="hidden" name="commandId" value={randomUUID()} />
                <input type="hidden" name="targetId" value={offer.id} />
                <button className="button button-secondary" type="submit">
                  Cancelar oferta
                </button>
              </form>
            </div>
          ) : null}
          {!isOwner && isOpen && !ownApplication ? (
            <form action={applyToOfferAction} className="compact-form">
              <input type="hidden" name="commandId" value={randomUUID()} />
              <input type="hidden" name="targetId" value={offer.id} />
              <button className="button button-primary" type="submit">
                Quero assumir este plantão
              </button>
            </form>
          ) : null}
          {ownApplication?.status === "active" ? (
            <form action={withdrawApplicationAction} className="compact-form">
              <p className="status">
                {applicationStatusLabels[ownApplication.status]}
              </p>
              <input type="hidden" name="commandId" value={randomUUID()} />
              <input type="hidden" name="targetId" value={ownApplication.id} />
              <button className="button button-secondary" type="submit">
                Retirar candidatura
              </button>
            </form>
          ) : null}
        </section>

        {isOwner ? (
          <section className="card">
            <h2>Candidaturas</h2>
            {applications.length ? (
              <ul className="candidate-list">
                {applications.map((application) => (
                  <li key={application.id}>
                    <div>
                      <strong>{application.candidate_display_name}</strong>
                      <span>{applicationStatusLabels[application.status]}</span>
                    </div>
                    {isOpen && application.status === "active" ? (
                      <form action={selectCandidateAction}>
                        <input
                          type="hidden"
                          name="commandId"
                          value={randomUUID()}
                        />
                        <input
                          type="hidden"
                          name="targetId"
                          value={application.id}
                        />
                        <input
                          type="hidden"
                          name="confirmationMinutes"
                          value="30"
                        />
                        <button className="button button-primary" type="submit">
                          Selecionar
                        </button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma candidatura recebida.</p>
            )}
          </section>
        ) : null}

        {substitution ? (
          <section className="card">
            <h2>Substituição</h2>
            <p className="status">
              {substitutionStatusLabels[substitution.status]}
            </p>
            {substitution.status === "pending_substitute_confirmation" ? (
              <p>Prazo: {formatDateTime(substitution.confirmation_deadline)}</p>
            ) : null}
            {substitution.substitute_id === identity.userId &&
            substitution.status === "pending_substitute_confirmation" ? (
              <div className="actions">
                {[
                  { label: "Confirmar", value: "true", primary: true },
                  { label: "Recusar", value: "false", primary: false },
                ].map((choice) => (
                  <form action={confirmSubstitutionAction} key={choice.value}>
                    <input
                      type="hidden"
                      name="commandId"
                      value={randomUUID()}
                    />
                    <input
                      type="hidden"
                      name="targetId"
                      value={substitution.id}
                    />
                    <input type="hidden" name="accepted" value={choice.value} />
                    <button
                      className={`button ${choice.primary ? "button-primary" : "button-secondary"}`}
                      type="submit"
                    >
                      {choice.label}
                    </button>
                  </form>
                ))}
              </div>
            ) : null}
            {isApprover &&
            substitution.status === "pending_institutional_approval" ? (
              <div className="actions">
                {[
                  { label: "Aprovar", value: "true", primary: true },
                  { label: "Rejeitar", value: "false", primary: false },
                ].map((choice) => (
                  <form action={decideSubstitutionAction} key={choice.value}>
                    <input
                      type="hidden"
                      name="commandId"
                      value={randomUUID()}
                    />
                    <input
                      type="hidden"
                      name="targetId"
                      value={substitution.id}
                    />
                    <input type="hidden" name="approved" value={choice.value} />
                    <button
                      className={`button ${choice.primary ? "button-primary" : "button-secondary"}`}
                      type="submit"
                    >
                      {choice.label}
                    </button>
                  </form>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {agreement ? (
          <section className="card agreement-card">
            <p className="eyebrow">Acordo confirmado</p>
            <h2>Registro imutável do repasse</h2>
            <p>Confirmado em {formatDateTime(agreement.confirmed_at)}.</p>
            <dl className="facts">
              <div>
                <dt>Setor</dt>
                <dd>
                  {String(
                    (agreement.snapshot as Record<string, unknown>).sector,
                  )}
                </dd>
              </div>
              <div>
                <dt>Valor</dt>
                <dd>
                  {formatCurrency(
                    Number(
                      (agreement.snapshot as Record<string, unknown>)
                        .value_cents,
                    ),
                  )}
                </dd>
              </div>
            </dl>
          </section>
        ) : null}
      </div>
    </main>
  );
}
