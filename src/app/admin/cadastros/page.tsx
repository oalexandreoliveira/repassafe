import Link from "next/link";
import { redirect } from "next/navigation";
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
const reviewGroups = [
  {
    title: "Identificação e contato",
    keys: ["civilName", "displayName", "cpf", "birthDate", "phone"],
  },
  {
    title: "Atuação profissional",
    keys: ["practicesMedicine", "crmNumber", "crmState", "specialty", "rqe"],
  },
  { title: "Vínculo declarado", keys: ["institution", "sector"] },
  { title: "Resposta às correções", keys: ["response"] },
];
function RegistrationReviewData({ data }: { data: Record<string, string> }) {
  const knownKeys = new Set(reviewGroups.flatMap((group) => group.keys));
  const otherKeys = Object.keys(data)
    .filter((key) => !knownKeys.has(key))
    .sort();
  const groups = [
    ...reviewGroups,
    { title: "Outras informações", keys: otherKeys },
  ];
  return (
    <div className="registration-review-data">
      {groups.map((group) => {
        const fields = group.keys.filter((key) => Object.hasOwn(data, key));
        return fields.length ? (
          <section className="registration-data-group" key={group.title}>
            <h3>{group.title}</h3>
            <dl>
              {fields.map((key) => (
                <div key={key}>
                  <dt>
                    {registrationFieldLabels[key] ??
                      `Informação cadastral: ${key}`}
                  </dt>
                  <dd>{registrationValueLabel(key, data[key])}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null;
      })}
    </div>
  );
}
export default async function RegistrationQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; q?: string; page?: string }>;
}) {
  try {
    await requireAdminIdentity();
  } catch {
    redirect("/mfa");
  }
  const { state = "submitted", q = "", page = "1" } = await searchParams;
  const { data, error } = await createAdminClient().rpc("registration_queue");
  if (error) throw new Error("Não foi possível carregar a fila de cadastro.");
  const drafts = (data as Draft[]).filter(
    (draft) =>
      (state === "all" || draft.state === state) &&
      `${draft.civil_name} ${draft.data.crmNumber ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(q.trim().slice(0, 80).toLocaleLowerCase("pt-BR")),
  );
  const pages = Math.max(1, Math.ceil(drafts.length / 15));
  const currentPage = Math.min(pages, Math.max(1, Number.parseInt(page) || 1));
  const pageHref = (value: number) =>
    `/admin/cadastros?${new URLSearchParams({ state, q, page: String(value) })}`;
  return (
    <main className="admin-content">
      <h1>Verificação de cadastros</h1>
      <p>
        Analise a versão enviada pelo titular. Abra um cadastro para consultar
        os dados e registrar a decisão.
      </p>
      <form className="admin-filters">
        <label>
          Buscar por nome ou CRM
          <input name="q" type="search" defaultValue={q} maxLength={80} />
        </label>
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
      <p className="form-help">
        {drafts.length} cadastro(s) · Página {currentPage} de {pages}
      </p>
      {drafts.length ? (
        drafts.slice((currentPage - 1) * 15, currentPage * 15).map((draft) => (
          <details className="admin-record" key={draft.user_id}>
            <summary>
              <h2>{draft.civil_name || "Identificação em preenchimento"}</h2>
              <p>
                Versão {draft.revision} · {registrationStateLabels[draft.state]}
              </p>
            </summary>
            <div className="record-detail">
              <RegistrationReviewData data={draft.data} />
              <h3 className="decision-heading">Registrar decisão</h3>
              {draft.state !== "incomplete" ? (
                <RegistrationDecisionForm
                  userId={draft.user_id}
                  revision={draft.revision}
                  data={draft.data}
                />
              ) : (
                <p>Este cadastro ainda não foi enviado pelo titular.</p>
              )}
            </div>
          </details>
        ))
      ) : (
        <p>Nenhum cadastro nesta etapa.</p>
      )}
      {pages > 1 ? (
        <nav className="actions" aria-label="Páginas de cadastros">
          {currentPage > 1 ? (
            <Link
              href={pageHref(currentPage - 1)}
              className="button button-secondary"
            >
              Anterior
            </Link>
          ) : null}
          {currentPage < pages ? (
            <Link
              href={pageHref(currentPage + 1)}
              className="button button-secondary"
            >
              Próxima
            </Link>
          ) : null}
        </nav>
      ) : null}
    </main>
  );
}
