import { AppScreen, TopBar } from "@/components/ui/app-shell";
import { CandidateCard } from "@/components/ui/person";
import { SelectionSubmit } from "@/components/ui/selection-submit";
import { formatDayShort, formatHourRangeShort } from "@/features/shifts/format";
import { offerTitle, type OfferSummary } from "@/features/shifts/offer-view";
import { plural } from "@/features/shifts/presentation";
import {
  hasCurrentVerification,
  verificationLabel,
  verificationValidity,
} from "@/features/shifts/candidate-profile";
import { appliedAt, type ApplicationItem } from "./candidate-selection";
import { CandidateProfessionalDetails } from "./candidate-professional-details";
import { InfoBanner } from "@/components/ui/info-banner";
import styles from "./screens.module.css";

const FORM_ID = "escolher-substituto";

/** S08 · Escolher substituto: escolha → S09 para revisar as condições. */
export function ChooseSubstitute({
  offer,
  applications,
  now,
  verificationChanged = false,
}: {
  offer: OfferSummary;
  /** Candidaturas ativas. */
  applications: ApplicationItem[];
  now: Date;
  verificationChanged?: boolean;
}) {
  return (
    <AppScreen
      header={
        <TopBar
          title="Escolher substituto"
          backHref={`/plantoes/${offer.id}`}
        />
      }
      footer={
        <SelectionSubmit form={FORM_ID}>
          Selecionar e revisar condições
        </SelectionSubmit>
      }
    >
      <section className={styles.darkCard} aria-label="Seu plantão">
        <span className={styles.darkCardLabel}>Seu plantão</span>
        <h2 className={styles.darkCardTitle}>{offerTitle(offer)}</h2>
        <span className={styles.darkCardMeta}>
          {formatDayShort(offer.startsAt)} ·{" "}
          {formatHourRangeShort(offer.startsAt, offer.endsAt)}
        </span>
      </section>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          {plural(applications.length, "candidatura", "candidaturas")}
        </h2>
        <span className={styles.sectionNote}>
          Confira a situação de cada candidato
        </span>
      </div>
      {verificationChanged && (
        <InfoBanner variant="warning" role="alert">
          A verificação deste candidato não está vigente ou não pôde ser
          consultada. Confira os perfis atualizados antes de escolher.
        </InfoBanner>
      )}
      <form
        id={FORM_ID}
        method="get"
        action={`/plantoes/${offer.id}/condicoes`}
        className={styles.fieldset}
      >
        <fieldset className={styles.fieldset}>
          <legend className="sr-only">
            Escolha quem vai assumir o plantão
          </legend>
          {applications.map((application) => (
            <CandidateCard
              key={application.id}
              inputName="candidatura"
              value={application.id}
              name={application.candidate_display_name}
              verified={hasCurrentVerification(application.professional, now)}
              disabled={!hasCurrentVerification(application.professional, now)}
              details={
                application.professional ? (
                  <span>
                    <span>
                      CRM {application.professional.crm ?? "não informado"}/
                      {application.professional.uf ?? "—"}
                    </span>
                    <br />
                    <span>
                      {application.professional.specialty ??
                        "Especialidade não informada"}
                      {application.professional.specialty ? " · declarada" : ""}
                      {application.professional.rqe
                        ? ` · RQE ${application.professional.rqe} — ${application.professional.rqe_verified ? "verificado" : "declarado, não verificado"}`
                        : ""}
                    </span>
                    <br />
                    <span>
                      {hasCurrentVerification(application.professional, now)
                        ? `Verificação válida até ${verificationValidity(application.professional)}`
                        : `${verificationLabel(application.professional, now)}. Seleção indisponível.`}
                    </span>
                  </span>
                ) : (
                  "Dados profissionais indisponíveis. Atualize a página para tentar novamente. Seleção indisponível."
                )
              }
              meta={appliedAt(application.created_at, now)}
              required
            >
              <CandidateProfessionalDetails
                name={application.candidate_display_name}
                profile={application.professional}
                now={now}
              />
            </CandidateCard>
          ))}
        </fieldset>
      </form>
      <p className={styles.help}>
        Consultar um perfil não confirma a escolha. Na próxima etapa, você
        revisa as condições antes de enviar ao substituto.
      </p>
    </AppScreen>
  );
}
