import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type EmailMessage = {
  from: string;
  to: string[];
  subject: string;
  text: string;
};
export type QueuedEmail = {
  id: string;
  recipient_email: string;
  href: string;
  state: string;
  attempts: number;
  attempted_at: string | null;
  first_attempt_at: string | null;
  message: EmailMessage | null;
};
export type EmailSender = { key: string; from: string; origin: string };
type EmailQueue<Item extends QueuedEmail> = {
  table: string;
  columns: string;
  idempotencyPrefix: string;
  orderBy: string;
  limit: number;
  retryMs: number;
  /** Encerra o item sem enviar, quando repetir deixou de ser adequado. */
  close: (
    item: Item,
    now: Date,
  ) => { state: string; last_error: string } | null;
  compose: (item: Item, sender: EmailSender) => EmailMessage;
  /** Instante (ms) a partir do qual nenhum novo item é iniciado nesta execução. */
  stopAt?: number;
};

export function emailSender(enabledFlag: string): EmailSender | null {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.AGREEMENT_EMAIL_FROM;
  const origin = process.env.NEXT_PUBLIC_APP_URL;
  if (process.env[enabledFlag] !== "true" || !key || !from || !origin)
    return null;
  if (new URL(origin).protocol !== "https:")
    throw new Error("O envio de e-mails exige a URL HTTPS do app.");
  return { key, from, origin };
}

/** Durable CAS claim; keep ambiguous retries within Resend's 24-hour key window. */
export async function drainEmailQueue<Item extends QueuedEmail>(
  queue: EmailQueue<Item>,
  sender: EmailSender,
) {
  const admin = createAdminClient();
  const retryBefore = new Date(Date.now() - queue.retryMs).toISOString();
  const { data, error } = await admin
    .from(queue.table)
    .select(queue.columns)
    .in("state", ["pending", "failed", "sending"])
    .or(`attempted_at.is.null,attempted_at.lte.${retryBefore}`)
    .order(queue.orderBy)
    .limit(queue.limit);
  if (error) throw new Error("Não foi possível consultar os envios.");
  let accepted = 0,
    failed = 0;
  for (const item of (data ?? []) as unknown as Item[]) {
    if (queue.stopAt !== undefined && Date.now() >= queue.stopAt) break;
    const now = new Date();
    if (
      item.attempted_at &&
      now.valueOf() - Date.parse(item.attempted_at) < queue.retryMs
    )
      continue;
    const closed = queue.close(item, now);
    if (closed) {
      await admin
        .from(queue.table)
        .update(closed)
        .eq("id", item.id)
        .eq("attempts", item.attempts);
      continue;
    }
    const message = item.message ?? queue.compose(item, sender);
    const claim = await admin
      .from(queue.table)
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
          Authorization: `Bearer ${sender.key}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `${queue.idempotencyPrefix}/${item.id}`,
        },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(8_000),
      });
      const body = (await response.json()) as { id?: string };
      if (!response.ok || !body.id)
        throw new Error(`Provedor respondeu HTTP ${response.status}`);
      const saved = await admin
        .from(queue.table)
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
        .from(queue.table)
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
  return { accepted, failed };
}
