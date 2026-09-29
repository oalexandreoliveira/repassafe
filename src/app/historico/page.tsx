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

function currentFortalezaMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

function monthRange(month: string) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1, 3));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1, 3));
  return { start: start.toISOString(), end: end.toISOString() };
}

export default async function PersonalHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    shiftMonth?: string | string[];
    substituteName?: string | string[];
  }>;
}) {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");
  const params = await searchParams;
  const requestedMonth =
    typeof params.shiftMonth === "string" ? params.shiftMonth : "";
  const shiftMonth = monthRange(requestedMonth)
    ? requestedMonth
    : currentFortalezaMonth();
  const substituteName =
    typeof params.substituteName === "string"
      ? params.substituteName.trim().slice(0, 100)
      : "";
  const range = monthRange(shiftMonth)!;
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
  const { data: passedSubstitutions } = await identity.supabase
    .from("substitutions")
    .select("id,offer_id,substitute_id")
    .eq("owner_id", identity.userId)
    .eq("status", "confirmed");
  const passedOfferIds = (passedSubstitutions ?? []).map(
    (substitution) => substitution.offer_id,
  );
  const [{ data: passedOffers }, { data: substituteProfiles }] = passedOfferIds.length
    ? await Promise.all([
        identity.supabase
          .from("shift_offers")
          .select("id,starts_at,ends_at,sector")
          .in("id", passedOfferIds)
          .gte("starts_at", range.start)
          .lt("starts_at", range.end)
          .order("starts_at"),
        identity.supabase
          .from("profiles")
          .select("id,display_name")
          .in(
            "id",
            [...new Set((passedSubstitutions ?? []).map((row) => row.substitute_id))],
          ),
      ])
    : [{ data: [] }, { data: [] }];
  const passedOfferById = new Map((passedOffers ?? []).map((offer) => [offer.id, offer]));
  const substituteProfileById = new Map(
    (substituteProfiles ?? []).map((profile) => [profile.id, profile]),
  );
  const passedShifts = (passedSubstitutions ?? [])
    .flatMap((substitution) => {
      const offer = passedOfferById.get(substitution.offer_id);
      return offer ? [{ ...substitution, offer }] : [];
    })
    .sort((left, right) => left.offer.starts_at.localeCompare(right.offer.starts_at));
  const normalizedSearch = substituteName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
  const passedShiftsFiltered = passedShifts.filter((substitution) => {
    const profile = substituteProfileById.get(substitution.substitute_id);
    const displayName = profile?.display_name ?? "";
    return displayName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .includes(normalizedSearch);
  });
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
      <section className="card admin-section" aria-labelledby="passed-shifts-heading">
        <h2 id="passed-shifts-heading">Plantões que repassei</h2>
        <p className="form-help">
          Pesquise por mês e pelo nome de quem assumiu meus plantões.
        </p>
        <form method="get" className="form-grid compact-form">
          <label>
            Mês
            <input type="month" name="shiftMonth" defaultValue={shiftMonth} />
          </label>
          <label>
            Nome do substituto
            <input
              type="search"
              name="substituteName"
              defaultValue={substituteName}
              maxLength={100}
              placeholder="Ex.: Davi"
            />
          </label>
          <button className="button button-primary" type="submit">
            Pesquisar
          </button>
        </form>
        {passedShiftsFiltered.length ? (
          <ul className="clean-list">
            {[...new Set(passedShiftsFiltered.map((row) => row.substitute_id))].map(
              (substituteId) => {
                const profile = substituteProfileById.get(substituteId);
                const doctorShifts = passedShiftsFiltered.filter(
                  (row) => row.substitute_id === substituteId,
                );
                return (
                  <li key={substituteId}>
                    <strong>{profile?.display_name ?? "Médico substituto"}</strong>
                    {doctorShifts.map((substitution) => (
                      <Link
                        key={substitution.id}
                        href={`/plantoes/${substitution.offer_id}`}
                      >
                        <span>
                          Dia{" "}
                          {new Intl.DateTimeFormat("pt-BR", {
                            day: "numeric",
                            timeZone: "America/Fortaleza",
                          }).format(new Date(substitution.offer.starts_at))}
                          {" · "}
                          {formatDateTime(substitution.offer.starts_at)} · {substitution.offer.sector}
                        </span>
                      </Link>
                    ))}
                  </li>
                );
              },
            )}
          </ul>
        ) : (
          <p>
            {substituteName
              ? `Nenhum plantão encontrado para “${substituteName}” neste mês.`
              : "Nenhum plantão repassado neste mês."}
          </p>
        )}
      </section>
      <section className="card admin-section">
        <h2>Ofertas publicadas</h2>
        {myOffers?.length ? (
          <ul className="clean-list">
            {myOffers.map((offer) => {
              const group = Array.isArray(offer.groups)
                ? offer.groups[0]
                : offer.groups;
              return (
                <li key={offer.id}>
                  <Link href={`/plantoes/${offer.id}`}>
                    <strong>{offer.sector}</strong>
                    <span>
                      {group?.name ?? "Oferta livre"} ·{" "}
                      {formatDateTime(offer.starts_at)} ·{" "}
                      {formatCurrency(offer.value_cents)} ·{" "}
                      {offerStatusLabels[offer.status] ?? offer.status}
                    </span>
                  </Link>
                </li>
              );
            })}
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
              const group = offer
                ? Array.isArray(offer.groups)
                  ? offer.groups[0]
                  : offer.groups
                : null;
              return (
                <li key={application.id}>
                  <Link href={`/plantoes/${application.offer_id}`}>
                    <strong>{offer?.sector ?? "Plantão"}</strong>
                    <span>
                      {group?.name ?? "Oferta livre"} ·{" "}
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

