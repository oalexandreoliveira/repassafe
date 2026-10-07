"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createHash } from "node:crypto";
import { agreementIdentity } from "@/lib/agreements";
import {
  createAgreementSchema,
  agreementCommandSchema,
  amountSchema,
  type AgreementFormState,
} from "@/features/agreements/schema";

function errorState(error: z.ZodError, formData: FormData): AgreementFormState {
  return {
    message: "Revise os campos indicados.",
    errors: z.flattenError(error).fieldErrors as Record<string, string[]>,
    values: Object.fromEntries(
      [...formData.entries()].filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
  };
}
function commandFailure(message: string): AgreementFormState {
  const known = [
    "Complete seu cadastro",
    "As duas partes precisam",
    "Vínculo de grupo",
    "O plantão precisa",
    "Informe uma data-limite",
    "O prazo de confirmação",
    "Convite indisponível",
    "Confirme seu e-mail",
    "Revise e aceite",
    "Informe o valor total",
    "Aguarde um minuto",
    "Convide outro profissional",
    "A data-limite passou",
  ];
  return {
    message: known.some((part) => message.startsWith(part))
      ? message
      : "Não foi possível concluir a ação. Atualize o acordo e tente novamente.",
  };
}
export async function createAgreementAction(
  _previous: AgreementFormState,
  formData: FormData,
): Promise<AgreementFormState> {
  const parsed = createAgreementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(parsed.error, formData);
  const identity = await agreementIdentity();
  const v = parsed.data;
  const { data, error } = await identity.supabase.rpc(
    "external_agreement_command",
    {
      request_ref: v.requestId,
      operation: "create",
      input: {
        creator_role: v.creatorRole,
        recipient_email: v.recipientEmail,
        group_id: v.groupId,
        location: v.location,
        sector: v.sector,
        starts_at: v.startsAt,
        ends_at: v.endsAt,
        value_cents: v.value,
        due_date: v.dueDate,
        payment_method: v.paymentMethod,
        notes: v.notes,
        accepted: true,
      },
    },
  );
  if (error)
    return {
      ...commandFailure(error.message),
      values: Object.fromEntries(
        [...formData.entries()].filter(
          (e): e is [string, string] => typeof e[1] === "string",
        ),
      ),
    };
  revalidatePath("/acordos/registrados");
  redirect(`/acordos/registrados/${data}`);
}
export async function agreementCommandAction(
  _previous: AgreementFormState,
  formData: FormData,
): Promise<AgreementFormState> {
  const parsed = agreementCommandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(parsed.error, formData);
  const identity = await agreementIdentity();
  const v = parsed.data;
  const input: Record<string, unknown> = {
    accepted: v.accepted === "true",
    terms_hash: v.termsHash,
    description: v.description,
  };
  if (v.operation === "payment") {
    input.paid_on = v.paidOn;
    input.amount_cents = amountSchema.parse(v.amount);
    const receipt = formData.get("receipt");
    if (receipt instanceof File && receipt.size > 0) {
      const allowed: Record<string, string> = {
        "application/pdf": "pdf",
        "image/png": "png",
        "image/jpeg": "jpg",
      };
      if (!allowed[receipt.type] || receipt.size > 4 * 1024 * 1024)
        return {
          errors: { receipt: ["Use PDF, PNG ou JPEG de até 4 MB."] },
          message: "Revise o comprovante.",
        };
      const bytes = new Uint8Array(await receipt.arrayBuffer());
      const valid =
        receipt.type === "application/pdf"
          ? new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-"
          : receipt.type === "image/png"
            ? [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n)
            : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      if (!valid)
        return {
          errors: {
            receipt: [
              "O conteúdo do arquivo não corresponde ao formato informado.",
            ],
          },
        };
      const digest = createHash("sha256").update(bytes).digest("hex");
      const path = `${v.agreementId}/${identity.userId}/${v.requestId}-${digest}.${allowed[receipt.type]}`;
      const { error } = await identity.supabase.storage
        .from("agreement-receipts")
        .upload(path, bytes, { contentType: receipt.type, upsert: false });
      if (
        error &&
        !("statusCode" in error && String(error.statusCode) === "409")
      )
        return {
          message:
            "Não foi possível anexar o comprovante. Atualize a página e tente novamente.",
        };
      input.receipt_path = path;
    }
  }
  const { error } = await identity.supabase.rpc("external_agreement_command", {
    request_ref: v.requestId,
    operation: v.operation,
    agreement_ref: v.agreementId,
    input,
  });
  if (error) {
    // A network error can hide a committed transaction. Keep the immutable
    // object for an idempotent retry; never delete evidence on an ambiguous result.
    return commandFailure(error.message);
  }
  revalidatePath(`/acordos/registrados/${v.agreementId}`);
  revalidatePath("/acordos/registrados");
  return {
    success: true,
    message: "Ação registrada. O histórico foi atualizado.",
  };
}
