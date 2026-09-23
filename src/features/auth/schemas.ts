import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
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
};

export const initialActionState: ActionState = { status: "idle", message: "" };
