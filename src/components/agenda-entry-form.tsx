"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { saveAgendaEntryAction } from "@/app/agenda/actions";
import { AgendaDatePicker } from "@/components/agenda-date-picker";
import { AppScreen, TopBar } from "@/components/ui/app-shell";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { InfoBanner } from "@/components/ui/info-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  addDays,
  agendaEntrySchema,
  agendaFormObject,
  agendaKinds,
  counterpartyLabel,
  kindHints,
  kindLabels,
  PERSONAL_NOTE_NOTICE,
  type AgendaFormState,
  type AgendaKind,
  type DueMode,
  type ReminderSettings,
} from "@/features/agenda/schema";
import { AgendaReminderFields } from "@/components/agenda-reminder-fields";
import { PATIENT_DATA_NOTICE } from "@/features/shifts/copy";
import screens from "@/components/screens/screens.module.css";
import styles from "./agenda-form.module.css";

export type AgendaFormInitial = {
  kind: AgendaKind;
  dates: string[];
  start: string;
  end: string;
  location: string;
  sector: string;
  value: string;
  dueMode: DueMode;
  dueDate: string;
  dueDays: string;
  paymentMethod: string;
  counterparty: string;
  notes: string;
  reminder: ReminderSettings;
};

/** Ordem de foco quando há erro (primeiro campo inválido recebe o foco). */
const fieldOrder: [string, string][] = [
  ["kind", "kind-own"],
  ["dates", "field-dates"],
  ["start", "field-start"],
  ["end", "field-end"],
  ["location", "field-location"],
  ["sector", "field-sector"],
  ["value", "field-value"],
  ["dueMode", "field-dueMode"],
  ["dueDate", "field-dueDate"],
  ["dueDays", "field-dueDays"],
  ["paymentMethod", "field-paymentMethod"],
  ["counterparty", "field-counterparty"],
  ["reminderLead", "field-reminderLead"],
  ["reminderRepeat", "field-reminderRepeat"],
  ["notes", "field-notes"],
];

function focusFirst(errors: Record<string, string[] | undefined>) {
  const target = fieldOrder.find(([field]) => errors[field]?.length);
  if (!target) return false;
  const element = document.getElementById(target[1]);
  const focusable =
    target[0] === "dates"
      ? element?.querySelector<HTMLElement>('button[tabindex="0"]')
      : element;
  focusable?.focus();
  return Boolean(focusable);
}

const displayDate = (date: string) => date.split("-").reverse().join("/");

export function AgendaEntryForm({
  mode,
  requestId,
  entryId,
  initial,
  initialMonth,
  today,
  backHref,
}: {
  mode: "create" | "edit";
  requestId: string;
  entryId?: string;
  initial: AgendaFormInitial;
  initialMonth: string;
  today: string;
  backHref: string;
}) {
  const [state, action] = useActionState<AgendaFormState, FormData>(
    saveAgendaEntryAction,
    {},
  );
  const [local, setLocal] = useState<AgendaFormState>({});
  const [kind, setKind] = useState<AgendaKind>(initial.kind);
  const [dates, setDates] = useState<string[]>(initial.dates);
  const [dueMode, setDueMode] = useState<DueMode>(initial.dueMode);
  const [dueDays, setDueDays] = useState(initial.dueDays);
  /** Campos corrigidos depois do último envio: o erro deixa de aparecer. */
  const [cleared, setCleared] = useState<string[]>([]);
  const messageRef = useRef<HTMLDivElement>(null);
  const active = local.message ? local : state;
  const errors = active.errors ?? {};
  const value = (name: keyof AgendaFormInitial) =>
    state.values?.[name] ?? String(initial[name]);
  const error = (name: string) =>
    cleared.includes(name) ? undefined : errors[name]?.[0];
  const changeDates = (next: string[]) => {
    setDates(next);
    setCleared((current) =>
      current.includes("dates") ? current : [...current, "dates"],
    );
  };

  useEffect(() => {
    if (!state.message) return;
    if (!focusFirst(state.errors ?? {})) messageRef.current?.focus();
  }, [state]);

  const sortedDates = [...dates].sort();
  const singleDate = sortedDates.length === 1 ? sortedDates[0] : null;
  const preview =
    singleDate && dueMode === "days" && /^\d{1,3}$/.test(dueDays)
      ? displayDate(addDays(singleDate, Number(dueDays)))
      : null;
  const submitLabel =
    mode === "edit"
      ? "Salvar alterações"
      : dates.length > 1
        ? `Salvar ${dates.length} plantões`
        : "Salvar plantão";

  return (
    <form
      action={action}
      noValidate
      onSubmit={(event) => {
        setCleared([]);
        const raw = agendaFormObject(new FormData(event.currentTarget));
        const parsed = agendaEntrySchema(today).safeParse(raw);
        if (parsed.success) {
          setLocal({});
          return;
        }
        event.preventDefault();
        const found: Record<string, string[]> = {};
        for (const issue of parsed.error.issues)
          (found[String(issue.path[0])] ??= []).push(issue.message);
        setLocal({ message: "Revise os campos indicados.", errors: found });
        if (!focusFirst(found)) messageRef.current?.focus();
      }}
    >
      <input type="hidden" name="requestId" value={requestId} />
      {entryId ? <input type="hidden" name="entryId" value={entryId} /> : null}
      <AppScreen
        header={
          <TopBar
            title={mode === "edit" ? "Editar plantão" : "Adicionar plantão"}
            backHref={backHref}
          />
        }
        footer={
          <SubmitButton block pendingLabel="Salvando">
            {submitLabel}
          </SubmitButton>
        }
      >
        {active.message ? (
          <div ref={messageRef} tabIndex={-1} className={styles.message}>
            <InfoBanner variant="warning" role="alert">
              {active.message}
            </InfoBanner>
          </div>
        ) : null}

        <fieldset
          className={screens.formSection}
          aria-describedby={error("kind") ? "kind-error" : undefined}
        >
          <legend>Tipo</legend>
          <div className={styles.choices}>
            {agendaKinds.map((option) => (
              <label key={option} className={styles.choice}>
                <input
                  type="radio"
                  id={`kind-${option}`}
                  name="kind"
                  value={option}
                  checked={kind === option}
                  onChange={() => setKind(option)}
                  aria-describedby={`kind-${option}-hint`}
                />
                <span className={styles.choiceText}>
                  <span className={styles.choiceTitle}>
                    {kindLabels[option]}
                  </span>
                  <span
                    id={`kind-${option}-hint`}
                    className={styles.choiceHint}
                  >
                    {kindHints[option]}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {error("kind") ? (
            <p id="kind-error" className={styles.error}>
              {error("kind")}
            </p>
          ) : null}
          {kind === "own" ? (
            <p className={styles.hint}>{PERSONAL_NOTE_NOTICE}</p>
          ) : (
            <InfoBanner>
              Esta anotação não tem o aceite do colega. Para registrar o
              combinado com o aceite das duas partes, use{" "}
              <Link href="/acordos/registrados/novo">Registrar acordo</Link>.
            </InfoBanner>
          )}
        </fieldset>

        <fieldset className={screens.formSection}>
          <legend>Quando</legend>
          {mode === "create" ? (
            <AgendaDatePicker
              value={dates}
              onChange={changeDates}
              initialMonth={initialMonth}
              today={today}
              error={error("dates")}
            />
          ) : (
            <TextField
              label="Data"
              name="dates"
              id="field-dates"
              type="date"
              required
              min={addDays(today, -730)}
              max={addDays(today, 400)}
              defaultValue={state.dates?.[0] ?? initial.dates[0]}
              onChange={(event) => changeDates([event.target.value])}
              error={error("dates")}
            />
          )}
          <div className={screens.formGrid2}>
            <TextField
              label="Início"
              name="start"
              type="time"
              required
              defaultValue={value("start")}
              error={error("start")}
            />
            <TextField
              label="Término"
              name="end"
              type="time"
              required
              defaultValue={value("end")}
              error={error("end")}
            />
          </div>
          <p className={styles.hint}>
            Término igual ou antes do início indica que o plantão termina no dia
            seguinte.
          </p>
        </fieldset>

        <fieldset className={screens.formSection}>
          <legend>Onde</legend>
          <TextField
            label="Instituição e local"
            name="location"
            required
            maxLength={160}
            autoComplete="off"
            defaultValue={value("location")}
            error={error("location")}
          />
          <TextField
            label="Setor (opcional)"
            name="sector"
            maxLength={120}
            autoComplete="off"
            defaultValue={value("sector")}
            error={error("sector")}
          />
        </fieldset>

        <fieldset className={screens.formSection}>
          <legend>Pagamento</legend>
          <TextField
            label="Valor previsto (opcional)"
            name="value"
            inputMode="decimal"
            placeholder="1500,00"
            autoComplete="off"
            defaultValue={value("value")}
            hint="Valor que você espera receber ou pagar por este plantão."
            error={error("value")}
          />
          <SelectField
            label="Prazo de pagamento"
            name="dueMode"
            value={dueMode}
            onChange={(event) => setDueMode(event.target.value as DueMode)}
            error={error("dueMode")}
          >
            <option value="none">Sem prazo definido</option>
            <option value="date">Até uma data</option>
            <option value="days">Dias após o plantão</option>
          </SelectField>
          {dueMode === "date" ? (
            <TextField
              label="Data-limite"
              name="dueDate"
              type="date"
              min={sortedDates[sortedDates.length - 1]}
              defaultValue={value("dueDate")}
              hint={
                dates.length > 1
                  ? "A mesma data vale para todos os plantões escolhidos."
                  : undefined
              }
              error={error("dueDate")}
            />
          ) : (
            <input type="hidden" name="dueDate" value="" />
          )}
          {dueMode === "days" ? (
            <div className={styles.daysField}>
              <TextField
                label="Dias após o plantão"
                name="dueDays"
                inputMode="numeric"
                maxLength={3}
                value={dueDays}
                onChange={(event) =>
                  setDueDays(event.target.value.replace(/\D/g, ""))
                }
                hint={
                  preview
                    ? `Data-limite: ${preview}.`
                    : dates.length > 1
                      ? "Cada plantão terá a própria data-limite."
                      : undefined
                }
                error={error("dueDays")}
              />
              <ul className={styles.quickDays} aria-label="Prazos comuns">
                {["30", "60", "90"].map((days) => (
                  <li key={days}>
                    <button
                      type="button"
                      className={styles.quickDay}
                      aria-pressed={dueDays === days}
                      onClick={() => setDueDays(days)}
                    >
                      {days} dias
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <input type="hidden" name="dueDays" value="" />
          )}
          <TextField
            label={`${counterpartyLabel(kind)} (opcional)`}
            name="counterparty"
            maxLength={120}
            autoComplete="off"
            defaultValue={value("counterparty")}
            hint={
              kind === "passed"
                ? "Nome do colega. Não informe CPF, telefone, e-mail nem dados de pacientes."
                : "Instituição, cooperativa, empresa ou colega. Não informe CPF, telefone, e-mail nem dados de pacientes."
            }
            error={error("counterparty")}
          />
          <TextField
            label="Forma de pagamento (opcional)"
            name="paymentMethod"
            maxLength={120}
            autoComplete="off"
            placeholder="Pix, transferência, nota fiscal"
            defaultValue={value("paymentMethod")}
            error={error("paymentMethod")}
          />
          {dueMode === "none" ? (
            <>
              <input
                type="hidden"
                name="reminderEnabled"
                value={initial.reminder.enabled ? "true" : "false"}
              />
              <input
                type="hidden"
                name="reminderLead"
                value={String(initial.reminder.leadDays)}
              />
              <input
                type="hidden"
                name="reminderRepeat"
                value={String(initial.reminder.repeatDays)}
              />
              <p className={styles.hint}>
                Com um prazo de pagamento, a agenda pode lembrar você de{" "}
                {kind === "passed" ? "pagar" : "cobrar"}.
              </p>
            </>
          ) : (
            <AgendaReminderFields
              initial={initial.reminder}
              direction={kind === "passed" ? "pay" : "receive"}
              errors={{
                reminderLead: error("reminderLead"),
                reminderRepeat: error("reminderRepeat"),
              }}
            />
          )}
        </fieldset>

        <fieldset className={screens.formSection}>
          <legend>Observações</legend>
          <TextAreaField
            label="Observações (opcional)"
            name="notes"
            maxLength={1000}
            defaultValue={value("notes")}
            error={error("notes")}
          />
          <InfoBanner variant="warning">{PATIENT_DATA_NOTICE}</InfoBanner>
        </fieldset>
      </AppScreen>
    </form>
  );
}
