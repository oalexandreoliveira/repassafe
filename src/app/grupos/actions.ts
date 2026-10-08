"use server";

import { createHmac } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getServerEnv } from "@/config/env";
import { invitePath } from "@/features/groups/invite-path";
import {
  createGroupSchema,
  groupCommandSchema,
  inviteSchema,
  joinGroupSchema,
  renameGroupSchema,
} from "@/features/groups/schemas";
import type { GroupActionState } from "@/features/groups/types";
import { rateLimitPolicies } from "@/features/security/rate-limits";
import { groupIdentity } from "@/lib/groups";
import {
  enforceRateLimit,
  RateLimitExceededError,
} from "@/lib/security/rate-limit";

/** Mensagens do banco que podem ser mostradas como estão. */
const knownMessages = [
  "Somente médicos com cadastro aprovado",
  "Informe um nome de 3 a 80 caracteres",
  "Você já gerencia 10 grupos ativos",
  "Seu cadastro precisa estar aprovado",
  "Convite indisponível",
  "O grupo atingiu o limite",
  "Grupo indisponível",
  "Este grupo está arquivado",
  "Somente o gestor do grupo",
  "Escolha a validade do convite",
  "Revogue um convite ativo",
  "Escolha outro membro",
  "Membro indisponível",
  "O novo gestor precisa",
  "Transfira a gestão",
  "Conclua ou cancele os plantões",
  "Aguarde um minuto",
];

function failure(message?: string): GroupActionState {
  const known = knownMessages.find((part) => message?.includes(part));
  if (known && message) {
    const start = message.indexOf(known);
    return { status: "error", message: `${message.slice(start)}.` };
  }
  return {
    status: "error",
    message: message?.includes("Comando já utilizado")
      ? "Atualize a página e tente novamente."
      : "Não foi possível concluir a ação. Atualize a página e tente novamente.",
  };
}

function fieldFailure(error: z.ZodError): GroupActionState {
  const fields = z.flattenError(error).fieldErrors as Record<
    string,
    string[] | undefined
  >;
  return {
    status: "error",
    message: "Revise o campo indicado.",
    fieldErrors: Object.fromEntries(
      Object.entries(fields).map(([name, messages]) => [
        name,
        messages?.[0] ?? "",
      ]),
    ),
  };
}

async function runGroupCommand(
  requestId: string,
  operation: string,
  groupId: string | null,
  input: Record<string, unknown>,
  userId?: string,
) {
  const identity = await groupIdentity();
  try {
    await enforceRateLimit({
      policy: rateLimitPolicies.groups,
      identifier: identity.userId,
      dimension: "user",
      actorId: identity.userId,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError)
      return { error: "Aguarde um minuto antes de tentar novamente" };
    throw error;
  }
  if (userId && userId !== identity.userId) return { error: "Sessão inválida" };
  const { data, error } = await identity.supabase.rpc("group_command", {
    request_ref: requestId,
    operation,
    group_ref: groupId,
    input,
  });
  if (error) return { error: error.message };
  return { data: (data ?? {}) as Record<string, string> };
}

/**
 * Token do convite derivado do pedido: repetir o envio devolve o mesmo link
 * (o banco é idempotente pelo requestId) e o cliente nunca escolhe o token.
 */
function inviteToken(userId: string, requestId: string) {
  const { RATE_LIMIT_PEPPER } = getServerEnv();
  return createHmac("sha256", RATE_LIMIT_PEPPER)
    .update(`group-invite:${userId}:${requestId}`)
    .digest("base64url");
}

export async function createGroupAction(
  _previous: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const parsed = createGroupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldFailure(parsed.error);
  const result = await runGroupCommand(parsed.data.requestId, "create", null, {
    name: parsed.data.name,
  });
  if ("error" in result) return failure(result.error);
  revalidatePath("/grupos");
  redirect(`/grupos/${result.data.group_id}?criado=1`);
}

export async function renameGroupAction(
  _previous: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const parsed = renameGroupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldFailure(parsed.error);
  const result = await runGroupCommand(
    parsed.data.requestId,
    "rename",
    parsed.data.groupId,
    { name: parsed.data.name },
  );
  if ("error" in result) return failure(result.error);
  revalidatePath(`/grupos/${parsed.data.groupId}`);
  revalidatePath("/grupos");
  return { status: "success", message: "Nome do grupo atualizado." };
}

export async function createInviteAction(
  _previous: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldFailure(parsed.error);
  const identity = await groupIdentity();
  const token = inviteToken(identity.userId, parsed.data.requestId);
  const result = await runGroupCommand(
    parsed.data.requestId,
    "invite",
    parsed.data.groupId,
    { token, validity_days: parsed.data.validityDays },
    identity.userId,
  );
  if ("error" in result) return failure(result.error);
  revalidatePath(`/grupos/${parsed.data.groupId}`);
  return {
    status: "success",
    message: "Link de convite gerado.",
    invitePath: invitePath(token),
    inviteExpiresAt: result.data.expires_at,
  };
}

const commandSuccess: Record<string, string> = {
  revoke_invite: "Link revogado. Ele não funciona mais.",
  remove_member: "Membro removido do grupo.",
  transfer: "Gestão transferida.",
  archive: "Grupo arquivado.",
};

export async function groupCommandAction(
  _previous: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const parsed = groupCommandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure();
  const command = parsed.data;
  const input =
    command.operation === "revoke_invite"
      ? { invite_id: command.inviteId }
      : command.operation === "remove_member" ||
          command.operation === "transfer"
        ? { profile_id: command.profileId }
        : {};
  const result = await runGroupCommand(
    command.requestId,
    command.operation,
    command.groupId,
    input,
  );
  if ("error" in result) return failure(result.error);
  revalidatePath("/grupos");
  revalidatePath(`/grupos/${command.groupId}`);
  if (command.operation === "leave") redirect("/grupos?saiu=1");
  return { status: "success", message: commandSuccess[command.operation] };
}

export async function joinGroupAction(
  _previous: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const parsed = joinGroupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return failure("Convite indisponível");
  const result = await runGroupCommand(parsed.data.requestId, "join", null, {
    token: parsed.data.token,
  });
  if ("error" in result) return failure(result.error);
  revalidatePath("/grupos");
  redirect(`/grupos/${result.data.group_id}?entrou=1`);
}
