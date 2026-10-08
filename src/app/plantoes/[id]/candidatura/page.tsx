import { notFound, redirect } from "next/navigation";
import { withdrawApplicationAction } from "@/app/plantoes/actions";
import { ApplicationSent } from "@/components/screens/application-sent";
import { toOfferSummary } from "@/features/shifts/offer-view";
import { getShiftDetails } from "@/lib/shifts/data";

/** S04 · Candidatura enviada (após candidatar-se). */
export default async function ApplicationSentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getShiftDetails(id);
  if (!workspace) notFound();
  const application = workspace.applications.find(
    (item) => item.candidate_id === workspace.identity.userId,
  );
  // Só faz sentido enquanto a candidatura está ativa; depois disso vale o detalhe.
  if (application?.status !== "active") redirect(`/plantoes/${id}`);

  return (
    <ApplicationSent
      offer={toOfferSummary(workspace.offer)}
      applicationId={application.id}
      withdraw={withdrawApplicationAction}
    />
  );
}
