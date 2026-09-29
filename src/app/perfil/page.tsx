import Link from "next/link";
import { redirect } from "next/navigation";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { groupRoleLabel, profileStatusLabel } from "@/features/admin/labels";

export default async function ProfilePage() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    identity.supabase
      .from("profiles")
      .select(
        "display_name,crm_number,crm_state,status,role,verification_notes",
      )
      .eq("id", identity.userId)
      .maybeSingle(),
    identity.supabase
      .from("group_memberships")
      .select("role,groups(name)")
      .eq("profile_id", identity.userId)
      .eq("active", true),
  ]);

  if (!profile) redirect("/entrar");

  return (
    <main className="shell dashboard">
      <header className="dashboard-header">
        <Link href="/painel" className="brand">
          <span aria-hidden="true">R</span> Repassafe
        </Link>
        <nav className="actions" aria-label="Navegação do perfil">
          <Link className="button button-secondary" href="/painel">
            Painel
          </Link>
          <Link className="button button-secondary" href="/historico">
            Meu histórico
          </Link>
        </nav>
      </header>

      <section className="dashboard-title">
        <div>
          <p className="eyebrow">Minha conta</p>
          <h1>Meu perfil</h1>
          <p>Seus dados profissionais, situação cadastral e vínculos.</p>
        </div>
        <span className={`status status-${profile.status}`}>
          {profileStatusLabel[profile.status] ?? profile.status}
        </span>
      </section>

      {profile.verification_notes ? (
        <section className="card" aria-labelledby="profile-guidance-heading">
          <h2 id="profile-guidance-heading">Orientação da equipe</h2>
          <p>{profile.verification_notes}</p>
        </section>
      ) : null}

      <div className="dashboard-grid">
        <section className="card" aria-labelledby="professional-data-heading">
          <h2 id="professional-data-heading">Dados profissionais</h2>
          <dl className="facts">
            <div>
              <dt>Nome profissional</dt>
              <dd>{profile.display_name}</dd>
            </div>
            <div>
              <dt>CRM</dt>
              <dd>
                {profile.crm_number} / {profile.crm_state}
              </dd>
            </div>
            <div>
              <dt>Tipo de acesso</dt>
              <dd>
                {profile.role === "admin" ? "Administrador" : "Profissional"}
              </dd>
            </div>
          </dl>
          <Link className="button button-secondary" href="/painel">
            Gerenciar cadastro
          </Link>
        </section>

        <section className="card" aria-labelledby="groups-heading">
          <h2 id="groups-heading">Grupos ativos</h2>
          {memberships?.length ? (
            <ul className="clean-list">
              {memberships.map((membership, index) => {
                const group = Array.isArray(membership.groups)
                  ? membership.groups[0]
                  : membership.groups;
                return (
                  <li key={`${group?.name ?? "group"}-${index}`}>
                    <strong>{group?.name ?? "Grupo"}</strong>
                    <span>
                      {groupRoleLabel[membership.role] ?? membership.role}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>Você não possui vínculos ativos com grupos.</p>
          )}
        </section>
      </div>

      <section
        className="card admin-section"
        aria-labelledby="profile-hub-links"
      >
        <h2 id="profile-hub-links">Acesse suas informações</h2>
        <nav className="actions" aria-label="Informações da conta">
          <Link className="button button-secondary" href="/historico">
            Meu histórico
          </Link>
          <Link className="button button-secondary" href="/notificacoes">
            Notificações
          </Link>
          {profile.status === "approved" ? (
            <Link className="button button-primary" href="/plantoes">
              Central de repasses
            </Link>
          ) : null}
        </nav>
      </section>
    </main>
  );
}
