import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";
describe("health check", () => {
  it("retorna estado sem dados sensíveis", async () => {
    const response = GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.environment).toBeUndefined();
    expect(JSON.stringify(body)).not.toMatch(/secret|token|password/i);
  });
});
