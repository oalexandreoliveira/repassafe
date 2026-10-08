import { MyPublished } from "@/components/screens/my-published";
import {
  ownOfferTab,
  parseOwnOfferTab,
  type OwnOfferTab,
} from "@/features/shifts/my-offers";
import { toOfferSummary } from "@/features/shifts/offer-view";
import { offerPresentation } from "@/features/shifts/presentation";
import { hasUnreadNotifications } from "@/lib/notifications";
import { requireApprovedProfessional } from "@/lib/shifts/data";

/** S07 · Meus plantões publicados (tab "Publicar"). */
export default async function MyPublishedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const tab = parseOwnOfferTab(
    typeof params.aba === "string" ? params.aba : undefined,
  );
  const identity = await requireApprovedProfessional();
  const [
    { data: offers },
    { data: substitutions },
    { data: agreements },
    unread,
  ] = await Promise.all([
    identity.supabase
      .from("shift_offers")
      .select(
        "id,owner_id,starts_at,ends_at,sector,status,published_at,group_id,groups(name,institutions(name))",
      )
      .eq("owner_id", identity.userId)
      .order("starts_at"),
    identity.supabase
      .from("substitutions")
      .select("offer_id,status")
      .eq("owner_id", identity.userId)
      .order("created_at", { ascending: false }),
    identity.supabase
      .from("shift_agreements")
      .select("id,offer_id")
      .eq("owner_id", identity.userId),
    hasUnreadNotifications(identity.supabase),
  ]);

  const ownOffers = (offers ?? []).map(toOfferSummary);
  const openIds = ownOffers
    .filter((offer) => ownOfferTab(offer.status) === "abertos")
    .map((offer) => offer.id);
  const { data: applications } = openIds.length
    ? await identity.supabase
        .from("shift_applications")
        .select("offer_id,status")
        .in("offer_id", openIds)
    : { data: [] };

  const activeByOffer = new Map<string, number>();
  for (const application of applications ?? [])
    if (application.status === "active")
      activeByOffer.set(
        application.offer_id,
        (activeByOffer.get(application.offer_id) ?? 0) + 1,
      );
  const latestSubstitution = new Map<string, string>();
  for (const substitution of substitutions ?? [])
    if (!latestSubstitution.has(substitution.offer_id))
      latestSubstitution.set(substitution.offer_id, substitution.status);
  const agreementByOffer = new Map(
    (agreements ?? []).map((agreement) => [agreement.offer_id, agreement.id]),
  );

  const counts: Record<OwnOfferTab, number> = {
    abertos: 0,
    andamento: 0,
    registrados: 0,
  };
  for (const offer of ownOffers) {
    const offerTab = ownOfferTab(offer.status);
    if (offerTab) counts[offerTab] += 1;
  }

  const items = ownOffers
    .filter((offer) => ownOfferTab(offer.status) === tab)
    .map((offer) => {
      const activeApplications = activeByOffer.get(offer.id) ?? 0;
      return {
        offer,
        activeApplications,
        agreementId: agreementByOffer.get(offer.id),
        status: offerPresentation({
          offerStatus: offer.status,
          substitutionStatus: latestSubstitution.get(offer.id),
          view: "owner",
          activeApplications,
        }),
      };
    });

  return (
    <MyPublished
      tab={tab}
      items={tab === "registrados" ? items.reverse() : items}
      counts={counts}
      unread={unread}
      published={typeof params.publicado === "string"}
      canPublish={identity.profile.role === "doctor"}
      now={new Date()}
    />
  );
}
