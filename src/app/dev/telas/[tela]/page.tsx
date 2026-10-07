import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgreementRegistered } from "@/components/screens/agreement-registered";
import { NotificationsList } from "@/components/screens/notifications-list";
import { PublishShiftForm } from "@/components/screens/publish-shift-form";
import { ShiftDetail } from "@/components/screens/shift-detail";
import { ShiftMural } from "@/components/screens/shift-mural";
import { offerPresentation } from "@/features/shifts/presentation";
import { requireDevPages } from "../../enabled";
import {
  agreementContent,
  applications,
  enfermaria,
  evidence,
  notifications,
  now,
  ownerId,
  prontoSocorro,
  uti,
  viewerId,
} from "../fixtures";

export const metadata: Metadata = {
  title: "Prévia de tela | Repassafe",
  robots: { index: false, follow: false },
};

/** Ação vazia: as prévias não enviam nada. */
async function noop() {
  "use server";
}

const detailActions = {
  apply: noop,
  withdrawApplication: noop,
  cancelOffer: noop,
  selectCandidate: noop,
  confirmSubstitution: noop,
  decideSubstitution: noop,
  reportCompletion: noop,
  confirmCompletion: noop,
  disputeCompletion: noop,
  submitEvaluation: noop,
  cancelConfirmedSubstitution: noop,
  substituteWithdrawal: noop,
};

const mural = [uti, prontoSocorro, enfermaria]
  .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  .map((offer) => ({
    offer,
    isOwner: false,
    status: offerPresentation({ offerStatus: offer.status, view: "mural" }),
  }));

const groups = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    name: "Plantonistas UTI",
    institutionName: "Hospital Exemplo",
    requiresApproval: true,
  },
];

const draft = {
  sector: "UTI Adulto",
  date: "2026-10-10",
  start: "19:00",
  end: "07:00",
  value: "1200,00",
  paymentTerms: "Transferência em até 30 dias após o plantão",
  notes: "Passagem presencial às 18h45 com a equipe de enfermagem.",
};

const screens: Record<string, () => React.ReactNode> = {
  s02: () => (
    <ShiftMural
      items={mural}
      totalCount={mural.length}
      groupsCount={3}
      unread
      canPublish
      filter="semana"
      now={now}
    />
  ),
  "s02-vazio": () => (
    <ShiftMural
      items={[]}
      totalCount={0}
      groupsCount={3}
      unread={false}
      canPublish
      filter="semana"
      now={now}
    />
  ),
  "s02-erro": () => (
    <ShiftMural
      items={[]}
      totalCount={0}
      groupsCount={3}
      unread={false}
      canPublish
      filter="semana"
      failed
      now={now}
    />
  ),
  s03: () => (
    <ShiftDetail
      offer={uti}
      viewerId={viewerId}
      isApprover={false}
      ownerTermsAcknowledged={false}
      applications={[]}
      hasAgreementDocument={false}
      hasEvaluated={false}
      occurrences={[]}
      now={now}
      actions={detailActions}
    />
  ),
  "s03-titular": () => (
    <ShiftDetail
      offer={{ ...uti, ownerId: viewerId }}
      viewerId={viewerId}
      isApprover={false}
      ownerTermsAcknowledged
      applications={applications}
      hasAgreementDocument={false}
      hasEvaluated={false}
      occurrences={[]}
      now={now}
      actions={detailActions}
    />
  ),
  "s03-substituto": () => (
    <ShiftDetail
      offer={{ ...uti, status: "selection_in_progress" }}
      viewerId={viewerId}
      isApprover={false}
      ownerTermsAcknowledged
      applications={[]}
      substitution={{
        id: "40000000-0000-4000-8000-000000000001",
        status: "pending_substitute_confirmation",
        owner_id: ownerId,
        substitute_id: viewerId,
        confirmation_deadline: "2026-10-10T18:00:00.000Z",
      }}
      hasAgreementDocument={false}
      hasEvaluated={false}
      occurrences={[]}
      now={now}
      actions={detailActions}
    />
  ),
  s05: () => (
    <PublishShiftForm
      action={noop}
      commandId="preview"
      groups={groups}
      minDate="2026-10-10"
      initialValues={draft}
    />
  ),
  s06: () => (
    <PublishShiftForm
      action={noop}
      commandId="preview"
      groups={groups}
      minDate="2026-10-10"
      initialValues={draft}
      initialStep={2}
    />
  ),
  s10: () => (
    <AgreementRegistered
      content={agreementContent}
      schemaVersion="1.0"
      generatedAt="2026-10-10T21:15:30.000Z"
      documentSha256={"3f9a6b0c1d2e3f40".repeat(4)}
      evidence={evidence}
      selectedAt="2026-10-10T19:40:00.000Z"
      documentHashValid
      eventChainValid
      backHref="/dev/telas"
    />
  ),
  s11: () => (
    <NotificationsList
      notifications={notifications}
      onlyUnread={false}
      hasUnread
      markAllRead={noop}
      now={now}
    />
  ),
};

export default async function ScreenPreviewPage({
  params,
}: {
  params: Promise<{ tela: string }>;
}) {
  await requireDevPages();
  const { tela } = await params;
  const render = screens[tela];
  if (!render) notFound();
  return render();
}
