import "server-only";
import { PAYMENT_NOTICE } from "@/features/shifts/copy";
import { formatDateTime } from "@/features/shifts/schemas";
import {
  drainEmailQueue,
  emailSender,
  type QueuedEmail,
} from "@/lib/email-queue";

export type CriticalEmailTemplate =
  | "selected"
  | "candidates"
  | "approval_pending"
  | "selection_declined"
  | "confirmation_expired"
  | "approval_rejected"
  | "cancelled"
  | "registration_reviewed";
type CriticalEmail = QueuedEmail & {
  template: CriticalEmailTemplate;
  expires_at: string;
};

/** Resumo mínimo: sem dados do plantão, valores ou campos livres; o detalhe fica atrás do login. */
function criticalEmailContent(item: CriticalEmail) {
  const limit = formatDateTime(item.expires_at);
  const contents: Record<
    CriticalEmailTemplate,
    { subject: string; intro: string; closing?: string }
  > = {
    selected: {
      subject: `Você foi selecionado: responda até ${limit}`,
      intro: `Você foi selecionado para assumir um plantão. Revise as condições e responda até ${limit} (horário de Brasília). Depois disso, a seleção é encerrada e a oferta pode voltar a ficar disponível.`,
      closing: PAYMENT_NOTICE,
    },
    candidates: {
      subject: "Nova candidatura para o seu plantão",
      intro:
        "Um profissional manifestou interesse em um plantão que você publicou. Consulte o perfil profissional e escolha quem vai assumir. Outras candidaturas na próxima hora aparecem no app, sem novo e-mail.",
    },
    approval_pending: {
      subject: "Repasse aguardando sua decisão",
      intro:
        "Um repasse do seu grupo aguarda a decisão institucional. Confira as condições e registre sua decisão.",
    },
    selection_declined: {
      subject: "O candidato recusou o repasse",
      intro:
        "O candidato selecionado recusou o repasse. Consulte o plantão e, se ainda houver tempo, escolha outra candidatura.",
    },
    confirmation_expired: {
      subject: "Prazo de confirmação encerrado",
      intro:
        "O candidato selecionado não confirmou dentro do prazo. Consulte o plantão e, se ainda houver tempo, escolha outra candidatura.",
    },
    approval_rejected: {
      subject: "Repasse rejeitado",
      intro:
        "A instituição rejeitou o repasse. Consulte o plantão para ver a situação atual.",
    },
    cancelled: {
      subject: "Repasse cancelado",
      intro:
        "Um repasse confirmado foi cancelado. Consulte o plantão para ver a justificativa e a situação atual.",
    },
    registration_reviewed: {
      subject: "Seu cadastro foi analisado",
      intro:
        "A equipe do Repassafe analisou seu cadastro. Confira a decisão e os próximos passos.",
    },
  };
  return contents[item.template];
}

export async function dispatchCriticalEmails(stopAt?: number) {
  const sender = emailSender("CRITICAL_EMAIL_ENABLED");
  if (!sender) return { configured: false, accepted: 0, failed: 0 };
  const result = await drainEmailQueue<CriticalEmail>(
    {
      table: "notification_email_deliveries",
      columns:
        "id,template,recipient_email,href,expires_at,state,attempts,attempted_at,first_attempt_at,message",
      idempotencyPrefix: "notification",
      // Prazos mais curtos primeiro: uma seleção não espera avisos sem urgência.
      orderBy: "expires_at",
      limit: 10,
      retryMs: 60_000,
      stopAt,
      close: (item, now) => {
        if (now.valueOf() < Date.parse(item.expires_at)) return null;
        // Uma tentativa anterior pode ter sido aceita pelo provedor sem registro local.
        return item.attempts > 0
          ? {
              state: "uncertain",
              last_error:
                "Prazo do aviso encerrado depois de tentativa sem confirmação.",
            }
          : {
              state: "expired",
              last_error: "Prazo do aviso encerrado antes do envio.",
            };
      },
      compose: (item, { from, origin }) => {
        const { subject, intro, closing } = criticalEmailContent(item);
        const link = new URL(item.href, origin).href;
        return {
          from,
          to: [item.recipient_email],
          subject,
          text: [intro, link, "Entre com sua conta para acessar.", closing]
            .filter(Boolean)
            .join("\n\n"),
        };
      },
    },
    sender,
  );
  return { configured: true, ...result };
}
