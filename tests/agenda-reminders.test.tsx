import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  collectionMessage,
  nextReminderDate,
  reminderDates,
  reminderDescription,
  reminderFrom,
  whatsappHref,
  type AgendaShift,
} from "@/features/agenda/model";
import {
  agendaCommandInput,
  agendaEntrySchema,
  agendaFormObject,
  defaultReminder,
  recordReminderSchema,
} from "@/features/agenda/schema";
import { notificationPresentation } from "@/components/screens/notifications-list";

vi.mock("next/navigation", () => ({ usePathname: () => "/agenda" }));
vi.mock("@/app/agenda/actions", () => ({
  saveAgendaEntryAction: vi.fn(),
  settleAgendaEntryAction: vi.fn(),
  unsettleAgendaEntryAction: vi.fn(),
  deleteAgendaEntryAction: vi.fn(),
  saveRecordReminderAction: vi.fn(),
}));

afterEach(cleanup);

const at = (date: string, time: string) =>
  new Date(`${date}T${time}:00-03:00`).toISOString();

describe("lembretes: datas previstas (espelho da regra do banco)", () => {
  it("avisa antes, no vencimento e repete por até 182 dias", () => {
    const dates = reminderDates("2026-11-20", { leadDays: 3, repeatDays: 7 });
    expect(dates.slice(0, 3)).toEqual([
      "2026-11-17",
      "2026-11-20",
      "2026-11-27",
    ]);
    expect(dates.at(-1)).toBe("2027-05-21"); // 20/11 + 182 dias
    expect(dates).toHaveLength(2 + 26);
    expect(
      reminderDates("2026-11-20", { leadDays: 0, repeatDays: 15 }),
    ).toHaveLength(1 + 12);
    expect(reminderDates("2026-11-20", { leadDays: 0, repeatDays: 0 })).toEqual(
      ["2026-11-20"],
    );
  });

  it("calcula o próximo aviso e respeita o lembrete desligado", () => {
    const settings = { enabled: true, leadDays: 3, repeatDays: 7 };
    expect(nextReminderDate("2026-11-20", settings, "2026-11-15")).toBe(
      "2026-11-17",
    );
    expect(nextReminderDate("2026-11-20", settings, "2026-11-18")).toBe(
      "2026-11-20",
    );
    expect(nextReminderDate("2026-11-20", settings, "2027-06-01")).toBeNull();
    expect(
      nextReminderDate(
        "2026-11-20",
        { ...settings, enabled: false },
        "2026-11-15",
      ),
    ).toBeNull();
    expect(nextReminderDate(null, settings, "2026-11-15")).toBeNull();
  });

  it("depois das 8h o aviso do dia já saiu", () => {
    expect(reminderFrom("2026-11-15", 7)).toBe("2026-11-15");
    expect(reminderFrom("2026-11-15", 8)).toBe("2026-11-16");
  });

  it("descreve o lembrete em texto pela direção do pagamento", () => {
    expect(reminderDescription(defaultReminder, "receive")).toBe(
      "Aviso na central do app às 8h: no dia do vencimento, depois toda semana até você marcar como recebido, por até 6 meses.",
    );
    expect(
      reminderDescription({ enabled: true, leadDays: 1, repeatDays: 0 }, "pay"),
    ).toBe("Aviso na central do app às 8h: 1 dia antes do vencimento.");
    expect(
      reminderDescription({ ...defaultReminder, enabled: false }, "pay"),
    ).toMatch(/^Desligado/);
  });
});

describe("cobrança pelo WhatsApp", () => {
  const base = {
    startsAt: at("2026-10-12", "19:00"),
    title: "UTI · Hospital X",
    valueCents: 150000,
  };

  it("monta a mensagem sem nomes e muda o tempo verbal após o vencimento", () => {
    expect(
      collectionMessage({
        ...base,
        dueDate: "2026-12-11",
        today: "2026-11-15",
      }),
    ).toBe(
      "Olá, tudo bem? Passando para lembrar do pagamento do plantão de 12/10 (UTI · Hospital X), no valor de R$ 1.500,00, com vencimento em 11/12. Pode me informar a previsão? Agradeço.",
    );
    expect(
      collectionMessage({
        ...base,
        dueDate: "2026-11-10",
        today: "2026-11-15",
      }),
    ).toContain("que venceu em 10/11");
    expect(
      collectionMessage({
        ...base,
        valueCents: null,
        dueDate: null,
        today: "2026-11-15",
      }),
    ).toBe(
      "Olá, tudo bem? Passando para lembrar do pagamento do plantão de 12/10 (UTI · Hospital X). Pode me informar a previsão? Agradeço.",
    );
  });

  it("abre o WhatsApp sem destinatário, com o texto codificado", () => {
    const href = whatsappHref("Olá & até 12/10?");
    expect(href.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(href.split("text=")[1])).toBe("Olá & até 12/10?");
  });
});

describe("lembretes: formulário e preferência", () => {
  const form = {
    requestId: "5a0e1c2d-0000-4000-8000-000000000001",
    kind: "passed",
    dates: ["2026-11-18"],
    start: "07:00",
    end: "19:00",
    location: "Hospital",
    sector: "",
    value: "",
    dueMode: "date",
    dueDate: "2026-11-30",
    dueDays: "",
    paymentMethod: "",
    counterparty: "",
    notes: "",
    reminderEnabled: "false",
    reminderLead: "7",
    reminderRepeat: "15",
  };

  it("envia o lembrete ao banco junto com a anotação", () => {
    const parsed = agendaEntrySchema("2026-11-15").parse(form);
    expect(agendaCommandInput(parsed).reminder).toEqual({
      enabled: false,
      lead_days: 7,
      repeat_days: 15,
    });
  });

  it("usa o padrão quando o formulário não traz o lembrete", () => {
    const object = agendaFormObject(new FormData());
    expect([
      object.reminderEnabled,
      object.reminderLead,
      object.reminderRepeat,
    ]).toEqual(["true", "0", "7"]);
  });

  it("aceita só as opções oferecidas", () => {
    const schema = agendaEntrySchema("2026-11-15");
    expect(schema.safeParse({ ...form, reminderLead: "2" }).success).toBe(
      false,
    );
    expect(schema.safeParse({ ...form, reminderRepeat: "30" }).success).toBe(
      false,
    );
    expect(
      recordReminderSchema.safeParse({
        source: "external",
        recordId: form.requestId,
        reminderEnabled: "true",
        reminderLead: "0",
        reminderRepeat: "7",
      }).success,
    ).toBe(false);
  });

  it("mostra os avisos da agenda como ação na central", () => {
    expect(notificationPresentation("agenda.payment_reminder")).toMatchObject({
      tone: "action",
      cta: "Abrir na agenda",
    });
  });
});

describe("pagamento do app na agenda", () => {
  const shift = (overrides: Partial<AgendaShift>): AgendaShift => ({
    key: "registered:a",
    source: "registered",
    id: "6b1f2d3e-0000-4000-8000-000000000002",
    href: "/acordos/registrados/a",
    paymentHref: "/agenda/pagamento/acordo/a",
    kind: "took",
    startsAt: at("2026-11-21", "19:00"),
    endsAt: at("2026-11-22", "07:00"),
    title: "Enfermaria · Hospital",
    valueCents: 140000,
    dueDate: "2026-11-27",
    counterparty: "",
    cancelled: false,
    settled: false,
    settledCents: null,
    reported: false,
    ...overrides,
  });

  async function renderScreen(value: AgendaShift) {
    const { AgendaAppPaymentScreen } =
      await import("@/components/screens/agenda-app-payment");
    render(
      <AgendaAppPaymentScreen
        shift={value}
        trackingHref="/acordos/registrados/a"
        reminder={defaultReminder}
        today="2026-11-15"
      />,
    );
  }

  it("quem recebe vê lembrete, cobrança e o caminho para confirmar no acordo", async () => {
    await renderScreen(shift({}));
    expect(screen.getByText("Você assumiu e recebe")).toBeInTheDocument();
    expect(screen.getByText(/Próximo aviso: 27\/11/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Cobrar pelo WhatsApp/ }),
    ).toHaveAttribute("target", "_blank");
    expect(
      screen.getByRole("link", { name: "Confirmar recebimento no acordo" }),
    ).toHaveAttribute("href", "/acordos/registrados/a");
    expect(
      screen.getByRole("button", { name: "Salvar lembrete" }),
    ).toBeInTheDocument();
  });

  it("quem paga e já informou não recebe mais lembretes nem cobra", async () => {
    await renderScreen(shift({ kind: "passed", reported: true }));
    expect(screen.queryByRole("link", { name: /WhatsApp/ })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Salvar lembrete" }),
    ).toBeNull();
    expect(
      screen.getByText(/os lembretes para você foram encerrados/),
    ).toBeInTheDocument();
  });

  it("repasse cancelado não tem pagamento a acompanhar", async () => {
    await renderScreen(shift({ source: "mural", cancelled: true }));
    expect(screen.getByText("Repasse cancelado")).toBeInTheDocument();
    expect(
      screen.getByText(/Não há pagamento a acompanhar/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Próximo aviso/)).toBeNull();
  });
});
