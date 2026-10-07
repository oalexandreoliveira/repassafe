"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  createAgreementAction,
  agreementCommandAction,
} from "@/app/acordos/registrados/actions";
import {
  createAgreementSchema,
  deadlineNotice,
  type AgreementFormState,
} from "@/features/agreements/schema";
import { formatCurrency, formatDateTime } from "@/features/shifts/schemas";

function Feedback({ state }: { state: AgreementFormState }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.message && !state.success) ref.current?.focus();
  }, [state]);
  return state.message ? (
    <p
      ref={ref}
      tabIndex={-1}
      role={state.success ? "status" : "alert"}
      className={state.success ? "form-help" : "form-error"}
    >
      {state.message}
    </p>
  ) : null;
}
function Field({
  name,
  label,
  state,
  type = "text",
  children,
  ...props
}: {
  name: string;
  label: string;
  state: AgreementFormState;
  type?: string;
  children?: ReactNode;
  required?: boolean;
  maxLength?: number;
  inputMode?: "decimal";
  accept?: string;
  defaultValue?: string;
}) {
  const uid = useId();
  const errors = state.errors?.[name];
  const shared = {
    name,
    id: uid,
    "aria-invalid": Boolean(errors),
    "aria-describedby": errors ? `${uid}-error` : undefined,
    defaultValue: state.values?.[name] ?? props.defaultValue,
  };
  return (
    <div className="form-field">
      <label htmlFor={uid}>{label}</label>
      {children ? (
        <select {...shared} required={props.required}>
          {children}
        </select>
      ) : type === "textarea" ? (
        <textarea {...props} {...shared} />
      ) : (
        <input {...props} {...shared} type={type} />
      )}
      {errors && (
        <span className="field-error" id={`${uid}-error`}>
          {errors[0]}
        </span>
      )}
    </div>
  );
}
function Accept({ text, state }: { text: string; state: AgreementFormState }) {
  const id = useId();
  return (
    <div>
      <label className="agreement-checkbox">
        <input
          type="checkbox"
          name="accepted"
          value="true"
          required
          aria-invalid={Boolean(state.errors?.accepted)}
          aria-describedby={state.errors?.accepted ? id : undefined}
        />
        <span>{text}</span>
      </label>
      {state.errors?.accepted && (
        <p id={id} className="field-error">
          {state.errors.accepted[0]}
        </p>
      )}
    </div>
  );
}
export function CreateAgreementForm({
  requestId,
  groups,
}: {
  requestId: string;
  groups: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createAgreementAction, {});
  const [local, setLocal] = useState<AgreementFormState>({});
  const [review, setReview] = useState<ReturnType<
    typeof createAgreementSchema.parse
  > | null>(null);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const active = local.message ? local : state;
  useEffect(() => {
    if (review) reviewRef.current?.focus();
  }, [review]);
  return (
    <form
      action={action}
      noValidate
      className="form-stack agreement-form"
      onSubmit={(event) => {
        if (review) return;
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        const parsed = createAgreementSchema.safeParse(data);
        if (!parsed.success) {
          const errors: Record<string, string[]> = {};
          for (const issue of parsed.error.issues)
            (errors[String(issue.path[0])] ??= []).push(issue.message);
          setLocal({ message: "Revise os campos indicados.", errors });
        } else {
          setLocal({});
          setReview(parsed.data);
        }
      }}
    >
      <input type="hidden" name="requestId" value={requestId} />
      <Feedback state={active} />
      <div hidden={Boolean(review)}>
        <fieldset>
          <legend>Participantes</legend>
          <Field
            name="creatorRole"
            label="Neste plantão, eu vou"
            state={active}
            required
            defaultValue=""
          >
            <option value="" disabled>
              Selecione seu papel
            </option>
            <option value="owner">Repassar o plantão e pagar</option>
            <option value="substitute">Assumir o plantão e receber</option>
          </Field>
          <Field
            name="recipientEmail"
            label="E-mail do outro profissional"
            type="email"
            state={active}
            required
            maxLength={254}
          />
          <p className="form-help">
            O convite será aceito pela conta com este e-mail confirmado. A outra
            pessoa pode se cadastrar depois.
          </p>
          <Field
            name="groupId"
            label="Vínculo institucional"
            state={active}
            defaultValue=""
          >
            <option value="">Sem grupo institucional</option>
            {groups.map((group) => (
              <option value={group.id} key={group.id}>
                {group.name}
              </option>
            ))}
          </Field>
          <p className="form-help">
            Em grupo, ambos precisam de vínculo ativo. A aprovação institucional
            será solicitada quando exigida.
          </p>
        </fieldset>
        <fieldset>
          <legend>Dados do plantão</legend>
          <Field
            name="location"
            label="Instituição e local (cidade e endereço)"
            state={active}
            required
            maxLength={240}
          />
          <Field
            name="sector"
            label="Setor"
            state={active}
            required
            maxLength={120}
          />
          <div className="form-row">
            <Field
              name="startsAt"
              label="Início"
              type="datetime-local"
              state={active}
              required
            />
            <Field
              name="endsAt"
              label="Término"
              type="datetime-local"
              state={active}
              required
            />
          </div>
          <p className="form-help">
            Horários no fuso de Fortaleza (UTC−3). O convite expira no início do
            plantão.
          </p>
        </fieldset>
        <fieldset>
          <legend>Pagamento</legend>
          <p>Quem repassa paga a quem assume. {deadlineNotice}</p>
          <div className="form-row">
            <Field
              name="value"
              label="Valor total (R$)"
              state={active}
              inputMode="decimal"
              required
            />
            <Field
              name="dueDate"
              label="Data-limite de pagamento"
              type="date"
              state={active}
              required
            />
          </div>
          <Field
            name="paymentMethod"
            label="Forma de pagamento"
            state={active}
            required
            maxLength={120}
          />
          <Field
            name="notes"
            label="Observações operacionais (sem dados de pacientes)"
            type="textarea"
            state={active}
            maxLength={1000}
          />
        </fieldset>
        <Accept
          state={active}
          text={`Confirmo meus dados e as condições informadas. ${deadlineNotice}`}
        />
        <button className="button button-primary" type="submit">
          Conferir acordo
        </button>
      </div>
      {review && (
        <section className="agreement-review">
          <h2 ref={reviewRef} tabIndex={-1}>
            Confira antes de enviar
          </h2>
          <p className="agreement-commitment">
            {review.creatorRole === "owner" ? "Você pagará" : "Você receberá"}{" "}
            <strong>{formatCurrency(review.value)}</strong> até{" "}
            <strong>{review.dueDate.split("-").reverse().join("/")}</strong>.
          </p>
          <p>
            <strong>{deadlineNotice}</strong>
          </p>
          <dl>
            <dt>Seu papel</dt>
            <dd>
              {review.creatorRole === "owner"
                ? "Repassar e pagar"
                : "Assumir e receber"}
            </dd>
            <dt>Outro profissional</dt>
            <dd>{review.recipientEmail}</dd>
            <dt>Grupo</dt>
            <dd>
              {groups.find((group) => group.id === review.groupId)?.name ??
                "Sem grupo institucional"}
            </dd>
            <dt>Plantão</dt>
            <dd>
              {review.location} · {review.sector}
              <br />
              {formatDateTime(review.startsAt)} até{" "}
              {formatDateTime(review.endsAt)}
            </dd>
            <dt>Forma de pagamento</dt>
            <dd>{review.paymentMethod}</dd>
            {review.notes && (
              <>
                <dt>Observações</dt>
                <dd>{review.notes}</dd>
              </>
            )}
          </dl>
          <p>
            Ao enviar, seu aceite ficará registrado. O acordo ainda depende da
            confirmação da outra parte e da aprovação institucional, quando
            exigida.
          </p>
          <div className="actions">
            <button
              type="submit"
              className="button button-primary"
              disabled={pending}
            >
              {pending ? "Registrando…" : "Aceitar e criar convite"}
            </button>
            <button
              type="button"
              className="button button-secondary"
              disabled={pending}
              onClick={() => setReview(null)}
            >
              Voltar e corrigir
            </button>
          </div>
        </section>
      )}
    </form>
  );
}
export function AgreementActionForm({
  agreementId,
  requestId,
  operation,
  label,
  termsHash,
  total,
}: {
  agreementId: string;
  requestId: string;
  operation: string;
  label: string;
  termsHash?: string;
  total?: number;
}) {
  const [state, action, pending] = useActionState(agreementCommandAction, {});
  return (
    <form action={action} noValidate className="form-stack agreement-action">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="agreementId" value={agreementId} />
      <input type="hidden" name="operation" value={operation} />
      {termsHash && <input type="hidden" name="termsHash" value={termsHash} />}
      <Feedback state={state} />
      {operation === "accept" && (
        <Accept
          state={state}
          text={`Li e aceito as condições, meu papel e a situação de verificação apresentada. ${deadlineNotice}`}
        />
      )}
      {operation === "receive" && (
        <Accept
          state={state}
          text="Confirmo que recebi o valor total deste acordo."
        />
      )}
      {operation === "payment" && (
        <>
          <div className="form-row">
            <Field
              name="paidOn"
              label="Data do pagamento"
              type="date"
              state={state}
              required
            />
            <Field
              name="amount"
              label="Valor pago (R$)"
              inputMode="decimal"
              state={state}
              required
              defaultValue={
                total ? (total / 100).toFixed(2).replace(".", ",") : ""
              }
            />
          </div>
          <Field
            name="receipt"
            label="Comprovante (opcional, PDF, PNG ou JPEG até 4 MB)"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            state={state}
          />
          <p className="form-help">
            Informe o valor total. Para pagamento parcial ou divergente, use
            “Informar divergência”. O comprovante fica disponível às duas
            partes.
          </p>
        </>
      )}
      {operation === "dispute" && (
        <Field
          name="description"
          label="Descreva a divergência (sem dados de pacientes)"
          state={state}
          type="textarea"
          maxLength={2000}
          required
        />
      )}
      <button
        className={`button ${["decline", "reject", "cancel", "dispute"].includes(operation) ? "button-secondary" : "button-primary"}`}
        disabled={pending || state.success}
        type="submit"
      >
        {pending ? "Registrando…" : label}
      </button>
    </form>
  );
}
export function ShareAgreement({ url }: { url: string }) {
  const [message, setMessage] = useState("");
  return (
    <div className="agreement-share">
      <label htmlFor="agreement-link">Link do convite</label>
      <input
        id="agreement-link"
        value={url}
        readOnly
        onFocus={(event) => event.currentTarget.select()}
      />
      <div className="actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setMessage("Link copiado.");
            } catch {
              setMessage("Selecione o link acima e copie para compartilhar.");
            }
          }}
        >
          Copiar link
        </button>
        <a
          className="button button-primary"
          href={`https://wa.me/?text=${encodeURIComponent(`Confira e confirme nosso acordo no Repassafe: ${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Compartilhar no WhatsApp
        </a>
      </div>
      <p role="status">{message}</p>
    </div>
  );
}
export function PrintAgreement() {
  return (
    <button
      type="button"
      className="button button-secondary"
      onClick={() => window.print()}
    >
      Imprimir ou salvar PDF
    </button>
  );
}
