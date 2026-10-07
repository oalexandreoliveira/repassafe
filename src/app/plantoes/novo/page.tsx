import { randomUUID } from "node:crypto";
import { publishOfferAction } from "@/app/plantoes/actions";
import { PublishShiftForm } from "@/components/screens/publish-shift-form";
import { dayKey } from "@/features/shifts/format";
import { requireApprovedProfessional } from "@/lib/shifts/data";

type GroupRow = {
  name: string;
  requires_approval: boolean;
  institutions: { name: string } | { name: string }[] | null;
};

export default async function NewShiftPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string }>;
}) {
  const { modo } = await searchParams;
  const mode = modo === "grupo" ? "group" : modo === "livre" ? "free" : "both";
  const identity = await requireApprovedProfessional();
  const { data: memberships } = await identity.supabase
    .from("group_memberships")
    .select("group_id,groups(name,requires_approval,institutions(name))")
    .eq("profile_id", identity.userId)
    .eq("active", true);

  const groups = (memberships ?? []).map((membership) => {
    const raw = membership.groups as GroupRow | GroupRow[] | null;
    const group = Array.isArray(raw) ? raw[0] : raw;
    const institution = Array.isArray(group?.institutions)
      ? group?.institutions[0]
      : group?.institutions;
    return {
      id: membership.group_id,
      name: group?.name ?? "Grupo",
      requiresApproval: Boolean(group?.requires_approval),
      institutionName: institution?.name,
    };
  });

  return (
    <PublishShiftForm
      action={publishOfferAction}
      commandId={randomUUID()}
      groups={groups}
      mode={mode}
      minDate={dayKey(new Date())}
    />
  );
}
