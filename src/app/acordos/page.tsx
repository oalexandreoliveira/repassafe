import { AgreementsList } from "@/components/screens/agreements-list";
import { hasUnreadNotifications } from "@/lib/notifications";
import { requireApprovedProfessional } from "@/lib/shifts/data";

type GroupRow = { name: string } | { name: string }[] | null;

/** Aba Acordos (derivada). */
export default async function AgreementsPage() {
  const identity = await requireApprovedProfessional();
  const [{ data: agreements }, unread] = await Promise.all([
    identity.supabase
      .from("shift_agreements")
      .select(
        "id,offer_id,owner_id,substitute_id,confirmed_at,snapshot,groups(name)",
      )
      .order("confirmed_at", { ascending: false })
      .limit(100),
    hasUnreadNotifications(identity.supabase),
  ]);
  const ids = (agreements ?? []).map((agreement) => agreement.id);
  const { data: documents } = ids.length
    ? await identity.supabase
        .from("agreement_documents")
        .select("agreement_id")
        .in("agreement_id", ids)
    : { data: [] };
  const withDocument = new Set(
    (documents ?? []).map((document) => document.agreement_id),
  );

  return (
    <AgreementsList
      unread={unread}
      canPublish={identity.profile.role === "doctor"}
      agreements={(agreements ?? []).map((agreement) => {
        const snapshot = agreement.snapshot as Record<string, unknown>;
        const raw = agreement.groups as GroupRow;
        const group = Array.isArray(raw) ? raw[0] : raw;
        return {
          id: agreement.id,
          offerId: agreement.offer_id,
          role:
            agreement.owner_id === identity.userId
              ? "owner"
              : agreement.substitute_id === identity.userId
                ? "substitute"
                : "coordination",
          confirmedAt: agreement.confirmed_at,
          sector: String(snapshot.sector),
          startsAt: String(snapshot.starts_at),
          endsAt: String(snapshot.ends_at),
          groupName: group?.name,
          hasDocument: withDocument.has(agreement.id),
        };
      })}
    />
  );
}
