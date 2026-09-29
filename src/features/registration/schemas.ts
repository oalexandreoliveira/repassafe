import { z } from "zod";

export const brazilianStates = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;
export const legalVersion = "2026-09-29";

export function isValidCpf(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  for (let length = 9; length <= 10; length++) {
    const sum = [...digits.slice(0, length)].reduce(
      (total, digit, index) => total + Number(digit) * (length + 1 - index),
      0,
    );
    const check = (sum * 10) % 11;
    if (Number(digits[length]) !== (check === 10 ? 0 : check)) return false;
  }
  return true;
}

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return `+${digits.startsWith("55") && digits.length === 13 ? digits : `55${digits}`}`;
}

const dateOfBirth = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.valueOf()) &&
    date.toISOString().slice(0, 10) === value &&
    date < new Date() &&
    date.getUTCFullYear() >= 1900
  );
}, "Informe uma data de nascimento válida.");

export const registrationSchema = z
  .object({
    civilName: z.string().trim().min(3, "Informe seu nome completo.").max(120),
    displayName: z
      .string()
      .trim()
      .min(3, "Informe seu nome de apresentação.")
      .max(120),
    cpf: z
      .string()
      .transform((value) => value.replace(/\D/g, ""))
      .refine(isValidCpf, "Informe um CPF válido."),
    birthDate: dateOfBirth,
    phone: z
      .string()
      .transform(normalizePhone)
      .refine(
        (value) => /^\+55[1-9]\d9\d{8}$/.test(value),
        "Informe um celular brasileiro com DDD.",
      ),
    practicesMedicine: z.enum(["yes", "no"]),
    crmNumber: z.string().trim().max(12).default(""),
    crmState: z.union([z.enum(brazilianStates), z.literal("")]).default(""),
    specialty: z.string().trim().max(120).default(""),
    rqe: z.string().trim().max(12).default(""),
    institution: z.string().trim().max(160).default(""),
    sector: z.string().trim().max(120).default(""),
    response: z.string().trim().max(2000).default(""),
  })
  .superRefine((value, context) => {
    if (value.practicesMedicine === "yes") {
      if (!/^\d{4,12}$/.test(value.crmNumber))
        context.addIssue({
          code: "custom",
          path: ["crmNumber"],
          message: "Informe o CRM.",
        });
      if (!value.crmState)
        context.addIssue({
          code: "custom",
          path: ["crmState"],
          message: "Selecione a UF do CRM.",
        });
    }
    if (value.rqe && (!/^\d{1,12}$/.test(value.rqe) || !value.specialty))
      context.addIssue({
        code: "custom",
        path: ["rqe"],
        message: "Informe o RQE numérico junto à especialidade.",
      });
  });

export const registrationDraftSchema = z.object({
  civilName: z.string().trim().max(120).default(""),
  displayName: z.string().trim().max(120).default(""),
  cpf: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => !value || isValidCpf(value), "Informe um CPF válido.")
    .default(""),
  birthDate: z.union([dateOfBirth, z.literal("")]).default(""),
  phone: z
    .string()
    .transform((value) => (value ? normalizePhone(value) : ""))
    .refine(
      (value) => !value || /^\+55[1-9]\d9\d{8}$/.test(value),
      "Informe um celular brasileiro com DDD.",
    )
    .default(""),
  practicesMedicine: z.enum(["yes", "no"]).default("yes"),
  crmNumber: z.string().trim().max(12).default(""),
  crmState: z.union([z.enum(brazilianStates), z.literal("")]).default(""),
  specialty: z.string().trim().max(120).default(""),
  rqe: z.string().trim().max(12).default(""),
  institution: z.string().trim().max(160).default(""),
  sector: z.string().trim().max(120).default(""),
  response: z.string().trim().max(2000).default(""),
});

export function verificationExpired(
  validUntil: string | null,
  now = new Date(),
) {
  return !validUntil || new Date(validUntil) <= now;
}
