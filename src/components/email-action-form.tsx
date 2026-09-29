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
        <input name="email" type="email" autoComplete="email" required />
      </label>
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
          role="status"
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
        />
      </label>
      <label>
        Confirme a nova senha
        <input
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <button className="button button-primary" disabled={pending}>
        {pending ? "Salvando…" : "Atualizar senha"}
      </button>
      {state.message ? (
        <p
          className={`form-message form-message-${state.status}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
