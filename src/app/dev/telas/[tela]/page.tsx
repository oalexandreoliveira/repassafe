import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgreementRegistered } from "@/components/screens/agreement-registered";
import { NotificationsList } from "@/components/screens/notifications-list";
import { PublishShiftForm } from "@/components/screens/publish-shift-form";
import { ShiftDetail } from "@/components/screens/shift-detail";
import { ShiftMural } from "@/components/screens/shift-mural";
import { AgreementsList } from "@/components/screens/agreements-list";
import { ApplicationSent } from "@/components/screens/application-sent";
import { ChooseSubstitute } from "@/components/screens/choose-substitute";
import {
  OwnerConditionsReview,
  SubstituteConditions,
} from "@/components/screens/conditions-confirmation";
import { MyPublished } from "@/components/screens/my-published";
import { AuthScreen } from "@/components/screens/auth-screen";
import { RegistrationOverview } from "@/components/screens/registration-overview";
import { NewPasswordForm } from "@/components/email-action-form";
import { MfaForm } from "@/components/mfa-form";
import {
  GroupCreateScreen,
  GroupDetailScreen,
  GroupInviteScreen,
  GroupsScreen,
} from "@/components/screens/groups";
import type { GroupDetail } from "@/features/groups/types";
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

const previewRequestId = "00000000-0000-4000-8000-000000000000";
const previewToken = "Q2xpcXVlLWFxdWktcGFyYS1lbnRyYXItbm8tZ3J1cG8";
const peerGroup: GroupDetail = {
  eligible: true,
  role: "manager",
  group: {
    id: "7f6c3b1e-0000-4000-8000-000000000001",
    name: "Plantonistas UTI Adulto",
    kind: "peer",
    active: true,
    requires_approval: false,
    created_at: "2026-10-01T12:00:00.000Z",
    institution_name: null,
  },
  members: [
    {
      profile_id: "1",
      display_name: "Ana Moreira",
      role: "manager",
      verified: true,
      is_self: true,
      joined_at: "2026-10-01T12:00:00.000Z",
    },
    {
      profile_id: "2",
      display_name: "Bruno Lima",
      role: "doctor",
      verified: true,
      is_self: false,
      joined_at: "2026-10-03T12:00:00.000Z",
    },
    {
      profile_id: "3",
      display_name: "Carla Souza",
      role: "doctor",
      verified: false,
      is_self: false,
      joined_at: "2026-10-05T12:00:00.000Z",
    },
  ],
  invites: [
    {
      id: "inv-1",
      created_at: "2026-10-06T12:00:00.000Z",
      expires_at: "2026-10-13T12:00:00.000Z",
      use_count: 2,
      max_uses: 500,
    },
  ],
  open_offers: 0,
};

const screens: Record<string, () => React.ReactNode> = {
  grupos: () => (
    <GroupsScreen
      approved
      canPublish
      overview={{
        eligible: true,
        groups: [
          {
            id: peerGroup.group.id,
            name: peerGroup.group.name,
            kind: "peer",
            active: true,
            role: "manager",
            requires_approval: false,
            institution_name: null,
            member_count: 3,
          },
          {
            id: "7f6c3b1e-0000-4000-8000-000000000002",
            name: "Clínica médica — noturno",
            kind: "peer",
            active: false,
            role: "doctor",
            requires_approval: false,
            institution_name: null,
            member_count: 8,
          },
          {
            id: "7f6c3b1e-0000-4000-8000-000000000003",
            name: "Plantonistas UTI",
            kind: "institutional",
            active: true,
            role: "doctor",
            requires_approval: true,
            institution_name: "Hospital Exemplo",
            member_count: null,
          },
        ],
      }}
    />
  ),
  "grupos-vazio": () => (
    <GroupsScreen
      approved
      canPublish
      overview={{ eligible: true, groups: [] }}
    />
  ),
  "grupo-novo": () => (
    <GroupCreateScreen eligible requestId={previewRequestId} preview />
  ),
  "grupo-gestor": () => (
    <GroupDetailScreen
      detail={peerGroup}
      approved
      canPublish
      preview
      previewInvitePath={`/grupos/convite/${previewToken}`}
    />
  ),
  "grupo-membro": () => (
    <GroupDetailScreen
      detail={{
        ...peerGroup,
        role: "doctor",
        invites: undefined,
        open_offers: undefined,
        members: peerGroup.members?.map((member) => ({
          ...member,
          is_self: member.profile_id === "2",
        })),
      }}
      approved
      canPublish
      preview
    />
  ),
  "grupo-institucional": () => (
    <GroupDetailScreen
      detail={{
        eligible: true,
        role: "doctor",
        group: {
          id: "7f6c3b1e-0000-4000-8000-000000000003",
          name: "Plantonistas UTI",
          kind: "institutional",
          active: true,
          requires_approval: true,
          created_at: "2026-09-01T12:00:00.000Z",
          institution_name: "Hospital Exemplo",
        },
      }}
      approved
      canPublish
      preview
    />
  ),
  convite: () => (
    <GroupInviteScreen
      token={previewToken}
      requestId={previewRequestId}
      previewMode
      preview={{
        status: "open",
        group_name: peerGroup.group.name,
        manager_name: "Ana Moreira",
        member_count: 3,
        expires_at: "2026-10-13T12:00:00.000Z",
      }}
    />
  ),
  "convite-pendente": () => (
    <GroupInviteScreen
      token={previewToken}
      requestId={previewRequestId}
      previewMode
      preview={{
        status: "ineligible",
        group_name: peerGroup.group.name,
        manager_name: "Ana Moreira",
        member_count: 3,
        expires_at: "2026-10-13T12:00:00.000Z",
      }}
    />
  ),
  "convite-indisponivel": () => (
    <GroupInviteScreen
      token={previewToken}
      requestId={previewRequestId}
      previewMode
      preview={{ status: "unavailable" }}
    />
  ),
  "convite-sem-login": () => (
    <GroupInviteScreen
      token={previewToken}
      requestId={previewRequestId}
      previewMode
      preview={null}
    />
  ),
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
  s04: () => (
    <ApplicationSent
      offer={uti}
      applicationId="30000000-0000-4000-8000-000000000001"
      withdraw={noop}
    />
  ),
  s07: () => (
    <MyPublished
      tab="abertos"
      counts={{ abertos: 2, andamento: 1, registrados: 4 }}
      items={[
        {
          offer: prontoSocorro,
          activeApplications: 3,
          status: offerPresentation({
            offerStatus: "open_normal",
            view: "owner",
            activeApplications: 3,
          }),
        },
        {
          offer: enfermaria,
          activeApplications: 0,
          status: offerPresentation({
            offerStatus: "open_normal",
            view: "owner",
          }),
        },
      ]}
      unread
      published
      canPublish
      now={now}
    />
  ),
  s08: () => (
    <ChooseSubstitute offer={uti} applications={applications} now={now} />
  ),
  "s09-titular": () => (
    <OwnerConditionsReview
      offer={uti}
      applicationId={applications[0].id}
      candidateName={applications[0].candidate_display_name}
      select={noop}
    />
  ),
  "s09-substituto": () => (
    <SubstituteConditions
      offer={uti}
      substitutionId="40000000-0000-4000-8000-000000000001"
      confirm={noop}
    />
  ),
  "cadastro-completar": () => (
    <RegistrationOverview
      smsEnabled={false}
      user={{
        email: "ana.moreira@exemplo.com",
        email_confirmed_at: "2026-10-01T12:00:00.000Z",
        phone: undefined,
        phone_confirmed_at: undefined,
      }}
      registration={{
        draft: {
          state: "changes_requested",
          revision: 2,
          photo_path: null,
          cpf: null,
          data: {
            civilName: "Ana Moreira",
            displayName: "Dra. Ana Moreira",
            practicesMedicine: "yes",
            crmNumber: "123456",
            crmState: "MA",
          },
          correction_fields: {
            cpf: "Confira os 11 números do CPF.",
          },
        },
        acceptances: [],
        decisions: [
          {
            revision: 1,
            outcome: "changes_requested",
            fields: { cpf: "Confira os 11 números do CPF." },
            decided_at: "2026-10-05T12:00:00.000Z",
          },
        ],
      }}
    />
  ),
  "senha-nova": () => (
    <AuthScreen title="Defina uma nova senha">
      <NewPasswordForm />
    </AuthScreen>
  ),
  mfa: () => (
    <AuthScreen
      title="Verificação em duas etapas"
      intro="Confirme sua identidade para abrir a administração."
    >
      <MfaForm factorId="preview" />
    </AuthScreen>
  ),
  acordos: () => (
    <AgreementsList
      unread={false}
      canPublish
      agreements={[
        {
          id: agreementContent.agreement_id,
          offerId: uti.id,
          role: "owner",
          confirmedAt: agreementContent.agreement_confirmed_at,
          sector: "UTI Adulto",
          startsAt: uti.startsAt,
          endsAt: uti.endsAt,
          groupName: "Plantonistas UTI",
          hasDocument: true,
        },
        {
          id: "7d1c2e9a-5b3f-4c8d-9e0a-1b2c3d4e5f61",
          offerId: enfermaria.id,
          role: "substitute",
          confirmedAt: "2026-10-08T15:00:00.000Z",
          sector: "Enfermaria",
          startsAt: enfermaria.startsAt,
          endsAt: enfermaria.endsAt,
          hasDocument: true,
        },
      ]}
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
