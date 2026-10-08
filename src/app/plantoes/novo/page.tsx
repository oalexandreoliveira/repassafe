import { randomUUID } from "node:crypto";
import { publishOfferAction } from "@/app/plantoes/actions";
import { PublishShiftForm } from "@/components/screens/publish-shift-form";
import { dayKey } from "@/features/shifts/format";
import { requireApprovedProfessional } from "@/lib/shifts/data";

type GroupRow = {
  name: string;
  kind: "institutional" | "peer";
  requires_approval: boolean;
  institutions: { name: string } | { name: string }[] | null;
};

export default async function NewShiftPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string; grupo?: string }>;
}) {
  const { modo, grupo } = await searchParams;
  const mode = modo === "grupo" ? "group" : modo === "livre" ? "free" : "both";
  const identity = await requireApprovedProfessional();
  const { data: memberships } = await identity.supabase
    .from("group_memberships")
    .select(
      "group_id,groups!inner(name,kind,active,requires_approval,institutions(name))",
    )
    .eq("profile_id", identity.userId)
    .eq("active", true)
    .eq("groups.active", true);

  const groups = (memberships ?? []).map((membership) => {
    const raw = membership.groups as GroupRow | GroupRow[] | null;
    const group = Array.isArray(raw) ? raw[0] : raw;
    const institution = Array.isArray(group?.institutions)
      ? group?.institutions[0]
      : group?.institutions;
    return {
      id: membership.group_id,
      name: group?.name ?? "Grupo",
      kind: group?.kind,
      requiresApproval: Boolean(group?.requires_approval),
      institutionName: institution?.name,
    };
  });
  // "Publicar plantão no grupo" chega com o grupo já escolhido.
  const preselected = groups.find((group) => group.id === grupo)?.id;

  return (
    <PublishShiftForm
      action={publishOfferAction}
      commandId={randomUUID()}
      groups={groups}
      mode={mode}
      initialValues={preselected ? { groupId: preselected } : undefined}
      minDate={dayKey(new Date())}
    />
  );
}
