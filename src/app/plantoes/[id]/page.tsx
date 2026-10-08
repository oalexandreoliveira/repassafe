import { notFound } from "next/navigation";
import {
  applyToOfferAction,
  cancelConfirmedSubstitutionAction,
  cancelOfferAction,
  confirmCompletionAction,
  decideSubstitutionAction,
  disputeCompletionAction,
  reportCompletionAction,
  submitEvaluationAction,
  substituteWithdrawalAction,
  withdrawApplicationAction,
} from "@/app/plantoes/actions";
import { ShiftDetail } from "@/components/screens/shift-detail";
import { toOfferSummary } from "@/features/shifts/offer-view";
import { getShiftDetails } from "@/lib/shifts/data";

export default async function ShiftDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getShiftDetails(id);
  if (!workspace) notFound();

  const {
    identity,
    offer,
    applications,
    substitutions,
    agreement,
    completion,
    evaluations,
    occurrences,
    isApprover,
    ownerTermsAcknowledged,
  } = workspace;
  const { data: agreementDocument } = agreement
    ? await identity.supabase
        .from("agreement_documents")
        .select("agreement_id")
        .eq("agreement_id", agreement.id)
        .maybeSingle()
    : { data: null };

  return (
    <ShiftDetail
      offer={toOfferSummary(offer)}
      viewerId={identity.userId}
      isApprover={isApprover}
      ownerTermsAcknowledged={ownerTermsAcknowledged}
      applications={applications}
      substitution={substitutions[0]}
      agreement={
        agreement
          ? {
              id: agreement.id,
              confirmed_at: agreement.confirmed_at,
              snapshot: agreement.snapshot as Record<string, unknown>,
            }
          : null
      }
      hasAgreementDocument={Boolean(agreementDocument)}
      completion={completion}
      hasEvaluated={evaluations.some(
        (evaluation) => evaluation.evaluator_id === identity.userId,
      )}
      occurrences={occurrences}
      now={new Date()}
      actions={{
        apply: applyToOfferAction,
        withdrawApplication: withdrawApplicationAction,
        cancelOffer: cancelOfferAction,
        decideSubstitution: decideSubstitutionAction,
        reportCompletion: reportCompletionAction,
        confirmCompletion: confirmCompletionAction,
        disputeCompletion: disputeCompletionAction,
        submitEvaluation: submitEvaluationAction,
        cancelConfirmedSubstitution: cancelConfirmedSubstitutionAction,
        substituteWithdrawal: substituteWithdrawalAction,
      }}
    />
  );
}
