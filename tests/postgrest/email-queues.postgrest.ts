import { createHmac, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { POST } from "@/app/api/jobs/agreement-emails/route";

vi.mock("server-only", () => ({}));

const api = process.env.QUEUE_TEST_API_URL;
if (api !== "http://127.0.0.1:55321")
  throw new Error(
    "Execute pnpm test:postgrest para criar a instância descartável.",
  );
const anonKey = process.env.QUEUE_TEST_ANON_KEY!;
const serviceKey = process.env.QUEUE_TEST_SERVICE_KEY!;
const recipient = "ab000000-0000-4000-8000-000000000001";
const critical = "notification_email_deliveries";
const agreements = "agreement_email_deliveries";
const token = randomUUID();
const provider = vi.fn<(request: Request) => Promise<Response>>(async () =>
  Response.json({ id: "local-resend" }),
);
const localFetch = globalThis.fetch;

beforeAll(() => {
  vi.stubEnv("APP_ENV", "test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", api);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", anonKey);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", serviceKey);
  vi.stubEnv("RATE_LIMIT_PEPPER", randomUUID());
  vi.stubEnv("MONITORING_TOKEN", randomUUID());
  vi.stubEnv("AGREEMENT_EMAIL_JOB_TOKEN", token);
  vi.stubEnv("RESEND_API_KEY", "local-test-only");
  vi.stubEnv("AGREEMENT_EMAIL_FROM", "registros@example.test");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.test");
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    if (
      request.method === "POST" &&
      request.url === "https://api.resend.com/emails"
    )
      return provider(request);
    if (new URL(request.url).origin !== api)
      throw new Error("Destino de rede fora da instância descartável.");
    return localFetch(request, { redirect: "error" });
  });
});
afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function client(key: string, bearer = key) {
  return createClient(api!, key, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function recipientToken() {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const claims = {
    role: "authenticated",
    sub: recipient,
    exp: Math.floor(Date.now() / 1000) + 300,
  };
  const body = `${encode({ alg: "HS256", typ: "JWT" })}.${encode(claims)}`;
  const signature = createHmac("sha256", process.env.QUEUE_TEST_JWT_SECRET!)
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

test("até o destinatário só pode consultar a notificação interna", async () => {
  const owner = client(anonKey, recipientToken());
  const notification = await owner
    .from("notifications")
    .select("id")
    .eq("recipient_id", recipient)
    .single()
    .throwOnError();
  for (const role of [client(anonKey), owner]) {
    for (const table of [critical, agreements]) {
      const read = await role.from(table).select("id");
      expect(read.error?.code).toBe("42501");
      const write = await role
        .from(table)
        .update({ state: "sent" })
        .eq("recipient_id", recipient);
      expect(write.error?.code).toBe("42501");
    }
  }
  const { data } = await client(serviceKey)
    .from(critical)
    .select("*")
    .single()
    .throwOnError();
  expect(data).toMatchObject({
    notification_id: notification.data.id,
    recipient_id: recipient,
    template: "registration_reviewed",
  });
});

test("service_role não pode criar, excluir ou redirecionar avisos", async () => {
  const queue = client(serviceKey).from(critical);
  const { data } = await queue.select("*").single().throwOnError();
  const insert = await queue.insert({
    ...data,
    id: randomUUID(),
    dedupe_key: randomUUID(),
  });
  expect(insert.error?.code).toBe("42501");
  for (const column of [
    "id",
    "notification_id",
    "dedupe_key",
    "template",
    "recipient_id",
    "recipient_email",
    "href",
    "expires_at",
    "created_at",
  ]) {
    const update = await queue
      .update({ [column]: data[column] })
      .eq("id", data.id);
    expect(update.error?.code, column).toBe("42501");
  }
  expect((await queue.delete().eq("id", data.id)).error?.code).toBe("42501");
});

test("o job adquire e confirma somente os itens da fila habilitada", async () => {
  const admin = client(serviceKey);
  const row = async (table: string) =>
    (await admin.from(table).select("*").single().throwOnError()).data;
  const post = (authorization?: string) =>
    POST(
      new Request("https://example.test/api/jobs/agreement-emails", {
        method: "POST",
        headers: authorization ? { authorization } : {},
      }),
    );
  vi.stubEnv("CRITICAL_EMAIL_ENABLED", "true");
  vi.stubEnv("AGREEMENT_EMAIL_ENABLED", "false");
  expect((await post()).status).toBe(401);
  const pending = { state: "pending", attempts: 0, provider_id: null };
  expect(await row(critical)).toMatchObject(pending);
  expect(await row(agreements)).toMatchObject(pending);
  expect(provider).not.toHaveBeenCalled();

  const run = async () => {
    const response = await post(`Bearer ${token}`);
    expect(response.status).toBe(200);
    return response.json();
  };
  const sent = { configured: true, accepted: 1, failed: 0 };
  const off = { configured: false, accepted: 0, failed: 0 };
  expect(await run()).toEqual({ critical: sent, agreements: off });
  const notice = await row(critical);
  expect(notice).toMatchObject({
    state: "sent",
    attempts: 1,
    attempted_at: expect.any(String),
    first_attempt_at: expect.any(String),
    provider_id: "local-resend",
    last_error: null,
    message: {
      to: ["medica@example.test"],
      subject: "Seu cadastro foi analisado",
    },
  });
  expect(await row(agreements)).toMatchObject(pending);
  expect(provider).toHaveBeenCalledTimes(1);
  const request = provider.mock.calls[0][0];
  expect(request.headers.get("Idempotency-Key")).toBe(
    `notification/${notice.id}`,
  );
  expect(await request.json()).toEqual(notice.message);

  vi.stubEnv("CRITICAL_EMAIL_ENABLED", "false");
  vi.stubEnv("AGREEMENT_EMAIL_ENABLED", "true");
  expect(await run()).toEqual({ critical: off, agreements: sent });
  const agreement = await row(agreements);
  expect(agreement).toMatchObject({
    state: "sent",
    attempts: 1,
    message: { subject: "Seu registro de repasse está disponível" },
  });
  expect(provider.mock.calls[1][0].headers.get("Idempotency-Key")).toBe(
    `agreement/${agreement.id}`,
  );
  vi.stubEnv("CRITICAL_EMAIL_ENABLED", "true");
  const empty = { configured: true, accepted: 0, failed: 0 };
  expect(await run()).toEqual({ critical: empty, agreements: empty });
  expect(await row(critical)).toEqual(notice);
  expect(provider).toHaveBeenCalledTimes(2);
});
