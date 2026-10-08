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
import { ActionFeedback } from "@/components/screens/auth-screen";
import styles from "@/components/screens/screens.module.css";
import { Button } from "@/components/ui/button";
import {
  CheckboxField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui/field";
import { InfoBanner } from "@/components/ui/info-banner";
import { initialActionState } from "@/features/auth/schemas";
import { brazilianStates } from "@/features/registration/schemas";

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
  const problem = (name: string) =>
    state.fieldErrors?.[name] || correctionFields[name] || undefined;
  const field = (
    name: string,
    label: string,
    type = "text",
    autoComplete?: string,
    help?: string,
  ) => (
    <TextField
      key={name}
      id={name}
      name={name}
      label={label}
      type={type}
      autoComplete={autoComplete}
      inputMode={
        name === "cpf" ? "numeric" : name === "phone" ? "tel" : undefined
      }
      maxLength={name === "cpf" ? 14 : name === "phone" ? 20 : undefined}
      value={values[name] ?? ""}
      onChange={(event) => change(name, event.target.value)}
      error={problem(name)}
      hint={problem(name) ? undefined : help}
    />
  );
  return (
    <form action={action} className={styles.form}>
      <input
        name="revision"
        type="hidden"
        value={Math.max(state.revision ?? 0, revision)}
      />
      <fieldset className={styles.formSection}>
        <legend>Identificação</legend>
        <p className={styles.help}>
          Dados civis ficam restritos a você e à equipe autorizada.
        </p>
        {field("civilName", "Nome civil completo", "text", "name")}
        {field("displayName", "Nome de apresentação")}
        {field(
          "cpf",
          "CPF",
          "text",
          "off",
          "Digite os 11 números, com ou sem pontuação. Ex.: 529.982.247-25.",
        )}
        {field("birthDate", "Nascimento", "date", "bday")}
        {field(
          "phone",
          "Celular com DDD",
          "tel",
          "tel",
          "Informe um celular brasileiro com DDD. Ex.: (11) 98765-4321 ou +55 11 98765-4321.",
        )}
      </fieldset>
      <fieldset className={styles.formSection}>
        <legend>Atuação profissional</legend>
        <SelectField
          id="practicesMedicine"
          name="practicesMedicine"
          label="Você atua como médico?"
          value={values.practicesMedicine ?? "yes"}
          onChange={(event) => change("practicesMedicine", event.target.value)}
          hint="A autorização de grupos é concedida pelo responsável. Selecionar esta opção não concede acesso."
        >
          <option value="yes">Sim, tenho CRM</option>
          <option value="no">Não, preciso de autorização institucional</option>
        </SelectField>
        <div className={styles.formGrid2}>
          {field("crmNumber", "CRM — para atuação médica")}
          <SelectField
            id="crmState"
            name="crmState"
            label="UF do CRM"
            value={values.crmState ?? ""}
            onChange={(event) => change("crmState", event.target.value)}
            error={problem("crmState")}
          >
            <option value="">Selecionar UF</option>
            {brazilianStates.map((uf) => (
              <option key={uf}>{uf}</option>
            ))}
          </SelectField>
        </div>
        <div className={styles.formGrid2}>
          {field("specialty", "Especialidade — opcional")}
          {field("rqe", "RQE — se aplicável")}
        </div>
        <p className={styles.help}>
          Especialidade e RQE serão conferidos separadamente do CRM.
        </p>
      </fieldset>
      <fieldset className={styles.formSection}>
        <legend>Vínculo declarado</legend>
        {field("institution", "Instituição — opcional")}
        {field("sector", "Setor — opcional")}
        <p className={styles.help}>
          Esta declaração não confirma vínculo, credenciamento ou permissão
          institucional.
        </p>
      </fieldset>
      {Object.keys(correctionFields).length ? (
        <TextAreaField
          id="response"
          name="response"
          label="Resposta às correções"
          maxLength={2000}
          value={values.response ?? ""}
          onChange={(event) => change("response", event.target.value)}
        />
      ) : (
        <input type="hidden" name="response" value={data.response ?? ""} />
      )}
      <ActionFeedback state={state} />
      <Button type="submit" block loading={pending}>
        Salvar progresso
      </Button>
    </form>
  );
}

export function RegistrationDocuments({ accepted }: { accepted: boolean }) {
  const [state, action, pending] = useActionState(
    acceptDocumentsAction,
    initialActionState,
  );
  return (
    <form action={action} className={styles.form}>
      <CheckboxField
        name="terms"
        required
        defaultChecked={accepted}
        label={
          <>
            Li e aceito os{" "}
            <Link href="/termos" target="_blank">
              Termos de uso (abre outra aba)
            </Link>
            .
          </>
        }
      />
      <CheckboxField
        name="privacy"
        required
        defaultChecked={accepted}
        label={
          <>
            Li a{" "}
            <Link href="/privacidade" target="_blank">
              Política de privacidade (abre outra aba)
            </Link>
            .
          </>
        }
      />
      <Button type="submit" variant="secondary" block loading={pending}>
        {accepted ? "Aceite registrado" : "Registrar aceite"}
      </Button>
      <ActionFeedback state={state} />
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
      <form action={action} className={styles.form}>
        <TextField
          id="photo"
          type="file"
          name="photo"
          label="Foto profissional"
          accept="image/jpeg,image/png,image/webp"
          required
          hint="JPG, PNG ou WebP, até 2 MB. Armazenamento privado."
        />
        <Button type="submit" variant="secondary" block loading={pending}>
          {hasPhoto ? "Substituir foto" : "Salvar foto"}
        </Button>
        <ActionFeedback state={state} />
      </form>
      {hasPhoto ? (
        <form action={removeAction} className={styles.form}>
          <Button type="submit" variant="ghost" block loading={removing}>
            Remover foto atual
          </Button>
          <ActionFeedback state={removeState} />
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
      <form action={sendAction} className={styles.form}>
        <Button type="submit" variant="secondary" block loading={sending}>
          Enviar ou reenviar código SMS
        </Button>
        <ActionFeedback state={sendState} />
      </form>
      <form action={verifyAction} className={styles.form}>
        <TextField
          id="code"
          name="code"
          label="Código recebido"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
        />
        <Button type="submit" variant="secondary" block loading={verifying}>
          Confirmar telefone
        </Button>
        <ActionFeedback state={verifyState} />
      </form>
    </>
  ) : (
    <InfoBanner variant="neutral">
      Confirmação por SMS em espera até a configuração do provedor. Coletar o
      telefone não o confirma.
    </InfoBanner>
  );
}

export function RegistrationEmail() {
  const [state, action, pending] = useActionState(
    changeEmailAction,
    initialActionState,
  );
  return (
    <details className={styles.disclosure}>
      <summary>Alterar e-mail da conta</summary>
      <form action={action} className={styles.disclosureBody}>
        <TextField
          id="newEmail"
          name="newEmail"
          type="email"
          label="Novo e-mail"
          autoComplete="email"
          required
        />
        <Button type="submit" variant="secondary" block loading={pending}>
          Solicitar alteração do e-mail
        </Button>
        <ActionFeedback state={state} />
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
    <form action={action} className={styles.form}>
      <input type="hidden" name="revision" value={revision} />
      <p className={styles.help}>
        Revise os dados salvos antes de enviar. Mudanças de identidade, CRM ou
        RQE passam por nova verificação.
      </p>
      {submitted ? (
        <InfoBanner role="status">
          Cadastro recebido. Aguarde a análise da equipe e acompanhe as decisões
          abaixo. CRM, RQE e autorização institucional são conferidos
          separadamente.
        </InfoBanner>
      ) : null}
      <Button type="submit" block loading={pending} disabled={submitted}>
        {submitted ? "Enviado para verificação" : "Enviar para verificação"}
      </Button>
      <ActionFeedback state={state} />
    </form>
  );
}
