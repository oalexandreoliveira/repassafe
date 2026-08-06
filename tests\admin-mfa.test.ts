import { describe, expect, it } from "vitest";
import { requireAdminMfa } from "@/lib/auth/require-admin-mfa";
describe("MFA administrativo", () => {
  it("aceita administrador em aal2", () =>
    expect(() =>
      requireAdminMfa({ user_role: "admin", aal: "aal2" }),
    ).not.toThrow());
  it("nega aal1", () =>
    expect(() => requireAdminMfa({ user_role: "admin", aal: "aal1" })).toThrow(
      /MFA/,
    ));
});
