import Link from "next/link";
import { redirect } from "next/navigation";
import {
  applicationStatusLabels,
  formatCurrency,
} from "@/features/shifts/schemas";
import { getVerifiedIdentity } from "@/lib/auth/session";
import styles from "@/components/screens/screens.module.css";
import { AppScreen, TopBar } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { ShiftCard } from "@/components/ui/shift-card";
import { formatHourRangeShort, formatShiftDay } from "@/features/shifts/format";
import { offerGroupLabel, toOfferSummary } from "@/features/shifts/offer-view";
import {
  applicationPresentation,
  offerPresentation,
  substitutionPresentation,
} from "@/features/shifts/presentation";

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
    .select("id,offer_id,application_id,substitute_id")
    .eq("owner_id", identity.userId)
    .eq("status", "confirmed");
  const passedOfferIds = (passedSubstitutions ?? []).map(
    (substitution) => substitution.offer_id,
  );
  const { data: passedOffers } = passedOfferIds.length
    ? await identity.supabase
        .from("shift_offers")
        .select("id,starts_at,ends_at,sector")
        .in("id", passedOfferIds)
        .gte("starts_at", range.start)
        .lt("starts_at", range.end)
        .order("starts_at")
    : { data: [] };
  const passedOfferById = new Map(
    (passedOffers ?? []).map((offer) => [offer.id, offer]),
  );
  const passedInMonth = (passedSubstitutions ?? []).filter((row) =>
    passedOfferById.has(row.offer_id),
  );
  const applicationIds = [
    ...new Set(passedInMonth.map((row) => row.application_id)),
  ];
  const { data: substituteApplications } = applicationIds.length
    ? await identity.supabase
        .from("shift_applications")
        .select("id,candidate_display_name")
        .in("id", applicationIds)
    : { data: [] };
  const substituteNameByApplicationId = new Map(
    (substituteApplications ?? []).map((application) => [
      application.id,
      application.candidate_display_name,
    ]),
  );
  const passedShifts = passedInMonth
    .flatMap((substitution) => {
      const offer = passedOfferById.get(substitution.offer_id);
      return offer ? [{ ...substitution, offer }] : [];
    })
    .sort((left, right) =>
      left.offer.starts_at.localeCompare(right.offer.starts_at),
    );
  const normalizedSearch = substituteName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
  const passedShiftsFiltered = passedShifts.filter((substitution) => {
    const displayName =
      substituteNameByApplicationId.get(substitution.application_id) ?? "";
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
    <AppScreen header={<TopBar title="Meu histórico" backHref="/perfil" />}>
      <p className={styles.help}>
        Ofertas, candidaturas e substituições ligadas à sua conta.
      </p>

      <section className={styles.stack} aria-labelledby="passed-shifts-heading">
        <h2 id="passed-shifts-heading" className={styles.sectionTitle}>
          Plantões que repassei
        </h2>
        <form method="get" className={styles.stack}>
          <div className={styles.formGrid2}>
            <TextField
              label="Mês"
              type="month"
              name="shiftMonth"
              defaultValue={shiftMonth}
            />
            <TextField
              label="Nome do substituto"
              type="search"
              name="substituteName"
              defaultValue={substituteName}
              maxLength={100}
              placeholder="Ex.: Davi"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" block>
            Pesquisar
          </Button>
        </form>
        {passedShiftsFiltered.length ? (
          <ul className={styles.list}>
            {[
              ...new Set(passedShiftsFiltered.map((row) => row.substitute_id)),
            ].map((substituteId) => {
              const doctorShifts = passedShiftsFiltered.filter(
                (row) => row.substitute_id === substituteId,
              );
              const displayName = doctorShifts[0]
                ? substituteNameByApplicationId.get(
                    doctorShifts[0].application_id,
                  )
                : undefined;
              return (
                <li key={substituteId} className={styles.panel}>
                  <h3 className={styles.panelTitle}>
                    {displayName ?? "Médico substituto"}
                  </h3>
                  <div>
                    {doctorShifts.map((substitution) => (
                      <Link
                        key={substitution.id}
                        href={`/plantoes/${substitution.offer_id}`}
                        className={styles.rowLink}
                      >
                        <span>
                          {formatShiftDay(substitution.offer.starts_at)} ·{" "}
                          {formatHourRangeShort(
                            substitution.offer.starts_at,
                            substitution.offer.ends_at,
                          )}{" "}
                          · {substitution.offer.sector}
                        </span>
                      </Link>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.help}>
            {substituteName
              ? `Nenhum plantão encontrado para “${substituteName}” neste mês.`
              : "Nenhum plantão repassado neste mês."}
          </p>
        )}
      </section>

      <section className={styles.stack} aria-labelledby="offers-heading">
        <h2 id="offers-heading" className={styles.sectionTitle}>
          Ofertas publicadas
        </h2>
        {myOffers?.length ? (
          <ul className={styles.list}>
            {myOffers.map((row) => {
              const offer = toOfferSummary(row);
              return (
                <li key={offer.id}>
                  <ShiftCard
                    status={offerPresentation({
                      offerStatus: offer.status,
                      view: "mural",
                    })}
                    group={offerGroupLabel(offer)}
                    title={offer.sector}
                    date={formatShiftDay(offer.startsAt)}
                    time={formatHourRangeShort(offer.startsAt, offer.endsAt)}
                    meta={
                      offer.valueCents !== undefined
                        ? formatCurrency(offer.valueCents)
                        : undefined
                    }
                    href={`/plantoes/${offer.id}`}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.help}>Nenhuma oferta publicada.</p>
        )}
      </section>

      <section className={styles.stack} aria-labelledby="applications-heading">
        <h2 id="applications-heading" className={styles.sectionTitle}>
          Candidaturas
        </h2>
        {myApplications?.length ? (
          <ul className={styles.list}>
            {myApplications.map((application) => {
              const row = offerById.get(application.offer_id);
              const offer = row ? toOfferSummary(row) : undefined;
              const status = applicationPresentation(application.status);
              return (
                <li key={application.id}>
                  <ShiftCard
                    status={{
                      tone: status.tone,
                      label:
                        applicationStatusLabels[application.status] ??
                        status.label,
                    }}
                    group={offer ? offerGroupLabel(offer) : undefined}
                    title={offer?.sector ?? "Plantão"}
                    date={offer ? formatShiftDay(offer.startsAt) : ""}
                    time={
                      offer
                        ? formatHourRangeShort(offer.startsAt, offer.endsAt)
                        : ""
                    }
                    meta={
                      offer?.valueCents !== undefined
                        ? formatCurrency(offer.valueCents)
                        : undefined
                    }
                    href={`/plantoes/${application.offer_id}`}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.help}>Nenhuma candidatura registrada.</p>
        )}
      </section>

      <section className={styles.stack} aria-labelledby="substitutions-heading">
        <h2 id="substitutions-heading" className={styles.sectionTitle}>
          Substituições
        </h2>
        {substitutions?.length ? (
          <ul className={styles.list}>
            {substitutions.map((substitution) => {
              const row = offerById.get(substitution.offer_id);
              const offer = row ? toOfferSummary(row) : undefined;
              const role =
                substitution.owner_id === identity.userId
                  ? "titular"
                  : "substituto";
              const completion = completionBySubstitution.get(substitution.id);
              const details = [
                `Você como ${role}`,
                completion
                  ? `Realização: ${
                      completion.status === "completed"
                        ? "confirmada"
                        : completion.status === "disputed"
                          ? "com divergência"
                          : "aguardando confirmação"
                    }`
                  : null,
                substitution.cancellation_reason
                  ? `Justificativa: ${substitution.cancellation_reason}`
                  : null,
                ...(occurrencesBySubstitution.get(substitution.id) ?? []).map(
                  (occurrence) =>
                    `Ocorrência ${occurrence.status === "open" ? "em análise" : "encerrada"}${
                      occurrence.decision
                        ? ` · Decisão: ${occurrence.decision}`
                        : ""
                    }`,
                ),
              ].filter(Boolean);
              return (
                <li key={substitution.id}>
                  <ShiftCard
                    status={substitutionPresentation(substitution.status)}
                    group={offer ? offerGroupLabel(offer) : undefined}
                    title={offer?.sector ?? "Plantão"}
                    date={offer ? formatShiftDay(offer.startsAt) : ""}
                    time={
                      offer
                        ? formatHourRangeShort(offer.startsAt, offer.endsAt)
                        : ""
                    }
                    meta={details.join(" · ")}
                    href={`/plantoes/${substitution.offer_id}`}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.help}>Nenhuma substituição registrada.</p>
        )}
      </section>
    </AppScreen>
  );
}
