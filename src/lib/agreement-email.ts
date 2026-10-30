import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type EmailMessage = {
  from: string;
  to: string[];
  subject: string;
  text: string;
};
type Delivery = {
  id: string;
  recipient_email: string;
  href: string;
  state: string;
  attempts: number;
  attempted_at: string | null;
  first_attempt_at: string | null;
  message: EmailMessage | null;
};

/** Durable CAS claim; keep ambiguous retries within Resend's 24-hour key window. */
export async function dispatchAgreementEmails() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.AGREEMENT_EMAIL_FROM;
  const origin = process.env.NEXT_PUBLIC_APP_URL;
  if (
    process.env.AGREEMENT_EMAIL_ENABLED !== "true" ||
    !key ||
    !from ||
    !origin
  )
    return { configured: false, accepted: 0, failed: 0 };
  if (new URL(origin).protocol !== "https:")
    throw new Error("O envio de registros exige a URL HTTPS do app.");
  const admin = createAdminClient();
  const retryBefore = new Date(Date.now() - 300_000).toISOString();
  const { data, error } = await admin
    .from("agreement_email_deliveries")
    .select(
      "id,recipient_email,href,state,attempts,attempted_at,first_attempt_at,message",
    )
    .in("state", ["pending", "failed", "sending"])
    .or(`attempted_at.is.null,attempted_at.lte.${retryBefore}`)
    .order("created_at")
    .limit(5);
  if (error) throw new Error("Não foi possível consultar os envios.");
  let accepted = 0,
    failed = 0;
  for (const item of (data ?? []) as Delivery[]) {
    const now = new Date();
    if (
      item.attempted_at &&
      now.valueOf() - Date.parse(item.attempted_at) < 300_000
    )
      continue;
    if (
      item.first_attempt_at &&
      now.valueOf() - Date.parse(item.first_attempt_at) > 23 * 3600_000
    ) {
      await admin
        .from("agreement_email_deliveries")
        .update({
          state: "uncertain",
          last_error:
            "Reconciliar no provedor antes de reenviar: janela de idempotência encerrada.",
        })
        .eq("id", item.id)
        .eq("attempts", item.attempts);
      continue;
    }
    const message = item.message ?? {
      from,
      to: [item.recipient_email],
      subject: "Seu registro de repasse está disponível",
      text: `O repasse foi confirmado. Consulte as partes, o plantão, as condições aceitas e o histórico no Repassafe:\n\n${new URL(item.href, origin).href}\n\nEntre com sua conta para acessar. Você pode imprimir ou salvar o registro como PDF. A confirmação do acordo não confirma a realização do plantão nem o recebimento do pagamento.\n\nValores e pagamento são combinados diretamente entre vocês. O Repassafe não intermedeia pagamentos.`,
    };
    const claim = await admin
      .from("agreement_email_deliveries")
      .update({
        state: "sending",
        attempts: item.attempts + 1,
        attempted_at: now.toISOString(),
        first_attempt_at: item.first_attempt_at ?? now.toISOString(),
        message,
      })
      .eq("id", item.id)
      .eq("state", item.state)
      .eq("attempts", item.attempts)
      .select("id")
      .maybeSingle();
    if (claim.error || !claim.data) continue;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `agreement/${item.id}`,
        },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(8_000),
      });
      const body = (await response.json()) as { id?: string };
      if (!response.ok || !body.id)
        throw new Error(`Provedor respondeu HTTP ${response.status}`);
      const saved = await admin
        .from("agreement_email_deliveries")
        .update({ state: "sent", provider_id: body.id, last_error: null })
        .eq("id", item.id)
        .eq("attempts", item.attempts + 1);
      if (saved.error)
        throw new Error(
          "Confirmação local pendente; repetir com a mesma chave.",
        );
      accepted++;
    } catch {
      await admin
        .from("agreement_email_deliveries")
        .update({
          state: "failed",
          last_error:
            "Envio não confirmado. Nova tentativa usará a mesma chave.",
        })
        .eq("id", item.id)
        .eq("attempts", item.attempts + 1);
      failed++;
    }
  }
  return { configured: true, accepted, failed };
}
