import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .refine(
      (value) =>
        z.email().safeParse(value).success || /^\+55[1-9]\d9\d{8}$/.test(value),
      "Informe e-mail ou celular confirmado no formato +55DDDNúmero.",
    ),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
});

export const accountSignupSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
  terms: z.literal("on", "Aceite os Termos de uso."),
  privacy: z.literal("on", "Confirme a leitura da Política de privacidade."),
});

export const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Informe um e-mail válido.")),
});
export const passwordResetSchema = z
  .object({
    password: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "As senhas não conferem.",
  });

export const signupSchema = loginSchema.extend({
  displayName: z.string().trim().min(3).max(120),
  crmNumber: z
    .string()
    .trim()
    .regex(/^\d{4,12}$/, "CRM inválido."),
  crmState: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Informe a UF do CRM."),
});

export const profileSchema = signupSchema.pick({
  displayName: true,
  crmNumber: true,
  crmState: true,
});

export type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
  revision?: number;
};

export const initialActionState: ActionState = { status: "idle", message: "" };
