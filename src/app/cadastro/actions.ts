"use server";

import { createHash } from "node:crypto";
import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { registrationContext } from "@/lib/registration";
import { legalDocuments } from "@/features/registration/legal";
import {
  legalVersion,
  registrationDraftSchema,
  registrationSchema,
} from "@/features/registration/schemas";
import {
  enforceRateLimit,
  RateLimitExceededError,
} from "@/lib/security/rate-limit";
import { rateLimitPolicies } from "@/features/security/rate-limits";
import type { ActionState } from "@/features/auth/schemas";

async function context() {
  const identity = await registrationContext();
  await enforceRateLimit({
    policy: rateLimitPolicies.profile,
    identifier: identity.userId,
    dimension: "user",
    actorId: identity.userId,
  });
  return identity;
}

const success = (message: string): ActionState => ({
  status: "success",
  message,
});
const failure = (message: string): ActionState => ({
  status: "error",
  message,
});

export async function saveRegistrationAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registrationDraftSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!parsed.success)
    return {
      ...failure("Revise os campos indicados."),
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
      ),
    };
  const revision = z.coerce
    .number()
    .int()
    .nonnegative()
    .safeParse(formData.get("revision"));
  if (!revision.success)
    return failure("Recarregue o cadastro antes de salvar.");
  try {
    const identity = await context();
    const { data, error } = await identity.admin.rpc("registration_save", {
      target_user: identity.userId,
      draft_data: parsed.data,
      expected_revision: revision.data,
    });
    if (error)
      return failure(
        error.code === "40001"
          ? "Seu cadastro mudou em outra sessão. Recarregue para continuar."
          : "Não foi possível salvar. Revise CPF e telefone ou procure suporte.",
      );
    revalidatePath("/cadastro/completar");
    return {
      ...success("Progresso salvo. Você pode continuar depois."),
      revision: data,
    };
  } catch (error) {
    if (error instanceof RateLimitExceededError)
      return failure("Aguarde antes de salvar novamente.");
    throw error;
  }
}

export async function submitRegistrationAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const identity = await context();
  const { data, error: readError } = await identity.admin.rpc(
    "registration_read",
    { target_user: identity.userId },
  );
  if (readError || !data?.draft)
    return failure("Salve seu cadastro antes de enviar.");
  const parsed = registrationSchema.safeParse(data.draft.data);
  if (!parsed.success) return failure(parsed.error.issues[0].message);
  if (process.env.SMS_VERIFICATION_ENABLED === "true") {
    const { data: account, error: accountError } =
      await identity.supabase.auth.getUser();
    if (
      accountError ||
      !account.user?.phone_confirmed_at ||
      account.user.phone !== data.draft.phone
    )
      return failure("Confirme seu telefone antes de enviar o cadastro.");
  }
  const revision = Number(formData.get("revision"));
  if (!Number.isSafeInteger(revision) || revision !== data.draft.revision)
    return failure("Revise a versão atual do cadastro antes de enviar.");
  const { error } = await identity.admin.rpc("registration_submit", {
    target_user: identity.userId,
    expected_revision: revision,
  });
  if (error)
    return failure(
      "Não foi possível enviar. Confirme o e-mail, complete a foto e aceite os documentos atuais.",
    );
  revalidatePath("/cadastro/completar");
  revalidatePath("/painel");
  return success(
    "Cadastro enviado. Acompanhe a decisão e eventuais correções aqui.",
  );
}

export async function acceptDocumentsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (formData.get("terms") !== "on" || formData.get("privacy") !== "on")
    return failure("Leia e aceite os dois documentos para continuar.");
  const identity = await context();
  const hash = (document: unknown) =>
    createHash("sha256").update(JSON.stringify(document)).digest("hex");
  const { error } = await identity.admin.rpc("registration_accept", {
    target_user: identity.userId,
    document_version: legalVersion,
    terms_hash: hash(legalDocuments.terms),
    privacy_hash: hash(legalDocuments.privacy),
  });
  if (error) return failure("Não foi possível registrar o aceite.");
  revalidatePath("/cadastro/completar");
  return success("Aceite registrado.");
}

export async function uploadPhotoAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const identity = await context();
  const file = formData.get("photo");
  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > 2 * 1024 * 1024 ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    return failure("Escolha uma foto JPG, PNG ou WebP de até 2 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const png =
    bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp =
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (!(
    (file.type === "image/png" && png) ||
    (file.type === "image/jpeg" && jpeg) ||
    (file.type === "image/webp" && webp)
  ))
    return failure("O arquivo não corresponde ao formato de imagem informado.");
  const path = `${identity.userId}/${crypto.randomUUID()}`;
  let sanitizedPhoto: Buffer;
  try {
    sanitizedPhoto = await sharp(bytes, { limitInputPixels: 16000000 })
      .rotate()
      .resize({
        width: 1024,
        height: 1024,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    return failure(
      "A imagem está danificada ou excede o limite de resolução. Escolha outra foto.",
    );
  }
  const { data: existing } = await identity.admin.rpc("registration_read", {
    target_user: identity.userId,
  });
  const { error } = await identity.admin.storage
    .from("profile-photos")
    .upload(path, sanitizedPhoto, { contentType: "image/webp", upsert: false });
  if (error) return failure("Não foi possível enviar a foto.");
  const { error: saveError } = await identity.admin.rpc("registration_photo", {
    target_user: identity.userId,
    object_path: path,
  });
  if (saveError) {
    await identity.admin.storage.from("profile-photos").remove([path]);
    return failure("Não foi possível associar a foto.");
  }
  if (existing?.draft?.photo_path)
    if (
      !(existing.submissions ?? []).some(
        (submission: { snapshot: { photo_path?: string } }) =>
          submission.snapshot.photo_path === existing.draft.photo_path,
      )
    )
      await identity.admin.storage
        .from("profile-photos")
        .remove([existing.draft.photo_path]);
  revalidatePath("/cadastro/completar");
  return success("Foto salva em armazenamento privado.");
}

export async function removePhotoAction(
  _previous: ActionState,
): Promise<ActionState> {
  void _previous;
  const identity = await context();
  const { data } = await identity.admin.rpc("registration_read", {
    target_user: identity.userId,
  });
  const { error } = await identity.admin.rpc("registration_photo", {
    target_user: identity.userId,
    object_path: null,
  });
  if (error) return failure("Não foi possível remover a foto.");
  if (data?.draft?.photo_path)
    if (
      !(data.submissions ?? []).some(
        (submission: { snapshot: { photo_path?: string } }) =>
          submission.snapshot.photo_path === data.draft.photo_path,
      )
    )
      await identity.admin.storage
        .from("profile-photos")
        .remove([data.draft.photo_path]);
  revalidatePath("/cadastro/completar");
  return success("Foto removida.");
}

export async function sendPhoneCodeAction(
  _previous: ActionState,
): Promise<ActionState> {
  void _previous;
  const identity = await context();
  if (process.env.SMS_VERIFICATION_ENABLED !== "true")
    return failure(
      "Confirmação por SMS aguardando configuração. Seu telefone continua sem confirmação.",
    );
  try {
    await enforceRateLimit({
      policy: rateLimitPolicies.phoneSend,
      identifier: identity.userId,
      dimension: "user",
      actorId: identity.userId,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError)
      return failure("Aguarde 15 minutos antes de solicitar outro código.");
    throw error;
  }
  const { data, error } = await identity.admin.rpc("registration_read", {
    target_user: identity.userId,
  });
  if (error || !data?.draft?.phone)
    return failure("Salve um telefone válido antes de solicitar o código.");
  const { error: phoneError } = await identity.supabase.auth.updateUser({
    phone: data.draft.phone,
  });
  if (phoneError)
    return failure(
      "Não foi possível enviar o código. Aguarde antes de tentar novamente.",
    );
  return success(
    "Código enviado. Use-o antes do prazo de expiração informado na mensagem.",
  );
}

export async function changeEmailAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = z
    .email("Informe um e-mail válido.")
    .safeParse(formData.get("newEmail"));
  if (!email.success) return failure("Informe o novo e-mail válido.");
  const identity = await context();
  const { error } = await identity.supabase.auth.updateUser(
    { email: email.data },
    { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm` },
  );
  if (error)
    return failure(
      "Não foi possível solicitar a mudança. Aguarde e tente novamente.",
    );
  return success(
    "Siga as confirmações enviadas pelo provedor. O novo e-mail só será confirmado após concluir os links necessários.",
  );
}

export async function verifyPhoneCodeAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const identity = await context();
  try {
    await enforceRateLimit({
      policy: rateLimitPolicies.phoneVerify,
      identifier: identity.userId,
      dimension: "user",
      actorId: identity.userId,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError)
      return failure("Limite de tentativas atingido. Aguarde 15 minutos.");
    throw error;
  }
  if (process.env.SMS_VERIFICATION_ENABLED !== "true")
    return failure("Confirmação por SMS aguardando configuração.");
  const code = z
    .string()
    .regex(/^\d{6}$/)
    .safeParse(formData.get("code"));
  if (!code.success) return failure("Informe o código de seis dígitos.");
  const { data, error: readError } = await identity.admin.rpc(
    "registration_read",
    { target_user: identity.userId },
  );
  if (readError || !data?.draft?.phone)
    return failure("Salve seu telefone antes de continuar.");
  const { error } = await identity.supabase.auth.verifyOtp({
    phone: data.draft.phone,
    token: code.data,
    type: "phone_change",
  });
  if (error)
    return failure("Código inválido ou expirado. Solicite outro código.");
  revalidatePath("/cadastro/completar");
  return success("Telefone confirmado pelo provedor.");
}
