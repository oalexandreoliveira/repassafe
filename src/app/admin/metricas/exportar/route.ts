import { requireAdminIdentity } from "@/lib/auth/session";
import {
  buildMetricsCsv,
  loadPilotMetrics,
} from "@/features/operations/pilot-metrics";

const periods = new Set(["30", "90", "365"]);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    await requireAdminIdentity();
  } catch {
    return new Response("Acesso administrativo necessário.", {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const url = new URL(request.url);
  const requestedPeriod = url.searchParams.get("period") ?? "30";
  const period = periods.has(requestedPeriod) ? requestedPeriod : "30";
  const requestedGroup = url.searchParams.get("group") ?? "";
  const groupId = uuidPattern.test(requestedGroup) ? requestedGroup : null;
  const end = new Date();
  const start = new Date(end.getTime() - Number(period) * 24 * 60 * 60 * 1000);
  const result = await loadPilotMetrics({
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    groupId,
  });

  if (result.error) {
    return new Response("Não foi possível gerar o relatório.", {
      status: 503,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const filename = `repassafe-metricas-${start.toISOString().slice(0, 10)}-${end.toISOString().slice(0, 10)}.csv`;
  const displayDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return new Response(
    `\uFEFF${buildMetricsCsv(result.rows, displayDate(start), displayDate(end))}`,
    {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    },
  );
}
