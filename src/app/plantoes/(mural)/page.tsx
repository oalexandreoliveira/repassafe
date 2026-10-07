import { ShiftMural } from "@/components/screens/shift-mural";
import { listShiftWorkspace } from "@/lib/shifts/data";
import { hasUnreadNotifications } from "@/lib/notifications";
import {
  isWorkflowFeedbackCode,
  workflowFeedback,
} from "@/features/shifts/feedback";
import {
  filterMuralOffers,
  parseMuralFilter,
} from "@/features/shifts/mural-filters";
import { toOfferSummary } from "@/features/shifts/offer-view";
import {
  applicationPresentation,
  offerPresentation,
} from "@/features/shifts/presentation";

const pendingApplication = new Set(["active", "selected_pending_confirmation"]);

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const single = (value: string | string[] | undefined) =>
    typeof value === "string" ? value : undefined;
  const feedbackCode = single(params.feedback);
  const filter = parseMuralFilter(single(params.filtro));
  const query = single(params.q)?.trim().slice(0, 100) || undefined;

  const { identity, offers, applications, substitutions, failed } =
    await listShiftWorkspace();
  const [{ count: groupsCount }, unread] = await Promise.all([
    identity.supabase
      .from("group_memberships")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", identity.userId)
      .eq("active", true),
    hasUnreadNotifications(identity.supabase),
  ]);

  const applicationByOffer = new Map(
    applications.map((application) => [application.offer_id, application]),
  );
  const substitutionByOffer = new Map(
    substitutions.map((substitution) => [substitution.offer_id, substitution]),
  );
  const now = new Date();
  const summaries = offers.map(toOfferSummary);
  const items = filterMuralOffers(summaries, { filter, query, now }).map(
    (offer) => {
      const application = applicationByOffer.get(offer.id);
      return {
        offer,
        isOwner: offer.ownerId === identity.userId,
        status:
          application && pendingApplication.has(application.status)
            ? applicationPresentation(application.status)
            : offerPresentation({
                offerStatus: offer.status,
                substitutionStatus: substitutionByOffer.get(offer.id)?.status,
                view: "mural",
              }),
      };
    },
  );

  return (
    <ShiftMural
      items={items}
      totalCount={summaries.length}
      groupsCount={groupsCount ?? 0}
      unread={unread}
      canPublish={identity.profile.role === "doctor"}
      filter={filter}
      query={query}
      failed={failed}
      feedback={
        isWorkflowFeedbackCode(feedbackCode)
          ? workflowFeedback[feedbackCode]
          : undefined
      }
      now={now}
    />
  );
}
