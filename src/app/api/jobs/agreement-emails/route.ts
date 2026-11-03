import { timingSafeEqual } from "node:crypto";
import { dispatchAgreementEmails } from "@/lib/agreement-email";
import { dispatchCriticalEmails } from "@/lib/critical-email";

export const maxDuration = 60;
// Cada chamada ao provedor leva até 8 s; a folga mantém a execução abaixo do limite.
const budgetMs = 45_000;

export async function POST(request: Request) {
  const secret = process.env.AGREEMENT_EMAIL_JOB_TOKEN;
  const received = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  if (
    !secret ||
    secret.length < 32 ||
    Buffer.byteLength(received) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  )
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const stopAt = Date.now() + budgetMs;
    const critical = await dispatchCriticalEmails(stopAt);
    const agreements = await dispatchAgreementEmails(stopAt);
    return Response.json({ critical, agreements });
  } catch {
    return Response.json(
      { error: "Processamento indisponível" },
      { status: 503 },
    );
  }
}
