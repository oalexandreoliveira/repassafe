"use client";
import { useActionState, useState } from "react";
import { reviewRegistrationAction } from "@/app/admin/cadastros/actions";
import { initialActionState } from "@/features/auth/schemas";
import { registrationFieldLabels } from "@/features/registration/labels";
export function RegistrationDecisionForm({
  userId,
  revision,
  data,
}: {
  userId: string;
  revision: number;
  data: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>({
    decision: "changes_requested",
    crmNumber: data.crmNumber ?? "",
    crmState: data.crmState ?? "",
    outcome: "unconfirmed",
    source: "",
    rqeSource: "",
    correctionField: "",
    correctionReason: "",
    internalNotes: "",
  });
  const [state, action, pending] = useActionState(
    reviewRegistrationAction,
    initialActionState,
  );
  const change = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  const input = (name: string, label: string, textarea = false) => (
    <div className="form-field">
      <label htmlFor={`${userId}-${name}`}>{label}</label>
      {textarea ? (
        <textarea
          id={`${userId}-${name}`}
          name={name}
          value={values[name]}
          maxLength={name === "internalNotes" ? 4000 : 1000}
          onChange={(event) => change(name, event.target.value)}
        />
      ) : (
        <input
          id={`${userId}-${name}`}
          name={name}
          value={values[name]}
          maxLength={name === "crmState" ? 2 : 300}
          onChange={(event) => change(name, event.target.value)}
        />
      )}
      <span className="field-error">{state.fieldErrors?.[name]}</span>
    </div>
  );
  return (
    <form action={action} className="form-stack">
      <input name="userId" type="hidden" value={userId} />
      <input name="revision" type="hidden" value={revision} />
      <label>
        Decisão
        <select
          name="decision"
          value={values.decision}
          onChange={(event) => change("decision", event.target.value)}
        >
          <option value="changes_requested">Solicitar correção</option>
          <option value="approved">Aprovar</option>
          <option value="rejected">Rejeitar</option>
          <option value="suspended">Suspender</option>
        </select>
      </label>
      <div className="form-row">
        {input("crmNumber", "CRM conferido")}
        {input("crmState", "UF conferida")}
      </div>
      <label>
        Situação profissional observada
        <select
          name="outcome"
          value={values.outcome}
          onChange={(event) => change("outcome", event.target.value)}
        >
          <option value="unconfirmed">Não confirmado</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </select>
      </label>
      {input("source", "Fonte da consulta CRM")}
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="rqeVerified"
          checked={values.rqeVerified === "on"}
          onChange={(event) =>
            change("rqeVerified", event.target.checked ? "on" : "")
          }
        />
        RQE conferido separadamente
      </label>
      {input("rqeSource", "Fonte e evidência específica do RQE")}
      <label>
        Campo a corrigir
        <select
          name="correctionField"
          value={values.correctionField}
          onChange={(event) => change("correctionField", event.target.value)}
        >
          <option value="">Selecionar</option>
          {Object.entries(registrationFieldLabels)
            .filter(
              ([key]) => key !== "response" && key !== "practicesMedicine",
            )
            .map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
        </select>
      </label>
      {input("correctionReason", "Orientação visível ao titular", true)}
      {input(
        "internalNotes",
        "Notas internas — não serão exibidas ao titular",
        true,
      )}
      <button className="button button-primary" disabled={pending}>
        {pending ? "Registrando decisão…" : "Registrar decisão nesta versão"}
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
