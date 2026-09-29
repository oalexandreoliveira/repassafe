import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  normalizeRateLimitIdentifier,
  rateLimitPolicies,
} from "@/features/security/rate-limits";

const migration = readFileSync(
  "supabase/migrations/20260923003100_security_audit_rate_limits.sql",
  "utf8",
).toLowerCase();

describe("controles de segurança do MVP", () => {
  it("aplica limites mais restritivos à autenticação", () => {
    expect(rateLimitPolicies.loginEmail.maxRequests).toBeLessThan(
      rateLimitPolicies.workflow.maxRequests,
    );
    expect(rateLimitPolicies.signupEmail.windowSeconds).toBe(86400);
  });

  it("normaliza identificadores antes da derivação criptográfica", () => {
    expect(normalizeRateLimitIdentifier("  MEDICO@EXAMPLE.COM ")).toBe(
      "medico@example.com",
    );
  });

  it("mantém contadores privados e a superfície pública sem grants de cliente", () => {
    expect(migration).toContain("create table private.rate_limit_buckets");
    expect(migration).toContain(
      "alter table private.rate_limit_buckets enable row level security",
    );
    expect(migration).toContain(
      "revoke all on public.rate_limit_checks from public, anon, authenticated",
    );
    expect(migration).toContain("return null");
  });

  it("protege funções privilegiadas e torna auditoria imutável", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("trigger audit_events_immutable");
    expect(migration).toContain(
      "revoke execute on function private.enforce_rate_limit()",
    );
  });
});
