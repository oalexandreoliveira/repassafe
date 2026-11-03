import { afterEach, beforeEach, expect, test, vi } from "vitest";

const mocked = vi.hoisted(() => ({
  critical: vi.fn(),
  agreements: vi.fn(),
}));
vi.mock("@/lib/critical-email", () => ({
  dispatchCriticalEmails: mocked.critical,
}));
vi.mock("@/lib/agreement-email", () => ({
  dispatchAgreementEmails: mocked.agreements,
}));
import { POST } from "@/app/api/jobs/agreement-emails/route";

const token = "t".repeat(32);
const post = (authorization?: string) =>
  POST(
    new Request("https://example.test/api/jobs/agreement-emails", {
      method: "POST",
      headers: authorization ? { authorization } : {},
    }),
  );

beforeEach(() => {
  vi.stubEnv("AGREEMENT_EMAIL_JOB_TOKEN", token);
  mocked.critical.mockResolvedValue({
    configured: true,
    accepted: 2,
    failed: 0,
  });
  mocked.agreements.mockResolvedValue({
    configured: true,
    accepted: 1,
    failed: 0,
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

test.each([undefined, "Bearer errado", `Bearer ${"x".repeat(32)}`])(
  "token ausente ou incorreto não processa filas (%s)",
  async (authorization) => {
    expect((await post(authorization)).status).toBe(401);
    expect(mocked.critical).not.toHaveBeenCalled();
    expect(mocked.agreements).not.toHaveBeenCalled();
  },
);
test("token curto demais mantém o endpoint fechado", async () => {
  vi.stubEnv("AGREEMENT_EMAIL_JOB_TOKEN", "curto");
  expect((await post("Bearer curto")).status).toBe(401);
});
test("avisos críticos saem antes dos registros, sob o mesmo limite de tempo", async () => {
  const before = Date.now();
  const response = await post(`Bearer ${token}`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    critical: { configured: true, accepted: 2, failed: 0 },
    agreements: { configured: true, accepted: 1, failed: 0 },
  });
  expect(mocked.critical.mock.invocationCallOrder[0]).toBeLessThan(
    mocked.agreements.mock.invocationCallOrder[0],
  );
  const stopAt = mocked.critical.mock.calls[0][0] as number;
  expect(mocked.agreements).toHaveBeenCalledWith(stopAt);
  // Último envio iniciado (até 8 s) ainda termina dentro de maxDuration.
  expect(stopAt - before + 8_000).toBeLessThan(60_000);
});
test("falha na fila não expõe detalhes", async () => {
  mocked.critical.mockRejectedValue(new Error("detalhe interno"));
  const response = await post(`Bearer ${token}`);
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("detalhe interno");
});
