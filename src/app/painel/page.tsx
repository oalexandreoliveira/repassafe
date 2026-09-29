import { redirect } from "next/navigation";
import Link from "next/link";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { logoutAction, markNotificationsReadAction } from "@/app/auth/actions";
import { ProfileForm } from "@/components/profile-form";
import { groupRoleLabel, profileStatusLabel } from "@/features/admin/labels";

export default async function DashboardPage() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");

  const [{ data: profile }, { data: memberships }, { data: notifications }] =
    await Promise.all([
      identity.supabase
        .from("profiles")
        .select(
          "display_name,crm_number,crm_state,status,role,verification_notes",
        )
        .eq("id", identity.userId)
        .single(),
      identity.supabase
        .from("group_memberships")
        .select("role,groups(name,requires_approval)")
        .eq("profile_id", identity.userId)
        .eq("active", true),
      identity.supabase
        .from("notifications")
        .select("id,event_type,title,body,href,created_at,read_at")
        .order("created_at", { ascending: false })
        .limit(20),
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
      {profile.verification_notes ? (
        <section className="card" aria-label="Orientação administrativa">
          <h2>Orientação da equipe</h2>
          <p>{profile.verification_notes}</p>
        </section>
      ) : null}
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
              Nenhum vínculo ativo. Você ainda pode publicar ofertas livres e
              candidatar-se a elas após a aprovação do cadastro.
            </p>
          )}
        </section>
      </div>
      <nav className="actions" aria-label="Área do profissional">
        <Link className="button button-secondary" href="/historico">
          Meu histórico
        </Link>
        <Link className="button button-secondary" href="/notificacoes">
          Central de notificações
        </Link>
      </nav>
      {notifications?.length ? (
        <section
          className="card admin-section"
          aria-labelledby="notifications-heading"
        >
          <div className="section-heading">
            <h2 id="notifications-heading">Notificações</h2>
            <Link href="/notificacoes">Ver central completa</Link>
            {notifications.some((notification) => !notification.read_at) ? (
              <form action={markNotificationsReadAction}>
                <button className="button button-secondary" type="submit">
                  Marcar como lidas
                </button>
              </form>
            ) : null}
          </div>
          <ul className="clean-list">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <Link href={notification.href}>
                  <strong>{notification.title}</strong>
                  <span>{notification.body}</span>
                </Link>
                <small>
                  {new Date(notification.created_at).toLocaleString("pt-BR")}
                  {notification.read_at ? " · Lida" : " · Não lida"}
                </small>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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
