type Claims = { aal?: string; user_role?: string };
export function requireAdminMfa(claims: Claims) {
  if (claims.user_role !== "admin" || claims.aal !== "aal2")
    throw new Error("Acesso administrativo requer MFA");
}
