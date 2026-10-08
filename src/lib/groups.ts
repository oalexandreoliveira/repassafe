import "server-only";
import { redirect } from "next/navigation";
import { getVerifiedIdentity } from "@/lib/auth/session";
import type {
  GroupDetail,
  GroupOverview,
  InvitePreview,
} from "@/features/groups/types";

type Identity = NonNullable<Awaited<ReturnType<typeof getVerifiedIdentity>>>;

export async function groupIdentity() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");
  return identity;
}

/** Tab bar e permissão de publicar, como no Perfil. */
export async function groupViewer(identity: Identity) {
  const { data: profile } = await identity.supabase
    .from("profiles")
    .select("status,role")
    .eq("id", identity.userId)
    .maybeSingle();
  return {
    approved: profile?.status === "approved",
    canPublish: profile?.role === "doctor",
  };
}

export async function readGroupOverview(identity: Identity) {
  const { data, error } = await identity.supabase.rpc("group_context", {});
  if (error) throw new Error("Não foi possível carregar seus grupos.");
  return data as GroupOverview;
}

/** null quando o grupo não existe ou a pessoa não tem vínculo ativo. */
export async function readGroup(identity: Identity, id: string) {
  const { data, error } = await identity.supabase.rpc("group_context", {
    group_ref: id,
  });
  if (error) throw new Error("Não foi possível carregar o grupo.");
  return (data ?? null) as GroupDetail | null;
}

export async function previewGroupInvite(identity: Identity, token: string) {
  const { data, error } = await identity.supabase.rpc("group_invite_preview", {
    token,
  });
  if (error) throw new Error("Não foi possível abrir o convite.");
  return data as InvitePreview;
}
