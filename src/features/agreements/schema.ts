import { z } from "zod";

export const deadlineNotice =
  "A data-limite vale mesmo se o hospital atrasar o pagamento.";
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(date.valueOf()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Informe uma data válida.");
const dateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Informe data e horário.")
  .refine((value) => {
    const [day, time] = value.split("T");
    return (
      dateSchema.safeParse(day).success &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(time)
    );
  }, "Informe data e horário válidos.")
  .transform((value) => new Date(`${value}:00-03:00`).toISOString());
export const amountSchema = z
  .string()
  .trim()
  .regex(/^\d{1,7}([,.]\d{1,2})?$/, "Use um valor como 1500,00.")
  .transform((value) => Math.round(Number(value.replace(",", ".")) * 100))
  .refine(
    (value) => value > 0 && value <= 999999999,
    "Informe um valor maior que zero.",
  );
export function businessDate(now = new Date()) {
  return new Date(now.valueOf() - 3 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}
export const createAgreementSchema = z
  .object({
    requestId: z.uuid(),
    creatorRole: z.enum(["owner", "substitute"], {
      error: "Selecione seu papel.",
    }),
    recipientEmail: z
      .email("Informe o e-mail do outro profissional.")
      .max(254)
      .transform((v) => v.toLowerCase()),
    groupId: z.union([z.uuid(), z.literal("")]),
    location: z.string().trim().min(3, "Informe instituição e local.").max(240),
    sector: z.string().trim().min(2, "Informe o setor.").max(120),
    startsAt: dateTimeSchema,
    endsAt: dateTimeSchema,
    value: amountSchema,
    dueDate: dateSchema,
    paymentMethod: z
      .string()
      .trim()
      .min(2, "Informe a forma de pagamento.")
      .max(120),
    notes: z.string().trim().max(1000),
    accepted: z.literal("true", {
      error: "Confirme as condições e a data-limite.",
    }),
  })
  .superRefine((value, ctx) => {
    if (value.endsAt <= value.startsAt)
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "O término deve ser posterior ao início.",
      });
    if (Date.parse(value.startsAt) <= Date.now())
      ctx.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: "Escolha um plantão futuro.",
      });
    if (value.dueDate < businessDate())
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "A data-limite não pode estar no passado.",
      });
  });
export const agreementCommandSchema = z
  .object({
    requestId: z.uuid(),
    agreementId: z.uuid(),
    operation: z.enum([
      "accept",
      "decline",
      "approve",
      "reject",
      "cancel",
      "payment",
      "receive",
      "dispute",
    ]),
    accepted: z.string().optional(),
    termsHash: z.string().optional(),
    paidOn: z.string().optional(),
    amount: z.string().optional(),
    description: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      ["accept", "receive"].includes(value.operation) &&
      value.accepted !== "true"
    )
      ctx.addIssue({
        code: "custom",
        path: ["accepted"],
        message: "Confirme antes de continuar.",
      });
    if (
      value.operation === "accept" &&
      !/^[a-f0-9]{64}$/.test(value.termsHash ?? "")
    )
      ctx.addIssue({
        code: "custom",
        path: ["accepted"],
        message: "Reabra o acordo para conferir as condições.",
      });
    if (value.operation === "payment") {
      if (
        !dateSchema.safeParse(value.paidOn).success ||
        value.paidOn! > businessDate()
      )
        ctx.addIssue({
          code: "custom",
          path: ["paidOn"],
          message: "Informe uma data válida, até hoje.",
        });
      if (!amountSchema.safeParse(value.amount).success)
        ctx.addIssue({
          code: "custom",
          path: ["amount"],
          message: "Informe o valor pago, como 1500,00.",
        });
    }
    if (
      value.operation === "dispute" &&
      ((value.description?.trim().length ?? 0) < 10 ||
        (value.description?.length ?? 0) > 2000)
    )
      ctx.addIssue({
        code: "custom",
        path: ["description"],
        message: "Descreva a divergência em 10 a 2000 caracteres.",
      });
  });
export type AgreementFormState = {
  message?: string;
  errors?: Record<string, string[]>;
  values?: Record<string, string>;
  success?: boolean;
};
export const agreementStatusLabels: Record<string, string> = {
  pending_acceptance: "Aguardando confirmação",
  pending_approval: "Aguardando aprovação institucional",
  confirmed: "Acordo confirmado",
  declined: "Convite recusado",
  rejected: "Não aprovado pela instituição",
  cancelled: "Convite cancelado",
  expired: "Prazo de confirmação encerrado",
};
export function agreementStatus(
  status: string,
  startsAt: string,
  now = new Date(),
) {
  return ["pending_acceptance", "pending_approval"].includes(status) &&
    Date.parse(startsAt) <= now.valueOf()
    ? "expired"
    : status;
}
export function paymentStatus(
  dueDate: string,
  receivedAt: string | null,
  reported: boolean,
  now = new Date(),
) {
  if (receivedAt) return "Recebimento confirmado";
  if (now.valueOf() >= Date.parse(`${dueDate}T00:00:00-03:00`) + 86400000)
    return "Prazo vencido — recebimento não confirmado";
  return reported
    ? "Pagamento informado — aguardando recebimento"
    : "Aguardando pagamento";
}
export const eventLabels: Record<string, string> = {
  created: "Condições registradas e aceitas pelo autor",
  accepted: "Condições aceitas pelo destinatário",
  approved: "Aprovação institucional registrada",
  rejected: "Aprovação institucional recusada",
  declined: "Convite recusado",
  cancelled: "Convite cancelado",
  payment_reported: "Pagamento informado",
  received: "Recebimento confirmado",
  disputed: "Divergência informada",
};
