import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const form = readFileSync("src/components/mfa-form.tsx", "utf8");
const page = readFileSync("src/app/mfa/page.tsx", "utf8");
const admin = readFileSync("src/app/admin/page.tsx", "utf8");

describe("fluxo MFA administrativo", () => {
  it("cadastra e verifica TOTP pela API oficial", () => {
    expect(form).toContain("supabase.auth.mfa.enroll");
    expect(form).toContain("supabase.auth.mfa.challengeAndVerify");
  });

  it("limpa fatores incompletos antes de reiniciar o cadastro", () => {
    expect(form).toContain("supabase.auth.mfa.unenroll");
    expect(page).toContain('factor.status === "unverified"');
  });

  it("restringe configuração e administração a admin aprovado em aal2", () => {
    expect(page).toContain('profile?.role !== "admin"');
    expect(page).toContain('profile.status !== "approved"');
    expect(page).toContain('identity.claims.aal === "aal2"');
    expect(admin).toContain('redirect("/mfa")');
  });
});
