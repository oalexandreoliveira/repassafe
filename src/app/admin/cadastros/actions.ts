"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminIdentity } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { rateLimitPolicies } from "@/features/security/rate-limits";
import type { ActionState } from "@/features/auth/schemas";

export async function reviewRegistrationAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const identity = await requireAdminIdentity();
  await enforceRateLimit({
    policy: rateLimitPolicies.administration,
    identifier: identity.userId,
    dimension: "user",
    actorId: identity.userId,
  });
  const result = z
    .object({
      userId: z.uuid(),
      revision: z.coerce.number().int().nonnegative(),
      decision: z.enum([
        "approved",
        "changes_requested",
        "rejected",
        "suspended",
      ]),
      correctionField: z.string().max(80),
      correctionReason: z.string().max(1000),
      internalNotes: z.string().max(4000),
      crmNumber: z.string().max(12),
      crmState: z.string().max(2),
      source: z.string().max(300),
      rqeSource: z.string().max(300),
      outcome: z.enum(["active", "inactive", "unconfirmed"]),
      rqeVerified: z.string().optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!result.success)
    return {
      status: "error",
      message: "Revise os campos da decisão.",
      fieldErrors: Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[0], issue.message]),
      ),
    };
  const parsed = result.data;
  const allowedFields = [
    "civilName",
    "displayName",
    "cpf",
    "birthDate",
    "phone",
    "crmNumber",
    "crmState",
    "specialty",
    "rqe",
    "institution",
    "sector",
    "photo",
  ];
  if (
    parsed.decision === "changes_requested" &&
    (!allowedFields.includes(parsed.correctionField) ||
      parsed.correctionReason.trim().length < 5)
  )
    return {
      status: "error",
      message: "Indique o campo e a orientação para correção.",
      fieldErrors: {
        ...(!allowedFields.includes(parsed.correctionField)
          ? { correctionField: "Selecione o campo que precisa de correção." }
          : {}),
        ...(parsed.correctionReason.trim().length < 5
          ? {
              correctionReason:
                "Descreva a orientação com pelo menos 5 caracteres.",
            }
          : {}),
      },
    };
  const { error } = await createAdminClient().rpc("registration_review", {
    target_user: parsed.userId,
    reviewer: identity.userId,
    expected_revision: parsed.revision,
    decision: parsed.decision,
    corrections:
      parsed.correctionField && parsed.correctionReason
        ? { [parsed.correctionField]: parsed.correctionReason }
        : {},
    internal_notes: parsed.internalNotes,
    evidence: {
      crmNumber: parsed.crmNumber,
      crmState: parsed.crmState,
      source: parsed.source,
      rqeSource: parsed.rqeSource,
      outcome: parsed.outcome,
    },
    verified_rqe: parsed.rqeVerified === "on",
    validity_days: Number(process.env.PROFESSIONAL_VERIFICATION_DAYS ?? 90),
  });
  if (error)
    return {
      status: "error",
      message:
        "Não foi possível decidir. Confira a versão enviada e a evidência profissional.",
    };
  revalidatePath("/admin/cadastros");
  revalidatePath("/cadastro/completar");
  revalidatePath("/painel");
  return {
    status: "success",
    message: "Decisão registrada e titular notificado.",
  };
}
