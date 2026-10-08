import { notFound, redirect } from "next/navigation";
import { ChooseSubstitute } from "@/components/screens/choose-substitute";
import { toOfferSummary } from "@/features/shifts/offer-view";
import { getShiftDetails } from "@/lib/shifts/data";

/** S08 · Escolher substituto (somente o titular, com a oferta aberta). */
export default async function ChooseSubstitutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getShiftDetails(id);
  if (!workspace) notFound();
  const { identity, offer, applications, ownerTermsAcknowledged } = workspace;
  const active = applications.filter(
    (application) => application.status === "active",
  );
  if (
    offer.owner_id !== identity.userId ||
    !["open_normal", "open_emergency"].includes(offer.status) ||
    !ownerTermsAcknowledged ||
    active.length === 0
  )
    redirect(`/plantoes/${id}`);

  return (
    <ChooseSubstitute
      offer={toOfferSummary(offer)}
      applications={active}
      now={new Date()}
    />
  );
}
