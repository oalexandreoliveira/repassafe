import Link from "next/link";
import { BellRing, MessageCircle } from "lucide-react";
import { buttonClassName } from "@/components/ui/button";
import {
  nextReminderDate,
  reminderDescription,
  whatsappHref,
  type PaymentDirection,
} from "@/features/agenda/model";
import type { ReminderSettings } from "@/features/agenda/schema";
import styles from "./agenda-form.module.css";

const ddmm = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

/** Situação do lembrete: como avisa e quando é o próximo aviso. */
export function ReminderStatus({
  settings,
  direction,
  dueDate,
  from,
  editHref,
}: {
  settings: ReminderSettings;
  direction: PaymentDirection;
  dueDate: string;
  /** Primeira data ainda sem aviso (hoje antes das 8h, amanhã depois). */
  from: string;
  /** Onde alterar, quando a configuração fica em outra tela. */
  editHref?: string;
}) {
  const next = nextReminderDate(dueDate, settings, from);
  return (
    <div className={styles.reminderStatus}>
      <BellRing size={18} aria-hidden="true" />
      <p className={styles.reminderText}>
        <span className={styles.reminderTitle}>Lembrete</span>
        {reminderDescription(settings, direction)}
        {settings.enabled
          ? next
            ? ` Próximo aviso: ${ddmm(next)}.`
            : " Os avisos deste pagamento já foram encerrados."
          : null}
        {editHref ? (
          <>
            {" "}
            <Link href={editHref}>Alterar lembrete</Link>
          </>
        ) : null}
      </p>
    </div>
  );
}

/** Abre o WhatsApp do próprio usuário com a mensagem pronta; nada é enviado pelo app. */
export function CollectOnWhatsApp({ message }: { message: string }) {
  return (
    <div className={styles.collect}>
      <a
        href={whatsappHref(message)}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClassName({ variant: "secondary", block: true })}
      >
        <MessageCircle size={20} aria-hidden="true" />
        Cobrar pelo WhatsApp
        <span className="sr-only"> (abre em outra aba)</span>
      </a>
      <p className={styles.hint}>
        Abre o WhatsApp com uma mensagem para você revisar e escolher o contato.
        O Repassafe não envia nada.
      </p>
    </div>
  );
}
