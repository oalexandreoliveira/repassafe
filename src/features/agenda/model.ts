import type { ShiftStatus } from "@/styles/theme";
import { dayKey } from "@/features/shifts/format";
import { addDays, type AgendaKind } from "./schema";

/**
 * Agenda do mês: plantões e pagamentos vindos dos registros do app (só
 * leitura) e das anotações pessoais. Regras puras, sem acesso a dados.
 */
export type AgendaSource = "personal" | "mural" | "registered";

export type AgendaShift = {
  key: string;
  source: AgendaSource;
  id: string;
  /** Destino do plantão (anotação ou tela do repasse/acordo). */
  href: string;
  /** Destino do pagamento (acompanhamento do app ou a própria anotação). */
  paymentHref: string;
  /** Papel do usuário: "passed" = repassou e paga; "took"/"own" = recebe. */
  kind: AgendaKind;
  startsAt: string;
  endsAt: string;
  /** "UTI · Hospital X" */
  title: string;
  valueCents: number | null;
  /** YYYY-MM-DD */
  dueDate: string | null;
  counterparty: string;
  cancelled: boolean;
  /** Recebimento confirmado (app) ou marcado pelo autor (anotação). */
  settled: boolean;
  settledCents: number | null;
  /** Pagamento informado pelo pagador, ainda sem confirmação (app). */
  reported: boolean;
};

export type PaymentDirection = "receive" | "pay";
export type PaymentState =
  "open" | "due_today" | "overdue" | "reported" | "settled";

export type AgendaPayment = {
  key: string;
  shift: AgendaShift;
  direction: PaymentDirection;
  state: PaymentState;
  dueDate: string;
  amountCents: number | null;
};

export type Presentation = { tone: ShiftStatus; label: string };

export function paymentDirection(kind: AgendaKind): PaymentDirection {
  return kind === "passed" ? "pay" : "receive";
}

/** Vencimento na virada para o dia seguinte, como no acordo registrado. */
export function paymentState(shift: AgendaShift, today: string): PaymentState {
  if (shift.settled) return "settled";
  if (!shift.dueDate) return "open";
  if (today > shift.dueDate) return "overdue";
  if (shift.reported) return "reported";
  return today === shift.dueDate ? "due_today" : "open";
}

export function paymentPresentation(
  payment: Pick<AgendaPayment, "direction" | "state"> & {
    shift: Pick<AgendaShift, "source">;
  },
): Presentation {
  const receive = payment.direction === "receive";
  switch (payment.state) {
    case "settled":
      return {
        tone: "confirmed",
        label:
          payment.shift.source === "personal"
            ? receive
              ? "Recebido"
              : "Pago"
            : "Recebimento confirmado",
      };
    case "overdue":
      return {
        tone: "pending",
        label: receive ? "Vencido — não recebido" : "Vencido — não pago",
      };
    case "due_today":
      return { tone: "pending", label: "Vence hoje" };
    case "reported":
      return { tone: "institutional", label: "Pagamento informado" };
    default:
      return {
        tone: "institutional",
        label: receive ? "A receber" : "A pagar",
      };
  }
}

export const sourceLabels: Record<AgendaSource, string> = {
  personal: "Anotação pessoal",
  mural: "Repasse confirmado",
  registered: "Acordo registrado",
};

export function shiftPresentation(shift: AgendaShift): Presentation {
  if (shift.cancelled) return { tone: "cancelled", label: "Repasse cancelado" };
  if (shift.source === "personal")
    return { tone: "empty", label: sourceLabels.personal };
  return shift.source === "mural"
    ? { tone: "confirmed", label: sourceLabels.mural }
    : { tone: "registered", label: sourceLabels.registered };
}

/** Papel do usuário no plantão, no vocabulário de cada origem. */
export function roleText(shift: Pick<AgendaShift, "kind" | "source">) {
  if (shift.source === "personal")
    return {
      own: "Meu plantão",
      took: "Assumi de um colega",
      passed: "Repassei a um colega",
    }[shift.kind];
  return shift.kind === "passed" ? "Você repassou" : "Você assumiu";
}

/* ---------- Mês ---------- */

const monthNames = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function parseMonth(value: unknown): string | null {
  return typeof value === "string" &&
    /^(20[2-9]\d)-(0[1-9]|1[0-2])$/.test(value)
    ? value
    : null;
}

export function monthOf(date: string) {
  return date.slice(0, 7);
}

export function addMonths(month: string, delta: number) {
  const [year, index] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, index - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

/** "novembro de 2026" */
export function monthLabel(month: string) {
  const [year, index] = month.split("-").map(Number);
  return `${monthNames[index - 1]} de ${year}`;
}

export function monthName(month: string) {
  return monthNames[Number(month.slice(5, 7)) - 1];
}

/** "12 de novembro" */
export function dayLabel(date: string) {
  return `${Number(date.slice(8, 10))} de ${monthNames[Number(date.slice(5, 7)) - 1]}`;
}

/** "4, 11 e 18 de novembro; 2 de dezembro" */
export function formatDateList(dates: string[]) {
  const byMonth = new Map<string, number[]>();
  for (const date of [...dates].sort()) {
    const days = byMonth.get(monthOf(date)) ?? [];
    days.push(Number(date.slice(8, 10)));
    byMonth.set(monthOf(date), days);
  }
  const list = new Intl.ListFormat("pt-BR", {
    style: "long",
    type: "conjunction",
  });
  return [...byMonth.entries()]
    .map(
      ([month, days]) =>
        `${list.format(days.map(String))} de ${monthName(month)}`,
    )
    .join("; ");
}

/** Limites do mês no fuso do produto, para consultas. */
export function monthBounds(month: string) {
  const firstDay = `${month}-01`;
  const nextFirstDay = `${addMonths(month, 1)}-01`;
  return {
    firstDay,
    nextFirstDay,
    startIso: new Date(`${firstDay}T00:00:00-03:00`).toISOString(),
    endIso: new Date(`${nextFirstDay}T00:00:00-03:00`).toISOString(),
  };
}

export type GridCell = {
  date: string;
  day: number;
  isToday: boolean;
  shiftCount: number;
  paymentCount: number;
  hasOverdue: boolean;
};

/** Semanas de domingo a sábado; células nulas completam a primeira e a última. */
export function monthGrid(
  month: string,
  today: string,
  counts: Map<string, { shifts: number; payments: number; overdue: boolean }>,
): (GridCell | null)[][] {
  const { firstDay, nextFirstDay } = monthBounds(month);
  const leading = new Date(`${firstDay}T12:00:00Z`).getUTCDay();
  const cells: (GridCell | null)[] = Array.from(
    { length: leading },
    () => null,
  );
  for (let date = firstDay; date < nextFirstDay; date = addDays(date, 1)) {
    const count = counts.get(date);
    cells.push({
      date,
      day: Number(date.slice(8, 10)),
      isToday: date === today,
      shiftCount: count?.shifts ?? 0,
      paymentCount: count?.payments ?? 0,
      hasOverdue: count?.overdue ?? false,
    });
  }
  while (cells.length % 7) cells.push(null);
  const weeks: (GridCell | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7)
    weeks.push(cells.slice(index, index + 7));
  return weeks;
}

/** Plantões em que o usuário trabalha (não repassados nem cancelados) com horário sobreposto. */
export function overlappingKeys(shifts: AgendaShift[]) {
  const working = shifts
    .filter((shift) => shift.kind !== "passed" && !shift.cancelled)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const keys = new Set<string>();
  for (let i = 0; i < working.length; i += 1)
    for (let j = i + 1; j < working.length; j += 1) {
      if (Date.parse(working[j].startsAt) >= Date.parse(working[i].endsAt))
        break;
      keys.add(working[i].key);
      keys.add(working[j].key);
    }
  return keys;
}

export type SummaryLine = { total: number; app: number; personal: number };
export type MonthSummary = {
  received: SummaryLine;
  receivable: SummaryLine;
  overdue: SummaryLine;
  payable: SummaryLine;
  /** Pagamentos do mês sem valor informado (não entram nos totais). */
  withoutValue: number;
  /** Algum pagamento do mês veio de cada origem. */
  hasApp: boolean;
  hasPersonal: boolean;
};

const line = (): SummaryLine => ({ total: 0, app: 0, personal: 0 });

export function summarize(payments: AgendaPayment[]): MonthSummary {
  const summary: MonthSummary = {
    received: line(),
    receivable: line(),
    overdue: line(),
    payable: line(),
    withoutValue: 0,
    hasApp: false,
    hasPersonal: false,
  };
  for (const payment of payments) {
    const personal = payment.shift.source === "personal";
    if (personal) summary.hasPersonal = true;
    else summary.hasApp = true;
    const settledAmount =
      payment.state === "settled"
        ? (payment.shift.settledCents ?? payment.amountCents)
        : payment.amountCents;
    if (settledAmount === null) {
      summary.withoutValue += 1;
      continue;
    }
    const target =
      payment.direction === "pay"
        ? payment.state === "settled"
          ? null
          : summary.payable
        : payment.state === "settled"
          ? summary.received
          : payment.state === "overdue"
            ? summary.overdue
            : summary.receivable;
    if (!target) continue;
    target.total += settledAmount;
    if (personal) target.personal += settledAmount;
    else target.app += settledAmount;
  }
  return summary;
}

export const agendaFilters = ["tudo", "plantoes", "pagamentos"] as const;
export type AgendaFilter = (typeof agendaFilters)[number];

export function parseFilter(value: unknown): AgendaFilter {
  return agendaFilters.includes(value as AgendaFilter)
    ? (value as AgendaFilter)
    : "tudo";
}

export type AgendaDay = {
  date: string;
  shifts: AgendaShift[];
  payments: AgendaPayment[];
};

export type AgendaMonth = {
  month: string;
  days: AgendaDay[];
  grid: (GridCell | null)[][];
  summary: MonthSummary;
  overlaps: Set<string>;
  /** Total do mês antes do filtro. */
  shiftCount: number;
  paymentCount: number;
};

/** Monta o mês: plantões pelo dia de início, pagamentos pelo vencimento. */
export function buildAgendaMonth(
  shifts: AgendaShift[],
  month: string,
  today: string,
  filter: AgendaFilter = "tudo",
): AgendaMonth {
  const monthShifts = shifts
    .filter((shift) => monthOf(dayKey(shift.startsAt)) === month)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const payments: AgendaPayment[] = shifts
    .filter(
      (shift) =>
        !shift.cancelled && shift.dueDate && monthOf(shift.dueDate) === month,
    )
    .map((shift) => ({
      key: `${shift.key}:payment`,
      shift,
      direction: paymentDirection(shift.kind),
      state: paymentState(shift, today),
      dueDate: shift.dueDate!,
      amountCents: shift.valueCents,
    }))
    .sort(
      (a, b) =>
        a.dueDate.localeCompare(b.dueDate) ||
        a.shift.startsAt.localeCompare(b.shift.startsAt),
    );

  const counts = new Map<
    string,
    { shifts: number; payments: number; overdue: boolean }
  >();
  const byDay = new Map<string, AgendaDay>();
  const day = (date: string) => {
    let entry = byDay.get(date);
    if (!entry) {
      entry = { date, shifts: [], payments: [] };
      byDay.set(date, entry);
    }
    return entry;
  };
  const count = (date: string) => {
    let entry = counts.get(date);
    if (!entry) {
      entry = { shifts: 0, payments: 0, overdue: false };
      counts.set(date, entry);
    }
    return entry;
  };
  if (filter !== "pagamentos")
    for (const shift of monthShifts) {
      const date = dayKey(shift.startsAt);
      day(date).shifts.push(shift);
      count(date).shifts += 1;
    }
  if (filter !== "plantoes")
    for (const payment of payments) {
      day(payment.dueDate).payments.push(payment);
      const entry = count(payment.dueDate);
      entry.payments += 1;
      if (payment.state === "overdue") entry.overdue = true;
    }

  return {
    month,
    days: [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date)),
    grid: monthGrid(month, today, counts),
    summary: summarize(payments),
    overlaps: overlappingKeys(monthShifts),
    shiftCount: monthShifts.length,
    paymentCount: payments.length,
  };
}
