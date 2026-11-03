import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocked = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => mocked }));
import { dispatchCriticalEmails } from "@/lib/critical-email";
import { PAYMENT_NOTICE } from "@/features/shifts/copy";

const inOneHour = () => new Date(Date.now() + 3600_000).toISOString();
const row = () => ({
  id: "delivery-1",
  template: "selected",
  recipient_email: "doctor@example.test",
  href: "/plantoes/example",
  expires_at: inOneHour(),
  state: "pending",
  attempts: 0,
  attempted_at: null as string | null,
  first_attempt_at: null as string | null,
  message: null as unknown,
});
let delivery: ReturnType<typeof row>;
let updates: Record<string, unknown>[];
let orderedBy: string[];
let claimed: boolean;

beforeEach(() => {
  vi.stubEnv("CRITICAL_EMAIL_ENABLED", "true");
  vi.stubEnv("RESEND_API_KEY", "test-key");
  vi.stubEnv("AGREEMENT_EMAIL_FROM", "Repassafe <registros@example.test>");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.test");
  delivery = row();
  updates = [];
  orderedBy = [];
  claimed = true;
  mocked.from.mockImplementation(() => {
    let mutation: Record<string, unknown> | undefined;
    const query = {
      select: () => query,
      in: () => query,
      or: () => query,
      order: (column: string) => {
        orderedBy.push(column);
        return query;
      },
      limit: () => query,
      eq: () => query,
      update: (value: Record<string, unknown>) => {
        mutation = value;
        updates.push(value);
        return query;
      },
      maybeSingle: async () => ({
        data: claimed ? { id: delivery.id } : null,
        error: null,
      }),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve({
          data: mutation ? null : [delivery],
          error: null,
        }).then(resolve),
    };
    return query;
  });
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: "resend-1" }) }),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const sentMessage = () =>
  JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string) as {
    to: string[];
    subject: string;
    text: string;
  };

test("o envio de registros ativo não liga os avisos críticos", async () => {
  vi.stubEnv("AGREEMENT_EMAIL_ENABLED", "true");
  vi.stubEnv("CRITICAL_EMAIL_ENABLED", "false");
  expect(await dispatchCriticalEmails()).toMatchObject({ configured: false });
  expect(mocked.from).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});
test("a seleção informa o horário-limite em Brasília, o link e a frase de pagamento", async () => {
  delivery.expires_at = "2026-11-03T17:32:00.000Z";
  vi.setSystemTime(new Date("2026-11-03T17:05:00.000Z"));
  try {
    expect(await dispatchCriticalEmails()).toEqual({
      configured: true,
      accepted: 1,
      failed: 0,
    });
  } finally {
    vi.useRealTimers();
  }
  const message = sentMessage();
  expect(message.to).toEqual(["doctor@example.test"]);
  expect(message.subject).toContain("03/11/2026, 14:32");
  expect(message.text).toContain("03/11/2026, 14:32 (horário de Brasília)");
  expect(message.text).toContain("https://example.test/plantoes/example");
  expect(message.text).toContain(PAYMENT_NOTICE);
  expect(vi.mocked(fetch).mock.calls[0][1]!.headers).toMatchObject({
    "Idempotency-Key": "notification/delivery-1",
  });
  expect(updates.at(-1)).toMatchObject({
    state: "sent",
    provider_id: "resend-1",
  });
});
test.each([
  ["candidates", "Nova candidatura para o seu plantão"],
  ["approval_pending", "Repasse aguardando sua decisão"],
  ["selection_declined", "O candidato recusou o repasse"],
  ["confirmation_expired", "Prazo de confirmação encerrado"],
  ["approval_rejected", "Repasse rejeitado"],
  ["cancelled", "Repasse cancelado"],
  ["registration_reviewed", "Seu cadastro foi analisado"],
])("o modelo %s leva ao link autenticado", async (template, subject) => {
  delivery.template = template;
  await dispatchCriticalEmails();
  const message = sentMessage();
  expect(message.subject).toBe(subject);
  expect(message.text).toContain("https://example.test/plantoes/example");
  expect(message.text).toContain("Entre com sua conta para acessar.");
  expect(message.text).not.toContain("undefined");
  expect(`${message.subject} ${message.text}`).not.toContain("!");
});
test("processa primeiro os prazos mais curtos", async () => {
  await dispatchCriticalEmails();
  expect(orderedBy).toEqual(["expires_at"]);
});
test("aviso vencido antes da primeira tentativa não é enviado", async () => {
  delivery.expires_at = new Date(Date.now() - 1000).toISOString();
  await dispatchCriticalEmails();
  expect(fetch).not.toHaveBeenCalled();
  expect(updates).toHaveLength(1);
  expect(updates[0]).toMatchObject({ state: "expired" });
});
test("aviso vencido após tentativa sem confirmação fica para reconciliação", async () => {
  delivery.state = "failed";
  delivery.attempts = 2;
  delivery.attempted_at = new Date(Date.now() - 120_000).toISOString();
  delivery.expires_at = new Date(Date.now() - 1000).toISOString();
  await dispatchCriticalEmails();
  expect(fetch).not.toHaveBeenCalled();
  expect(updates[0]).toMatchObject({ state: "uncertain" });
});
test("falha repete a mesma mensagem e a mesma chave depois de um minuto", async () => {
  delivery.state = "failed";
  delivery.attempts = 1;
  delivery.attempted_at = new Date(Date.now() - 61_000).toISOString();
  delivery.message = {
    from: "old@example.test",
    to: ["doctor@example.test"],
    subject: "original",
    text: "frozen",
  };
  vi.mocked(fetch).mockRejectedValue(new Error("timeout"));
  expect(await dispatchCriticalEmails()).toMatchObject({ failed: 1 });
  expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)).toEqual(
    delivery.message,
  );
  expect(vi.mocked(fetch).mock.calls[0][1]!.headers).toMatchObject({
    "Idempotency-Key": "notification/delivery-1",
  });
  expect(updates.at(-1)).toMatchObject({ state: "failed" });
});
test("aguarda um minuto antes de tentar novamente", async () => {
  delivery.state = "failed";
  delivery.attempts = 1;
  delivery.attempted_at = new Date(Date.now() - 30_000).toISOString();
  await dispatchCriticalEmails();
  expect(fetch).not.toHaveBeenCalled();
});
test("outra execução que já adquiriu o item impede envio concorrente", async () => {
  claimed = false;
  await dispatchCriticalEmails();
  expect(fetch).not.toHaveBeenCalled();
});
