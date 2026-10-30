"use client";

import { useActionState, useState } from "react";
import { recordPaymentAction } from "@/app/acordos/[id]/pagamento/actions";
import { initialActionState } from "@/features/auth/schemas";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField, CheckboxField } from "@/components/ui/field";
import { ActionFeedback } from "@/components/screens/auth-screen";
import { PATIENT_DATA_NOTICE } from "@/features/shifts/copy";
import styles from "@/components/screens/screens.module.css";

export function PaymentEventForm({
  agreementId,
  requestId,
  operation,
  amount,
  today,
}: {
  agreementId: string;
  requestId: string;
  operation: "payment" | "receive" | "dispute" | "source_delay";
  amount: number;
  today: string;
}) {
  const [state, action, pending] = useActionState(
    recordPaymentAction,
    initialActionState,
  );
  const [paidOn, setPaidOn] = useState("");
  const [paidAmount, setPaidAmount] = useState(
    (amount / 100).toFixed(2).replace(".", ","),
  );
  const [description, setDescription] = useState("");
  const [accepted, setAccepted] = useState(false);
  const labels = {
    payment: "Informar pagamento",
    receive: "Confirmar recebimento integral",
    dispute: "Registrar divergência",
    source_delay: "Registrar atraso da fonte pagadora",
  };
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="agreementId" value={agreementId} />
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="operation" value={operation} />
      {operation === "payment" && (
        <>
          <TextField
            name="paidOn"
            label="Data do pagamento"
            type="date"
            value={paidOn}
            onChange={(event) => setPaidOn(event.target.value)}
            disabled={pending}
            max={today}
            required
            error={state.fieldErrors?.paidOn}
          />
          <TextField
            name="amount"
            label="Valor pago (R$)"
            value={paidAmount}
            onChange={(event) => setPaidAmount(event.target.value)}
            disabled={pending}
            inputMode="decimal"
            required
            error={state.fieldErrors?.amount}
          />
          <p className={styles.help}>
            Informe o valor total. Para pagamento parcial, registre uma
            divergência. Quem recebe confirma o recebimento separadamente.
          </p>
        </>
      )}
      {operation === "receive" && (
        <CheckboxField
          name="accepted"
          value="true"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          disabled={pending}
          required
          label="Confirmo que recebi o valor total deste acordo."
        />
      )}
      {["dispute", "source_delay"].includes(operation) && (
        <>
          <TextAreaField
            id={`${operation}-description`}
            name="description"
            label="Descreva o ocorrido"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={pending}
            minLength={10}
            maxLength={2000}
            required
            error={state.fieldErrors?.description}
          />
          <p className={styles.help}>{PATIENT_DATA_NOTICE}</p>
          {operation === "source_delay" && (
            <p className={styles.help}>
              Este relato registra o contexto. Não altera a data-limite nem
              comprova ausência de responsabilidade.
            </p>
          )}
        </>
      )}
      <ActionFeedback state={state} />
      <Button
        type="submit"
        loading={pending}
        disabled={state.status === "success"}
        variant={
          ["receive", "payment"].includes(operation) ? "primary" : "secondary"
        }
        block
      >
        {labels[operation]}
      </Button>
    </form>
  );
}
