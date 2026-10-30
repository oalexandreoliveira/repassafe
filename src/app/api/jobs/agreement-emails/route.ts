import { timingSafeEqual } from "node:crypto";
import { dispatchAgreementEmails } from "@/lib/agreement-email";

export const maxDuration = 60;

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
    return Response.json(await dispatchAgreementEmails());
  } catch {
    return Response.json(
      { error: "Processamento indisponível" },
      { status: 503 },
    );
  }
}
