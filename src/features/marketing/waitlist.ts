import { z } from "zod";
import { brazilianStates } from "@/features/registration/schemas";

export const waitlistInterests = [
  ["repassar", "Repassar plantões"],
  ["assumir", "Assumir plantões de colegas"],
  ["ambos", "Repassar e assumir"],
] as const;

export const waitlistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe seu nome com ao menos 3 caracteres.")
    .max(120, "Use até 120 caracteres no nome."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Informe um e-mail válido."))
    .pipe(z.string().max(254, "O e-mail é longo demais.")),
  interest: z.enum(["repassar", "assumir", "ambos"], "Escolha uma opção."),
  specialty: z
    .string()
    .trim()
    .max(80, "Use até 80 caracteres na especialidade.")
    .transform((value) => value || null)
    .pipe(
      z
        .string()
        .min(2, "Informe a especialidade com ao menos 2 caracteres.")
        .nullable(),
    ),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .transform((value) => value || null)
    .pipe(z.enum(brazilianStates, "Escolha uma UF da lista.").nullable()),
  consent: z.literal("on", "Confirme que concorda com o uso do contato."),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
