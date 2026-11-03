import "server-only";
import {
  drainEmailQueue,
  emailSender,
  type QueuedEmail,
} from "@/lib/email-queue";

export async function dispatchAgreementEmails(stopAt?: number) {
  const sender = emailSender("AGREEMENT_EMAIL_ENABLED");
  if (!sender) return { configured: false, accepted: 0, failed: 0 };
  const result = await drainEmailQueue<QueuedEmail>(
    {
      table: "agreement_email_deliveries",
      columns:
        "id,recipient_email,href,state,attempts,attempted_at,first_attempt_at,message",
      idempotencyPrefix: "agreement",
      orderBy: "created_at",
      limit: 5,
      retryMs: 300_000,
      stopAt,
      close: (item, now) =>
        item.first_attempt_at &&
        now.valueOf() - Date.parse(item.first_attempt_at) > 23 * 3600_000
          ? {
              state: "uncertain",
              last_error:
                "Reconciliar no provedor antes de reenviar: janela de idempotência encerrada.",
            }
          : null,
      compose: (item, { from, origin }) => ({
        from,
        to: [item.recipient_email],
        subject: "Seu registro de repasse está disponível",
        text: `O repasse foi confirmado. Consulte as partes, o plantão, as condições aceitas e o histórico no Repassafe:\n\n${new URL(item.href, origin).href}\n\nEntre com sua conta para acessar. Você pode imprimir ou salvar o registro como PDF. A confirmação do acordo não confirma a realização do plantão nem o recebimento do pagamento.\n\nValores e pagamento são combinados diretamente entre vocês. O Repassafe não intermedeia pagamentos.`,
      }),
    },
    sender,
  );
  return { configured: true, ...result };
}
