import Link from "next/link";
import { redirect } from "next/navigation";
import {
  applicationStatusLabels,
  formatCurrency,
  formatDateTime,
  offerStatusLabels,
  substitutionStatusLabels,
} from "@/features/shifts/schemas";
import { getVerifiedIdentity } from "@/lib/auth/session";

export default async function PersonalHistoryPage() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");
  const [
    { data: myOffers },
    { data: myApplications },
    { data: substitutions },
  ] = await Promise.all([
    identity.supabase
      .from("shift_offers")
      .select(
        "id,owner_id,starts_at,ends_at,sector,value_cents,status,groups(name)",
      )
      .eq("owner_id", identity.userId)
      .order("starts_at", { ascending: false }),
    identity.supabase
      .from("shift_applications")
      .select("id,offer_id,status,created_at")
      .eq("candidate_id", identity.userId)
      .order("created_at", { ascending: false }),
    identity.supabase
      .from("substitutions")
      .select(
        "id,offer_id,status,owner_id,substitute_id,created_at,cancellation_reason",
      )
      .or(`owner_id.eq.${identity.userId},substitute_id.eq.${identity.userId}`)
      .order("created_at", { ascending: false }),
  ]);
  const offerIds = [
    ...new Set([
      ...(myOffers ?? []).map((offer) => offer.id),
      ...(myApplications ?? []).map((application) => application.offer_id),
    ]),
  ];
  const { data: relatedOffers } = offerIds.length
    ? await identity.supabase
        .from("shift_offers")
        .select(
          "id,owner_id,starts_at,ends_at,sector,value_cents,status,groups(name)",
        )
        .in("id", offerIds)
    : { data: [] };
  const offerById = new Map(
    (relatedOffers ?? []).map((offer) => [offer.id, offer]),
  );
  const substitutionIds = (substitutions ?? []).map(
    (substitution) => substitution.id,
  );
  const [{ data: completions }, { data: occurrences }] = substitutionIds.length
    ? await Promise.all([
        identity.supabase
          .from("shift_completions")
          .select("substitution_id,status")
          .in("substitution_id", substitutionIds),
        identity.supabase
          .from("shift_occurrences")
          .select("substitution_id,status,decision")
          .in("substitution_id", substitutionIds),
      ])
    : [{ data: [] }, { data: [] }];
  const completionBySubstitution = new Map(
    (completions ?? []).map((completion) => [
      completion.substitution_id,
      completion,
    ]),
  );
  const occurrencesBySubstitution = new Map<
    string,
    Array<{ status: string; decision: string | null }>
  >();
  for (const occurrence of occurrences ?? []) {
    const current =
      occurrencesBySubstitution.get(occurrence.substitution_id) ?? [];
    current.push(occurrence);
    occurrencesBySubstitution.set(occurrence.substitution_id, current);
  }

  return (
    <main className="shell dashboard">
      <header className="dashboard-header">
        <Link href="/painel" className="brand">
          <span aria-hidden="true">R</span> Repassafe
        </Link>
        <Link href="/notificacoes" className="button button-secondary">
          Notificações
        </Link>
      </header>
      <section className="dashboard-title">
        <div>
          <p className="eyebrow">Área do profissional</p>
          <h1>Meu histórico</h1>
          <p className="form-help">
            Ofertas, candidaturas e substituições ligadas à sua conta.
          </p>
        </div>
      </section>
      <section className="card admin-section">
        <h2>Ofertas publicadas</h2>
        {myOffers?.length ? (
          <ul className="clean-list">
            {myOffers.map((offer) => (
              <li key={offer.id}>
                <Link href={`/plantoes/${offer.id}`}>
                  <strong>{offer.sector}</strong>
                  <span>
                    {formatDateTime(offer.starts_at)} ·{" "}
                    {formatCurrency(offer.value_cents)} ·{" "}
                    {offerStatusLabels[offer.status] ?? offer.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma oferta publicada.</p>
        )}
      </section>
      <section className="card admin-section">
        <h2>Candidaturas</h2>
        {myApplications?.length ? (
          <ul className="clean-list">
            {myApplications.map((application) => {
              const offer = offerById.get(application.offer_id);
              return (
                <li key={application.id}>
                  <Link href={`/plantoes/${application.offer_id}`}>
                    <strong>{offer?.sector ?? "Plantão"}</strong>
                    <span>
                      {offer
                        ? `${formatDateTime(offer.starts_at)} · ${formatCurrency(offer.value_cents)} · `
                        : ""}
                      {applicationStatusLabels[application.status] ??
                        application.status}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>Nenhuma candidatura registrada.</p>
        )}
      </section>
      <section className="card admin-section">
        <h2>Substituições</h2>
        {substitutions?.length ? (
          <ul className="clean-list">
            {substitutions.map((substitution) => {
              const offer = offerById.get(substitution.offer_id);
              const role =
                substitution.owner_id === identity.userId
                  ? "Titular"
                  : "Substituto";
              const completion = completionBySubstitution.get(substitution.id);
              return (
                <li key={substitution.id}>
                  <Link href={`/plantoes/${substitution.offer_id}`}>
                    <strong>
                      {offer?.sector ?? "Plantão"} · {role}
                    </strong>
                    <span>
                      {offer ? formatDateTime(offer.starts_at) : ""} ·{" "}
                      {substitutionStatusLabels[substitution.status] ??
                        substitution.status}
                    </span>
                    {completion ? (
                      <span>
                        Realização:{" "}
                        {completion.status === "completed"
                          ? "confirmada"
                          : completion.status === "disputed"
                            ? "com divergência"
                            : "aguardando confirmação"}
                      </span>
                    ) : null}
                    {substitution.cancellation_reason ? (
                      <span>
                        Justificativa: {substitution.cancellation_reason}
                      </span>
                    ) : null}
                    {occurrencesBySubstitution
                      .get(substitution.id)
                      ?.map((occurrence, index) => (
                        <span key={`${substitution.id}-occurrence-${index}`}>
                          Ocorrência{" "}
                          {occurrence.status === "open"
                            ? "em análise"
                            : "encerrada"}
                          {occurrence.decision
                            ? ` · Decisão: ${occurrence.decision}`
                            : ""}
                        </span>
                      ))}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>Nenhuma substituição registrada.</p>
        )}
      </section>
    </main>
  );
}
