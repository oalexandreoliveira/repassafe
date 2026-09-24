import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminIdentity } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  applicationStatusLabels,
  formatCurrency,
  formatDateTime,
  offerStatusLabels,
  substitutionStatusLabels,
} from "@/features/shifts/schemas";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validStatuses = new Set([
  ...Object.keys(offerStatusLabels),
  ...Object.keys(applicationStatusLabels),
  ...Object.keys(substitutionStatusLabels),
]);

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function safeSearch(value: string) {
  return value
    .trim()
    .slice(0, 80)
    .replace(/[%,_()[\]\\]/g, " ")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ");
}

export default async function AdminOperationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  try {
    await requireAdminIdentity();
  } catch {
    redirect("/mfa");
  }

  const params = await searchParams;
  const q = safeSearch(one(params.q));
  const groupId = one(params.group);
  const date = one(params.date);
  const status = one(params.status);
  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !Number.isNaN(Date.parse(`${date}T00:00:00Z`));
  const validGroup = uuidPattern.test(groupId);
  const validStatus = validStatuses.has(status);
  const admin = createAdminClient();
  const [{ data: groups }, { data: profiles }] = await Promise.all([
    admin.from("groups").select("id,name").eq("active", true).order("name"),
    q && !uuidPattern.test(q)
      ? admin
          .from("profiles")
          .select("id,display_name,crm_number,crm_state")
          .or(`display_name.ilike.%${q}%,crm_number.ilike.%${q}%`)
          .limit(100)
      : Promise.resolve({ data: [] }),
  ]);

  let matchingOfferIds: string[] | null = null;
  if (q) {
    const ids = new Set<string>();
    if (uuidPattern.test(q)) {
      ids.add(q);
      const [byApplication, bySubstitution] = await Promise.all([
        admin
          .from("shift_applications")
          .select("offer_id")
          .eq("id", q)
          .maybeSingle(),
        admin
          .from("substitutions")
          .select("offer_id")
          .eq("id", q)
          .maybeSingle(),
      ]);
      if (byApplication.data?.offer_id) ids.add(byApplication.data.offer_id);
      if (bySubstitution.data?.offer_id) ids.add(bySubstitution.data.offer_id);
    } else {
      const profileIds = (profiles ?? []).map((profile) => profile.id);
      if (profileIds.length) {
        const [owned, applications, substitutions] = await Promise.all([
          admin
            .from("shift_offers")
            .select("id")
            .in("owner_id", profileIds)
            .limit(100),
          admin
            .from("shift_applications")
            .select("offer_id")
            .in("candidate_id", profileIds)
            .limit(100),
          admin
            .from("substitutions")
            .select("offer_id")
            .or(
              `owner_id.in.(${profileIds.join(",")}),substitute_id.in.(${profileIds.join(",")})`,
            )
            .limit(100),
        ]);
        owned.data?.forEach((row) => ids.add(row.id));
        applications.data?.forEach((row) => ids.add(row.offer_id));
        substitutions.data?.forEach((row) => ids.add(row.offer_id));
      }
    }
    matchingOfferIds = [...ids];
  }

  if (validStatus && Object.hasOwn(offerStatusLabels, status)) {
    const { data } = await admin
      .from("shift_offers")
      .select("id")
      .eq("status", status)
      .limit(200);
    const matched = new Set((data ?? []).map((row) => row.id));
    matchingOfferIds =
      matchingOfferIds === null
        ? [...matched]
        : matchingOfferIds.filter((id) => matched.has(id));
  } else if (validStatus && Object.hasOwn(applicationStatusLabels, status)) {
    const { data } = await admin
      .from("shift_applications")
      .select("offer_id")
      .eq("status", status)
      .limit(200);
    const matched = new Set((data ?? []).map((row) => row.offer_id));
    matchingOfferIds =
      matchingOfferIds === null
        ? [...matched]
        : matchingOfferIds.filter((id) => matched.has(id));
  } else if (validStatus && Object.hasOwn(substitutionStatusLabels, status)) {
    const { data } = await admin
      .from("substitutions")
      .select("offer_id")
      .eq("status", status)
      .limit(200);
    const matched = new Set((data ?? []).map((row) => row.offer_id));
    matchingOfferIds =
      matchingOfferIds === null
        ? [...matched]
        : matchingOfferIds.filter((id) => matched.has(id));
  }

  let offersQuery = admin
    .from("shift_offers")
    .select(
      "id,group_id,owner_id,starts_at,ends_at,sector,value_cents,status,groups(name)",
    )
    .order("starts_at", { ascending: false })
    .limit(100);
  if (validGroup) offersQuery = offersQuery.eq("group_id", groupId);
  if (validDate) {
    const from = new Date(`${date}T00:00:00-03:00`).toISOString();
    const to = new Date(
      new Date(from).getTime() + 24 * 60 * 60 * 1000,
    ).toISOString();
    offersQuery = offersQuery.gte("starts_at", from).lt("starts_at", to);
  }
  if (validStatus && Object.hasOwn(offerStatusLabels, status))
    offersQuery = offersQuery.eq("status", status);
  if (matchingOfferIds !== null) {
    offersQuery = matchingOfferIds.length
      ? offersQuery.in("id", matchingOfferIds)
      : offersQuery.eq("id", "00000000-0000-0000-0000-000000000000");
  }
  const { data: offers } = await offersQuery;
  const offerIds = (offers ?? []).map((offer) => offer.id);
  const [{ data: applications }, { data: substitutions }] = offerIds.length
    ? await Promise.all([
        admin
          .from("shift_applications")
          .select("id,offer_id,candidate_id,status,created_at")
          .in("offer_id", offerIds)
          .order("created_at", { ascending: false }),
        admin
          .from("substitutions")
          .select("id,offer_id,owner_id,substitute_id,status,created_at")
          .in("offer_id", offerIds)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];
  const profileIds = [
    ...new Set([
      ...(offers ?? []).map((row) => row.owner_id),
      ...(applications ?? []).map((row) => row.candidate_id),
      ...(substitutions ?? []).flatMap((row) => [
        row.owner_id,
        row.substitute_id,
      ]),
    ]),
  ];
  const { data: people } = profileIds.length
    ? await admin
        .from("profiles")
        .select("id,display_name,crm_number,crm_state")
        .in("id", profileIds)
    : { data: [] };
  const peopleById = new Map(
    (people ?? []).map((person) => [person.id, person]),
  );
  const entityIds = [
    ...offerIds,
    ...(applications ?? []).map((row) => row.id),
    ...(substitutions ?? []).map((row) => row.id),
  ];
  const { data: auditEvents } = entityIds.length
    ? await admin
        .from("audit_events")
        .select("id,event_type,entity_type,entity_id,occurred_at")
        .in("entity_id", entityIds)
        .order("occurred_at", { ascending: false })
        .limit(300)
    : { data: [] };
  const hasFilters = Boolean(
    q ||
    (groupId && !validGroup) ||
    (date && !validDate) ||
    (status && !validStatus),
  );

  return (
    <main className="shell dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Administração protegida por MFA</p>
          <h1>Consulta operacional</h1>
        </div>
        <Link href="/admin" className="button button-secondary">
          Voltar à administração
        </Link>
      </header>
      <section className="card admin-section">
        <h2>Localizar repasses</h2>
        <p className="form-help">
          Busque por identificador, profissional ou CRM e refine por grupo, data
          ou situação.
        </p>
        <form
          role="search"
          aria-label="Consultar repasses"
          method="get"
          className="form-grid"
        >
          <label>
            Identificador, nome ou CRM
            <input name="q" defaultValue={q} maxLength={80} />
          </label>
          <label>
            Grupo
            <select name="group" defaultValue={validGroup ? groupId : ""}>
              <option value="">Todos os grupos</option>
              {groups?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Data do plantão
            <input
              name="date"
              type="date"
              defaultValue={validDate ? date : ""}
            />
          </label>
          <label>
            Situação
            <select name="status" defaultValue={validStatus ? status : ""}>
              <option value="">Todas</option>
              {Object.entries(offerStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label} · oferta
                </option>
              ))}
              {Object.entries(applicationStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label} · candidatura
                </option>
              ))}
              {Object.entries(substitutionStatusLabels).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label} · substituição
                  </option>
                ),
              )}
            </select>
          </label>
          <button className="button button-primary">Consultar</button>
        </form>
        {hasFilters ? (
          <p
            className="form-message form-message-error"
            role="status"
            aria-live="polite"
          >
            Um ou mais filtros inválidos foram ignorados. Revise a consulta.
          </p>
        ) : null}
      </section>
      <section className="admin-section" aria-labelledby="results-title">
        <h2 id="results-title">Resultados ({offers?.length ?? 0})</h2>
        {offers?.length ? (
          <div className="admin-list">
            {offers.map((offer) => {
              const group = Array.isArray(offer.groups)
                ? offer.groups[0]
                : offer.groups;
              const offerApps =
                applications?.filter((row) => row.offer_id === offer.id) ?? [];
              const offerSubs =
                substitutions?.filter((row) => row.offer_id === offer.id) ?? [];
              const relatedIds = new Set([
                offer.id,
                ...offerApps.map((row) => row.id),
                ...offerSubs.map((row) => row.id),
              ]);
              const history =
                auditEvents?.filter(
                  (event) => event.entity_id && relatedIds.has(event.entity_id),
                ) ?? [];
              const owner = peopleById.get(offer.owner_id);
              return (
                <article className="card" key={offer.id}>
                  <h3>{offer.sector}</h3>
                  <p>
                    {group?.name ?? "Grupo"} ·{" "}
                    {offerStatusLabels[offer.status] ?? offer.status}
                  </p>
                  <p>
                    {formatDateTime(offer.starts_at)} –{" "}
                    {formatDateTime(offer.ends_at)} ·{" "}
                    {formatCurrency(offer.value_cents)}
                  </p>
                  <p>
                    Oferta <code>{offer.id}</code> · Titular:{" "}
                    {owner?.display_name ?? "—"}
                    {owner?.crm_number
                      ? ` · CRM ${owner.crm_number}/${owner.crm_state}`
                      : ""}
                  </p>
                  {offerApps.length ? (
                    <div>
                      <h4>Candidaturas</h4>
                      <ul className="clean-list">
                        {offerApps.map((row) => (
                          <li key={row.id}>
                            <span>
                              {peopleById.get(row.candidate_id)?.display_name ??
                                "Profissional"}{" "}
                              ·{" "}
                              {applicationStatusLabels[row.status] ??
                                row.status}
                            </span>
                            <code>{row.id}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {offerSubs.length ? (
                    <div>
                      <h4>Substituições</h4>
                      <ul className="clean-list">
                        {offerSubs.map((row) => (
                          <li key={row.id}>
                            <span>
                              {peopleById.get(row.substitute_id)
                                ?.display_name ?? "Profissional"}{" "}
                              ·{" "}
                              {substitutionStatusLabels[row.status] ??
                                row.status}
                            </span>
                            <code>{row.id}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <details className="operation-history">
                    <summary>Histórico de auditoria ({history.length})</summary>
                    {history.length ? (
                      <ul className="clean-list">
                        {history.map((event) => (
                          <li key={event.id}>
                            <span>
                              {new Date(event.occurred_at).toLocaleString(
                                "pt-BR",
                              )}{" "}
                              · {event.event_type} · {event.entity_type}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        Nenhum evento de auditoria associado foi encontrado.
                      </p>
                    )}
                  </details>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="card empty-state">
            <h3>Nenhum repasse encontrado</h3>
            <p>Altere os filtros e tente novamente.</p>
          </div>
        )}
      </section>
    </main>
  );
}
