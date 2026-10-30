"use client";
import { useActionState } from "react";
import Link from "next/link";
import { joinWaitlistAction } from "@/app/lista-de-espera/actions";
import { initialActionState } from "@/features/auth/schemas";
import { brazilianStates } from "@/features/registration/schemas";
import { waitlistInterests } from "@/features/marketing/waitlist";
import { CheckboxField, SelectField, TextField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import styles from "./waitlist-form.module.css";

export function WaitlistForm() {
  const [state, action] = useActionState(
    joinWaitlistAction,
    initialActionState,
  );
  const errors = state.fieldErrors ?? {};

  if (state.status === "success")
    return (
      <p role="status" className={`form-message form-message-success`}>
        {state.message}
      </p>
    );

  return (
    <form action={action} className={styles.form} noValidate>
      <TextField
        label="Nome completo"
        name="name"
        autoComplete="name"
        minLength={3}
        maxLength={120}
        required
        error={errors.name}
      />
      <TextField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        maxLength={254}
        required
        error={errors.email}
      />
      <SelectField
        label="O que você quer fazer"
        name="interest"
        defaultValue=""
        required
        error={errors.interest}
      >
        <option value="" disabled>
          Selecione
        </option>
        {waitlistInterests.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
      <div className={styles.row}>
        <TextField
          label="Especialidade (opcional)"
          name="specialty"
          maxLength={80}
          error={errors.specialty}
        />
        <SelectField
          label="UF de atuação (opcional)"
          name="state"
          defaultValue=""
          error={errors.state}
        >
          <option value="">Selecione</option>
          {brazilianStates.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </SelectField>
      </div>
      {/* Isca para robôs: fora da ordem de tabulação e oculto de leitores de tela. */}
      <div className={styles.trap} aria-hidden="true">
        <label>
          Não preencha este campo
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <CheckboxField
        name="consent"
        error={errors.consent}
        label={
          <>
            Concordo em ser contatado por e-mail sobre o piloto do Repassafe.
            Leia a <Link href="/privacidade">Política de Privacidade</Link>.
          </>
        }
      />
      <SubmitButton block pendingLabel="Enviando…">
        Entrar na lista de espera
      </SubmitButton>
      {state.status === "error" ? (
        <p role="alert" className="form-message form-message-error">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
