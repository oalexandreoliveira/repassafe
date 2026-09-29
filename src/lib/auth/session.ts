import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireAdminMfa } from "@/lib/auth/require-admin-mfa";

export async function getVerifiedIdentity() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return null;

  return { supabase, userId, claims: data.claims };
}

export async function getAdministrativeAccess(
  identity: NonNullable<Awaited<ReturnType<typeof getVerifiedIdentity>>>,
) {
  const { data, error } = await identity.supabase
    .from("administrative_access")
    .select("user_id,active")
    .eq("user_id", identity.userId)
    .maybeSingle();
  if (error)
    throw new Error("Não foi possível verificar o acesso administrativo");
  return data?.active === true ? data : null;
}

export async function requireAdminIdentity() {
  const identity = await getVerifiedIdentity();
  if (!identity) throw new Error("Sessão inválida");
  const administrativeAccess = await getAdministrativeAccess(identity);

  requireAdminMfa({
    active: administrativeAccess?.active,
    aal: String(identity.claims.aal ?? ""),
  });

  return { ...identity, administrativeAccess };
}
