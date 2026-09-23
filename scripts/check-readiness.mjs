const url = process.env.READINESS_URL;
const token = process.env.MONITORING_TOKEN;

if (!url || !token) {
  console.error("READINESS_URL e MONITORING_TOKEN são obrigatórios.");
  process.exit(2);
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10000);

try {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
    signal: controller.signal,
    cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok || body.status !== "ready") {
    console.error(`Readiness reprovado: HTTP ${response.status}.`);
    process.exit(1);
  }
  console.log("Readiness aprovado: aplicação, banco e Storage disponíveis.");
} catch {
  console.error(
    "Readiness reprovado: endpoint indisponível ou resposta inválida.",
  );
  process.exit(1);
} finally {
  clearTimeout(timeout);
}
