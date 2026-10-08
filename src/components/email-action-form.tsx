"use client";

import { useActionState } from "react";
import {
  requestPasswordResetAction,
  resendConfirmationAction,
  updatePasswordAction,
} from "@/app/auth/actions";
import { ActionFeedback } from "@/components/screens/auth-screen";
import styles from "@/components/screens/screens.module.css";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
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
    <form action={formAction} className={styles.form}>
      <TextField
        label="E-mail"
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />
      <ActionFeedback state={state} />
      <Button type="submit" block loading={pending}>
        {mode === "recovery" ? "Enviar instruções" : "Reenviar confirmação"}
      </Button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initialActionState,
  );
  return (
    <form action={formAction} className={styles.form}>
      <TextField
        label="Nova senha"
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint="Use pelo menos 8 caracteres."
        error={state.fieldErrors?.password}
      />
      <TextField
        label="Confirme a nova senha"
        id="passwordConfirmation"
        name="passwordConfirmation"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        error={state.fieldErrors?.passwordConfirmation}
      />
      <ActionFeedback state={state} />
      <Button type="submit" block loading={pending}>
        Atualizar senha
      </Button>
    </form>
  );
}
