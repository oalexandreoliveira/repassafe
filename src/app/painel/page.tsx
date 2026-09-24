import { redirect } from "next/navigation";
import Link from "next/link";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { logoutAction } from "@/app/auth/actions";
import { ProfileForm } from "@/components/profile-form";
import { groupRoleLabel, profileStatusLabel } from "@/features/admin/labels";

export default async function DashboardPage() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    identity.supabase
      .from("profiles")
      .select("display_name,crm_number,crm_state,status,role")
      .eq("id", identity.userId)
      .single(),
    identity.supabase
      .from("group_memberships")
      .select("role,groups(name,requires_approval)")
      .eq("profile_id", identity.userId)
      .eq("active", true),
  ]);
  if (!profile) redirect("/entrar");

  return (
    <main className="shell dashboard">
      <header className="dashboard-header">
        <Link href="/" className="brand">
          <span aria-hidden="true">R</span> Repassafe
        </Link>
        <form action={logoutAction}>
          <button className="button button-secondary">Sair</button>
        </form>
      </header>
      <section className="dashboard-title">
        <div>
          <p className="eyebrow">Área do profissional</p>
          <h1>Olá, {profile.display_name}</h1>
        </div>
        <span className={`status status-${profile.status}`}>
          {profileStatusLabel[profile.status] ?? profile.status}
        </span>
      </section>
      <div className="dashboard-grid">
        <section className="card">
          <h2>Dados profissionais</h2>
          <ProfileForm
            profile={{
              display_name: profile.display_name,
              crm_number: profile.crm_number ?? "",
              crm_state: profile.crm_state ?? "",
            }}
          />
        </section>
        <section className="card">
          <h2>Grupos ativos</h2>
          {memberships?.length ? (
            <ul className="clean-list">
              {memberships.map((membership, index) => {
                const group = Array.isArray(membership.groups)
                  ? membership.groups[0]
                  : membership.groups;
                return (
                  <li key={index}>
                    <strong>{group?.name ?? "Grupo"}</strong>
                    <span>
                      {groupRoleLabel[membership.role] ?? membership.role}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>
              Nenhum vínculo ativo. A equipe administrativa fará a liberação.
            </p>
          )}
        </section>
      </div>
      {profile.role === "admin" ? (
        <Link
          className="button button-primary inline-action"
          href={identity.claims.aal === "aal2" ? "/admin" : "/mfa"}
        >
          {identity.claims.aal === "aal2"
            ? "Abrir administração"
            : "Configurar MFA administrativo"}
        </Link>
      ) : null}
      {profile.status === "approved" ? (
        <Link className="button button-primary inline-action" href="/plantoes">
          Abrir central de repasses
        </Link>
      ) : null}
    </main>
  );
}
