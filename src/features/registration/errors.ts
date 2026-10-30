import type { ActionState } from "@/features/auth/schemas";

/** Classify only known constraints. Never echo database details or identity data. */
export function registrationConflict(error: {
  code?: string;
  message?: string;
  details?: string;
}): ActionState | null {
  if (error.code !== "23505") return null;
  const text = `${error.message ?? ""} ${error.details ?? ""}`;
  const field = text.includes("profiles_crm_unique_idx")
    ? "crmNumber"
    : text.includes("registration_drafts_phone_key")
      ? "phone"
      : text.includes("registration_drafts_cpf_key")
        ? "cpf"
        : null;
  const label =
    field === "crmNumber" ? "CRM e UF" : field === "phone" ? "celular" : "CPF";
  const message = field
    ? `Não foi possível vincular este ${label} ao cadastro. Confira os dados; se estiverem corretos, solicite uma revisão no suporte.`
    : "Um dos dados informados não pôde ser vinculado ao cadastro. Confira os dados ou solicite uma revisão no suporte.";
  return {
    status: "error",
    message,
    ...(field ? { fieldErrors: { [field]: message } } : {}),
  };
}
