import { describe, expect, it } from "vitest";
import { requireAdminMfa } from "@/lib/auth/require-admin-mfa";
describe("MFA administrativo", () => {
  it("aceita administrador em aal2", () =>
    expect(() => requireAdminMfa({ active: true, aal: "aal2" })).not.toThrow());
  it("nega aal1", () =>
    expect(() => requireAdminMfa({ active: true, aal: "aal1" })).toThrow(
      /MFA/,
    ));
  it("nega acesso administrativo revogado mesmo em aal2", () =>
    expect(() => requireAdminMfa({ active: false, aal: "aal2" })).toThrow(
      /MFA/,
    ));
  it("nega uma identidade sem concessão administrativa", () =>
    expect(() => requireAdminMfa({ aal: "aal2" })).toThrow(/MFA/));
});
