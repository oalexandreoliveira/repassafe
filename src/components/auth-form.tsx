"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction, signupAction } from "@/app/auth/actions";
import { initialActionState } from "@/features/auth/schemas";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialActionState,
  );

  return (
    <form action={formAction} className="form-stack">
      <label>
        {mode === "login" ? "E-mail ou celular confirmado" : "E-mail"}
        <input
          name="email"
          type={mode === "login" ? "text" : "email"}
          autoComplete="username"
          aria-invalid={!!state.fieldErrors?.email}
          aria-describedby={
            state.fieldErrors?.email ? "auth-email-error" : undefined
          }
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      {state.fieldErrors?.email ? (
        <p id="auth-email-error" className="field-error">
          {state.fieldErrors.email}
        </p>
      ) : null}
      {mode === "signup" ? (
        <>
          <label className="checkbox-label">
            <input name="terms" type="checkbox" required />
            Aceito os{" "}
            <Link href="/termos" target="_blank">
              Termos de uso
            </Link>
            .
          </label>
          <label className="checkbox-label">
            <input name="privacy" type="checkbox" required />
            Li a{" "}
            <Link href="/privacidade" target="_blank">
              Política de privacidade
            </Link>
            .
          </label>
        </>
      ) : (
        <p className="form-help">
          Telefone no formato +55DDDNúmero, após confirmação por SMS.
        </p>
      )}
      <label>
        Senha
        <input
          name="password"
          type="password"
          aria-invalid={!!state.fieldErrors?.password}
          aria-describedby={
            state.fieldErrors?.password ? "auth-password-error" : undefined
          }
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
      </label>
      <button className="button button-primary" disabled={pending}>
        {pending ? "Processando…" : mode === "login" ? "Entrar" : "Criar conta"}
      </button>
      {state.fieldErrors?.password ? (
        <p id="auth-password-error" className="field-error">
          {state.fieldErrors.password}
        </p>
      ) : null}
      {state.message ? (
        <p
          className={`form-message form-message-${state.status}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <p className="form-help">
        {mode === "login" ? "Ainda não possui acesso? " : "Já possui acesso? "}
        <Link href={mode === "login" ? "/cadastro" : "/entrar"}>
          {mode === "login" ? "Solicitar cadastro" : "Entrar"}
        </Link>
      </p>
      {mode === "login" ? (
        <p className="form-help">
          <Link href="/senha/esqueci">Esqueci minha senha</Link> ·{" "}
          <Link href="/confirmar-email">Reenviar confirmação do e-mail</Link>
        </p>
      ) : null}
    </form>
  );
}
