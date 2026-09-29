import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export async function registrationContext() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");
  return { ...identity, admin: createAdminClient() };
}

export async function readRegistration() {
  const identity = await registrationContext();
  const [{ data, error }, { data: account, error: accountError }] =
    await Promise.all([
      identity.admin.rpc("registration_read", { target_user: identity.userId }),
      identity.supabase.auth.getUser(),
    ]);
  if (error || accountError || !account.user)
    throw new Error("Não foi possível carregar seu cadastro.");
  return { identity, registration: data, user: account.user };
}
