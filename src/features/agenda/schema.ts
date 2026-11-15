import { z } from "zod";
import {
  amountSchema,
  businessDate,
  dateSchema,
} from "@/features/agreements/schema";

/** Tipos de anotação pessoal (docs/product/personal-agenda.md). */
export const agendaKinds = ["own", "took", "passed"] as const;
export type AgendaKind = (typeof agendaKinds)[number];

export const kindLabels: Record<AgendaKind, string> = {
  own: "Meu plantão",
  took: "Assumi de um colega",
  passed: "Repassei a um colega",
};

export const kindHints: Record<AgendaKind, string> = {
  own: "Da sua escala. Quem paga é a instituição, a cooperativa ou a empresa.",
  took: "Combinado fora do app. O colega paga você.",
  passed: "Combinado fora do app. Você paga o colega.",
};

/** Rótulo do nome de quem paga (ou recebe, quando o usuário é o pagador). */
export function counterpartyLabel(kind: AgendaKind) {
  return kind === "passed" ? "Quem recebe" : "Responsável pelo pagamento";
}

export const PERSONAL_NOTE_NOTICE =
  "Anotação pessoal: visível só para você e sem aceite de outra parte.";

export const MAX_DATES = 31;
export const dueModes = ["none", "date", "days"] as const;
export type DueMode = (typeof dueModes)[number];

const timeSchema = (message: string) =>
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, message);

/** Soma dias a uma data YYYY-MM-DD, sem depender do fuso do servidor. */
export function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

const optionalAmount = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) return null;
    const parsed = amountSchema.safeParse(value);
    if (!parsed.success) {
      ctx.addIssue({ code: "custom", message: "Use um valor como 1500,00." });
      return z.NEVER;
    }
    return parsed.data;
  });

const limited = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use até ${max.toLocaleString("pt-BR")} caracteres.`);

/**
 * Formulário de cadastro e edição. Datas e horários são do fuso do produto
 * (America/Fortaleza, UTC−3, sem horário de verão). O banco repete as regras.
 */
export function agendaEntrySchema(today = businessDate()) {
  return z
    .object({
      requestId: z.uuid(),
      kind: z.enum(agendaKinds, { error: "Selecione o tipo do plantão." }),
      dates: z
        .array(dateSchema)
        .min(1, "Selecione ao menos uma data.")
        .max(MAX_DATES, `Selecione no máximo ${MAX_DATES} datas.`),
      start: timeSchema("Informe o horário de início."),
      end: timeSchema("Informe o horário de término."),
      location: z
        .string()
        .trim()
        .min(2, "Informe a instituição e o local.")
        .max(160, "Use até 160 caracteres."),
      sector: limited(120),
      value: optionalAmount,
      dueMode: z.enum(dueModes, { error: "Escolha como é o prazo." }),
      dueDate: z.string().trim(),
      dueDays: z.string().trim(),
      paymentMethod: limited(120),
      counterparty: limited(120),
      notes: limited(1000),
    })
    .superRefine((value, ctx) => {
      const earliest = addDays(today, -730);
      const latest = addDays(today, 400);
      if (value.dates.some((date) => date < earliest || date > latest))
        ctx.addIssue({
          code: "custom",
          path: ["dates"],
          message: "Escolha datas entre dois anos atrás e um ano à frente.",
        });
      if (new Set(value.dates).size !== value.dates.length)
        ctx.addIssue({
          code: "custom",
          path: ["dates"],
          message: "Cada data pode ser escolhida uma vez.",
        });
      const sorted = [...value.dates].sort();
      if (value.dueMode === "date") {
        if (!dateSchema.safeParse(value.dueDate).success)
          ctx.addIssue({
            code: "custom",
            path: ["dueDate"],
            message: "Informe a data-limite.",
          });
        else if (sorted.length && value.dueDate < sorted[sorted.length - 1])
          ctx.addIssue({
            code: "custom",
            path: ["dueDate"],
            message:
              sorted.length > 1
                ? "A data-limite deve ser no dia do último plantão escolhido ou depois."
                : "A data-limite deve ser no dia do plantão ou depois.",
          });
        else if (sorted.length && value.dueDate > addDays(sorted[0], 365))
          ctx.addIssue({
            code: "custom",
            path: ["dueDate"],
            message: "Use uma data-limite de até um ano após o plantão.",
          });
      }
      if (value.dueMode === "days") {
        const days = Number(value.dueDays);
        if (!/^\d{1,3}$/.test(value.dueDays) || days < 1 || days > 365)
          ctx.addIssue({
            code: "custom",
            path: ["dueDays"],
            message: "Informe de 1 a 365 dias.",
          });
      }
    });
}

export type AgendaEntryInput = z.infer<ReturnType<typeof agendaEntrySchema>>;

/** Lê o FormData preservando as várias datas escolhidas. */
export function agendaFormObject(formData: FormData) {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  return {
    requestId: text("requestId"),
    kind: text("kind"),
    dates: formData
      .getAll("dates")
      .filter((value): value is string => typeof value === "string" && !!value),
    start: text("start"),
    end: text("end"),
    location: text("location"),
    sector: text("sector"),
    value: text("value"),
    dueMode: text("dueMode") || "none",
    dueDate: text("dueDate"),
    dueDays: text("dueDays"),
    paymentMethod: text("paymentMethod"),
    counterparty: text("counterparty"),
    notes: text("notes"),
  };
}

function fortalezaIso(date: string, time: string) {
  return new Date(`${date}T${time}:00-03:00`).toISOString();
}

/**
 * Converte as datas escolhidas em plantões. Término igual ou anterior ao
 * início significa o dia seguinte (plantão noturno ou de 24 horas).
 */
export function composeShifts(input: AgendaEntryInput) {
  const nextDay = input.end <= input.start;
  return [...input.dates].sort().map((date) => ({
    starts_at: fortalezaIso(date, input.start),
    ends_at: fortalezaIso(nextDay ? addDays(date, 1) : date, input.end),
    due_date:
      input.dueMode === "date"
        ? input.dueDate
        : input.dueMode === "days"
          ? addDays(date, Number(input.dueDays))
          : null,
  }));
}

/** Corpo do comando no banco (public.agenda_command). */
export function agendaCommandInput(input: AgendaEntryInput) {
  return {
    kind: input.kind,
    location: input.location,
    sector: input.sector,
    value_cents: input.value,
    payment_method: input.paymentMethod,
    counterparty: input.counterparty,
    notes: input.notes,
    shifts: composeShifts(input),
  };
}

export const settleSchema = (today = businessDate()) =>
  z.object({
    entryId: z.uuid(),
    settledOn: dateSchema.refine(
      (value) => value <= today,
      "Informe uma data válida, até hoje.",
    ),
    amount: amountSchema,
  });

export type AgendaFormState = {
  message?: string;
  errors?: Record<string, string[]>;
  values?: Record<string, string>;
  dates?: string[];
};

/** Mensagens do banco que podem ser exibidas como estão. */
const knownDatabaseMessages = [
  "Agenda indisponível para esta conta",
  "Selecione",
  "Informe",
  "Valor inválido",
  "O término deve ser posterior",
  "Escolha datas entre",
  "A data-limite deve ficar",
  "Datas repetidas",
  "Limite de anotações atingido",
  "Plantão indisponível",
  "Texto acima do limite",
];

export function agendaFailure(message: string) {
  return knownDatabaseMessages.some((known) => message.startsWith(known))
    ? `${message}.`
    : "Não foi possível salvar. Atualize a página e tente novamente.";
}
