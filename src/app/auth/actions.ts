"use server";

import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { legalDocuments } from "@/features/registration/legal";
import { legalVersion } from "@/features/registration/schemas";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicSupabaseEnv } from "@/config/env";
import {
  loginSchema,
  profileSchema,
  accountSignupSchema,
  emailSchema,
  passwordResetSchema,
  type ActionState,
} from "@/features/auth/schemas";
import {
  getAdministrativeAccess,
  getVerifiedIdentity,
} from "@/lib/auth/session";
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
  const credentials = parsed.data.email.startsWith("+")
    ? { phone: parsed.data.email, password: parsed.data.password }
    : { email: parsed.data.email, password: parsed.data.password };
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
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
  const identity = await getVerifiedIdentity();
  if (identity && (await getAdministrativeAccess(identity))) {
    redirect("/mfa");
  }
  redirect("/painel");
}

export async function signupAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = accountSignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos indicados.",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
      ),
    };
  }

  const { email, password } = parsed.data;
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
  try {
    await recordAuditEvent({
      eventType: "profile.signup_started",
      entityType: "signup",
    });
  } catch {
    // Measurement is best-effort and must not prevent account creation.
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
    const hash = (document: unknown) =>
      createHash("sha256").update(JSON.stringify(document)).digest("hex");
    const { error: profileError } = await admin.rpc("registration_accept", {
      target_user: data.user.id,
      document_version: legalVersion,
      terms_hash: hash(legalDocuments.terms),
      privacy_hash: hash(legalDocuments.privacy),
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
      eventType: "account.registered",
      entityType: "authentication",
      entityId: data.user.id,
      metadata: { status: "pending" },
    });
  }

  if (data.session) redirect("/cadastro/completar");

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

export async function resendConfirmationAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      status: "error",
      message: "Confira o e-mail informado.",
      fieldErrors: { email: "Informe um e-mail válido." },
    };
  const genericMessage =
    "Se a conta precisar de confirmação, enviaremos as instruções por e-mail.";
  try {
    const ip = await getRequestIp();
    await enforceRateLimit({
      policy: rateLimitPolicies.confirmationResendIp,
      identifier: ip,
      dimension: "ip",
    });
    await enforceRateLimit({
      policy: rateLimitPolicies.confirmationResendEmail,
      identifier: parsed.data.email,
      dimension: "email",
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError)
      return { status: "success", message: genericMessage };
    throw error;
  }
  const env = getPublicSupabaseEnv();
  const supabase = await createClient();
  await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/confirm` },
  });
  return { status: "success", message: genericMessage };
}

export async function requestPasswordResetAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      status: "error",
      message: "Confira o e-mail informado.",
      fieldErrors: { email: "Informe um e-mail válido." },
    };
  try {
    const ip = await getRequestIp();
    await enforceRateLimit({
      policy: rateLimitPolicies.recoveryIp,
      identifier: ip,
      dimension: "ip",
    });
    await enforceRateLimit({
      policy: rateLimitPolicies.recoveryEmail,
      identifier: parsed.data.email,
      dimension: "email",
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return {
        status: "error",
        message:
          "Aguarde alguns minutos antes de pedir outro link de recuperação.",
      };
    }
    throw error;
  }

  const env = getPublicSupabaseEnv();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/recovery` },
  );
  if (error) {
    try {
      await recordAuditEvent({
        eventType: "auth.password_recovery.failed",
        entityType: "authentication",
        metadata: {
          email_fingerprint: securityFingerprint(
            "email",
            parsed.data.email,
          ).slice(0, 12),
        },
      });
    } catch {
      // Keep responses generic even when audit storage is unavailable.
    }
    return {
      status: "error",
      message:
        "Não foi possível enviar as instruções agora. Aguarde alguns minutos e tente novamente.",
    };
  }
  return {
    status: "success",
    message:
      "Se o endereço puder receber recuperação, enviaremos as instruções por e-mail.",
  };
}

export async function updatePasswordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const identity = await getVerifiedIdentity();
  if (!identity) {
    return {
      status: "error",
      message: "O link expirou ou não é válido. Solicite uma nova recuperação.",
    };
  }
  const parsed = passwordResetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0].message,
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [
          String(issue.path[0]),
          issue.message,
        ]),
      ),
    };
  }
  const { error } = await identity.supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return {
      status: "error",
      message: "Não foi possível atualizar a senha. Solicite um novo link.",
    };
  }
  await recordAuditEvent({
    actorId: identity.userId,
    eventType: "auth.password_recovered",
    entityType: "authentication",
    entityId: identity.userId,
  });
  if (await getAdministrativeAccess(identity)) redirect("/mfa");
  return {
    status: "success",
    message: "Senha atualizada. Você já pode entrar.",
  };
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

export async function markNotificationsReadAction() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");
  const { error } = await identity.supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", identity.userId)
    .is("read_at", null);
  if (error) throw new Error("Não foi possível atualizar as notificações");
  revalidatePath("/painel");
  revalidatePath("/notificacoes");
}
