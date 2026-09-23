import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdminIdentity } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createGroupAction,
  createInstitutionAction,
  reviewProfileAction,
  upsertMembershipAction,
} from "@/app/admin/actions";

export default async function AdminPage() {
  try {
    await requireAdminIdentity();
  } catch {
    redirect("/painel");
  }

  const admin = createAdminClient();
  const [{ data: profiles }, { data: institutions }, { data: groups }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id,display_name,contact_email,crm_number,crm_state,status")
        .order("created_at"),
      admin
        .from("institutions")
        .select("id,name")
        .eq("active", true)
        .order("name"),
      admin
        .from("groups")
        .select("id,name,institution_id,requires_approval")
        .eq("active", true)
        .order("name"),
    ]);

  return (
    <main className="shell dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Administração protegida por MFA</p>
          <h1>Operação do piloto</h1>
        </div>
        <Link href="/painel" className="button button-secondary">
          Voltar ao painel
        </Link>
      </header>

      <section className="admin-section">
        <h2>Verificação profissional</h2>
        <div className="admin-list">
          {profiles?.map((profile) => (
            <article className="card" key={profile.id}>
              <h3>{profile.display_name}</h3>
              <p>
                CRM {profile.crm_number}/{profile.crm_state} ·{" "}
                {profile.contact_email}
              </p>
              <p className={`status status-${profile.status}`}>
                {profile.status}
              </p>
              <form
                action={reviewProfileAction}
                className="form-stack compact-form"
              >
                <input type="hidden" name="profileId" value={profile.id} />
                <label>
                  Decisão
                  <select name="status" defaultValue="approved">
                    <option value="approved">Aprovar</option>
                    <option value="changes_requested">
                      Solicitar correção
                    </option>
                    <option value="rejected">Rejeitar</option>
                    <option value="suspended">Suspender</option>
                  </select>
                </label>
                <label>
                  Observação administrativa
                  <textarea name="notes" maxLength={500} />
                </label>
                <button className="button button-primary">
                  Registrar decisão
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-grid admin-section">
        <div className="card">
          <h2>Nova instituição</h2>
          <form action={createInstitutionAction} className="form-stack">
            <label>
              Nome
              <input name="name" required />
            </label>
            <button className="button button-primary">Criar instituição</button>
          </form>
        </div>
        <div className="card">
          <h2>Novo grupo</h2>
          <form action={createGroupAction} className="form-stack">
            <label>
              Instituição
              <select name="institutionId" required>
                {institutions?.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nome do grupo
              <input name="name" required />
            </label>
            <label>
              Aprovação institucional
              <select name="requiresApproval" defaultValue="true">
                <option value="true">Obrigatória</option>
                <option value="false">Dispensada</option>
              </select>
            </label>
            <button className="button button-primary">Criar grupo</button>
          </form>
        </div>
      </section>

      <section className="card admin-section">
        <h2>Vincular profissional</h2>
        <form action={upsertMembershipAction} className="form-grid">
          <label>
            Profissional
            <select name="profileId" required>
              {profiles
                ?.filter((profile) => profile.status === "approved")
                .map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.display_name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Grupo
            <select name="groupId" required>
              {groups?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Papel
            <select name="role" defaultValue="doctor">
              <option value="doctor">Médico</option>
              <option value="approver">Aprovador</option>
            </select>
          </label>
          <button className="button button-primary">Ativar vínculo</button>
        </form>
      </section>
    </main>
  );
}
