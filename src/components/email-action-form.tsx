"use client";

import { useActionState } from "react";
import {
  requestPasswordResetAction,
  resendConfirmationAction,
  updatePasswordAction,
} from "@/app/auth/actions";
import { initialActionState } from "@/features/auth/schemas";

export function EmailActionForm({
  mode,
}: {
  mode: "recovery" | "confirmation";
}) {
  const action =
    mode === "recovery" ? requestPasswordResetAction : resendConfirmationAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialActionState,
  );
  return (
    <form action={formAction} className="form-stack">
      <label>
        E-mail
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={!!state.fieldErrors?.email}
          aria-describedby={
            state.fieldErrors?.email ? "email-error" : undefined
          }
        />
      </label>
      {state.fieldErrors?.email ? (
        <p id="email-error" className="field-error">
          {state.fieldErrors.email}
        </p>
      ) : null}
      <button className="button button-primary" disabled={pending}>
        {pending
          ? "Enviando…"
          : mode === "recovery"
            ? "Enviar instruções"
            : "Reenviar confirmação"}
      </button>
      {state.message ? (
        <p
          className={`form-message form-message-${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initialActionState,
  );
  return (
    <form action={formAction} className="form-stack">
      <label>
        Nova senha
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={!!state.fieldErrors?.password}
          aria-describedby={
            state.fieldErrors?.password ? "password-error" : undefined
          }
        />
      </label>
      {state.fieldErrors?.password ? (
        <p id="password-error" className="field-error">
          {state.fieldErrors.password}
        </p>
      ) : null}
      <label>
        Confirme a nova senha
        <input
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          aria-invalid={!!state.fieldErrors?.passwordConfirmation}
          aria-describedby={
            state.fieldErrors?.passwordConfirmation
              ? "confirmation-error"
              : undefined
          }
        />
      </label>
      {state.fieldErrors?.passwordConfirmation ? (
        <p id="confirmation-error" className="field-error">
          {state.fieldErrors.passwordConfirmation}
        </p>
      ) : null}
      <button className="button button-primary" disabled={pending}>
        {pending ? "Salvando…" : "Atualizar senha"}
      </button>
      {state.message ? (
        <p
          className={`form-message form-message-${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
