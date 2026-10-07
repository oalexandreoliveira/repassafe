import { CandidateCard } from "@/components/ui/person";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatAuditTime, formatTime, dayKey } from "@/features/shifts/format";
import { CommandFields, type FormAction } from "./command-fields";
import styles from "./screens.module.css";

export type ApplicationItem = {
  id: string;
  candidate_id: string;
  candidate_display_name: string;
  status: string;
  created_at: string;
};

/** "Candidatou-se hoje, 14:32" / "ontem, 21:48" / "10/10 09:12". */
export function appliedAt(value: string, now: Date) {
  const days =
    (Date.parse(`${dayKey(now)}T00:00:00Z`) -
      Date.parse(`${dayKey(value)}T00:00:00Z`)) /
    86_400_000;
  if (days === 0) return `Candidatou-se hoje, ${formatTime(value)}`;
  if (days === 1) return `Candidatou-se ontem, ${formatTime(value)}`;
  return `Candidatou-se em ${formatAuditTime(value)}`;
}

/** Escolha do substituto (padrão de S08): cartões selecionáveis e uma única ação. */
export function CandidateSelection({
  applications,
  action,
  submitLabel,
  now,
}: {
  /** Somente candidaturas ativas. */
  applications: ApplicationItem[];
  action: FormAction;
  submitLabel: string;
  now: Date;
}) {
  return (
    <form action={action} className={styles.stack}>
      <CommandFields />
      <fieldset className={styles.fieldset}>
        <legend className="sr-only">Escolha quem vai assumir o plantão</legend>
        {applications.map((application, index) => (
          <CandidateCard
            key={application.id}
            inputName="targetId"
            value={application.id}
            name={application.candidate_display_name}
            meta={appliedAt(application.created_at, now)}
            required={index === 0}
          />
        ))}
      </fieldset>
      <SubmitButton block>{submitLabel}</SubmitButton>
    </form>
  );
}
