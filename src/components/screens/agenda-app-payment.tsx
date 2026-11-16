import { Users } from "lucide-react";
import { AgendaRecordReminderForm } from "@/components/agenda-record-reminder-form";
import { CalendarExport } from "@/components/agenda-handover";
import {
  CollectOnWhatsApp,
  ReminderStatus,
} from "@/components/agenda-payment-extras";
import { AppScreen, TopBar } from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { InfoBanner } from "@/components/ui/info-banner";
import { KeyValueList } from "@/components/ui/key-value-list";
import { StatusChip } from "@/components/ui/status-chip";
import { Toast } from "@/components/ui/toast";
import {
  collectionMessage,
  monthOf,
  paymentDirection,
  paymentPresentation,
  paymentState,
  shiftPresentation,
  type AgendaShift,
} from "@/features/agenda/model";
import type { ReminderSettings } from "@/features/agenda/schema";
import { PAYMENT_NOTICE } from "@/features/shifts/copy";
import {
  dayKey,
  formatDayShort,
  formatHourRange,
} from "@/features/shifts/format";
import { formatCurrency } from "@/features/shifts/schemas";
import styles from "./screens.module.css";

const displayDate = (date: string) => date.split("-").reverse().join("/");

/**
 * Pagamento de um repasse do app visto pela agenda (derivada): situação,
 * lembrete pessoal e cobrança. Recebimento e pagamento seguem no acordo.
 */
export function AgendaAppPaymentScreen({
  shift,
  trackingHref,
  reminder,
  today,
  reminderFrom = today,
  saved = false,
}: {
  shift: AgendaShift;
  trackingHref: string;
  reminder: ReminderSettings;
  today: string;
  reminderFrom?: string;
  saved?: boolean;
}) {
  const direction = paymentDirection(shift.kind);
  const receive = direction === "receive";
  const origin = shiftPresentation(shift);
  const status =
    shift.dueDate && !shift.cancelled
      ? paymentPresentation({
          direction,
          state: paymentState(shift, today),
          shift,
        })
      : null;
  const open = !shift.cancelled && !shift.settled && shift.dueDate !== null;
  // Quem paga já fez sua parte ao informar o pagamento: os avisos param.
  const remindable = open && !(direction === "pay" && shift.reported);
  const month = monthOf(shift.dueDate ?? dayKey(shift.startsAt));

  return (
    <AppScreen
      header={<TopBar title="Pagamento" backHref={`/agenda?mes=${month}`} />}
    >
      <div className={styles.detailHead}>
        <StatusChip tone={origin.tone}>{origin.label}</StatusChip>
        <h2 className={styles.detailTitle}>{shift.title}</h2>
        <p className={styles.detailGroup}>
          <Users size={14} aria-hidden="true" />
          {receive ? "Você assumiu e recebe" : "Você repassou e paga"}
        </p>
      </div>

      <section className={styles.stack} aria-labelledby="payment-heading">
        <div className={styles.sectionHeader}>
          <h2 id="payment-heading" className={styles.sectionTitle}>
            Pagamento
          </h2>
          {status ? (
            <StatusChip tone={status.tone}>{status.label}</StatusChip>
          ) : null}
        </div>
        <KeyValueList
          items={[
            {
              label: "Valor",
              value:
                shift.valueCents !== null
                  ? formatCurrency(shift.valueCents)
                  : "Não informado",
            },
            {
              label: "Data-limite",
              value: shift.dueDate
                ? displayDate(shift.dueDate)
                : "Conforme as condições originais",
            },
            {
              label: "Plantão",
              value: `${formatDayShort(shift.startsAt)}, ${formatHourRange(shift.startsAt, shift.endsAt)}`,
            },
          ]}
        />
        {shift.cancelled ? (
          <InfoBanner>
            Este repasse foi cancelado. Não há pagamento a acompanhar.
          </InfoBanner>
        ) : null}
        {remindable && shift.dueDate ? (
          <ReminderStatus
            settings={reminder}
            direction={direction}
            dueDate={shift.dueDate}
            from={reminderFrom}
          />
        ) : null}
        {open && receive ? (
          <CollectOnWhatsApp
            message={collectionMessage({
              startsAt: shift.startsAt,
              title: shift.title,
              valueCents: shift.valueCents,
              dueDate: shift.dueDate,
              today,
            })}
          />
        ) : null}
        <ButtonLink href={trackingHref} block>
          {!open
            ? "Ver pagamento no acordo"
            : receive
              ? "Confirmar recebimento no acordo"
              : shift.reported
                ? "Ver pagamento no acordo"
                : "Informar pagamento no acordo"}
        </ButtonLink>
        <p className={styles.help}>
          {receive
            ? "Só você confirma o recebimento, na tela do acordo."
            : shift.reported
              ? "Você já informou o pagamento; os lembretes para você foram encerrados."
              : "Ao informar o pagamento no acordo, os lembretes para você param."}{" "}
          {PAYMENT_NOTICE}
        </p>
      </section>

      {remindable ? (
        <section className={styles.stack} aria-labelledby="reminder-heading">
          <h2 id="reminder-heading" className={styles.sectionTitle}>
            Lembrete
          </h2>
          <AgendaRecordReminderForm
            source={shift.source === "mural" ? "mural" : "registered"}
            recordId={shift.id}
            initial={reminder}
            direction={direction}
          />
        </section>
      ) : null}

      {!shift.cancelled ? (
        <CalendarExport
          action={`${shift.paymentHref}/calendario`}
          withDue={remindable && shift.dueDate !== null}
          detailsLabel="Incluir valor"
        />
      ) : null}

      {saved ? <Toast message="Lembrete salvo" clearParam="salvo" /> : null}
    </AppScreen>
  );
}
