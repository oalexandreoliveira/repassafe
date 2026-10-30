import { AppScreen, TopBar } from "@/components/ui/app-shell";
import { InfoBanner } from "@/components/ui/info-banner";
import { KeyValueList } from "@/components/ui/key-value-list";
import { PaymentEventForm } from "@/components/payment-event-form";
import { paymentStatus } from "@/features/agreements/schema";
import { formatCurrency, formatDateTime } from "@/features/shifts/schemas";
import { PAYMENT_NOTICE } from "@/features/shifts/copy";
import styles from "@/components/screens/screens.module.css";

export type PaymentEvent = {
  id: string;
  actor_id: string;
  kind: "payment" | "receive" | "dispute" | "source_delay";
  created_at: string;
  paid_on: string | null;
  amount_cents: number | null;
  description: string | null;
};

export function PaymentTracking({
  id,
  userId,
  owner,
  amount,
  terms,
  dueDate,
  events,
  today,
  requestIds,
}: {
  id: string;
  userId: string;
  owner: boolean;
  amount: number;
  terms: string;
  dueDate: string | null;
  events: PaymentEvent[];
  today: string;
  requestIds: Record<PaymentEvent["kind"], string>;
}) {
  const received = events.find((event) => event.kind === "receive");
  const status = received
    ? "Recebimento confirmado"
    : dueDate
      ? paymentStatus(
          dueDate,
          null,
          events.some((event) => event.kind === "payment"),
        )
      : "Prazo conforme as condições originais";
  const labels = {
    payment: "Pagamento informado",
    receive: "Recebimento confirmado",
    dispute: "Divergência registrada",
    source_delay: "Atraso da fonte pagadora relatado",
  };
  const form = (operation: PaymentEvent["kind"]) => (
    <PaymentEventForm
      agreementId={id}
      requestId={requestIds[operation]}
      operation={operation}
      amount={amount}
      today={today}
    />
  );
  return (
    <AppScreen
      header={
        <TopBar title="Acompanhar pagamento" backHref={`/acordos/${id}`} />
      }
    >
      <InfoBanner role="status">{status}</InfoBanner>
      <KeyValueList
        items={[
          { label: "Valor total", value: formatCurrency(amount) },
          {
            label: "Seu papel",
            value: owner ? "Quem repassa e paga" : "Quem assume e recebe",
          },
          { label: "Condições registradas", value: terms, stacked: true },
        ]}
      />
      <p className={styles.help}>
        A confirmação do acordo, a realização do plantão e o recebimento são
        etapas independentes. Falta de confirmação no app não comprova falta de
        pagamento.
      </p>
      {!dueDate && (
        <InfoBanner>
          Este registro anterior não possui data-limite estruturada. As
          condições originais foram preservadas; o app não calcula atraso
          automaticamente.
        </InfoBanner>
      )}
      {!received &&
        (owner ? (
          <details className={styles.disclosure}>
            <summary>Informar pagamento</summary>
            <div className={styles.disclosureBody}>{form("payment")}</div>
          </details>
        ) : (
          form("receive")
        ))}
      {owner && (
        <details className={styles.disclosure}>
          <summary>Relatar atraso da fonte pagadora</summary>
          <div className={styles.disclosureBody}>{form("source_delay")}</div>
        </details>
      )}
      <details className={styles.disclosure}>
        <summary>Informar divergência</summary>
        <div className={styles.disclosureBody}>{form("dispute")}</div>
      </details>
      <section className={styles.stack}>
        <h2 className={styles.sectionTitle}>Histórico do pagamento</h2>
        {events.length ? (
          <ol className={styles.list}>
            {events.map((event) => (
              <li key={event.id} className={styles.panel}>
                <strong>{labels[event.kind]}</strong>
                <p>
                  {event.actor_id === userId ? "Você" : "Outra parte"} ·{" "}
                  {formatDateTime(event.created_at)}
                </p>
                {event.paid_on && (
                  <p>
                    {event.paid_on.split("-").reverse().join("/")} ·{" "}
                    {formatCurrency(event.amount_cents!)}
                  </p>
                )}
                {event.description && <p>{event.description}</p>}
              </li>
            ))}
          </ol>
        ) : (
          <p>Nenhuma atualização registrada.</p>
        )}
      </section>
      <InfoBanner>{PAYMENT_NOTICE}</InfoBanner>
    </AppScreen>
  );
}
