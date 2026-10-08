import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { GroupInviteScreen } from "@/components/screens/groups";
import { inviteTokenPattern } from "@/features/groups/invite-path";
import type { InvitePreview } from "@/features/groups/types";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { previewGroupInvite } from "@/lib/groups";

export const metadata: Metadata = {
  title: "Convite para grupo | Repassafe",
  robots: { index: false, follow: false },
};

export default async function GroupInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const identity = await getVerifiedIdentity();
  // Sem sessão, o convite não é consultado: a tela só orienta a entrar.
  const preview: InvitePreview | null = !identity
    ? null
    : inviteTokenPattern.test(token)
      ? await previewGroupInvite(identity, token)
      : { status: "unavailable" };
  return (
    <GroupInviteScreen
      token={token}
      preview={preview}
      requestId={randomUUID()}
    />
  );
}
