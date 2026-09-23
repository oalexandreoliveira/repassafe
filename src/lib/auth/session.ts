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

export async function requireAdminIdentity() {
  const identity = await getVerifiedIdentity();
  if (!identity) throw new Error("Sessão inválida");

  const { data: profile, error } = await identity.supabase
    .from("profiles")
    .select("role,status")
    .eq("id", identity.userId)
    .single();
  if (error || !profile)
    throw new Error("Perfil administrativo não encontrado");

  requireAdminMfa({
    role: profile.role,
    status: profile.status,
    aal: String(identity.claims.aal ?? ""),
  });

  return { ...identity, profile };
}
