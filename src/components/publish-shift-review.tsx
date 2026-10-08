import { Share2 } from "lucide-react";
import { CheckboxField } from "@/components/ui/field";
import { InfoBanner } from "@/components/ui/info-banner";
import { KeyValueList } from "@/components/ui/key-value-list";
import { ProgressSteps } from "@/components/ui/progress";
import { ShiftCard } from "@/components/ui/shift-card";
import type { PublishGroup } from "@/components/publish-shift-fields";
import { formatHourRangeShort, formatShiftDay } from "@/features/shifts/format";
import {
  composeRange,
  fortalezaIso,
  type ShiftFormValues,
} from "@/features/shifts/form-values";
import { formatCurrency } from "@/features/shifts/schemas";
import { PAYMENT_NOTICE } from "@/features/shifts/copy";
import styles from "./publish-shift-fields.module.css";

export const OWNER_TERMS_TEXT =
  "Confirmo que sou o responsável pela oferta e que os dados e as condições informados estão corretos. Se um substituto as aceitar, esta proposta será a base do registro do repasse.";

function centsOf(value: string) {
  return Math.round(Number(value.trim().replace(",", ".")) * 100);
}

/** S06 · Revisar e publicar: pré-visualização, condições e aceite do titular. */
export function PublishShiftReview({
  values,
  group,
  acknowledged,
  readOnly = false,
}: {
  values: ShiftFormValues;
  group?: PublishGroup;
  /** Estado inicial (ou fixo, na demonstração) do aceite. */
  acknowledged?: boolean;
  readOnly?: boolean;
}) {
  const { startsAt, endsAt } = composeRange(values);
  const start = fortalezaIso(startsAt);
  const end = fortalezaIso(endsAt);
  const cents = centsOf(values.value);
  return (
    <div className={styles.fields}>
      <ProgressSteps
        total={2}
        current={2}
        caption="Etapa 2 de 2 · é assim que os colegas vão ver"
      />
      <ShiftCard
        status={{ tone: "open", label: "Aberto" }}
        group={group?.name ?? "Oferta livre"}
        title={
          group?.institutionName
            ? `${values.sector} · ${group.institutionName}`
            : values.sector
        }
        date={start ? formatShiftDay(start) : ""}
        time={start && end ? formatHourRangeShort(start, end) : ""}
        meta={values.notes.trim() || undefined}
        headingLevel="h2"
      />
      <KeyValueList
        items={[
          {
            label: "Quem pode ver",
            value: group?.name ?? "Profissionais aprovados",
          },
          {
            label: "Aprovação da coordenação",
            value: group?.requiresApproval
              ? "Exigida pelo grupo"
              : "Não exigida",
          },
          ...(group
            ? [
                {
                  label: "Avisar membros do grupo",
                  value: "Sim, automaticamente",
                },
              ]
            : []),
          {
            label: "Valor",
            value: Number.isFinite(cents)
              ? formatCurrency(cents)
              : values.value,
          },
          {
            label: "Condições de pagamento",
            value: values.paymentTerms,
            stacked: true,
          },
        ]}
      />
      <InfoBanner icon={Share2}>
        Depois de publicar, você pode compartilhar o link no grupo do WhatsApp.
        Quem tocar cai direto neste plantão.
      </InfoBanner>
      <InfoBanner>{PAYMENT_NOTICE}</InfoBanner>
      <CheckboxField
        name="ownerTermsAcknowledged"
        value="true"
        required
        label={OWNER_TERMS_TEXT}
        {...(readOnly
          ? { checked: Boolean(acknowledged), readOnly: true }
          : { defaultChecked: acknowledged })}
      />
    </div>
  );
}
