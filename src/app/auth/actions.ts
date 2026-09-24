"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicSupabaseEnv } from "@/config/env";
import {
  loginSchema,
  profileSchema,
  signupSchema,
  type ActionState,
} from "@/features/auth/schemas";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { rateLimitPolicies } from "@/features/security/rate-limits";
import { recordAuditEvent } from "@/lib/security/audit";
import {
  enforceRateLimit,
  getRequestIp,
  RateLimitExceededError,
  securityFingerprint,
} from "@/lib/security/rate-limit";

const invalidCredentials: ActionState = {
  status: "error",
  message: "Não foi possível autenticar com os dados informados.",
};

export async function loginAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalidCredentials;

  try {
    const ip = await getRequestIp();
    await enforceRateLimit({
      policy: rateLimitPolicies.loginIp,
      identifier: ip,
      dimension: "ip",
    });
    await enforceRateLimit({
      policy: rateLimitPolicies.loginEmail,
      identifier: parsed.data.email,
      dimension: "email",
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) return invalidCredentials;
    throw error;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    await recordAuditEvent({
      eventType: "auth.login.failed",
      entityType: "authentication",
      metadata: {
        email_fingerprint: securityFingerprint(
          "email",
          parsed.data.email,
        ).slice(0, 12),
      },
    });
    return invalidCredentials;
  }
  await recordAuditEvent({
    actorId: data.user.id,
    eventType: "auth.login.succeeded",
    entityType: "authentication",
    entityId: data.user.id,
  });
  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", data.user.id)
    .single();
  if (profile?.role === "admin" && profile.status === "approved") {
    redirect("/mfa");
  }
  redirect("/painel");
}

export async function signupAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const { email, password, displayName, crmNumber, crmState } = parsed.data;
  try {
    const ip = await getRequestIp();
    await enforceRateLimit({
      policy: rateLimitPolicies.signupIp,
      identifier: ip,
      dimension: "ip",
    });
    await enforceRateLimit({
      policy: rateLimitPolicies.signupEmail,
      identifier: email,
      dimension: "email",
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return {
        status: "error",
        message: "Não foi possível concluir o cadastro. Tente mais tarde.",
      };
    }
    throw error;
  }
  const supabase = await createClient();
  const env = getPublicSupabaseEnv();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/confirm`,
    },
  });

  if (error) {
    return {
      status: "error",
      message: "Não foi possível concluir o cadastro. Revise os dados.",
    };
  }

  if (data.user && (data.user.identities?.length ?? 0) > 0) {
    const admin = createAdminClient();
    const { error: profileError } = await admin.from("profiles").insert({
      id: data.user.id,
      contact_email: email,
      display_name: displayName,
      crm_number: crmNumber,
      crm_state: crmState,
      role: "doctor",
      status: "pending",
    });
    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return {
        status: "error",
        message: "Não foi possível preparar o perfil. Tente novamente.",
      };
    }
    await recordAuditEvent({
      actorId: data.user.id,
      eventType: "profile.registered",
      entityType: "profile",
      entityId: data.user.id,
      metadata: { status: "pending" },
    });
  }

  return {
    status: "success",
    message: "Confira seu e-mail para confirmar o cadastro.",
  };
}

export async function updateProfileAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const identity = await getVerifiedIdentity();
  if (!identity) return { status: "error", message: "Sessão expirada." };

  try {
    await enforceRateLimit({
      policy: rateLimitPolicies.profile,
      identifier: identity.userId,
      dimension: "user",
      actorId: identity.userId,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return { status: "error", message: "Aguarde antes de tentar novamente." };
    }
    throw error;
  }

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { status: "error", message: parsed.error.issues[0].message };

  const { error } = await identity.supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      crm_number: parsed.data.crmNumber,
      crm_state: parsed.data.crmState,
    })
    .eq("id", identity.userId);
  if (error)
    return { status: "error", message: "Não foi possível salvar o perfil." };

  await recordAuditEvent({
    actorId: identity.userId,
    eventType: "profile.updated",
    entityType: "profile",
    entityId: identity.userId,
    metadata: { fields: ["display_name", "crm_number", "crm_state"] },
  });

  revalidatePath("/painel");
  return { status: "success", message: "Perfil atualizado." };
}

export async function logoutAction() {
  const identity = await getVerifiedIdentity();
  if (identity) {
    await recordAuditEvent({
      actorId: identity.userId,
      eventType: "auth.logout",
      entityType: "authentication",
      entityId: identity.userId,
    });
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
