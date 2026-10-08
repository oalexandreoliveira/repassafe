"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction, signupAction } from "@/app/auth/actions";
import { ActionFeedback } from "@/components/screens/auth-screen";
import styles from "@/components/screens/screens.module.css";
import { Button, ButtonLink } from "@/components/ui/button";
import { CheckboxField, TextField } from "@/components/ui/field";
import { initialActionState } from "@/features/auth/schemas";

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "signup";
  /** Destino após o login (apenas convite de grupo, validado no servidor). */
  next?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialActionState,
  );

  return (
    <form action={formAction} className={styles.form}>
      {mode === "login" && next ? (
        <input type="hidden" name="next" value={next} />
      ) : null}
      <TextField
        label={mode === "login" ? "E-mail ou celular confirmado" : "E-mail"}
        id="auth-email"
        name="email"
        type={mode === "login" ? "text" : "email"}
        autoComplete="username"
        hint={
          mode === "login"
            ? "Telefone no formato +55DDDNúmero, após confirmação por SMS."
            : undefined
        }
        error={state.fieldErrors?.email}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <TextField
        label="Senha"
        id="auth-password"
        name="password"
        type="password"
        error={state.fieldErrors?.password}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        minLength={8}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        required
      />
      {mode === "signup" ? (
        <>
          <CheckboxField
            name="terms"
            required
            label={
              <>
                Aceito os{" "}
                <Link href="/termos" target="_blank">
                  Termos de uso
                </Link>
                .
              </>
            }
          />
          <CheckboxField
            name="privacy"
            required
            label={
              <>
                Li a{" "}
                <Link href="/privacidade" target="_blank">
                  Política de privacidade
                </Link>
                .
              </>
            }
          />
        </>
      ) : null}
      <ActionFeedback state={state} />
      <Button type="submit" block loading={pending}>
        {mode === "login" ? "Entrar" : "Criar conta"}
      </Button>
      <p className={styles.inlineLinks}>
        {mode === "login" ? "Ainda não possui acesso? " : "Já possui acesso? "}
        <Link href={mode === "login" ? "/cadastro" : "/entrar"}>
          {mode === "login" ? "Criar conta" : "Entrar"}
        </Link>
      </p>
      {mode === "login" ? (
        <ul className={styles.links}>
          <li>
            <ButtonLink href="/senha/esqueci" variant="ghost" size="sm" block>
              Esqueci minha senha
            </ButtonLink>
          </li>
          <li>
            <ButtonLink href="/confirmar-email" variant="ghost" size="sm" block>
              Reenviar confirmação do e-mail
            </ButtonLink>
          </li>
        </ul>
      ) : null}
    </form>
  );
}
