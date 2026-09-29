import { describe, expect, it } from "vitest";
import { requireAdminMfa } from "@/lib/auth/require-admin-mfa";
describe("MFA administrativo", () => {
  it("aceita administrador em aal2", () =>
    expect(() =>
      requireAdminMfa({ role: "admin", status: "approved", aal: "aal2" }),
    ).not.toThrow());
  it("nega aal1", () =>
    expect(() =>
      requireAdminMfa({ role: "admin", status: "approved", aal: "aal1" }),
    ).toThrow(/MFA/));
  it("nega administrador suspenso mesmo em aal2", () =>
    expect(() =>
      requireAdminMfa({ role: "admin", status: "suspended", aal: "aal2" }),
    ).toThrow(/MFA/));
});
