"use client";
import { useActionState } from "react";
import { adminFeedbackAction } from "@/app/admin/feedback-actions";
// Keep existing server actions and their authorization checks as the source of truth.
export function AdminActionForm({
  actionName,
  children,
  className,
}: {
  actionName: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, submit, pending] = useActionState(
    adminFeedbackAction.bind(null, actionName),
    { status: "idle" as const, message: "" },
  );
  return (
    <form action={submit} className={className} aria-busy={pending}>
      <fieldset className="action-fields" disabled={pending}>
        {children}
      </fieldset>
      {pending ? <p role="status">Registrando alteração…</p> : null}
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
