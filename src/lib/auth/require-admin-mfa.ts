type AccessContext = { aal?: string; active?: boolean };

export function requireAdminMfa(context: AccessContext) {
  if (context.active !== true || context.aal !== "aal2")
    throw new Error("Acesso administrativo requer MFA");
}
