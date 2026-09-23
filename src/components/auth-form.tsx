"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, signupAction } from "@/app/auth/actions";
import { initialActionState } from "@/features/auth/schemas";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialActionState,
  );

  return (
    <form action={formAction} className="form-stack">
      {mode === "signup" ? (
        <>
          <label>
            Nome profissional
            <input name="displayName" autoComplete="name" required />
          </label>
          <div className="form-row">
            <label>
              CRM
              <input name="crmNumber" inputMode="numeric" required />
            </label>
            <label>
              UF
              <input name="crmState" maxLength={2} required />
            </label>
          </div>
        </>
      ) : null}
      <label>
        E-mail
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Senha
        <input
          name="password"
          type="password"
          minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
      </label>
      <button className="button button-primary" disabled={pending}>
        {pending ? "Processando…" : mode === "login" ? "Entrar" : "Criar conta"}
      </button>
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
    </form>
  );
}
