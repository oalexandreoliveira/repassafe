"use client";

import { useActionState } from "react";
import { saveRecordReminderAction } from "@/app/agenda/actions";
import { AgendaReminderFields } from "@/components/agenda-reminder-fields";
import { InfoBanner } from "@/components/ui/info-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import type { PaymentDirection } from "@/features/agenda/model";
import type {
  AgendaFormState,
  ReminderSettings,
} from "@/features/agenda/schema";
import screens from "@/components/screens/screens.module.css";

/** Lembrete pessoal sobre um repasse do app; não altera o acordo. */
export function AgendaRecordReminderForm({
  source,
  recordId,
  initial,
  direction,
}: {
  source: "mural" | "registered";
  recordId: string;
  initial: ReminderSettings;
  direction: PaymentDirection;
}) {
  const [state, action] = useActionState<AgendaFormState, FormData>(
    saveRecordReminderAction,
    {},
  );
  return (
    <form action={action} noValidate className={screens.panel}>
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="recordId" value={recordId} />
      {state.message ? (
        <InfoBanner variant="warning" role="alert">
          {state.message}
        </InfoBanner>
      ) : null}
      <AgendaReminderFields
        initial={initial}
        direction={direction}
        separated={false}
        errors={{
          reminderLead: state.errors?.reminderLead?.[0],
          reminderRepeat: state.errors?.reminderRepeat?.[0],
        }}
      />
      <p className={screens.help}>
        A preferência vale só para você e não altera o acordo.
      </p>
      <SubmitButton variant="secondary" block pendingLabel="Salvando">
        Salvar lembrete
      </SubmitButton>
    </form>
  );
}
