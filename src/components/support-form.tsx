"use client";
import { useActionState, useState } from "react";
import { createSupportAction } from "@/app/suporte/actions";
import { initialActionState } from "@/features/auth/schemas";
export function SupportForm({ email }: { email?: string }) {
  const [contact, setContact] = useState(email ?? "");
  const [message, setMessage] = useState("");
  const [state, action, pending] = useActionState(
    createSupportAction,
    initialActionState,
  );
  return (
    <form action={action} className="form-stack">
      <label htmlFor="support-email">
        E-mail para contato
        <input
          id="support-email"
          type="email"
          name="email"
          autoComplete="email"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          aria-invalid={!!state.fieldErrors?.email}
          aria-describedby={
            state.fieldErrors?.email ? "support-email-error" : undefined
          }
          required
        />
      </label>
      {state.fieldErrors?.email ? (
        <p id="support-email-error" className="field-error">
          {state.fieldErrors.email}
        </p>
      ) : null}
      <label htmlFor="category">
        Assunto
        <select id="category" name="category">
          <option value="support">Suporte do cadastro ou dos repasses</option>
          <option value="privacy">
            Privacidade e direitos sobre meus dados
          </option>
        </select>
      </label>
      <label htmlFor="message">
        Sua solicitação
        <textarea
          id="message"
          name="message"
          minLength={10}
          maxLength={4000}
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={!!state.fieldErrors?.message}
          aria-describedby={
            state.fieldErrors?.message
              ? "message-help support-message-error"
              : "message-help"
          }
        />
      </label>
      {state.fieldErrors?.message ? (
        <p id="support-message-error" className="field-error">
          {state.fieldErrors.message}
        </p>
      ) : null}
      <p id="message-help" className="form-help">
        Não inclua senha, códigos, dados de pacientes ou documentos neste campo.
      </p>
      <button className="button button-primary" disabled={pending}>
        {pending ? "Registrando…" : "Abrir solicitação"}
      </button>
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`form-message form-message-${state.status}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
