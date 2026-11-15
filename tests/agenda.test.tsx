import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addMonths,
  buildAgendaMonth,
  formatDateList,
  monthBounds,
  monthGrid,
  overlappingKeys,
  paymentPresentation,
  paymentState,
  summarize,
  type AgendaPayment,
  type AgendaShift,
} from "@/features/agenda/model";
import {
  agendaCommandInput,
  agendaEntrySchema,
  agendaFailure,
  agendaFormObject,
  composeShifts,
  settleSchema,
} from "@/features/agenda/schema";
import { personalShift, type AgendaEntryRow } from "@/features/agenda/rows";
import { TabBar, activeTab } from "@/components/ui/tab-bar";

vi.mock("next/navigation", () => ({ usePathname: () => "/agenda" }));
vi.mock("@/app/agenda/actions", () => ({
  saveAgendaEntryAction: vi.fn(),
  settleAgendaEntryAction: vi.fn(),
  unsettleAgendaEntryAction: vi.fn(),
  deleteAgendaEntryAction: vi.fn(),
}));

afterEach(cleanup);

const at = (date: string, time: string) =>
  new Date(`${date}T${time}:00-03:00`).toISOString();

const shift = (overrides: Partial<AgendaShift>): AgendaShift => ({
  key: "personal:a",
  source: "personal",
  id: "a",
  href: "/agenda/a",
  paymentHref: "/agenda/a",
  kind: "own",
  startsAt: at("2026-11-04", "19:00"),
  endsAt: at("2026-11-05", "07:00"),
  title: "UTI · Hospital",
  valueCents: 180000,
  dueDate: "2026-11-20",
  counterparty: "Cooperativa",
  cancelled: false,
  settled: false,
  settledCents: null,
  reported: false,
  ...overrides,
});

const validForm = {
  requestId: "5a0e1c2d-0000-4000-8000-000000000001",
  kind: "own",
  dates: ["2026-11-18"],
  start: "19:00",
  end: "07:00",
  location: "Hospital Exemplo",
  sector: "UTI",
  value: "1800,00",
  dueMode: "days",
  dueDate: "",
  dueDays: "60",
  paymentMethod: "Pix",
  counterparty: "Cooperativa",
  notes: "",
};

describe("agenda: estado do pagamento", () => {
  it("vence na virada para o dia seguinte e prioriza a confirmação", () => {
    const due = shift({ dueDate: "2026-11-15" });
    expect(paymentState(due, "2026-11-14")).toBe("open");
    expect(paymentState(due, "2026-11-15")).toBe("due_today");
    expect(paymentState(due, "2026-11-16")).toBe("overdue");
    expect(paymentState({ ...due, settled: true }, "2026-11-30")).toBe(
      "settled",
    );
    expect(paymentState({ ...due, reported: true }, "2026-11-10")).toBe(
      "reported",
    );
    // Pagamento informado sem confirmação continua vencido após o prazo.
    expect(paymentState({ ...due, reported: true }, "2026-11-16")).toBe(
      "overdue",
    );
  });

  it("descreve o estado em texto conforme quem recebe ou paga", () => {
    const personal = { source: "personal" as const };
    expect(
      paymentPresentation({
        direction: "receive",
        state: "overdue",
        shift: personal,
      }),
    ).toEqual({ tone: "pending", label: "Vencido — não recebido" });
    expect(
      paymentPresentation({ direction: "pay", state: "open", shift: personal })
        .label,
    ).toBe("A pagar");
    expect(
      paymentPresentation({
        direction: "pay",
        state: "settled",
        shift: personal,
      }).label,
    ).toBe("Pago");
    expect(
      paymentPresentation({
        direction: "receive",
        state: "settled",
        shift: { source: "mural" },
      }).label,
    ).toBe("Recebimento confirmado");
  });
});

describe("agenda: mês", () => {
  it("calcula os limites do mês no fuso do produto", () => {
    expect(monthBounds("2026-12")).toEqual({
      firstDay: "2026-12-01",
      nextFirstDay: "2027-01-01",
      startIso: "2026-12-01T03:00:00.000Z",
      endIso: "2027-01-01T03:00:00.000Z",
    });
    expect(addMonths("2026-01", -1)).toBe("2025-12");
  });

  it("monta semanas de domingo a sábado", () => {
    const weeks = monthGrid("2026-11", "2026-11-15", new Map());
    expect(weeks[0][0]?.date).toBe("2026-11-01");
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    const cells = weeks.flat().filter(Boolean);
    expect(cells).toHaveLength(30);
    expect(cells.find((cell) => cell?.isToday)?.date).toBe("2026-11-15");
  });

  it("coloca o plantão no dia de início e o pagamento no vencimento", () => {
    const night = shift({
      startsAt: at("2026-10-31", "19:00"),
      endsAt: at("2026-11-01", "07:00"),
      dueDate: "2026-11-30",
    });
    const november = buildAgendaMonth([night], "2026-11", "2026-11-15");
    expect(november.shiftCount).toBe(0);
    expect(november.paymentCount).toBe(1);
    expect(november.days.map((day) => day.date)).toEqual(["2026-11-30"]);
    const october = buildAgendaMonth([night], "2026-10", "2026-11-15");
    expect(october.days.map((day) => day.date)).toEqual(["2026-10-31"]);
    expect(october.paymentCount).toBe(0);
  });

  it("filtra a lista sem mudar os totais do mês", () => {
    const month = buildAgendaMonth(
      [shift({ dueDate: "2026-11-20" })],
      "2026-11",
      "2026-11-15",
      "pagamentos",
    );
    expect(month.days.flatMap((day) => day.shifts)).toHaveLength(0);
    expect(month.days.flatMap((day) => day.payments)).toHaveLength(1);
    expect(month.shiftCount).toBe(1);
  });

  it("tira repasses cancelados dos pagamentos", () => {
    const month = buildAgendaMonth(
      [shift({ source: "mural", cancelled: true })],
      "2026-11",
      "2026-11-15",
    );
    expect(month.paymentCount).toBe(0);
    expect(month.shiftCount).toBe(1);
  });

  it("aponta sobreposição só entre plantões em que o médico trabalha", () => {
    const a = shift({ key: "a" });
    const b = shift({
      key: "b",
      startsAt: at("2026-11-05", "06:00"),
      endsAt: at("2026-11-05", "12:00"),
    });
    const passed = shift({ key: "c", kind: "passed" });
    const later = shift({
      key: "d",
      startsAt: at("2026-11-05", "07:00"),
      endsAt: at("2026-11-05", "19:00"),
    });
    expect([...overlappingKeys([a, passed])]).toEqual([]);
    expect([...overlappingKeys([a, b])].sort()).toEqual(["a", "b"]);
    expect([...overlappingKeys([a, later])]).toEqual([]);
  });

  it("escreve listas de datas por mês", () => {
    expect(formatDateList(["2026-11-25", "2026-11-04", "2026-12-02"])).toBe(
      "4 e 25 de novembro; 2 de dezembro",
    );
  });
});

describe("agenda: resumo do mês", () => {
  const payment = (
    overrides: Partial<AgendaShift>,
    state: AgendaPayment["state"],
  ): AgendaPayment => {
    const base = shift(overrides);
    return {
      key: base.key,
      shift: base,
      direction: base.kind === "passed" ? "pay" : "receive",
      state,
      dueDate: base.dueDate!,
      amountCents: base.valueCents,
    };
  };

  it("separa recebido, a receber, vencido e a pagar sem somar duas vezes", () => {
    const summary = summarize([
      payment({ settled: true, settledCents: 162000 }, "settled"),
      payment({}, "open"),
      payment({ source: "mural", valueCents: 150000 }, "reported"),
      payment({}, "overdue"),
      payment({ kind: "passed", valueCents: 130000 }, "due_today"),
      payment({ kind: "passed", valueCents: 50000 }, "settled"),
      payment({ valueCents: null }, "open"),
    ]);
    expect(summary.received).toEqual({
      total: 162000,
      app: 0,
      personal: 162000,
    });
    expect(summary.receivable).toEqual({
      total: 330000,
      app: 150000,
      personal: 180000,
    });
    expect(summary.overdue.total).toBe(180000);
    expect(summary.payable.total).toBe(130000);
    expect(summary.withoutValue).toBe(1);
    expect(summary.hasApp && summary.hasPersonal).toBe(true);
  });
});

describe("agenda: formulário", () => {
  const schema = agendaEntrySchema("2026-11-15");

  it("aceita valor e prazo opcionais", () => {
    const parsed = schema.parse({
      ...validForm,
      value: "",
      dueMode: "none",
    });
    expect(parsed.value).toBeNull();
    expect(composeShifts(parsed)[0].due_date).toBeNull();
  });

  it("converte plantão noturno e prazo em dias para cada data", () => {
    const parsed = schema.parse({
      ...validForm,
      dates: ["2026-11-25", "2026-11-18"],
    });
    expect(composeShifts(parsed)).toEqual([
      {
        starts_at: "2026-11-18T22:00:00.000Z",
        ends_at: "2026-11-19T10:00:00.000Z",
        due_date: "2027-01-17",
      },
      {
        starts_at: "2026-11-25T22:00:00.000Z",
        ends_at: "2026-11-26T10:00:00.000Z",
        due_date: "2027-01-24",
      },
    ]);
    expect(agendaCommandInput(parsed).value_cents).toBe(180000);
  });

  it("trata início igual ao término como plantão de 24 horas", () => {
    const parsed = schema.parse({ ...validForm, start: "07:00", end: "07:00" });
    const [only] = composeShifts(parsed);
    expect(Date.parse(only.ends_at) - Date.parse(only.starts_at)).toBe(
      24 * 3_600_000,
    );
  });

  it("indica o campo de cada erro", () => {
    const result = schema.safeParse({
      ...validForm,
      kind: "",
      dates: [],
      location: " ",
      value: "abc",
      dueMode: "date",
      dueDate: "2026-11-10",
    });
    expect(result.success).toBe(false);
    const fields = new Set(
      result.error?.issues.map((issue) => String(issue.path[0])),
    );
    expect(fields).toEqual(new Set(["kind", "dates", "location", "value"]));
  });

  it("exige data-limite no dia do último plantão ou depois", () => {
    const result = schema.safeParse({
      ...validForm,
      dates: ["2026-11-18", "2026-11-25"],
      dueMode: "date",
      dueDate: "2026-11-20",
    });
    expect(result.error?.issues[0]).toMatchObject({
      path: ["dueDate"],
      message:
        "A data-limite deve ser no dia do último plantão escolhido ou depois.",
    });
  });

  it("limita datas, prazo em dias e período aceito", () => {
    const issues = (input: Partial<typeof validForm>) =>
      schema
        .safeParse({ ...validForm, ...input })
        .error?.issues.map((issue) => issue.message);
    expect(
      issues({
        dates: Array.from(
          { length: 32 },
          (_, index) => `2026-12-${String(index + 1).padStart(2, "0")}`,
        ),
      }),
    ).toContain("Selecione no máximo 31 datas.");
    expect(issues({ dueDays: "0" })).toContain("Informe de 1 a 365 dias.");
    expect(issues({ dates: ["2024-01-01"] })).toContain(
      "Escolha datas entre dois anos atrás e um ano à frente.",
    );
  });

  it("lê várias datas do FormData", () => {
    const data = new FormData();
    data.append("dates", "2026-11-18");
    data.append("dates", "2026-11-25");
    data.append("location", "Hospital");
    const object = agendaFormObject(data);
    expect(object.dates).toEqual(["2026-11-18", "2026-11-25"]);
    expect(object.dueMode).toBe("none");
  });

  it("aceita recebimento só até hoje", () => {
    const settle = settleSchema("2026-11-15");
    const entryId = validForm.requestId;
    expect(
      settle.safeParse({ entryId, settledOn: "2026-11-16", amount: "10,00" })
        .success,
    ).toBe(false);
    expect(
      settle.parse({ entryId, settledOn: "2026-11-15", amount: "1620,00" })
        .amount,
    ).toBe(162000);
  });

  it("mostra mensagens conhecidas do banco e esconde as demais", () => {
    expect(agendaFailure("Plantão indisponível")).toBe("Plantão indisponível.");
    expect(agendaFailure("duplicate key value")).toBe(
      "Não foi possível salvar. Atualize a página e tente novamente.",
    );
  });
});

describe("agenda: navegação e telas", () => {
  it("mapeia a rota e exibe a aba só quando permitido", () => {
    expect(activeTab("/agenda")).toBe("agenda");
    expect(activeTab("/agenda/abc/editar")).toBe("agenda");
    render(<TabBar canPublish={false} agenda />);
    expect(screen.getByRole("link", { name: "Agenda" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("link", { name: "Publicar" })).toBeNull();
    cleanup();
    render(<TabBar canPublish={false} />);
    expect(screen.queryByRole("link", { name: "Agenda" })).toBeNull();
  });

  it("identifica anotações pessoais, avisa vencidos e liga os dias à lista", async () => {
    const { AgendaScreen } = await import("@/components/screens/agenda");
    const agenda = buildAgendaMonth(
      [
        shift({ dueDate: "2026-11-13" }),
        shift({
          key: "registered:b",
          source: "registered",
          id: "b",
          href: "/acordos/registrados/b",
          paymentHref: "/acordos/registrados/b",
          kind: "passed",
          startsAt: at("2026-11-26", "07:00"),
          endsAt: at("2026-11-26", "19:00"),
          dueDate: "2026-11-30",
          counterparty: "",
        }),
      ],
      "2026-11",
      "2026-11-15",
    );
    render(
      <AgendaScreen
        agenda={agenda}
        filter="tudo"
        isCurrent
        failed={false}
        unread={false}
        canPublish
      />,
    );
    expect(screen.getAllByText("Anotação pessoal").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Acordo registrado").length).toBeGreaterThan(0);
    expect(screen.getByText("Vencido — não recebido")).toBeInTheDocument();
    // Chip do pagamento a fazer (o rótulo também aparece no resumo).
    expect(
      screen
        .getAllByText("A pagar")
        .some(
          (element) => element.getAttribute("data-tone") === "institutional",
        ),
    ).toBe(true);
    const calendar = screen.getByRole("table", {
      name: /Calendário de novembro/,
    });
    expect(
      within(calendar).getByRole("link", {
        name: "13 de novembro: 1 pagamento, com vencimento passado",
      }),
    ).toHaveAttribute("href", "#dia-2026-11-13");
    expect(
      screen.getByText(/O Repassafe não intermedeia pagamentos/),
    ).toBeInTheDocument();
    // Registros do app levam às telas existentes, sem ação de edição.
    expect(screen.queryByRole("link", { name: /Editar/ })).toBeNull();
  });

  it("mostra a diferença entre o valor previsto e o recebido", async () => {
    const { AgendaEntryScreen } =
      await import("@/components/screens/agenda-entry");
    const entry: AgendaEntryRow = {
      id: "5a0e1c2d-0000-4000-8000-000000000002",
      kind: "took",
      starts_at: at("2026-10-03", "07:00"),
      ends_at: at("2026-10-03", "19:00"),
      location: "Hospital",
      sector: "PS",
      value_cents: 180000,
      due_date: "2026-11-02",
      payment_method: "Pix",
      counterparty: "Dra. Exemplo",
      notes: "",
      settled_on: "2026-11-03",
      settled_cents: 162000,
      created_at: at("2026-10-01", "10:00"),
      updated_at: at("2026-10-01", "10:00"),
    };
    expect(personalShift(entry).settled).toBe(true);
    render(
      <AgendaEntryScreen
        entry={entry}
        today="2026-11-15"
        startsInFuture={false}
      />,
    );
    expect(screen.getByText("Recebido")).toBeInTheDocument();
    expect(
      screen.getByText("R$ 180,00 a menos que o previsto."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Desfazer marcação" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Dra. Exemplo")).toBeInTheDocument();
  });
});
