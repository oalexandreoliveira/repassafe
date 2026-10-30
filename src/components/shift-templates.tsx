"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import type {
  ShiftFormField,
  ShiftFormValues,
} from "@/features/shifts/form-values";
import styles from "@/components/screens/screens.module.css";

export function ShiftTemplates({
  values,
  onChange,
}: {
  values: ShiftFormValues;
  onChange?: (field: ShiftFormField, value: string) => void;
}) {
  const [period, setPeriod] = useState("day");
  const [applied, setApplied] = useState(false);
  return (
    <details className={styles.disclosure}>
      <summary>Usar um modelo de horários e condições</summary>
      <div className={styles.disclosureBody}>
        <p className={styles.help}>
          O modelo substitui início, fim e condições de pagamento. Revise os
          dados antes de publicar; a data-limite é sempre escolhida por você.
        </p>
        <SelectField
          label="Modelo de turno"
          name="shiftTemplate"
          value={period}
          onChange={(event) => {
            setPeriod(event.target.value);
            setApplied(false);
          }}
        >
          <option value="day">Serviço diurno (SD) · 07h às 19h</option>
          <option value="night">
            Serviço noturno (SN) · 19h às 07h do dia seguinte
          </option>
          <option value="morning">Manhã · 07h às 13h</option>
        </SelectField>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            onChange?.("start", period === "night" ? "19:00" : "07:00");
            onChange?.(
              "end",
              period === "night"
                ? "07:00"
                : period === "morning"
                  ? "13:00"
                  : "19:00",
            );
            onChange?.(
              "paymentTerms",
              "Pagamento por Pix, no valor total combinado.",
            );
            setApplied(true);
          }}
        >
          Aplicar modelo
        </Button>
        {applied && (
          <p role="status">
            Modelo aplicado. Confira os horários, a data-limite e a forma de
            pagamento.
          </p>
        )}
        <p className={styles.help}>
          No setor, descreva a atividade e o local: rotina, intercorrência ou
          round, por exemplo. Rotina e round podem ocorrer juntos.{" "}
          {values.date
            ? "Confira também a data do plantão."
            : "Escolha a data do plantão."}
        </p>
      </div>
    </details>
  );
}
