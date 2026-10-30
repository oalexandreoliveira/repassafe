"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  agreementCommandSchema,
  amountSchema,
} from "@/features/agreements/schema";
import type { ActionState } from "@/features/auth/schemas";
import {
  enforceRateLimit,
  RateLimitExceededError,
} from "@/lib/security/rate-limit";
import { rateLimitPolicies } from "@/features/security/rate-limits";

export async function recordPaymentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const sourceDelay = raw.operation === "source_delay";
  const parsed = agreementCommandSchema.safeParse({
    ...raw,
    operation: sourceDelay ? "dispute" : raw.operation,
  });
  if (!parsed.success)
    return {
      status: "error",
      message: "Revise os campos indicados.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      ),
    };
  const identity = await getVerifiedIdentity();
  if (!identity)
    return {
      status: "error",
      message: "Entre novamente para registrar a atualização.",
    };
  const v = parsed.data;
  if (!["payment", "receive", "dispute"].includes(v.operation))
    return { status: "error", message: "Ação inválida." };
  try {
    await enforceRateLimit({
      policy: rateLimitPolicies.workflow,
      identifier: identity.userId,
      dimension: "user",
      actorId: identity.userId,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError)
      return {
        status: "error",
        message: "Aguarde antes de registrar outra atualização.",
      };
    throw error;
  }
  const { error } = await createAdminClient().rpc("record_agreement_payment", {
    target_user: identity.userId,
    request_ref: z.uuid().parse(v.requestId),
    target_agreement: v.agreementId,
    operation: sourceDelay ? "source_delay" : v.operation,
    input: {
      accepted: v.accepted === "true",
      paid_on: v.operation === "payment" ? v.paidOn : null,
      amount_cents:
        v.operation === "payment" ? amountSchema.parse(v.amount) : null,
      description: ["dispute"].includes(v.operation)
        ? v.description?.trim()
        : null,
    },
  });
  if (error)
    return {
      status: "error",
      message:
        "Não foi possível registrar. Confira a data e o valor total, atualize a página e tente novamente. Para pagamento parcial, informe uma divergência.",
    };
  revalidatePath(`/acordos/${v.agreementId}/pagamento`);
  return { status: "success", message: "Atualização registrada no histórico." };
}
