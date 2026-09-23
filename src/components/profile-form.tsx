"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/auth/actions";
import { initialActionState } from "@/features/auth/schemas";

export function ProfileForm({
  profile,
}: {
  profile: { display_name: string; crm_number: string; crm_state: string };
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialActionState,
  );
  return (
    <form action={formAction} className="form-stack">
      <label>
        Nome profissional
        <input
          name="displayName"
          defaultValue={profile.display_name}
          required
        />
      </label>
      <div className="form-row">
        <label>
          CRM
          <input name="crmNumber" defaultValue={profile.crm_number} required />
        </label>
        <label>
          UF
          <input
            name="crmState"
            maxLength={2}
            defaultValue={profile.crm_state}
            required
          />
        </label>
      </div>
      <button className="button button-secondary" disabled={pending}>
        {pending ? "Salvando…" : "Atualizar perfil"}
      </button>
      {state.message ? <p role="status">{state.message}</p> : null}
    </form>
  );
}
