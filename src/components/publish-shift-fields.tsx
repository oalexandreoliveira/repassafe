import styles from "./publish-shift-fields.module.css";

export type ShiftFormExample = {
  startsAt: string;
  endsAt: string;
  sector: string;
  value: string;
  paymentTerms: string;
  notes: string;
  ownerTermsAcknowledged: boolean;
};

/** Shared by the operational form and its inert, fictional landing demonstration. */
export function PublishShiftFields({
  groups = [],
  example,
  mode = "both",
}: {
  groups?: { id: string; name: string }[];
  example?: ShiftFormExample;
  mode?: "both" | "group" | "free";
}) {
  const preview = (
    name: Exclude<keyof ShiftFormExample, "ownerTermsAcknowledged">,
  ) => (example ? { value: example[name], readOnly: true } : {});
  return (
    <>
      {mode === "free" ? (
        <input type="hidden" name="groupId" value="" />
      ) : (
        <label>
          {mode === "group" ? "Grupo" : "Grupo (opcional)"}
          <select name="groupId" defaultValue="" required={mode === "group"}>
            <option value="" disabled={mode === "group"}>
              {mode === "group"
                ? "Selecione seu grupo"
                : "Oferta livre — sem grupo"}
            </option>
            {groups.map((group) => (
              <option value={group.id} key={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="form-row">
        <label>
          Início
          <input
            type="datetime-local"
            className={styles.dateInput}
            name="startsAt"
            required
            {...preview("startsAt")}
          />
        </label>
        <label>
          Término
          <input
            type="datetime-local"
            className={styles.dateInput}
            name="endsAt"
            required
            {...preview("endsAt")}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Setor
          <input
            name="sector"
            minLength={2}
            maxLength={120}
            required
            {...preview("sector")}
          />
        </label>
        <label>
          Valor (R$)
          <input
            name="value"
            inputMode="decimal"
            placeholder="1200,00"
            required
            {...preview("value")}
          />
        </label>
      </div>
      <label>
        Condições de pagamento
        <input
          name="paymentTerms"
          maxLength={300}
          required
          {...preview("paymentTerms")}
        />
      </label>
      <label>
        Observações operacionais (sem dados de pacientes)
        <textarea name="notes" maxLength={1000} {...preview("notes")} />
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="ownerTermsAcknowledged"
          value="true"
          required
          {...(example
            ? { checked: example.ownerTermsAcknowledged, readOnly: true }
            : {})}
        />
        Confirmo que sou o responsável pela oferta e que os dados e as condições
        informados estão corretos. Se um substituto as aceitar, esta proposta
        será a base do registro do repasse.
      </label>
      <button className="button button-primary" type="submit">
        Publicar plantão
      </button>
    </>
  );
}
