import { afterEach, describe, expect, it, vi } from "vitest";
import { log } from "@/lib/observability/logger";

describe("logger estruturado", () => {
  afterEach(() => vi.restoreAllMocks());

  it("remove dados sensíveis inclusive em objetos aninhados", () => {
    const output = vi
      .spyOn(console, "info")
      .mockImplementation(() => undefined);

    log("info", "support.lookup", {
      requestId: "safe-correlation-id",
      email: "medico@example.com",
      nested: {
        access_token: "secret",
        patientName: "never log this",
        status: "ok",
      },
    });

    const entry = JSON.parse(String(output.mock.calls[0][0]));
    expect(entry.requestId).toBe("safe-correlation-id");
    expect(entry.email).toBeUndefined();
    expect(entry.nested).toEqual({ status: "ok" });
  });
});
