"use client";

import { useState } from "react";
import { SelectField } from "@/components/ui/field";
import { Toggle } from "@/components/ui/toggle";
import {
  reminderDescription,
  type PaymentDirection,
} from "@/features/agenda/model";
import {
  reminderLeadLabels,
  reminderLeads,
  reminderRepeatLabels,
  reminderRepeats,
  type ReminderLead,
  type ReminderRepeat,
  type ReminderSettings,
} from "@/features/agenda/schema";
import styles from "./agenda-form.module.css";

/**
 * Lembrete de pagamento: ligado por padrão, aviso no vencimento e repetição
 * semanal. Envia reminderEnabled, reminderLead e reminderRepeat no formulário.
 */
export function AgendaReminderFields({
  initial,
  direction,
  errors = {},
  separated = true,
}: {
  initial: ReminderSettings;
  direction: PaymentDirection;
  errors?: Partial<Record<"reminderLead" | "reminderRepeat", string>>;
  /** Linha divisória acima, quando o bloco segue outros campos. */
  separated?: boolean;
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [lead, setLead] = useState(String(initial.leadDays) as ReminderLead);
  const [repeat, setRepeat] = useState(
    String(initial.repeatDays) as ReminderRepeat,
  );
  const description = reminderDescription(
    { enabled, leadDays: Number(lead), repeatDays: Number(repeat) },
    direction,
  );
  return (
    <div
      className={`${styles.reminder} ${separated ? styles.reminderSeparated : ""}`}
    >
      <input
        type="hidden"
        name="reminderEnabled"
        value={enabled ? "true" : "false"}
      />
      <Toggle
        name="reminderToggle"
        label={
          direction === "receive" ? "Lembrar de cobrar" : "Lembrar de pagar"
        }
        checked={enabled}
        onChange={(event) => setEnabled(event.target.checked)}
        aria-describedby="reminder-description"
      />
      {enabled ? (
        <div className={styles.reminderOptions}>
          <SelectField
            label="Primeiro aviso"
            name="reminderLead"
            value={lead}
            onChange={(event) => setLead(event.target.value as ReminderLead)}
            error={errors.reminderLead}
          >
            {reminderLeads.map((option) => (
              <option key={option} value={option}>
                {reminderLeadLabels[option]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Depois do vencimento"
            name="reminderRepeat"
            value={repeat}
            onChange={(event) =>
              setRepeat(event.target.value as ReminderRepeat)
            }
            error={errors.reminderRepeat}
          >
            {reminderRepeats.map((option) => (
              <option key={option} value={option}>
                {reminderRepeatLabels[option]}
              </option>
            ))}
          </SelectField>
        </div>
      ) : (
        <>
          <input type="hidden" name="reminderLead" value={lead} />
          <input type="hidden" name="reminderRepeat" value={repeat} />
        </>
      )}
      <p id="reminder-description" className={styles.hint} aria-live="polite">
        {description}
      </p>
    </div>
  );
}
