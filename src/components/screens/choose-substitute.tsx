import { AppScreen, TopBar } from "@/components/ui/app-shell";
import { CandidateCard } from "@/components/ui/person";
import { SelectionSubmit } from "@/components/ui/selection-submit";
import { formatDayShort, formatHourRangeShort } from "@/features/shifts/format";
import { offerTitle, type OfferSummary } from "@/features/shifts/offer-view";
import { plural } from "@/features/shifts/presentation";
import { appliedAt, type ApplicationItem } from "./candidate-selection";
import styles from "./screens.module.css";

const FORM_ID = "escolher-substituto";

/** S08 · Escolher substituto: escolha → S09 para revisar as condições. */
export function ChooseSubstitute({
  offer,
  applications,
  now,
}: {
  offer: OfferSummary;
  /** Candidaturas ativas. */
  applications: ApplicationItem[];
  now: Date;
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
        <span className={styles.sectionNote}>Todos com CRM verificado</span>
      </div>
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
          {applications.map((application, index) => (
            <CandidateCard
              key={application.id}
              inputName="candidatura"
              value={application.id}
              name={application.candidate_display_name}
              meta={appliedAt(application.created_at, now)}
              required={index === 0}
            />
          ))}
        </fieldset>
      </form>
    </AppScreen>
  );
}
