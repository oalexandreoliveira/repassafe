import { describe, expect, it } from "vitest";
import { safeReturnPath, loginPath } from "@/features/groups/invite-path";
import { registrationConflict } from "@/features/registration/errors";
import { paymentStatus } from "@/features/agreements/schema";

describe("feedback do piloto", () => {
  const id = "11000000-0000-4000-8000-000000000001";
  it("retoma somente destinos compartilháveis, sem redirecionamento aberto", () => {
    for (const path of [
      `/plantoes/${id}`,
      `/acordos/${id}`,
      `/acordos/registrados/${id}`,
    ]) {
      expect(safeReturnPath(path)).toBe(path);
      expect(loginPath(path)).toBe(
        `/entrar?proximo=${encodeURIComponent(path)}`,
      );
    }
    for (const path of [
      "https://evil.test",
      "//evil.test",
      `/plantoes/${id}/../../admin`,
      `/plantoes/${id}?next=//evil.test`,
      `/plantoes/${id}%0a`,
      `/acordos/${id}#x`,
      "/admin",
    ])
      expect(safeReturnPath(path)).toBeNull();
  });
  it("distingue conflito de CRM de CPF e não vaza detalhes da outra conta", () => {
    const result = registrationConflict({
      code: "23505",
      message: 'duplicate key "profiles_crm_unique_idx"',
      details: "PRIVATE IDENTITY",
    });
    expect(result?.fieldErrors?.crmNumber).toContain("CRM e UF");
    expect(result?.fieldErrors?.cpf).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain("PRIVATE IDENTITY");
    expect(
      registrationConflict({ code: "23505", message: "unknown_constraint" })
        ?.fieldErrors,
    ).toBeUndefined();
    expect(
      registrationConflict({
        code: "23505",
        message: "registration_drafts_phone_key",
      })?.fieldErrors?.phone,
    ).toBeTruthy();
  });
  it("não confunde pagamento informado com recebimento nem antecipa vencimento", () => {
    expect(
      paymentStatus("2026-10-30", null, true, new Date("2026-10-31T02:59:59Z")),
    ).toContain("aguardando recebimento");
    expect(
      paymentStatus("2026-10-30", null, true, new Date("2026-10-31T03:00:00Z")),
    ).toBe("Prazo vencido — recebimento não confirmado");
    expect(
      paymentStatus(
        "2026-10-30",
        "2026-10-30T15:00:00Z",
        true,
        new Date("2026-11-02T03:00:00Z"),
      ),
    ).toBe("Recebimento confirmado");
  });
});
