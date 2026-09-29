import Link from "next/link";
import { requireAdminIdentity } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { RegistrationDecisionForm } from "@/components/registration-decision-form";
import {
  registrationFieldLabels,
  registrationStateLabels,
  registrationValueLabel,
} from "@/features/registration/labels";
type Draft = {
  user_id: string;
  state: string;
  revision: number;
  civil_name: string;
  data: Record<string, string>;
  correction_fields: Record<string, string>;
  photo_path: string | null;
};
export default async function RegistrationQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  await requireAdminIdentity();
  const { state = "submitted" } = await searchParams;
  const { data, error } = await createAdminClient().rpc("registration_queue");
  if (error) throw new Error("Não foi possível carregar a fila de cadastro.");
  const drafts = (data as Draft[]).filter(
    (draft) => state === "all" || draft.state === state,
  );
  return (
    <main className="shell legal-document">
      <Link href="/admin">Administração</Link>
      <h1>Verificação de cadastros</h1>
      <form className="form-stack">
        <label htmlFor="queue-state">
          Mostrar
          <select id="queue-state" name="state" defaultValue={state}>
            <option value="submitted">Aguardando análise</option>
            <option value="changes_requested">Correções solicitadas</option>
            <option value="incomplete">Em preenchimento</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Não aprovados</option>
            <option value="all">Todos</option>
          </select>
        </label>
        <button className="button button-secondary">Filtrar fila</button>
      </form>
      {drafts.length ? (
        drafts.map((draft) => (
          <section className="registration-section" key={draft.user_id}>
            <h2>{draft.civil_name || "Identificação em preenchimento"}</h2>
            <p>
              Versão {draft.revision} · {registrationStateLabels[draft.state]}
            </p>
            <dl>
              {Object.entries(draft.data).map(([key, value]) => (
                <div key={key}>
                  <dt>
                    {registrationFieldLabels[key] ?? "Informação cadastral"}
                  </dt>
                  <dd>{registrationValueLabel(key, value)}</dd>
                </div>
              ))}
            </dl>
            {draft.state !== "incomplete" ? (
              <RegistrationDecisionForm
                userId={draft.user_id}
                revision={draft.revision}
                data={draft.data}
              />
            ) : (
              <p>Este cadastro ainda não foi enviado pelo titular.</p>
            )}
          </section>
        ))
      ) : (
        <p>Nenhum cadastro nesta etapa.</p>
      )}
    </main>
  );
}
