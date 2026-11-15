"use client";

import { useActionState } from "react";
import { settleAgendaEntryAction } from "@/app/agenda/actions";
import { TextField } from "@/components/ui/field";
import { InfoBanner } from "@/components/ui/info-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import type { AgendaFormState } from "@/features/agenda/schema";
import screens from "@/components/screens/screens.module.css";

/** Marca a anotação como recebida (ou paga) com data e valor efetivos. */
export function AgendaSettleForm({
  entryId,
  receive,
  today,
  minDate,
  plannedValue,
}: {
  entryId: string;
  receive: boolean;
  today: string;
  minDate: string;
  /** Valor previsto já formatado ("1800,00"), sugerido no campo. */
  plannedValue: string;
}) {
  const [state, action] = useActionState<AgendaFormState, FormData>(
    settleAgendaEntryAction,
    {},
  );
  const error = (name: string) => state.errors?.[name]?.[0];
  return (
    <form action={action} noValidate className={screens.stack}>
      <input type="hidden" name="entryId" value={entryId} />
      {state.message ? (
        <InfoBanner variant="warning" role="alert">
          {state.message}
        </InfoBanner>
      ) : null}
      <div className={screens.formGrid2}>
        <TextField
          label={receive ? "Recebido em" : "Pago em"}
          name="settledOn"
          type="date"
          required
          min={minDate}
          max={today}
          defaultValue={state.values?.settledOn ?? today}
          error={error("settledOn")}
        />
        <TextField
          label={receive ? "Valor recebido" : "Valor pago"}
          name="amount"
          inputMode="decimal"
          required
          autoComplete="off"
          placeholder="1500,00"
          defaultValue={state.values?.amount ?? plannedValue}
          error={error("amount")}
        />
      </div>
      <p className={screens.help}>
        Informe o valor que de fato {receive ? "entrou" : "saiu"}, com retenções
        ou descontos.
      </p>
      <SubmitButton block variant="secondary" pendingLabel="Salvando">
        {receive ? "Confirmar recebimento" : "Confirmar pagamento"}
      </SubmitButton>
    </form>
  );
}
