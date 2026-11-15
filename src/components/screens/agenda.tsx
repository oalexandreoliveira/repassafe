import Link from "next/link";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
} from "lucide-react";
import {
  AppScreen,
  Fab,
  GroupLabel,
  RootTopBar,
  ScreenHeading,
} from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChipLink, FilterChipList } from "@/components/ui/filter-chip";
import { IconLink } from "@/components/ui/icon-button";
import { InfoBanner } from "@/components/ui/info-banner";
import { KeyValueList } from "@/components/ui/key-value-list";
import { ShiftCard } from "@/components/ui/shift-card";
import { StatusChip } from "@/components/ui/status-chip";
import { TabBar } from "@/components/ui/tab-bar";
import { Toast } from "@/components/ui/toast";
import {
  addMonths,
  dayLabel,
  monthLabel,
  monthName,
  paymentPresentation,
  roleText,
  shiftPresentation,
  sourceLabels,
  type AgendaFilter,
  type AgendaMonth,
  type AgendaPayment,
  type AgendaShift,
  type GridCell,
  type MonthSummary,
} from "@/features/agenda/model";
import { counterpartyLabel } from "@/features/agenda/schema";
import { PAYMENT_NOTICE } from "@/features/shifts/copy";
import {
  formatDayHeading,
  formatHourRangeShort,
  formatShiftDay,
  formatShortDate,
} from "@/features/shifts/format";
import { formatCurrency } from "@/features/shifts/schemas";
import screens from "./screens.module.css";
import styles from "./agenda.module.css";

const weekdays = [
  ["D", "Domingo"],
  ["S", "Segunda-feira"],
  ["T", "Terça-feira"],
  ["Q", "Quarta-feira"],
  ["Q", "Quinta-feira"],
  ["S", "Sexta-feira"],
  ["S", "Sábado"],
] as const;

const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);
const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;
const dueDisplay = (date: string) => formatShortDate(`${date}T12:00:00-03:00`);

function monthHref(month: string, filter: AgendaFilter) {
  return `/agenda?mes=${month}${filter === "tudo" ? "" : `&ver=${filter}`}`;
}

function cellLabel(cell: GridCell) {
  const parts = [
    cell.shiftCount ? plural(cell.shiftCount, "plantão", "plantões") : "",
    cell.paymentCount
      ? plural(cell.paymentCount, "pagamento", "pagamentos")
      : "",
    cell.hasOverdue ? "com vencimento passado" : "",
  ].filter(Boolean);
  return `${dayLabel(cell.date)}${cell.isToday ? ", hoje" : ""}: ${parts.join(", ")}`;
}

function MonthCalendar({
  agenda,
  filter,
  isCurrent,
}: {
  agenda: AgendaMonth;
  filter: AgendaFilter;
  isCurrent: boolean;
}) {
  const label = capitalize(monthLabel(agenda.month));
  return (
    <section className={styles.calendar} aria-labelledby="agenda-month">
      <div className={styles.monthNav}>
        <IconLink
          href={monthHref(addMonths(agenda.month, -1), filter)}
          label="Mês anterior"
          icon={<ChevronLeft size={20} />}
          className={styles.monthButton}
        />
        <h2 id="agenda-month" className={styles.monthTitle} aria-live="polite">
          {label}
        </h2>
        <IconLink
          href={monthHref(addMonths(agenda.month, 1), filter)}
          label="Próximo mês"
          icon={<ChevronRight size={20} />}
          className={styles.monthButton}
        />
      </div>
      <table className={styles.grid}>
        <caption className="sr-only">
          Calendário de {monthLabel(agenda.month)}. Dias com plantões ou
          pagamentos levam à lista abaixo.
        </caption>
        <thead>
          <tr>
            {weekdays.map(([short, long]) => (
              <th key={long} scope="col" abbr={long}>
                {short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {agenda.grid.map((week, index) => (
            <tr key={index}>
              {week.map((cell, column) =>
                cell ? (
                  <td key={cell.date}>
                    {cell.shiftCount || cell.paymentCount ? (
                      <a
                        href={`#dia-${cell.date}`}
                        className={styles.day}
                        aria-label={cellLabel(cell)}
                        aria-current={cell.isToday ? "date" : undefined}
                      >
                        <span className={styles.dayNumber}>{cell.day}</span>
                        <span className={styles.marks} aria-hidden="true">
                          {cell.shiftCount ? (
                            <span className={styles.shiftMark} />
                          ) : null}
                          {cell.paymentCount ? (
                            <span
                              className={`${styles.paymentMark} ${cell.hasOverdue ? styles.overdueMark : ""}`}
                            />
                          ) : null}
                        </span>
                      </a>
                    ) : (
                      <span
                        className={`${styles.day} ${styles.dayIdle}`}
                        aria-current={cell.isToday ? "date" : undefined}
                      >
                        <span className={styles.dayNumber}>{cell.day}</span>
                      </span>
                    )}
                  </td>
                ) : (
                  <td key={`blank-${column}`} aria-hidden="true" />
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className={styles.legend} aria-label="Legenda do calendário">
        <li>
          <span className={styles.shiftMark} aria-hidden="true" />
          Plantão
        </li>
        <li>
          <span className={styles.paymentMark} aria-hidden="true" />
          Pagamento
        </li>
        <li>
          <span
            className={`${styles.paymentMark} ${styles.overdueMark}`}
            aria-hidden="true"
          />
          Vencido
        </li>
        {!isCurrent ? (
          <li className={styles.todayLink}>
            <Link
              href={filter === "tudo" ? "/agenda" : `/agenda?ver=${filter}`}
            >
              Ir para o mês atual
            </Link>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function money(value: number) {
  return <span className={styles.money}>{formatCurrency(value)}</span>;
}

function Summary({ month, summary }: { month: string; summary: MonthSummary }) {
  const rows = [
    ["Recebido", summary.received],
    ["A receber", summary.receivable],
    ["Vencido a receber", summary.overdue],
    ["A pagar", summary.payable],
  ] as const;
  return (
    <section className={screens.stack} aria-labelledby="agenda-summary">
      <h2 id="agenda-summary" className={screens.sectionTitle}>
        Pagamentos com vencimento em {monthName(month)}
      </h2>
      <KeyValueList
        items={rows.map(([label, line]) => ({
          label,
          value: money(line.total),
        }))}
      />
      {summary.hasApp && summary.hasPersonal ? (
        <details className={screens.disclosure}>
          <summary>Ver por origem</summary>
          <div className={screens.disclosureBody}>
            <table className={styles.breakdown}>
              <caption className="sr-only">
                Totais por origem: repasses do Repassafe e anotações pessoais
              </caption>
              <thead>
                <tr>
                  <td />
                  <th scope="col">Repasses do app</th>
                  <th scope="col">Anotações pessoais</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, line]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{money(line.app)}</td>
                    <td>{money(line.personal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
      <p className={screens.help}>
        {summary.withoutValue
          ? `${plural(summary.withoutValue, "pagamento sem valor informado não entra", "pagamentos sem valor informado não entram")} nos totais. `
          : null}
        {PAYMENT_NOTICE}
      </p>
    </section>
  );
}

function shiftMeta(shift: AgendaShift, overlapping: boolean) {
  const parts = [
    shift.valueCents !== null ? formatCurrency(shift.valueCents) : "",
    shift.dueDate ? `pagamento até ${dueDisplay(shift.dueDate)}` : "",
    shift.counterparty,
  ].filter(Boolean);
  if (!parts.length && !overlapping) return undefined;
  return (
    <>
      {parts.join(" · ")}
      {overlapping ? (
        <span className={styles.warning}>
          <CircleAlert size={14} aria-hidden="true" />
          Horário sobreposto a outro plantão
        </span>
      ) : null}
    </>
  );
}

function PaymentCard({ payment }: { payment: AgendaPayment }) {
  const status = paymentPresentation(payment);
  const { shift } = payment;
  const amount =
    payment.state === "settled" && shift.settledCents !== null
      ? shift.settledCents
      : payment.amountCents;
  const action = payment.direction === "receive" ? "Receber" : "Pagar";
  return (
    <article className={styles.paymentCard}>
      <div className={styles.cardTop}>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
        <span className={styles.origin}>{sourceLabels[shift.source]}</span>
      </div>
      <h3 className={styles.amount}>
        <Link href={shift.paymentHref} className={styles.cardLink}>
          <span className="sr-only">{action} </span>
          {amount !== null ? formatCurrency(amount) : "Valor não informado"}
        </Link>
      </h3>
      {shift.counterparty ? (
        <p className={styles.cardLine}>
          {counterpartyLabel(shift.kind)}: {shift.counterparty}
        </p>
      ) : null}
      <p className={styles.cardMeta}>
        Plantão de {formatShiftDay(shift.startsAt)} · {shift.title}
      </p>
    </article>
  );
}

const filterLabels: Record<AgendaFilter, string> = {
  tudo: "Tudo",
  plantoes: "Plantões",
  pagamentos: "Pagamentos",
};

export function AgendaScreen({
  agenda,
  filter,
  isCurrent,
  failed,
  unread,
  canPublish,
  saved,
  deleted,
}: {
  agenda: AgendaMonth;
  filter: AgendaFilter;
  isCurrent: boolean;
  failed: boolean;
  unread: boolean;
  canPublish: boolean;
  saved?: number;
  deleted?: boolean;
}) {
  const empty = !agenda.shiftCount && !agenda.paymentCount;
  const counts: Record<AgendaFilter, number | undefined> = {
    tudo: undefined,
    plantoes: agenda.shiftCount,
    pagamentos: agenda.paymentCount,
  };
  return (
    <AppScreen
      header={<RootTopBar unread={unread} />}
      tabBar={<TabBar canPublish={canPublish} agenda />}
      floating={
        <Fab href={`/agenda/novo?mes=${agenda.month}`}>Adicionar plantão</Fab>
      }
    >
      <ScreenHeading
        title="Agenda"
        subtitle="Seus plantões e pagamentos: repasses confirmados no Repassafe e anotações pessoais."
      />
      {failed ? (
        <InfoBanner variant="warning" role="alert">
          Não foi possível carregar toda a agenda. Os itens abaixo podem estar
          incompletos.{" "}
          <Link href={monthHref(agenda.month, filter)}>Tentar de novo</Link>
        </InfoBanner>
      ) : null}
      <MonthCalendar agenda={agenda} filter={filter} isCurrent={isCurrent} />
      {agenda.paymentCount ? (
        <Summary month={agenda.month} summary={agenda.summary} />
      ) : null}

      {empty ? (
        <EmptyState
          icon={CalendarClock}
          title={`Nada marcado em ${monthName(agenda.month)}`}
          action={
            <ButtonLink href={`/agenda/novo?mes=${agenda.month}`} block>
              Adicionar plantão
            </ButtonLink>
          }
        >
          Adicione os plantões da sua escala e os combinados com colegas para
          acompanhar datas, valores e prazos. Repasses confirmados no Repassafe
          aparecem aqui sozinhos.
        </EmptyState>
      ) : (
        <>
          <FilterChipList label="Mostrar na lista">
            {(Object.keys(filterLabels) as AgendaFilter[]).map((option) => (
              <FilterChipLink
                key={option}
                href={monthHref(agenda.month, option)}
                selected={option === filter}
              >
                {counts[option] === undefined
                  ? filterLabels[option]
                  : `${filterLabels[option]} ${counts[option]}`}
              </FilterChipLink>
            ))}
          </FilterChipList>
          {agenda.days.length ? (
            agenda.days.map((day) => (
              <section
                key={day.date}
                id={`dia-${day.date}`}
                className={`${screens.dayGroup} ${styles.dayGroup}`}
                aria-label={formatDayHeading(`${day.date}T12:00:00-03:00`)}
              >
                <GroupLabel>
                  {formatDayHeading(`${day.date}T12:00:00-03:00`)}
                </GroupLabel>
                <ul className={screens.list}>
                  {day.shifts.map((shift) => (
                    <li key={shift.key}>
                      <ShiftCard
                        status={shiftPresentation(shift)}
                        group={roleText(shift)}
                        title={shift.title}
                        date={formatShiftDay(shift.startsAt)}
                        time={formatHourRangeShort(
                          shift.startsAt,
                          shift.endsAt,
                        )}
                        meta={shiftMeta(shift, agenda.overlaps.has(shift.key))}
                        href={shift.href}
                      />
                    </li>
                  ))}
                  {day.payments.map((payment) => (
                    <li key={payment.key}>
                      <PaymentCard payment={payment} />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <p className={screens.help}>
              {filter === "pagamentos"
                ? `Nenhum pagamento vence em ${monthName(agenda.month)}.`
                : `Nenhum plantão em ${monthName(agenda.month)}.`}
            </p>
          )}
        </>
      )}
      {saved ? (
        <Toast
          message={saved === 1 ? "Plantão salvo" : `${saved} plantões salvos`}
          clearParam="salvos"
        />
      ) : null}
      {deleted ? (
        <Toast message="Anotação excluída" clearParam="excluido" />
      ) : null}
    </AppScreen>
  );
}
