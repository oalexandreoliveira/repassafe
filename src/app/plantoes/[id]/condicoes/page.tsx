import { notFound, redirect } from "next/navigation";
import {
  confirmSubstitutionAction,
  selectCandidateAction,
} from "@/app/plantoes/actions";
import {
  OwnerConditionsReview,
  SubstituteConditions,
} from "@/components/screens/conditions-confirmation";
import { toOfferSummary } from "@/features/shifts/offer-view";
import { getShiftDetails } from "@/lib/shifts/data";

/**
 * S09 · Confirmar condições. O titular chega de S08 com ?candidatura=;
 * o substituto chega pela notificação "Você foi selecionado".
 */
export default async function ConditionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { candidatura } = await searchParams;
  const workspace = await getShiftDetails(id);
  if (!workspace) notFound();
  const {
    identity,
    offer,
    applications,
    substitutions,
    ownerTermsAcknowledged,
  } = workspace;
  const summary = toOfferSummary(offer);

  if (typeof candidatura === "string") {
    const application = applications.find(
      (item) => item.id === candidatura && item.status === "active",
    );
    if (
      offer.owner_id !== identity.userId ||
      !["open_normal", "open_emergency"].includes(offer.status) ||
      !ownerTermsAcknowledged ||
      !application
    )
      redirect(`/plantoes/${id}`);
    return (
      <OwnerConditionsReview
        offer={summary}
        applicationId={application.id}
        candidateName={application.candidate_display_name}
        select={selectCandidateAction}
      />
    );
  }

  const substitution = substitutions[0];
  if (
    substitution?.substitute_id !== identity.userId ||
    substitution.status !== "pending_substitute_confirmation"
  )
    redirect(`/plantoes/${id}`);
  return (
    <SubstituteConditions
      offer={summary}
      substitutionId={substitution.id}
      confirm={confirmSubstitutionAction}
    />
  );
}
