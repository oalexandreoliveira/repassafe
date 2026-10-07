"use client";

import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { InfoBanner } from "@/components/ui/info-banner";
import {
  composeRange,
  type ShiftFormErrors,
  type ShiftFormField,
  type ShiftFormValues,
} from "@/features/shifts/form-values";
import { PATIENT_DATA_NOTICE } from "@/features/shifts/copy";
import styles from "./publish-shift-fields.module.css";

export type PublishGroup = {
  id: string;
  name: string;
  requiresApproval: boolean;
  institutionName?: string;
};

/**
 * Campos de S05 (publicar e editar). Compartilhado com a demonstração da
 * landing, que passa valores fictícios em modo somente leitura.
 */
export function PublishShiftFields({
  values,
  onChange,
  errors = {},
  groups = [],
  showGroup = true,
  minDate,
  readOnly = false,
}: {
  values: ShiftFormValues;
  onChange?: (field: ShiftFormField, value: string) => void;
  errors?: ShiftFormErrors;
  groups?: PublishGroup[];
  /** Na edição o grupo não muda e segue como campo oculto. */
  showGroup?: boolean;
  /** Primeira data aceita (hoje, no fuso do produto). */
  minDate?: string;
  readOnly?: boolean;
}) {
  const { startsAt, endsAt } = composeRange(values);
  const group = groups.find((item) => item.id === values.groupId);
  const bind = (field: ShiftFormField) => ({
    value: values[field],
    readOnly,
    onChange: (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => onChange?.(field, event.target.value),
    error: errors[field],
  });

  return (
    <div className={styles.fields}>
      <input type="hidden" name="startsAt" value={startsAt} />
      <input type="hidden" name="endsAt" value={endsAt} />
      {showGroup ? (
        <SelectField
          label="Grupo"
          name="groupId"
          {...bind("groupId")}
          disabled={readOnly}
        >
          {groups.map((item) => (
            <option value={item.id} key={item.id}>
              {item.institutionName
                ? `${item.name} · ${item.institutionName}`
                : item.name}
            </option>
          ))}
          <option value="">Oferta livre — sem grupo</option>
        </SelectField>
      ) : (
        <input type="hidden" name="groupId" value={values.groupId} />
      )}
      <TextField
        label="Setor"
        name="sector"
        minLength={2}
        maxLength={120}
        required
        autoComplete="off"
        {...bind("sector")}
      />
      <TextField
        label="Data"
        id="field-date"
        name="date"
        type="date"
        min={minDate}
        required
        className={styles.dateInput}
        {...bind("date")}
      />
      <div className={styles.timeRow}>
        <TextField
          label="Início"
          id="field-start"
          name="start"
          type="time"
          required
          className={styles.dateInput}
          {...bind("start")}
        />
        <TextField
          label="Fim"
          id="field-end"
          name="end"
          type="time"
          required
          className={styles.dateInput}
          hint={
            values.start && values.end && values.end <= values.start
              ? "Termina no dia seguinte."
              : undefined
          }
          {...bind("end")}
        />
      </div>
      <TextField
        label="Valor (R$)"
        name="value"
        inputMode="decimal"
        placeholder="1200,00"
        required
        {...bind("value")}
      />
      <TextField
        label="Condições de pagamento"
        name="paymentTerms"
        maxLength={300}
        required
        {...bind("paymentTerms")}
      />
      <div className={styles.notes}>
        <TextAreaField
          label="Observações operacionais"
          name="notes"
          maxLength={1000}
          placeholder="Ex.: passagem de plantão presencial às 18h45 com a equipe de enfermagem."
          {...bind("notes")}
        />
        <InfoBanner variant="warning">{PATIENT_DATA_NOTICE}</InfoBanner>
      </div>
      {group?.requiresApproval ? (
        <InfoBanner variant="neutral">
          Este grupo exige <strong>aprovação da coordenação</strong> antes do
          acordo ser registrado.
        </InfoBanner>
      ) : null}
    </div>
  );
}
