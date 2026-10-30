"use server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  enforceRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "@/lib/security/rate-limit";
import { rateLimitPolicies } from "@/features/security/rate-limits";
import { waitlistSchema } from "@/features/marketing/waitlist";
import type { ActionState } from "@/features/auth/schemas";

const duplicateCode = "23505";

export async function joinWaitlistAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  // Campo-isca invisível: robôs preenchem, pessoas não. Resposta idêntica ao sucesso.
  if (String(formData.get("website") ?? "") !== "") return successState();

  const parsed = waitlistSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      status: "error",
      message: "Revise os campos indicados e envie novamente.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      ),
    };

  try {
    await enforceRateLimit({
      policy: rateLimitPolicies.waitlistIp,
      identifier: await getRequestIp(),
      dimension: "ip",
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError)
      return {
        status: "error",
        message:
          "Muitas tentativas deste acesso. Aguarde antes de tentar de novo.",
      };
    throw error;
  }

  const { consent: _consent, ...entry } = parsed.data;
  void _consent;
  const { error } = await createAdminClient()
    .from("waitlist_entries")
    .insert(entry);
  // E-mail já inscrito recebe a mesma resposta, para não revelar quem está na lista.
  if (error && error.code !== duplicateCode)
    return {
      status: "error",
      message:
        "Não foi possível registrar seu contato agora. Tente novamente em alguns minutos.",
    };
  return successState();
}

function successState(): ActionState {
  return {
    status: "success",
    message:
      "Contato registrado. Avisaremos por e-mail quando houver vaga no piloto da sua região e especialidade.",
  };
}
