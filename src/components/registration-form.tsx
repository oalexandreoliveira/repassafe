"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  acceptDocumentsAction,
  changeEmailAction,
  removePhotoAction,
  saveRegistrationAction,
  sendPhoneCodeAction,
  submitRegistrationAction,
  uploadPhotoAction,
  verifyPhoneCodeAction,
} from "@/app/cadastro/actions";
import { initialActionState, type ActionState } from "@/features/auth/schemas";
import { brazilianStates } from "@/features/registration/schemas";

function Feedback({ state }: { state: ActionState }) {
  return state.message ? (
    <p
      className={`form-message form-message-${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  ) : null;
}

export function RegistrationForm({
  data,
  revision,
  correctionFields = {},
}: {
  data: Record<string, string>;
  revision: number;
  correctionFields?: Record<string, string>;
}) {
  const [values, setValues] = useState(data);
  const change = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const [state, action, pending] = useActionState(
    saveRegistrationAction,
    initialActionState,
  );
  const field = (
    name: string,
    label: string,
    type = "text",
    autoComplete?: string,
  ) => (
    <div key={name} className="form-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={values[name] ?? ""}
        onChange={(event) => change(name, event.target.value)}
        aria-invalid={!!state.fieldErrors?.[name] || !!correctionFields[name]}
        aria-describedby={
          state.fieldErrors?.[name] || correctionFields[name]
            ? `${name}-help`
            : undefined
        }
      />
      <span id={`${name}-help`} className="field-error">
        {state.fieldErrors?.[name] || correctionFields[name]}
      </span>
    </div>
  );
  return (
    <form action={action} className="form-stack">
      <input
        name="revision"
        type="hidden"
        value={Math.max(state.revision ?? 0, revision)}
      />
      <fieldset>
        <legend>Identificação</legend>
        <p className="form-help">
          Dados civis ficam restritos a você e à equipe autorizada.
        </p>
        {field("civilName", "Nome civil completo", "text", "name")}
        {field("displayName", "Nome de apresentação")}
        <div className="form-row">
          {field("cpf", "CPF")}
          {field("birthDate", "Nascimento", "date", "bday")}
        </div>
        {field("phone", "Celular com DDD", "tel", "tel")}
      </fieldset>
      <fieldset>
        <legend>Atuação profissional</legend>
        <div className="form-field">
          <label htmlFor="practicesMedicine">Você atua como médico?</label>
          <select
            id="practicesMedicine"
            name="practicesMedicine"
            value={values.practicesMedicine ?? "yes"}
            onChange={(event) =>
              change("practicesMedicine", event.target.value)
            }
          >
            <option value="yes">Sim, tenho CRM</option>
            <option value="no">
              Não, preciso de autorização institucional
            </option>
          </select>
        </div>
        <p className="form-help">
          A autorização de grupos é concedida pelo responsável. Selecionar esta
          opção não concede acesso.
        </p>
        <div className="form-row">
          {field("crmNumber", "CRM — para atuação médica")}
          <div className="form-field">
            <label htmlFor="crmState">UF do CRM</label>
            <select
              id="crmState"
              name="crmState"
              value={values.crmState ?? ""}
              onChange={(event) => change("crmState", event.target.value)}
              aria-invalid={
                !!state.fieldErrors?.crmState || !!correctionFields.crmState
              }
              aria-describedby="crmState-help"
            >
              <option value="">Selecionar UF</option>
              {brazilianStates.map((uf) => (
                <option key={uf}>{uf}</option>
              ))}
            </select>
            <span id="crmState-help" className="field-error">
              {state.fieldErrors?.crmState || correctionFields.crmState}
            </span>
          </div>
        </div>
        <div className="form-row">
          {field("specialty", "Especialidade — opcional")}
          {field("rqe", "RQE — se aplicável")}
        </div>
        <p className="form-help">
          Especialidade e RQE serão conferidos separadamente do CRM.
        </p>
      </fieldset>
      <fieldset>
        <legend>Vínculo declarado</legend>
        {field("institution", "Instituição — opcional")}
        {field("sector", "Setor — opcional")}
        <p className="form-help">
          Esta declaração não confirma vínculo, credenciamento ou permissão
          institucional.
        </p>
      </fieldset>
      {Object.keys(correctionFields).length ? (
        <label htmlFor="response">
          Resposta às correções
          <textarea
            id="response"
            name="response"
            maxLength={2000}
            value={values.response ?? ""}
            onChange={(event) => change("response", event.target.value)}
          />
        </label>
      ) : (
        <input type="hidden" name="response" value={data.response ?? ""} />
      )}
      <Feedback state={state} />
      <button className="button button-primary" disabled={pending}>
        {pending ? "Salvando…" : "Salvar progresso"}
      </button>
    </form>
  );
}

export function RegistrationDocuments({ accepted }: { accepted: boolean }) {
  const [state, action, pending] = useActionState(
    acceptDocumentsAction,
    initialActionState,
  );
  return (
    <form action={action} className="form-stack">
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="terms"
          required
          defaultChecked={accepted}
        />
        Li e aceito os{" "}
        <Link href="/termos" target="_blank">
          Termos de uso (abre outra aba)
        </Link>
        .
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="privacy"
          required
          defaultChecked={accepted}
        />
        Li a{" "}
        <Link href="/privacidade" target="_blank">
          Política de privacidade (abre outra aba)
        </Link>
        .
      </label>
      <button className="button button-secondary" disabled={pending}>
        {pending
          ? "Registrando…"
          : accepted
            ? "Aceite registrado"
            : "Registrar aceite"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function RegistrationPhoto({ hasPhoto }: { hasPhoto: boolean }) {
  const [state, action, pending] = useActionState(
    uploadPhotoAction,
    initialActionState,
  );
  const [removeState, removeAction, removing] = useActionState(
    removePhotoAction,
    initialActionState,
  );
  return (
    <>
      <form action={action} className="form-stack">
        <label htmlFor="photo">
          Foto profissional
          <input
            id="photo"
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            required
            aria-describedby="photo-help"
          />
        </label>
        <p id="photo-help" className="form-help">
          JPG, PNG ou WebP, até 2 MB. Armazenamento privado.
        </p>
        <button className="button button-secondary" disabled={pending}>
          {pending ? "Enviando…" : hasPhoto ? "Substituir foto" : "Salvar foto"}
        </button>
        <Feedback state={state} />
      </form>
      {hasPhoto ? (
        <form action={removeAction}>
          <button className="button button-secondary" disabled={removing}>
            Remover foto atual
          </button>
          <Feedback state={removeState} />
        </form>
      ) : null}
    </>
  );
}

export function RegistrationPhone({ enabled }: { enabled: boolean }) {
  const [sendState, sendAction, sending] = useActionState(
    sendPhoneCodeAction,
    initialActionState,
  );
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyPhoneCodeAction,
    initialActionState,
  );
  return enabled ? (
    <>
      <form action={sendAction}>
        <button className="button button-secondary" disabled={sending}>
          {sending ? "Enviando…" : "Enviar ou reenviar código SMS"}
        </button>
        <Feedback state={sendState} />
      </form>
      <form action={verifyAction} className="form-stack">
        <label htmlFor="code">
          Código recebido
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
          />
        </label>
        <button className="button button-secondary" disabled={verifying}>
          Confirmar telefone
        </button>
        <Feedback state={verifyState} />
      </form>
    </>
  ) : (
    <p className="form-help">
      Confirmação por SMS em espera até a configuração do provedor. Coletar o
      telefone não o confirma.
    </p>
  );
}

export function RegistrationEmail() {
  const [state, action, pending] = useActionState(
    changeEmailAction,
    initialActionState,
  );
  return (
    <details>
      <summary>Alterar e-mail da conta</summary>
      <form action={action} className="form-stack">
        <label htmlFor="newEmail">
          Novo e-mail
          <input
            id="newEmail"
            name="newEmail"
            type="email"
            autoComplete="email"
            required
          />
        </label>
        <button className="button button-secondary" disabled={pending}>
          Solicitar alteração do e-mail
        </button>
        <Feedback state={state} />
      </form>
    </details>
  );
}

export function RegistrationSubmit({
  revision,
  submitted,
}: {
  revision: number;
  submitted: boolean;
}) {
  const [state, action, pending] = useActionState(
    submitRegistrationAction,
    initialActionState,
  );
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="revision" value={revision} />
      <p>
        Revise os dados salvos antes de enviar. Mudanças de identidade, CRM ou
        RQE passam por nova verificação.
      </p>
      {submitted ? (
        <p role="status">
          Cadastro recebido. Aguarde a análise da equipe e acompanhe as decisões
          abaixo. CRM, RQE e autorização institucional são conferidos
          separadamente.
        </p>
      ) : null}
      <button className="button button-primary" disabled={pending || submitted}>
        {pending
          ? "Enviando…"
          : submitted
            ? "Enviado para verificação"
            : "Enviar para verificação"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
