import { z } from "zod";

const localDateTime = z
  .string()
  .min(1)
  .transform((value, context) => {
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) {
      context.addIssue({ code: "custom", message: "Data e hora inválidas" });
      return z.NEVER;
    }
    return date.toISOString();
  });

const moneyToCents = z
  .string()
  .trim()
  .regex(/^\d{1,7}([,.]\d{1,2})?$/, "Valor inválido")
  .transform((value) => Math.round(Number(value.replace(",", ".")) * 100));

export const offerFormSchema = z
  .object({
    commandId: z.uuid(),
    groupId: z.uuid(),
    startsAt: localDateTime,
    endsAt: localDateTime,
    sector: z.string().trim().min(2).max(120),
    value: moneyToCents,
    paymentTerms: z.string().trim().min(2).max(300),
    notes: z.string().trim().max(1000).default(""),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: "O término deve ocorrer depois do início",
    path: ["endsAt"],
  });

export const targetCommandSchema = z.object({
  commandId: z.uuid(),
  targetId: z.uuid(),
});

export const selectionSchema = targetCommandSchema.extend({
  confirmationMinutes: z.coerce.number().int().min(5).max(1440).default(30),
});

export const confirmationSchema = targetCommandSchema.extend({
  accepted: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const decisionSchema = targetCommandSchema.extend({
  approved: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const reasonCommandSchema = targetCommandSchema.extend({
  reason: z.string().trim().min(10).max(2000),
});

export const occurrenceDecisionSchema = targetCommandSchema.extend({
  decision: z.string().trim().min(10).max(2000),
});

export const completionStatusLabels: Record<string, string> = {
  pending_confirmation: "Aguardando confirmação da realização",
  completed: "Plantão concluído",
  disputed: "Realização em análise",
};

export const offerStatusLabels: Record<string, string> = {
  open_normal: "Aberto",
  open_emergency: "Urgente",
  selection_in_progress: "Aguardando confirmação",
  closed_confirmed: "Repasse confirmado",
  cancelled_by_owner: "Cancelado pelo responsável",
  cancelled_admin: "Cancelado pela administração",
  expired: "Expirado",
};

export const applicationStatusLabels: Record<string, string> = {
  active: "Candidatura ativa",
  withdrawn: "Retirada",
  selected_pending_confirmation: "Selecionado — confirme",
  confirmed: "Confirmada",
  declined: "Recusada",
  confirmation_expired: "Prazo de confirmação expirado",
  not_selected: "Outro profissional selecionado",
  invalidated: "Invalidada",
};

export const substitutionStatusLabels: Record<string, string> = {
  pending_substitute_confirmation: "Aguardando confirmação do substituto",
  pending_institutional_approval: "Aguardando aprovação institucional",
  confirmed: "Repasse confirmado",
  rejected_institutionally: "Rejeitado pela instituição",
  cancelled: "Cancelado",
};

export function formatCurrency(valueCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueCents / 100);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Fortaleza",
  }).format(new Date(value));
}
