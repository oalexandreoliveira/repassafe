"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getVerifiedIdentity, requireAdminIdentity } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  enforceRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "@/lib/security/rate-limit";
import { rateLimitPolicies } from "@/features/security/rate-limits";
import type { ActionState } from "@/features/auth/schemas";

export async function createSupportAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = z
    .object({
      email: z.email(),
      category: z.enum(["support", "privacy"]),
      message: z.string().trim().min(10).max(4000),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      status: "error",
      message:
        "Informe e-mail válido e uma mensagem entre 10 e 4.000 caracteres.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      ),
    };
  const identity = await getVerifiedIdentity();
  try {
    await enforceRateLimit({
      policy: rateLimitPolicies.signupIp,
      identifier: await getRequestIp(),
      dimension: "ip",
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError)
      return {
        status: "error",
        message: "Aguarde antes de abrir outra solicitação.",
      };
    throw error;
  }
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("support_create", {
    target_user: identity?.userId ?? null,
    email: parsed.data.email,
    request_category: parsed.data.category,
    request_message: parsed.data.message,
  });
  if (error)
    return {
      status: "error",
      message:
        "Não foi possível abrir a solicitação. Tente novamente mais tarde.",
    };
  revalidatePath("/suporte");
  return {
    status: "success",
    message: `Solicitação registrada. Protocolo: ${data}. Guarde este comprovante. ${identity ? "Acompanhe a resposta nesta página." : "Entre com sua conta para acompanhar solicitações vinculadas. A equipe usará o contato informado para responder."}`,
  };
}

export async function answerSupportAction(formData: FormData) {
  const identity = await requireAdminIdentity();
  await enforceRateLimit({
    policy: rateLimitPolicies.administration,
    identifier: identity.userId,
    dimension: "user",
    actorId: identity.userId,
  });
  const parsed = z
    .object({ id: z.uuid(), response: z.string().trim().min(3).max(4000) })
    .parse(Object.fromEntries(formData));
  const { error } = await createAdminClient().rpc("support_answer", {
    request_id: parsed.id,
    reply: parsed.response,
  });
  if (error) throw new Error("Não foi possível registrar a resposta.");
  revalidatePath("/admin/suporte");
  revalidatePath("/suporte");
}
