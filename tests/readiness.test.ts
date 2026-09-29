import { describe, expect, it } from "vitest";
import { hasValidMonitoringToken } from "@/features/operations/readiness";

describe("autorização de readiness", () => {
  const token = "monitoring-token-at-least-32-characters";

  it("aceita somente Bearer token exato", () => {
    expect(hasValidMonitoringToken(`Bearer ${token}`, token)).toBe(true);
    expect(hasValidMonitoringToken(`Bearer ${token}x`, token)).toBe(false);
    expect(hasValidMonitoringToken(null, token)).toBe(false);
  });
});
