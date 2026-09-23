type AccessContext = { aal?: string; role?: string; status?: string };

export function requireAdminMfa(context: AccessContext) {
  if (
    context.role !== "admin" ||
    context.status !== "approved" ||
    context.aal !== "aal2"
  )
    throw new Error("Acesso administrativo requer MFA");
}
