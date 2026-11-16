import { Calendar, Clock, Hourglass, Users } from "lucide-react";
import {
  deleteAgendaEntryAction,
  unsettleAgendaEntryAction,
} from "@/app/agenda/actions";
import { AgendaSettleForm } from "@/components/agenda-settle-form";
import {
  CalendarExport,
  HandOverShift,
  HandoverStatus,
} from "@/components/agenda-handover";
import { AppScreen, TopBar } from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { InfoBanner } from "@/components/ui/info-banner";
import { InfoTile, InfoTileGrid } from "@/components/ui/info-tile";
import {
  KeyValueList,
  type KeyValueItem,
} from "@/components/ui/key-value-list";
import { StatusChip } from "@/components/ui/status-chip";
import { SubmitButton } from "@/components/ui/submit-button";
import { Toast } from "@/components/ui/toast";
import {
  CollectOnWhatsApp,
  ReminderStatus,
} from "@/components/agenda-payment-extras";
import {
  collectionMessage,
  monthOf,
  paymentDirection,
  paymentPresentation,
  paymentState,
  type Handover,
} from "@/features/agenda/model";
import { counterpartyLabel, kindLabels } from "@/features/agenda/schema";
import { PAYMENT_NOTICE } from "@/features/shifts/copy";
import {
  dayKey,
  formatDayShort,
  formatDuration,
  formatHourRange,
} from "@/features/shifts/format";
import { formatCurrency } from "@/features/shifts/schemas";
import {
  entryReminder,
  personalShift,
  type AgendaEntryRow,
} from "@/features/agenda/rows";
import styles from "./screens.module.css";

const displayDate = (date: string) => date.split("-").reverse().join("/");
const amountInput = (cents: number) =>
  (cents / 100).toFixed(2).replace(".", ",");

function difference(planned: number | null, actual: number) {
  if (planned === null || planned === actual) return null;
  const delta = Math.abs(planned - actual);
  return `${formatCurrency(delta)} ${actual < planned ? "a menos" : "a mais"} que o previsto`;
}

/** Detalhe de uma anotação pessoal (derivada). */
export function AgendaEntryScreen({
  entry,
  today,
  reminderFrom = today,
  startsInFuture,
  handover,
  canPublish = false,
  saved = false,
  settled = false,
}: {
  entry: AgendaEntryRow;
  today: string;
  /** Primeira data ainda sem aviso (hoje antes das 8h, amanhã depois). */
  reminderFrom?: string;
  /** Acordo registrado exige plantão futuro. */
  startsInFuture: boolean;
  /** Repasse criado a partir de "Meu plantão". */
  handover?: Handover;
  /** Publicar no mural exige aprovação com verificação vigente. */
  canPublish?: boolean;
  saved?: boolean;
  settled?: boolean;
}) {
  const shift = personalShift(entry);
  const receive = paymentDirection(entry.kind) === "receive";
  const month = monthOf(dayKey(entry.starts_at));
  const shiftDay = dayKey(entry.starts_at);
  const hasPayment = entry.value_cents !== null || entry.due_date !== null;
  const status =
    entry.due_date || entry.settled_on
      ? paymentPresentation({
          direction: paymentDirection(entry.kind),
          state: paymentState(shift, today),
          shift,
        })
      : null;

  const paymentItems: KeyValueItem[] = [
    {
      label: "Valor previsto",
      value:
        entry.value_cents !== null
          ? formatCurrency(entry.value_cents)
          : "Não informado",
    },
    {
      label: "Data-limite",
      value: entry.due_date
        ? displayDate(entry.due_date)
        : "Sem prazo definido",
    },
  ];
  if (entry.counterparty)
    paymentItems.push({
      label: counterpartyLabel(entry.kind),
      value: entry.counterparty,
    });
  if (entry.payment_method)
    paymentItems.push({
      label: "Forma de pagamento",
      value: entry.payment_method,
    });
  if (entry.settled_on && entry.settled_cents !== null) {
    paymentItems.push(
      {
        label: receive ? "Recebido em" : "Pago em",
        value: displayDate(entry.settled_on),
      },
      {
        label: receive ? "Valor recebido" : "Valor pago",
        value: formatCurrency(entry.settled_cents),
      },
    );
  }
  const gap =
    entry.settled_cents !== null
      ? difference(entry.value_cents, entry.settled_cents)
      : null;
  const colleague = entry.kind !== "own";
  const future = startsInFuture;
  const label = counterpartyLabel(entry.kind);
  const detailsLabel = `Incluir valor e ${label.charAt(0).toLowerCase()}${label.slice(1)}`;

  return (
    <AppScreen
      header={<TopBar title="Plantão" backHref={`/agenda?mes=${month}`} />}
    >
      <div className={styles.detailHead}>
        <StatusChip tone="empty">Anotação pessoal</StatusChip>
        <h2 className={styles.detailTitle}>{shift.title}</h2>
        <p className={styles.help}>
          Visível só para você e sem aceite de outra parte.
        </p>
      </div>

      <InfoTileGrid label="Dados do plantão">
        <InfoTile
          icon={Calendar}
          label="Data"
          value={formatDayShort(entry.starts_at)}
        />
        <InfoTile
          icon={Clock}
          label="Horário"
          value={formatHourRange(entry.starts_at, entry.ends_at)}
        />
        <InfoTile
          icon={Hourglass}
          label="Duração"
          value={formatDuration(entry.starts_at, entry.ends_at)}
        />
        <InfoTile
          icon={Users}
          label="Tipo"
          value={
            handover?.state === "confirmed"
              ? "Repassado a um colega"
              : kindLabels[entry.kind]
          }
        />
      </InfoTileGrid>

      {handover && entry.kind === "own" ? (
        <HandoverStatus handover={handover} />
      ) : null}

      <section className={styles.stack} aria-labelledby="payment-heading">
        <div className={styles.sectionHeader}>
          <h2 id="payment-heading" className={styles.sectionTitle}>
            Pagamento
          </h2>
          {status ? (
            <StatusChip tone={status.tone}>{status.label}</StatusChip>
          ) : null}
        </div>
        {hasPayment || entry.counterparty || entry.payment_method ? (
          <KeyValueList items={paymentItems} />
        ) : (
          <p className={styles.help}>
            Sem valor nem prazo informados. Edite o plantão para acompanhar o
            pagamento.
          </p>
        )}
        {gap ? <p className={styles.help}>{gap}.</p> : null}
        {entry.due_date && !entry.settled_on ? (
          <ReminderStatus
            settings={entryReminder(entry)}
            direction={paymentDirection(entry.kind)}
            dueDate={entry.due_date}
            from={reminderFrom}
            editHref={`/agenda/${entry.id}/editar`}
          />
        ) : null}
        {receive && !entry.settled_on ? (
          <CollectOnWhatsApp
            message={collectionMessage({
              startsAt: entry.starts_at,
              title: shift.title,
              valueCents: entry.value_cents,
              dueDate: entry.due_date,
              today,
            })}
          />
        ) : null}
        {entry.settled_on ? (
          <form action={unsettleAgendaEntryAction}>
            <input type="hidden" name="entryId" value={entry.id} />
            <SubmitButton variant="ghost" block>
              Desfazer marcação
            </SubmitButton>
          </form>
        ) : (
          <details className={styles.disclosure}>
            <summary>
              {receive ? "Marcar como recebido" : "Marcar como pago"}
            </summary>
            <div className={styles.disclosureBody}>
              <AgendaSettleForm
                entryId={entry.id}
                receive={receive}
                today={today}
                minDate={shiftDay}
                plannedValue={
                  entry.value_cents !== null
                    ? amountInput(entry.value_cents)
                    : ""
                }
              />
            </div>
          </details>
        )}
        <p className={styles.help}>{PAYMENT_NOTICE}</p>
      </section>

      {entry.notes ? (
        <div className={styles.notes}>
          <span className={styles.notesLabel}>Observações</span>
          <p className={styles.notesText}>{entry.notes}</p>
        </div>
      ) : null}

      <CalendarExport
        action={`/agenda/${entry.id}/calendario`}
        withDue={entry.due_date !== null && !entry.settled_on}
        detailsLabel={detailsLabel}
      />
      {entry.kind === "own" && future && !handover ? (
        <HandOverShift entryId={entry.id} canPublish={canPublish} />
      ) : null}

      {colleague && future ? (
        <InfoBanner>
          Para ter o aceite do colega e acompanhar o pagamento pelos dois,
          registre o combinado como acordo.
        </InfoBanner>
      ) : null}

      <div className={styles.actions}>
        <ButtonLink
          href={`/agenda/${entry.id}/editar`}
          variant="secondary"
          block
        >
          Editar plantão
        </ButtonLink>
        {colleague && future ? (
          <ButtonLink href="/acordos/registrados/novo" variant="ghost" block>
            Registrar acordo
          </ButtonLink>
        ) : null}
        <form action={deleteAgendaEntryAction}>
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="month" value={month} />
          <ConfirmSubmit
            question="Excluir esta anotação da agenda? Esta ação não pode ser desfeita."
            confirmLabel="Excluir anotação"
            keepLabel="Manter anotação"
          >
            Excluir anotação
          </ConfirmSubmit>
        </form>
      </div>
      {saved ? <Toast message="Alterações salvas" clearParam="salvo" /> : null}
      {settled ? (
        <Toast
          message={receive ? "Recebimento marcado" : "Pagamento marcado"}
          clearParam="marcado"
        />
      ) : null}
    </AppScreen>
  );
}
