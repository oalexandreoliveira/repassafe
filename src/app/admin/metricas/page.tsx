import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminIdentity } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  formatMetricPercent,
  loadPilotMetrics,
  metricCount,
  pilotMetricEvents,
} from "@/features/operations/pilot-metrics";

const periods = new Set(["30", "90", "365"]);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const metricCards = [
  "signup_completed",
  "user_approved",
  "offer_published",
  "application_created",
  "substitution_confirmed",
  "completion_confirmed",
  "substitution_cancelled",
  "occurrence_opened",
] as const;

function single(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function dateLabel(value: Date) {
  return value.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

export default async function PilotMetricsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  try {
    await requireAdminIdentity();
  } catch {
    redirect("/mfa");
  }

  const params = await searchParams;
  const requestedPeriod = single(params.period);
  const period = periods.has(requestedPeriod) ? requestedPeriod : "30";
  const requestedGroup = single(params.group);
  const groupId = uuidPattern.test(requestedGroup) ? requestedGroup : null;
  const end = new Date();
  const start = new Date(end.getTime() - Number(period) * 24 * 60 * 60 * 1000);
  const admin = createAdminClient();
  const [{ data: groups }, result] = await Promise.all([
    admin.from("groups").select("id,name").order("name"),
    loadPilotMetrics({
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      groupId,
    }),
  ]);

  const offers = metricCount(result.rows, "offer_published");
  const confirmed = metricCount(result.rows, "substitution_confirmed");
  const completed = metricCount(result.rows, "completion_confirmed");
  const cancellations = metricCount(result.rows, "substitution_cancelled");
  const exportQuery = new URLSearchParams({ period });
  if (groupId) exportQuery.set("group", groupId);

  return (
    <main className="admin-content pilot-metrics">
      <header className="dashboard-header">
        <div>
          <h1>Métricas do piloto</h1>
          <p>
            Acompanhe o caminho das ofertas à conclusão. Os números contam
            eventos registrados no período selecionado.
          </p>
        </div>
        <Link href="/admin/operacao" className="button button-secondary">
          Consultar operação
        </Link>
      </header>

      <section aria-label="Filtros e exportação">
        <form method="get" className="admin-filters">
          <label>
            Período
            <select name="period" defaultValue={period}>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Últimos 12 meses</option>
            </select>
          </label>
          <label>
            Grupo
            <select name="group" defaultValue={groupId ?? ""}>
              <option value="">Todos os grupos</option>
              {groups?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <button className="button button-primary">Aplicar filtros</button>
          <a
            className="button button-secondary"
            href={`/admin/metricas/exportar?${exportQuery.toString()}`}
          >
            Baixar CSV consolidado
          </a>
        </form>
        <p className="form-help" aria-live="polite">
          De {dateLabel(start)} a {dateLabel(end)}. Exportação sem
          identificadores pessoais ou registros individuais.
        </p>
      </section>

      {result.error ? (
        <p className="form-message form-message-error" role="alert">
          Não foi possível carregar as métricas agora. Atualize a página ou
          consulte a operação.
        </p>
      ) : (
        <>
          <section aria-labelledby="funnel-title" className="admin-section">
            <h2 id="funnel-title">Atividade do período</h2>
            <dl className="pilot-metric-grid">
              {metricCards.map((event) => (
                <div className="pilot-metric" key={event}>
                  <dt>{pilotMetricEvents[event]}</dt>
                  <dd>
                    {metricCount(result.rows, event).toLocaleString("pt-BR")}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="conversion-title" className="admin-section">
            <h2 id="conversion-title">Conversão do fluxo</h2>
            <dl className="pilot-conversion-list">
              <div>
                <dt>Ofertas que chegaram a repasse confirmado</dt>
                <dd>{formatMetricPercent(confirmed, offers)}</dd>
                <p>
                  {confirmed} confirmações para {offers} ofertas publicadas
                </p>
              </div>
              <div>
                <dt>Repasses confirmados com plantão concluído</dt>
                <dd>{formatMetricPercent(completed, confirmed)}</dd>
                <p>
                  {completed} conclusões para {confirmed} repasses confirmados
                </p>
              </div>
              <div>
                <dt>Cancelamentos em relação às ofertas publicadas</dt>
                <dd>{formatMetricPercent(cancellations, offers)}</dd>
                <p>
                  {cancellations} cancelamentos para {offers} ofertas publicadas
                </p>
              </div>
            </dl>
            <p className="form-help">
              A taxa compara eventos ocorridos no mesmo período; ela não
              acompanha uma coorte de ofertas individual.
            </p>
          </section>

          <section
            aria-labelledby="group-breakdown-title"
            className="admin-section"
          >
            <h2 id="group-breakdown-title">Detalhamento por grupo</h2>
            {result.rows.length ? (
              <div
                className="table-scroll"
                role="region"
                aria-label="Métricas por grupo"
                tabIndex={0}
              >
                <table className="pilot-metrics-table">
                  <thead>
                    <tr>
                      <th scope="col">Grupo</th>
                      <th scope="col">Indicador</th>
                      <th scope="col">Quantidade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row) => (
                      <tr key={`${row.event_type}-${row.group_id ?? "free"}`}>
                        <td>{row.group_name}</td>
                        <td>{pilotMetricEvents[row.event_type]}</td>
                        <td>
                          {Number(row.event_count).toLocaleString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <h3>Ainda não há eventos neste recorte</h3>
                <p>
                  Amplie o período ou selecione todos os grupos para consultar
                  outras movimentações.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
