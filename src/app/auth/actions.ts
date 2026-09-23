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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return invalidCredentials;
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

  revalidatePath("/painel");
  return { status: "success", message: "Perfil atualizado." };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
