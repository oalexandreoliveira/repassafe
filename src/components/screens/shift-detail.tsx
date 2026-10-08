import { Calendar, Clock, Inbox, MapPin, Users } from "lucide-react";
import { AppScreen, TopBar } from "@/components/ui/app-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { SelectField, TextAreaField } from "@/components/ui/field";
import { InfoBanner } from "@/components/ui/info-banner";
import { InfoTile, InfoTileGrid } from "@/components/ui/info-tile";
import { KeyValueList } from "@/components/ui/key-value-list";
import { RegistrySeal } from "@/components/ui/registry";
import { StatusChip } from "@/components/ui/status-chip";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  formatAuditTime,
  formatDuration,
  formatHourRange,
  formatPeriod,
  formatShiftDay,
} from "@/features/shifts/format";
import {
  offerGroupLabel,
  offerTitle,
  type OfferSummary,
} from "@/features/shifts/offer-view";
import {
  applicationPresentation,
  completionPresentation,
  offerPresentation,
  plural,
  substitutionPresentation,
} from "@/features/shifts/presentation";
import {
  applicationStatusLabels,
  formatCurrency,
  formatDateTime,
} from "@/features/shifts/schemas";
import type { ApplicationItem } from "./candidate-selection";
import { CommandFields, type FormAction } from "./command-fields";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { PATIENT_DATA_NOTICE, PAYMENT_NOTICE } from "@/features/shifts/copy";
import styles from "./screens.module.css";

export type ShiftDetailActions = {
  apply: FormAction;
  withdrawApplication: FormAction;
  cancelOffer: FormAction;
  decideSubstitution: FormAction;
  reportCompletion: FormAction;
  confirmCompletion: FormAction;
  disputeCompletion: FormAction;
  submitEvaluation: FormAction;
  cancelConfirmedSubstitution: FormAction;
  substituteWithdrawal: FormAction;
};

export type SubstitutionItem = {
  id: string;
  status: string;
  owner_id: string;
  substitute_id: string;
  confirmation_deadline: string;
  cancellation_reason?: string | null;
};

export type CompletionItem = {
  id: string;
  status: string;
  reported_by_owner: boolean;
};

export type OccurrenceItem = {
  id: string;
  category: string;
  description: string;
  status: string;
  decision?: string | null;
};

export type AgreementItem = {
  id: string;
  confirmed_at: string;
  snapshot: Record<string, unknown>;
};

const occurrenceLabels: Record<string, string> = {
  late_cancellation: "Cancelamento tardio",
  substitute_withdrawal: "Desistência do substituto",
  completion_dispute: "Divergência de conclusão",
};

const ownerRubric = [
  ["substituteAttendance", "Comparecimento"],
  ["substitutePunctuality", "Pontualidade"],
  ["substituteCommunication", "Comunicação"],
  ["substituteScheduleCompliance", "Cumprimento do horário"],
  ["substituteAdministrativeRequirements", "Exigências administrativas"],
] as const;

const substituteRubric = [
  ["ownerInformationClarity", "Clareza das informações"],
  ["ownerInformationAccuracy", "Precisão das informações"],
  ["ownerCommunication", "Comunicação"],
  ["ownerAmountCompliance", "Cumprimento do valor combinado"],
  ["ownerPaymentTimeliness", "Pagamento no prazo"],
] as const;

/** S03 · Detalhe do plantão, com as seções de cada papel no fluxo. */
export function ShiftDetail({
  offer,
  viewerId,
  isApprover,
  ownerTermsAcknowledged,
  applications,
  substitution,
  agreement,
  hasAgreementDocument,
  completion,
  hasEvaluated,
  occurrences,
  now,
  actions,
}: {
  offer: OfferSummary;
  viewerId: string;
  isApprover: boolean;
  ownerTermsAcknowledged: boolean;
  applications: ApplicationItem[];
  substitution?: SubstitutionItem;
  agreement?: AgreementItem | null;
  hasAgreementDocument: boolean;
  completion?: CompletionItem | null;
  hasEvaluated: boolean;
  occurrences: OccurrenceItem[];
  now: Date;
  actions: ShiftDetailActions;
}) {
  const isOwner = offer.ownerId === viewerId;
  const isOpen = ["open_normal", "open_emergency"].includes(offer.status);
  const ownApplication = applications.find(
    (application) => application.candidate_id === viewerId,
  );
  const activeApplications = applications.filter(
    (application) => application.status === "active",
  );
  const isSubstitute = substitution?.substitute_id === viewerId;
  const pendingApplication =
    ownApplication &&
    ["active", "selected_pending_confirmation"].includes(ownApplication.status);
  const status = pendingApplication
    ? applicationPresentation(ownApplication.status)
    : offerPresentation({
        offerStatus: offer.status,
        substitutionStatus: substitution?.status,
        view: isOwner ? "owner" : "detail",
        activeApplications: activeApplications.length,
      });
  const shiftEnded = offer.endsAt <= now.toISOString();
  const involved = isOwner || isSubstitute;
  const canApply = !isOwner && isOpen && !ownApplication;
  const applicationsClosed =
    !isOpen && !isOwner && !ownApplication && !isSubstitute && !isApprover;

  const footer = canApply ? (
    <form action={actions.apply}>
      <CommandFields targetId={offer.id} />
      <SubmitButton block>Candidatar-me</SubmitButton>
    </form>
  ) : ownApplication?.status === "active" ? (
    <form action={actions.withdrawApplication}>
      <CommandFields targetId={ownApplication.id} />
      <ConfirmSubmit
        variant="secondary"
        question="Cancelar sua candidatura a este plantão?"
        confirmLabel="Sim, cancelar candidatura"
        keepLabel="Manter candidatura"
      >
        Cancelar candidatura
      </ConfirmSubmit>
    </form>
  ) : applicationsClosed ? (
    <>
      <Button block disabled>
        Candidatar-me
      </Button>
      <p className={styles.help} role="status">
        Candidaturas encerradas
      </p>
    </>
  ) : undefined;

  return (
    <AppScreen
      header={<TopBar title="Detalhe do plantão" backHref="/plantoes" />}
      footer={footer}
    >
      <div className={styles.detailHead}>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
        <h2 className={styles.detailTitle}>{offerTitle(offer)}</h2>
        <p className={styles.detailGroup}>
          <Users size={14} />
          {offer.groupName
            ? `Grupo ${offer.groupName}`
            : offerGroupLabel(offer)}
        </p>
      </div>

      <InfoTileGrid label="Dados do plantão">
        <InfoTile
          icon={Calendar}
          label="Data"
          value={formatShiftDay(offer.startsAt)}
        />
        <InfoTile
          icon={Clock}
          label="Horário"
          value={formatHourRange(offer.startsAt, offer.endsAt)}
        />
        {offer.institutionName ? (
          <InfoTile icon={MapPin} label="Local" value={offer.institutionName} />
        ) : null}
        <InfoTile
          icon={Inbox}
          label="Duração"
          value={formatDuration(offer.startsAt, offer.endsAt)}
        />
      </InfoTileGrid>

      {offer.valueCents !== undefined ? (
        <KeyValueList
          items={[
            { label: "Valor", value: formatCurrency(offer.valueCents) },
            {
              label: "Condições de pagamento",
              value: offer.paymentTerms ?? "",
              stacked: true,
            },
          ]}
        />
      ) : null}

      {offer.notes ? (
        <div className={styles.notes}>
          <span className={styles.notesLabel}>Observações operacionais</span>
          <p className={styles.notesText}>{offer.notes}</p>
        </div>
      ) : null}

      <InfoBanner>
        {isOwner
          ? PAYMENT_NOTICE
          : "Você só assume o plantão depois dos aceites necessários e da confirmação do repasse. Valores são combinados diretamente com quem publicou."}
      </InfoBanner>

      {isOwner ? (
        <section className={styles.stack} aria-labelledby="candidates-heading">
          <div className={styles.sectionHeader}>
            <h2 id="candidates-heading" className={styles.sectionTitle}>
              {applications.length
                ? plural(applications.length, "candidatura", "candidaturas")
                : "Candidaturas"}
            </h2>
            {activeApplications.length ? (
              <span className={styles.sectionNote}>
                Todos com CRM verificado
              </span>
            ) : null}
          </div>
          {!ownerTermsAcknowledged && applications.length > 0 ? (
            <InfoBanner variant="warning" role="alert">
              Para selecionar alguém, revise e confirme as condições atuais.
              Como esta oferta já recebeu candidaturas, cancele-a e publique
              novamente para registrar essa confirmação.
            </InfoBanner>
          ) : null}
          {isOpen && ownerTermsAcknowledged && activeApplications.length ? (
            <ButtonLink href={`/plantoes/${offer.id}/candidaturas`} block>
              Ver candidaturas
            </ButtonLink>
          ) : null}
          {applications.some(
            (application) =>
              !(
                isOpen &&
                ownerTermsAcknowledged &&
                application.status === "active"
              ),
          ) ? (
            <ul className={styles.list}>
              {applications
                .filter(
                  (application) =>
                    !(
                      isOpen &&
                      ownerTermsAcknowledged &&
                      application.status === "active"
                    ),
                )
                .map((application) => {
                  const presentation = applicationPresentation(
                    application.status,
                  );
                  return (
                    <li key={application.id} className={styles.panel}>
                      <strong>{application.candidate_display_name}</strong>
                      <StatusChip tone={presentation.tone}>
                        {applicationStatusLabels[application.status] ??
                          presentation.label}
                      </StatusChip>
                    </li>
                  );
                })}
            </ul>
          ) : null}
          {applications.length === 0 ? (
            <p className={styles.help}>Nenhuma candidatura recebida.</p>
          ) : null}
          {isOpen ? (
            <div className={styles.actions}>
              {applications.length === 0 ? (
                <ButtonLink
                  href={`/plantoes/${offer.id}/editar`}
                  variant="secondary"
                  block
                >
                  Editar
                </ButtonLink>
              ) : null}
              <form action={actions.cancelOffer}>
                <CommandFields targetId={offer.id} />
                <SubmitButton variant="ghost" block>
                  Cancelar oferta
                </SubmitButton>
              </form>
            </div>
          ) : null}
        </section>
      ) : null}

      {substitution ? (
        <section
          className={styles.stack}
          aria-labelledby="substitution-heading"
        >
          <h2 id="substitution-heading" className={styles.sectionTitle}>
            Substituição
          </h2>
          {(() => {
            const presentation = substitutionPresentation(substitution.status);
            return (
              <StatusChip tone={presentation.tone}>
                {presentation.label}
              </StatusChip>
            );
          })()}
          {substitution.cancellation_reason ? (
            <p className={styles.panelText}>
              Justificativa do cancelamento: {substitution.cancellation_reason}
            </p>
          ) : null}
          {substitution.status === "pending_substitute_confirmation" ? (
            <p className={styles.help}>
              Prazo: {formatDateTime(substitution.confirmation_deadline)}
            </p>
          ) : null}

          {isSubstitute &&
          substitution.status === "pending_substitute_confirmation" ? (
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Você foi selecionado</h3>
              <p className={styles.panelText}>
                Revise e aceite as condições até o prazo para seguir com o
                repasse.
              </p>
              <ButtonLink href={`/plantoes/${offer.id}/condicoes`} block>
                Confirmar condições
              </ButtonLink>
            </div>
          ) : null}

          {isApprover &&
          substitution.status === "pending_institutional_approval" ? (
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Aprovação da coordenação</h3>
              <div className={styles.actions}>
                {(
                  [
                    { label: "Aprovar", value: "true", variant: "primary" },
                    { label: "Rejeitar", value: "false", variant: "secondary" },
                  ] as const
                ).map((choice) => (
                  <form action={actions.decideSubstitution} key={choice.value}>
                    <CommandFields targetId={substitution.id} />
                    <input type="hidden" name="approved" value={choice.value} />
                    <SubmitButton variant={choice.variant} block>
                      {choice.label}
                    </SubmitButton>
                  </form>
                ))}
              </div>
            </div>
          ) : null}

          {substitution.status === "confirmed" &&
          shiftEnded &&
          involved &&
          !completion ? (
            <form action={actions.reportCompletion} className={styles.panel}>
              <CommandFields targetId={substitution.id} />
              <p className={styles.panelText}>
                Informe que o plantão foi realizado para solicitar confirmação
                da outra parte.
              </p>
              <SubmitButton block>Registrar realização</SubmitButton>
            </form>
          ) : null}

          {completion ? (
            <div className={styles.panel}>
              {(() => {
                const presentation = completionPresentation(completion.status);
                return (
                  <StatusChip tone={presentation.tone}>
                    {presentation.label}
                  </StatusChip>
                );
              })()}
              {completion.status === "pending_confirmation" &&
              ((completion.reported_by_owner && isSubstitute) ||
                (!completion.reported_by_owner && isOwner) ||
                isApprover) ? (
                <div className={styles.actions}>
                  <form action={actions.confirmCompletion}>
                    <CommandFields targetId={substitution.id} />
                    <SubmitButton block>Confirmar realização</SubmitButton>
                  </form>
                  <form
                    action={actions.disputeCompletion}
                    className={styles.stack}
                  >
                    <CommandFields targetId={substitution.id} />
                    <TextAreaField
                      label="Motivo da divergência"
                      name="reason"
                      minLength={10}
                      maxLength={2000}
                      required
                      hint={PATIENT_DATA_NOTICE}
                    />
                    <SubmitButton variant="secondary" block>
                      Abrir ocorrência
                    </SubmitButton>
                  </form>
                </div>
              ) : null}
            </div>
          ) : null}

          {completion?.status === "completed" &&
          [substitution.owner_id, substitution.substitute_id].includes(
            viewerId,
          ) &&
          !hasEvaluated ? (
            <form action={actions.submitEvaluation} className={styles.panel}>
              <h3 className={styles.panelTitle}>
                {isOwner ? "Avalie o substituto" : "Avalie o titular"}
              </h3>
              <p className={styles.panelText}>
                {isOwner
                  ? "Avalie comparecimento, pontualidade, comunicação, cumprimento do horário e exigências administrativas."
                  : "Avalie clareza e precisão das informações, comunicação, cumprimento do valor combinado e se recebeu no prazo."}
              </p>
              <CommandFields targetId={substitution.id} />
              {(isOwner ? ownerRubric : substituteRubric).map(
                ([name, label]) => (
                  <SelectField
                    key={name}
                    label={`${label} (1 a 5)`}
                    name={name}
                    required
                    defaultValue="5"
                  >
                    {[1, 2, 3, 4, 5].map((score) => (
                      <option key={score} value={score}>
                        {score}
                      </option>
                    ))}
                  </SelectField>
                ),
              )}
              <p className={styles.help}>
                Avaliação estruturada sem comentário público.
              </p>
              <SubmitButton block>Enviar avaliação</SubmitButton>
            </form>
          ) : null}
          {completion?.status === "completed" && hasEvaluated ? (
            <p className={styles.help} role="status">
              Sua avaliação já foi registrada.
            </p>
          ) : null}

          {substitution.status === "confirmed" && !completion && involved ? (
            <details className={styles.disclosure}>
              <summary>Cancelar repasse confirmado</summary>
              <form
                action={
                  isOwner
                    ? actions.cancelConfirmedSubstitution
                    : actions.substituteWithdrawal
                }
                className={styles.disclosureBody}
              >
                <CommandFields targetId={substitution.id} />
                <TextAreaField
                  label="Justificativa"
                  name="reason"
                  minLength={10}
                  maxLength={2000}
                  required
                  hint={PATIENT_DATA_NOTICE}
                />
                <SubmitButton variant="secondary" block>
                  Registrar cancelamento
                </SubmitButton>
              </form>
            </details>
          ) : null}
        </section>
      ) : null}

      {occurrences.length ? (
        <section className={styles.stack} aria-labelledby="occurrences-heading">
          <h2 id="occurrences-heading" className={styles.sectionTitle}>
            Ocorrências
          </h2>
          <ul className={styles.list}>
            {occurrences.map((occurrence) => (
              <li key={occurrence.id} className={styles.panel}>
                <strong>
                  {occurrenceLabels[occurrence.category] ?? "Ocorrência"}
                </strong>
                <StatusChip
                  tone={
                    occurrence.status === "open" ? "institutional" : "empty"
                  }
                >
                  {occurrence.status === "open" ? "Em análise" : "Encerrada"}
                </StatusChip>
                <p className={styles.panelText}>{occurrence.description}</p>
                {occurrence.decision ? (
                  <p className={styles.panelText}>
                    Decisão: {occurrence.decision}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {agreement ? (
        <section className={styles.stack} aria-labelledby="agreement-heading">
          <h2 id="agreement-heading" className="sr-only">
            Repasse confirmado
          </h2>
          <RegistrySeal
            title="Repasse confirmado"
            detail={`REGISTRO ${agreement.id} · ${formatAuditTime(agreement.confirmed_at)}`}
          />
          {hasAgreementDocument ? (
            <ButtonLink
              href={`/acordos/${agreement.id}`}
              variant="secondary"
              block
            >
              Ver comprovante do repasse
            </ButtonLink>
          ) : (
            <KeyValueList
              items={[
                {
                  label: "Período",
                  value: formatPeriod(
                    String(agreement.snapshot.starts_at),
                    String(agreement.snapshot.ends_at),
                  ),
                },
                { label: "Setor", value: String(agreement.snapshot.sector) },
                {
                  label: "Valor",
                  value: formatCurrency(Number(agreement.snapshot.value_cents)),
                },
                {
                  label: "Condições de pagamento",
                  value: String(agreement.snapshot.payment_terms),
                  stacked: true,
                },
              ]}
            />
          )}
        </section>
      ) : null}
    </AppScreen>
  );
}
