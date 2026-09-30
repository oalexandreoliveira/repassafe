import { AdminActionForm } from "@/components/admin-action-form";
import { redirect } from "next/navigation";
import { requireAdminIdentity } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
type Request = {
  id: string;
  contact_email: string;
  message: string;
  category: string;
  response: string | null;
  state: string;
};
export default async function AdminSupportPage() {
  try {
    await requireAdminIdentity();
  } catch {
    redirect("/mfa");
  }
  const { data, error } = await createAdminClient().rpc("support_list", {
    target_user: null,
  });
  if (error) throw new Error("Não foi possível carregar a fila.");
  return (
    <main className="admin-content">
      <h1>Solicitações de suporte</h1>
      <p>
        Responda pelo canal do titular. Pedidos sem conta exigem contato
        operacional pelo e-mail informado.
      </p>
      {data?.length ? (
        (data as Request[]).map((request) => (
          <section className="registration-section" key={request.id}>
            <h2>
              {request.category === "privacy" ? "Privacidade" : "Suporte"} —{" "}
              {request.state === "open" ? "Aberto" : "Respondido"}
            </h2>
            <p>Protocolo: {request.id}</p>
            <p>Contato: {request.contact_email}</p>
            <p>{request.message}</p>
            <AdminActionForm
              actionName="answerSupportAction"
              className="form-stack"
            >
              <input type="hidden" name="id" value={request.id} />
              <label>
                Resposta
                <textarea
                  name="response"
                  defaultValue={request.response ?? ""}
                  minLength={3}
                  maxLength={4000}
                  required
                />
              </label>
              <button className="button button-primary">
                Registrar resposta
              </button>
            </AdminActionForm>
          </section>
        ))
      ) : (
        <p>Nenhuma solicitação aberta.</p>
      )}
    </main>
  );
}
