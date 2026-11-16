import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyHandovers,
  buildAgendaMonth,
  overlappingKeys,
  roleText,
  type AgendaShift,
  type Handover,
} from "@/features/agenda/model";
import {
  agendaIcs,
  foldLine,
  icsFileName,
  icsText,
} from "@/features/agenda/ics";
import {
  canHandOver,
  handoverEntryId,
  handoverPrefill,
  matchGroup,
} from "@/features/agenda/handover";
import type { AgendaEntryRow } from "@/features/agenda/rows";
import { defaultReminder } from "@/features/agenda/schema";

vi.mock("next/navigation", () => ({ usePathname: () => "/agenda" }));
vi.mock("@/app/agenda/actions", () => ({
  saveAgendaEntryAction: vi.fn(),
  settleAgendaEntryAction: vi.fn(),
  unsettleAgendaEntryAction: vi.fn(),
  deleteAgendaEntryAction: vi.fn(),
  saveRecordReminderAction: vi.fn(),
}));
vi.mock("@/app/acordos/registrados/actions", () => ({
  createAgreementAction: vi.fn(),
  agreementCommandAction: vi.fn(),
}));

afterEach(cleanup);

const at = (date: string, time: string) =>
  new Date(`${date}T${time}:00-03:00`).toISOString();

const entryId = "5a0e1c2d-0000-4000-8000-000000000009";

const entry = (overrides: Partial<AgendaEntryRow> = {}): AgendaEntryRow => ({
  id: entryId,
  kind: "own",
  starts_at: at("2026-12-12", "19:00"),
  ends_at: at("2026-12-13", "07:00"),
  location: "Hospital São Lucas",
  sector: "UTI",
  value_cents: 180000,
  due_date: "2027-02-10",
  payment_method: "Pix",
  counterparty: "Cooperativa Exemplo",
  notes: "Levar crachá",
  settled_on: null,
  settled_cents: null,
  reminder_enabled: true,
  reminder_lead_days: 3,
  reminder_repeat_days: 7,
  handover_offer_id: null,
  handover_agreement_id: null,
  created_at: at("2026-11-16", "10:00"),
  updated_at: at("2026-11-16", "10:00"),
  ...overrides,
});

const shift = (overrides: Partial<AgendaShift>): AgendaShift => ({
  key: `personal:${entryId}`,
  source: "personal",
  id: entryId,
  href: `/agenda/${entryId}`,
  paymentHref: `/agenda/${entryId}`,
  kind: "own",
  startsAt: at("2026-12-12", "19:00"),
  endsAt: at("2026-12-13", "07:00"),
  title: "UTI · Hospital",
  valueCents: 180000,
  dueDate: "2026-12-20",
  counterparty: "Cooperativa",
  cancelled: false,
  settled: false,
  settledCents: null,
  reported: false,
  ...overrides,
});

const confirmed: Handover = {
  state: "confirmed",
  href: "/plantoes/offer-1",
  paymentHref: "/agenda/pagamento/repasse/agreement-1",
  recordKey: "mural:agreement-1",
};

describe("repasse a partir da agenda: preenchimento", () => {
  it("leva data e horários de Fortaleza, inclusive término no dia seguinte", () => {
    expect(handoverPrefill(entry())).toEqual({
      startsAt: "2026-12-12T19:00",
      endsAt: "2026-12-13T07:00",
      date: "2026-12-12",
      start: "19:00",
      end: "07:00",
      location: "Hospital São Lucas",
      sector: "UTI",
    });
  });

  it("só oferece repasse em Meu plantão futuro e sem repasse aberto", () => {
    const now = Date.parse(at("2026-11-16", "12:00"));
    expect(canHandOver(entry(), undefined, now)).toBe(true);
    expect(canHandOver(entry({ kind: "took" }), undefined, now)).toBe(false);
    expect(
      canHandOver(
        entry({ starts_at: at("2026-11-10", "07:00") }),
        undefined,
        now,
      ),
    ).toBe(false);
    expect(
      canHandOver(entry(), { state: "pending", href: "/plantoes/x" }, now),
    ).toBe(false);
  });

  it("escolhe o grupo da mesma instituição, sem diferenciar acento e caixa", () => {
    const groups = [
      {
        id: "g1",
        name: "Plantonistas UTI",
        institutionName: "Hospital Central",
      },
      { id: "g2", name: "Escala", institutionName: "Hospital Sao Lucas" },
    ];
    expect(matchGroup(groups, "  hospital são  lucas ")).toBe("g2");
    expect(matchGroup(groups, "Outro hospital")).toBeUndefined();
  });

  it("aceita apenas um identificador válido no campo oculto", () => {
    expect(handoverEntryId(entryId)).toBe(entryId);
    expect(handoverEntryId("1; drop table")).toBeNull();
    expect(handoverEntryId(null)).toBeNull();
  });
});

describe("repasse a partir da agenda: plantão unificado", () => {
  const note = shift({});
  const record = shift({
    key: "mural:agreement-1",
    source: "mural",
    id: "agreement-1",
    href: "/plantoes/offer-1",
    paymentHref: "/agenda/pagamento/repasse/agreement-1",
    kind: "passed",
    title: "UTI · Hospital",
    valueCents: 150000,
    dueDate: "2026-12-27",
    counterparty: "",
  });

  it("mostra o plantão uma vez e mantém os dois pagamentos", () => {
    const shifts = applyHandovers(
      [note, record],
      new Map([[entryId, confirmed]]),
    );
    const month = buildAgendaMonth(shifts, "2026-12", "2026-11-16");
    expect(month.shiftCount).toBe(1);
    expect(month.days[0].shifts[0].key).toBe(note.key);
    expect(roleText(month.days[0].shifts[0])).toBe("Repassado a um colega");
    expect(month.paymentCount).toBe(2);
    expect(month.summary.receivable.total).toBe(180000);
    expect(month.summary.payable.total).toBe(150000);
  });

  it("em andamento, o plantão segue como seu e o registro não some", () => {
    const shifts = applyHandovers(
      [note, record],
      new Map([[entryId, { state: "pending", href: "/plantoes/offer-1" }]]),
    );
    expect(roleText(shifts[0])).toBe("Meu plantão · repasse em andamento");
    expect(shifts[1].mergedInto).toBeUndefined();
  });

  it("plantão repassado não conta como sobreposição de horário", () => {
    const other = shift({
      key: "personal:b",
      id: "b",
      kind: "took",
      startsAt: at("2026-12-12", "20:00"),
      endsAt: at("2026-12-13", "08:00"),
    });
    expect(overlappingKeys([note, other]).size).toBe(2);
    const [linked] = applyHandovers([note], new Map([[entryId, confirmed]]));
    expect(overlappingKeys([linked, other]).size).toBe(0);
  });

  it("vínculo só vale para Meu plantão", () => {
    const [took] = applyHandovers(
      [shift({ kind: "took" })],
      new Map([[entryId, confirmed]]),
    );
    expect(took.handover).toBeUndefined();
  });
});

describe("agenda do celular (.ics)", () => {
  const base = {
    uid: entryId,
    kind: "own" as const,
    startsAt: at("2026-12-12", "19:00"),
    endsAt: at("2026-12-13", "07:00"),
    title: "UTI · Hospital São Lucas, ala B",
    location: "Hospital São Lucas; ala B",
    dueDate: "2027-02-10",
    leadDays: 3,
    url: `https://www.repassafe.com.br/agenda/${entryId}`,
    details: null,
    now: new Date("2026-11-16T15:04:05.678Z"),
  };

  it("gera um calendário válido com o plantão em UTC e o vencimento com alarmes", () => {
    const ics = agendaIcs(base);
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.split("\r\n").filter(Boolean)[0]).toBe("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTAMP:20261116T150405Z");
    expect(ics).toContain("DTSTART:20261212T220000Z");
    expect(ics).toContain("DTEND:20261213T100000Z");
    expect(ics).toContain("DTSTART;VALUE=DATE:20270210");
    expect(ics).toContain("DTEND;VALUE=DATE:20270211");
    expect(ics).toContain("TRIGGER;RELATED=START:PT8H");
    expect(ics).toContain("TRIGGER;RELATED=START:-P2DT16H");
    expect(ics).toContain(`UID:${entryId}-plantao@repassafe.com.br`);
    expect(ics).toContain(`UID:${entryId}-vencimento@repassafe.com.br`);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
    // Nenhuma linha passa de 75 octetos e o texto é escapado.
    for (const line of ics.split("\r\n"))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain("LOCATION:Hospital São Lucas\\; ala B");
    expect(unfolded).toContain(
      "SUMMARY:Pagamento a receber vence hoje · Plantão de 12/12",
    );
  });

  it("deixa valor e nomes de fora, salvo pedido explícito", () => {
    const plain = agendaIcs(base).replace(/\r\n /g, "");
    expect(plain).not.toMatch(/1\.800|Cooperativa|crachá/);
    const detailed = agendaIcs({
      ...base,
      details: {
        valueCents: 180000,
        counterparty: "Cooperativa Exemplo",
        counterpartyLabel: "Responsável pelo pagamento",
      },
    }).replace(/\r\n /g, "");
    expect(detailed).toContain("Valor previsto: R$ 1.800\\,00.");
    expect(detailed).toContain(
      "Responsável pelo pagamento: Cooperativa Exemplo.",
    );
  });

  it("sem prazo em aberto, só o plantão; repassado não ocupa a agenda", () => {
    const ics = agendaIcs({ ...base, dueDate: null, handedOver: true });
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).not.toContain("VALARM");
    expect(ics).toContain("TRANSP:TRANSPARENT");
    expect(ics.replace(/\r\n /g, "")).toContain("SUMMARY:Plantão repassado");
  });

  it("quem paga recebe o aviso de pagamento a fazer", () => {
    const ics = agendaIcs({ ...base, kind: "passed", leadDays: 0 });
    expect(ics.replace(/\r\n /g, "")).toContain("Pagamento a fazer vence hoje");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(1);
  });

  it("dobra linhas sem partir caracteres e escapa o texto", () => {
    const folded = foldLine(`DESCRIPTION:${"ç".repeat(60)}`);
    for (const line of folded.split("\r\n"))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, "")).toBe(`DESCRIPTION:${"ç".repeat(60)}`);
    expect(icsText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
    expect(icsFileName(at("2026-12-12", "22:30"))).toBe(
      "plantao-2026-12-12.ics",
    );
  });
});

describe("repasse a partir da agenda: telas", () => {
  async function renderEntry(
    props: { handover?: Handover; canPublish?: boolean; future?: boolean } = {},
  ) {
    const { AgendaEntryScreen } =
      await import("@/components/screens/agenda-entry");
    render(
      <AgendaEntryScreen
        entry={entry()}
        today="2026-11-16"
        startsInFuture={props.future ?? true}
        handover={props.handover}
        canPublish={props.canPublish ?? true}
      />,
    );
  }

  it("Meu plantão futuro oferece publicar ou registrar com os dados da agenda", async () => {
    await renderEntry();
    const panel = screen
      .getByText("Repassar este plantão")
      .closest("details") as HTMLElement;
    expect(
      within(panel).getByRole("link", { name: "Publicar plantão" }),
    ).toHaveAttribute("href", `/plantoes/novo?agenda=${entryId}`);
    expect(
      within(panel).getByRole("link", { name: "Registrar acordo" }),
    ).toHaveAttribute("href", `/acordos/registrados/novo?agenda=${entryId}`);
  });

  it("sem aprovação para publicar, só o acordo registrado", async () => {
    await renderEntry({ canPublish: false });
    expect(screen.queryByRole("link", { name: "Publicar plantão" })).toBeNull();
    expect(
      screen.getByText(/Publicar no mural exige cadastro aprovado/),
    ).toBeInTheDocument();
  });

  it("plantão passado não oferece repasse", async () => {
    await renderEntry({ future: false });
    expect(screen.queryByText("Repassar este plantão")).toBeNull();
  });

  it("repasse confirmado mostra a situação e o pagamento ao colega", async () => {
    await renderEntry({ handover: confirmed });
    expect(screen.queryByText("Repassar este plantão")).toBeNull();
    expect(screen.getByText("Repassado a um colega")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver pagamento ao colega" }),
    ).toHaveAttribute("href", confirmed.paymentHref);
    expect(screen.getByRole("link", { name: "Ver repasse" })).toHaveAttribute(
      "href",
      confirmed.href,
    );
  });

  it("repasse em andamento leva ao acompanhamento", async () => {
    await renderEntry({
      handover: { state: "pending", href: "/acordos/registrados/x" },
    });
    expect(
      screen.getByRole("link", { name: "Acompanhar repasse" }),
    ).toHaveAttribute("href", "/acordos/registrados/x");
  });

  it("baixa o arquivo da agenda sem valor e nomes por padrão", async () => {
    await renderEntry();
    const button = screen.getByRole("button", {
      name: "Baixar arquivo da agenda",
    });
    const form = button.closest("form") as HTMLFormElement;
    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", `/agenda/${entryId}/calendario`);
    const option = within(form).getByRole("checkbox", {
      name: "Incluir valor e responsável pelo pagamento",
    });
    expect(option).not.toBeChecked();
    expect(within(form).getByText(/não se atualiza/)).toBeInTheDocument();
  });

  it("o pagamento do app também vai para a agenda do celular, exceto cancelado", async () => {
    const { AgendaAppPaymentScreen } =
      await import("@/components/screens/agenda-app-payment");
    const record = shift({
      key: "registered:r",
      source: "registered",
      id: "r",
      paymentHref: "/agenda/pagamento/acordo/r",
      kind: "took",
    });
    const { unmount } = render(
      <AgendaAppPaymentScreen
        shift={record}
        trackingHref="/acordos/registrados/r"
        reminder={defaultReminder}
        today="2026-11-16"
      />,
    );
    expect(
      screen
        .getByRole("button", { name: "Baixar arquivo da agenda" })
        .closest("form"),
    ).toHaveAttribute("action", "/agenda/pagamento/acordo/r/calendario");
    expect(
      screen.getByRole("checkbox", { name: "Incluir valor" }),
    ).toBeInTheDocument();
    unmount();
    render(
      <AgendaAppPaymentScreen
        shift={{ ...record, cancelled: true }}
        trackingHref="/acordos/registrados/r"
        reminder={defaultReminder}
        today="2026-11-16"
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Baixar arquivo da agenda" }),
    ).toBeNull();
  });

  it("o acordo chega preenchido e ligado à anotação", async () => {
    const { CreateAgreementForm } =
      await import("@/components/agreement-forms");
    const { container } = render(
      <CreateAgreementForm
        requestId="6b1f2d3e-0000-4000-8000-000000000010"
        groups={[]}
        agendaEntryId={entryId}
        initial={{
          creatorRole: "owner",
          location: "Hospital São Lucas",
          sector: "UTI",
          startsAt: "2026-12-12T19:00",
          endsAt: "2026-12-13T07:00",
        }}
      />,
    );
    expect(screen.getByLabelText("Neste plantão, eu vou")).toHaveValue("owner");
    expect(
      screen.getByLabelText("Instituição e local (cidade e endereço)"),
    ).toHaveValue("Hospital São Lucas");
    expect(screen.getByLabelText("Início")).toHaveValue("2026-12-12T19:00");
    expect(screen.getByLabelText("Término")).toHaveValue("2026-12-13T07:00");
    expect(container.querySelector('input[name="agendaEntryId"]')).toHaveValue(
      entryId,
    );
  });
});
