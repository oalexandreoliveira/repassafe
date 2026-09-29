import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/features/auth/schemas";

describe("validação de identidade", () => {
  it("normaliza a UF do CRM", () => {
    const result = signupSchema.parse({
      displayName: "Dra. Ana Silva",
      crmNumber: "12345",
      crmState: "ma",
      email: "ana@example.com",
      password: "senha-segura",
    });
    expect(result.crmState).toBe("MA");
  });

  it("recusa senha curta", () => {
    expect(
      loginSchema.safeParse({ email: "ana@example.com", password: "curta" })
        .success,
    ).toBe(false);
  });
});
