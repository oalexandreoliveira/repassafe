import { CheckboxField } from "@/components/ui/field";
import { InfoBanner } from "@/components/ui/info-banner";
import {
  KeyValueList,
  type KeyValueItem,
} from "@/components/ui/key-value-list";
import { ProgressSteps } from "@/components/ui/progress";
import { SubmitButton } from "@/components/ui/submit-button";
import { CommandFields, type FormAction } from "./command-fields";
import { AGREEMENT_CONSENT, PAYMENT_NOTICE } from "@/features/shifts/copy";
import styles from "./screens.module.css";

/** Legenda do progresso no momento da confirmação das condições (etapa 3). */
export function confirmationProgress(requiresApproval: boolean) {
  return requiresApproval
    ? {
        total: 5,
        caption: "Etapa 3 de 5 · depois: aprovação da coordenação e registro",
      }
    : { total: 4, caption: "Etapa 3 de 4 · depois: registro do acordo" };
}

/**
 * Confirmação das condições por quem assume (padrão de S09). O aceite usa o
 * mesmo comando confirm_substitution, com a concordância obrigatória.
 */
export function ConditionsConfirmation({
  substitutionId,
  conditions,
  requiresApproval,
  action,
}: {
  substitutionId: string;
  conditions: KeyValueItem[];
  requiresApproval: boolean;
  action: FormAction;
}) {
  const progress = confirmationProgress(requiresApproval);
  return (
    <div className={styles.stack}>
      <ProgressSteps
        total={progress.total}
        current={3}
        caption={progress.caption}
      />
      <KeyValueList items={conditions} />
      <InfoBanner>{PAYMENT_NOTICE}</InfoBanner>
      <form action={action} className={styles.stack}>
        <CommandFields targetId={substitutionId} />
        <input type="hidden" name="accepted" value="true" />
        <CheckboxField
          name="termsAcknowledged"
          value="true"
          required
          label={AGREEMENT_CONSENT}
        />
        <SubmitButton block>Aceitar condições</SubmitButton>
      </form>
      <form action={action}>
        <CommandFields targetId={substitutionId} />
        <input type="hidden" name="accepted" value="false" />
        <SubmitButton variant="secondary" block>
          Recusar
        </SubmitButton>
      </form>
    </div>
  );
}
