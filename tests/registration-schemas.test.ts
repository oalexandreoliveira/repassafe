import { describe, expect, it } from "vitest";
import { accountSignupSchema, loginSchema } from "@/features/auth/schemas";
import {
  isValidCpf,
  normalizePhone,
  registrationDraftSchema,
  registrationSchema,
  verificationExpired,
} from "@/features/registration/schemas";

const complete = {
  civilName: "Pessoa de Teste",
  displayName: "Dra. Teste",
  cpf: "52998224725",
  birthDate: "1990-03-15",
  phone: "11987654321",
  practicesMedicine: "yes",
  crmNumber: "12345",
  crmState: "SP",
};
describe("cadastro completo", () => {
  it("verifica os dois dígitos do CPF e recusa repetições", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224724")).toBe(false);
    expect(isValidCpf("11111111111")).toBe(false);
  });
  it("normaliza celular nacional e internacional sem duplicar prefixo", () => {
    expect(normalizePhone("(11) 98765-4321")).toBe("+5511987654321");
    expect(normalizePhone("+55 11 98765-4321")).toBe("+5511987654321");
  });
  it("salva identificação incompleta e valida somente valores preenchidos", () => {
    expect(registrationDraftSchema.safeParse({}).success).toBe(true);
    expect(
      registrationDraftSchema.safeParse({ cpf: "11111111111" }).success,
    ).toBe(false);
  });
  it("exige CRM e UF real somente para atuação médica", () => {
    expect(registrationSchema.safeParse(complete).success).toBe(true);
    expect(
      registrationSchema.safeParse({ ...complete, crmState: "ZZ" }).success,
    ).toBe(false);
    expect(
      registrationSchema.safeParse({
        ...complete,
        practicesMedicine: "no",
        crmNumber: "",
        crmState: "",
      }).success,
    ).toBe(true);
    expect(
      registrationSchema.safeParse({ ...complete, crmNumber: "" }).success,
    ).toBe(false);
  });
  it("valida datas civis reais e impede futuro", () => {
    expect(
      registrationSchema.safeParse({ ...complete, birthDate: "1990-02-31" })
        .success,
    ).toBe(false);
    expect(
      registrationSchema.safeParse({ ...complete, birthDate: "2100-01-01" })
        .success,
    ).toBe(false);
  });
  it("não presume RQE e exige especialidade para RQE declarado", () => {
    expect(
      registrationSchema.safeParse({ ...complete, specialty: "", rqe: "123" })
        .success,
    ).toBe(false);
    expect(
      registrationSchema.safeParse({
        ...complete,
        specialty: "Cardiologia",
        rqe: "123",
      }).success,
    ).toBe(true);
  });
  it("exige aceite explícito dos dois documentos na criação de conta", () => {
    const account = { email: "test@example.com", password: "senha-segura" };
    expect(accountSignupSchema.safeParse(account).success).toBe(false);
    expect(
      accountSignupSchema.safeParse({ ...account, terms: "on", privacy: "on" })
        .success,
    ).toBe(true);
  });
  it("permite login por telefone confirmado sem flexibilizar cadastro por email", () => {
    expect(
      loginSchema.safeParse({
        email: "+5511987654321",
        password: "senha-segura",
      }).success,
    ).toBe(true);
    expect(
      accountSignupSchema.safeParse({
        email: "+5511987654321",
        password: "senha-segura",
        terms: "on",
        privacy: "on",
      }).success,
    ).toBe(false);
  });
  it("considera vencida a verificação no instante limite", () => {
    const now = new Date("2026-09-29T12:00:00Z");
    expect(verificationExpired(null, now)).toBe(true);
    expect(verificationExpired(now.toISOString(), now)).toBe(true);
    expect(verificationExpired("2026-09-30T12:00:00Z", now)).toBe(false);
  });
});
