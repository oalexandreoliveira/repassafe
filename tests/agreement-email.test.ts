import { afterEach, beforeEach, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocked = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => mocked }));
import { dispatchAgreementEmails } from "@/lib/agreement-email";

const row = () => ({
  id: "delivery-1",
  recipient_email: "doctor@example.test",
  href: "/acordos/example",
  state: "pending",
  attempts: 0,
  attempted_at: null as string | null,
  first_attempt_at: null as string | null,
  message: null as unknown,
});
let delivery: ReturnType<typeof row>;
let updates: Record<string, unknown>[];
let claimed: boolean;

beforeEach(() => {
  vi.stubEnv("AGREEMENT_EMAIL_ENABLED", "true");
  vi.stubEnv("RESEND_API_KEY", "test-key");
  vi.stubEnv("AGREEMENT_EMAIL_FROM", "Repassafe <registros@example.test>");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.test");
  delivery = row();
  updates = [];
  claimed = true;
  mocked.from.mockImplementation(() => {
    let mutation: Record<string, unknown> | undefined;
    const query = {
      select: () => query,
      in: () => query,
      or: () => query,
      order: () => query,
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

test("envio desativado não consulta fila nem contata o provedor", async () => {
  vi.stubEnv("AGREEMENT_EMAIL_ENABLED", "false");
  expect(await dispatchAgreementEmails()).toMatchObject({ configured: false });
  expect(mocked.from).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});
test("envia link autenticado e persiste a aceitação do provedor", async () => {
  expect(await dispatchAgreementEmails()).toEqual({
    configured: true,
    accepted: 1,
    failed: 0,
  });
  const options = vi.mocked(fetch).mock.calls[0][1]!;
  expect(options.headers).toMatchObject({
    "Idempotency-Key": "agreement/delivery-1",
  });
  expect(JSON.parse(options.body as string).text).toContain(
    "https://example.test/acordos/example",
  );
  expect(updates.at(-1)).toMatchObject({
    state: "sent",
    provider_id: "resend-1",
  });
});
test("falha preserva o payload para repetir com a mesma chave", async () => {
  delivery.state = "failed";
  delivery.attempts = 1;
  delivery.first_attempt_at = new Date(Date.now() - 600_000).toISOString();
  delivery.message = {
    from: "old@example.test",
    to: ["doctor@example.test"],
    subject: "original",
    text: "frozen",
  };
  vi.mocked(fetch).mockRejectedValue(new Error("timeout"));
  expect(await dispatchAgreementEmails()).toMatchObject({ failed: 1 });
  expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)).toEqual(
    delivery.message,
  );
  expect(updates.at(-1)).toMatchObject({ state: "failed" });
});
test("outra execução que já adquiriu o item impede envio concorrente", async () => {
  claimed = false;
  await dispatchAgreementEmails();
  expect(fetch).not.toHaveBeenCalled();
});
test("interrompe tentativas ambíguas antes da expiração da chave no provedor", async () => {
  delivery.first_attempt_at = new Date(
    Date.now() - 24 * 3600_000,
  ).toISOString();
  await dispatchAgreementEmails();
  expect(fetch).not.toHaveBeenCalled();
  expect(updates[0]).toMatchObject({ state: "uncertain" });
});
test("aguarda cinco minutos antes de tentar novamente", async () => {
  delivery.attempted_at = new Date().toISOString();
  await dispatchAgreementEmails();
  expect(fetch).not.toHaveBeenCalled();
});
