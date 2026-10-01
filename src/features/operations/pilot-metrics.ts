import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const pilotMetricEvents = {
  signup_completed: "Envios de cadastro",
  user_approved: "Aprovações profissionais",
  offer_published: "Ofertas publicadas",
  application_created: "Candidaturas recebidas",
  substitution_confirmed: "Repasses confirmados",
  completion_confirmed: "Plantões concluídos",
  substitution_cancelled: "Cancelamentos, desistências e expirações",
  occurrence_opened: "Ocorrências abertas",
} as const;

export type PilotMetricEvent = keyof typeof pilotMetricEvents;

export type PilotMetricRow = {
  event_type: PilotMetricEvent;
  group_id: string | null;
  group_name: string;
  event_count: number;
};

export async function loadPilotMetrics({
  startAt,
  endAt,
  groupId,
}: {
  startAt: string;
  endAt: string;
  groupId: string | null;
}) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("pilot_metrics_aggregate", {
    p_start_at: startAt,
    p_end_at: endAt,
    p_group_id: groupId,
  });

  if (error) return { rows: [] as PilotMetricRow[], error: true };

  const rows = ((data ?? []) as PilotMetricRow[]).filter((row) =>
    Object.hasOwn(pilotMetricEvents, row.event_type),
  );

  return {
    rows: rows as PilotMetricRow[],
    error: false,
  };
}

export function metricCount(rows: PilotMetricRow[], event: PilotMetricEvent) {
  return rows.reduce(
    (total, row) =>
      total + (row.event_type === event ? Number(row.event_count) : 0),
    0,
  );
}

export function formatMetricPercent(numerator: number, denominator: number) {
  if (!denominator) return "—";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export function buildMetricsCsv(
  rows: PilotMetricRow[],
  periodStart: string,
  periodEnd: string,
) {
  const header = [
    "Início do período",
    "Fim do período",
    "Indicador",
    "Grupo",
    "Quantidade",
  ];
  const body = rows.map((row) => [
    periodStart,
    periodEnd,
    pilotMetricEvents[row.event_type],
    row.group_name,
    String(row.event_count),
  ]);
  const cell = (value: string) => {
    const safeValue = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
    return `"${safeValue.replaceAll('"', '""').replace(/[\r\n]+/g, " ")}"`;
  };

  return [header, ...body].map((line) => line.map(cell).join(",")).join("\r\n");
}
