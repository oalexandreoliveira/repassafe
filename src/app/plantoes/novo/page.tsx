import { randomUUID } from "node:crypto";
import { publishOfferAction } from "@/app/plantoes/actions";
import { PublishShiftForm } from "@/components/screens/publish-shift-form";
import { dayKey } from "@/features/shifts/format";
import {
  canHandOver,
  handoverPrefill,
  matchGroup,
} from "@/features/agenda/handover";
import { loadAgendaEntry } from "@/lib/agenda";
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
  searchParams: Promise<{ modo?: string; grupo?: string; agenda?: string }>;
}) {
  const { modo, grupo, agenda } = await searchParams;
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
  // "Repassar este plantão" (agenda): só "Meu plantão" futuro do próprio autor.
  const entry = agenda ? await loadAgendaEntry(identity, agenda) : null;
  const source =
    // eslint-disable-next-line react-hooks/purity -- Server component compares the shift start once per request.
    entry && canHandOver(entry, undefined, Date.now()) ? entry : null;
  const prefill = source ? handoverPrefill(source) : null;
  const matched = prefill ? matchGroup(groups, prefill.location) : undefined;

  return (
    <PublishShiftForm
      action={publishOfferAction}
      commandId={randomUUID()}
      groups={groups}
      mode={mode}
      initialValues={
        prefill
          ? {
              date: prefill.date,
              start: prefill.start,
              end: prefill.end,
              sector: prefill.sector,
              ...(matched || preselected
                ? { groupId: matched ?? preselected }
                : {}),
            }
          : preselected
            ? { groupId: preselected }
            : undefined
      }
      fromAgenda={
        source ? { entryId: source.id, location: source.location } : undefined
      }
      minDate={dayKey(new Date())}
    />
  );
}
