import { describe, expect, it } from "vitest";
import {
  loginSchema,
  passwordResetSchema,
  signupSchema,
} from "@/features/auth/schemas";

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

  it("normaliza e-mail para evitar variação de maiúsculas e espaços", () => {
    const result = loginSchema.parse({
      email: "  ANA@EXAMPLE.COM ",
      password: "senha-segura",
    });
    expect(result.email).toBe("ana@example.com");
  });

  it("recusa senha curta", () => {
    expect(
      loginSchema.safeParse({ email: "ana@example.com", password: "curta" })
        .success,
    ).toBe(false);
  });

  it("exige confirmação igual para a nova senha", () => {
    expect(
      passwordResetSchema.safeParse({
        password: "senha-segura",
        passwordConfirmation: "diferente",
      }).success,
    ).toBe(false);
    expect(
      passwordResetSchema.safeParse({
        password: "senha-segura",
        passwordConfirmation: "senha-segura",
      }).success,
    ).toBe(true);
  });
});
