import { buildAgendaMonth, type AgendaShift } from "@/features/agenda/model";
import { personalShift, type AgendaEntryRow } from "@/features/agenda/rows";

/** Dados sintéticos da agenda (nenhum dado real; "hoje" fixo em 15/11/2026). */
export const agendaToday = "2026-11-15";
export const agendaMonth = "2026-11";

const at = (date: string, time: string) =>
  new Date(`${date}T${time}:00-03:00`).toISOString();

export const agendaEntry: AgendaEntryRow = {
  id: "5a0e1c2d-0000-4000-8000-000000000001",
  kind: "own",
  starts_at: at("2026-11-04", "19:00"),
  ends_at: at("2026-11-05", "07:00"),
  location: "Hospital Exemplo",
  sector: "UTI Adulto",
  value_cents: 180000,
  due_date: "2026-11-13",
  payment_method: "Transferência",
  counterparty: "Cooperativa Exemplo",
  notes: "Passagem de plantão presencial às 18h45.",
  settled_on: null,
  settled_cents: null,
  created_at: at("2026-10-20", "10:00"),
  updated_at: at("2026-10-20", "10:00"),
};

export const agendaSettledEntry: AgendaEntryRow = {
  ...agendaEntry,
  id: "5a0e1c2d-0000-4000-8000-000000000002",
  kind: "took",
  starts_at: at("2026-10-03", "07:00"),
  ends_at: at("2026-10-03", "19:00"),
  sector: "Pronto-socorro",
  due_date: "2026-11-02",
  counterparty: "Dra. Exemplo",
  payment_method: "Pix",
  notes: "",
  settled_on: "2026-11-03",
  settled_cents: 162000,
};

const personal = (overrides: Partial<AgendaEntryRow>) =>
  personalShift({ ...agendaEntry, ...overrides });

const app = (overrides: Partial<AgendaShift>): AgendaShift => ({
  key: "mural:fixture",
  source: "mural",
  id: "6b1f2d3e-0000-4000-8000-000000000001",
  href: "/dev/telas/acordos",
  paymentHref: "/dev/telas/pagamento",
  kind: "took",
  startsAt: at("2026-11-21", "19:00"),
  endsAt: at("2026-11-22", "07:00"),
  title: "Enfermaria · Hospital Exemplo",
  valueCents: 150000,
  dueDate: "2026-11-28",
  counterparty: "",
  cancelled: false,
  settled: false,
  settledCents: null,
  reported: false,
  ...overrides,
});

export const agendaShifts: AgendaShift[] = [
  personalShift(agendaEntry),
  personal({
    id: "5a0e1c2d-0000-4000-8000-000000000003",
    starts_at: at("2026-11-11", "19:00"),
    ends_at: at("2026-11-12", "07:00"),
    due_date: "2027-01-10",
  }),
  personal({
    id: "5a0e1c2d-0000-4000-8000-000000000004",
    starts_at: at("2026-11-18", "19:00"),
    ends_at: at("2026-11-19", "07:00"),
    due_date: "2027-01-17",
  }),
  personal({
    id: "5a0e1c2d-0000-4000-8000-000000000005",
    kind: "took",
    location: "Hospital Exemplo Sul",
    sector: "Pronto-socorro",
    starts_at: at("2026-11-18", "13:00"),
    ends_at: at("2026-11-18", "23:00"),
    value_cents: 90000,
    due_date: "2026-11-15",
    counterparty: "Dr. Exemplo",
  }),
  personalShift(agendaSettledEntry),
  app({}),
  {
    ...app({
      key: "registered:fixture",
      source: "registered",
      id: "6b1f2d3e-0000-4000-8000-000000000002",
      href: "/dev/telas/acordos",
      paymentHref: "/dev/telas/acordos",
      kind: "passed",
      startsAt: at("2026-11-26", "07:00"),
      endsAt: at("2026-11-26", "19:00"),
      title: "Centro cirúrgico · Hospital Exemplo",
      valueCents: 130000,
      dueDate: "2026-11-30",
    }),
  },
];

export const agendaFixture = buildAgendaMonth(
  agendaShifts,
  agendaMonth,
  agendaToday,
);
export const agendaEmpty = buildAgendaMonth([], "2026-12", agendaToday);
