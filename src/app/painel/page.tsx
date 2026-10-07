import { redirect } from "next/navigation";
import Link from "next/link";
import {
  getAdministrativeAccess,
  getVerifiedIdentity,
} from "@/lib/auth/session";
import { logoutAction, markNotificationsReadAction } from "@/app/auth/actions";
import { groupRoleLabel, profileStatusLabel } from "@/features/admin/labels";

export default async function DashboardPage() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");
  const administrativeAccess = await getAdministrativeAccess(identity);

  const [{ data: profile }, { data: memberships }, { data: notifications }] =
    await Promise.all([
      identity.supabase
        .from("profiles")
        .select(
          "display_name,crm_number,crm_state,status,role,verification_notes,verification_valid_until",
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
  if (!profile || profile.role === "admin") {
    if (administrativeAccess)
      redirect(identity.claims.aal === "aal2" ? "/admin" : "/mfa");
    redirect("/cadastro/completar");
  }
  const canPublish =
    profile.role === "doctor" &&
    profile.status === "approved" &&
    !!profile.verification_valid_until &&
    // eslint-disable-next-line react-hooks/purity -- Server component checks validity once per authenticated request.
    Date.parse(profile.verification_valid_until) > Date.now();

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
          <h1>Olá, {profile.display_name}</h1>
        </div>
        <span className={`status status-${profile.status}`}>
          {profileStatusLabel[profile.status] ?? profile.status}
        </span>
      </section>
      {canPublish ? (
        <section className="workspace-start" aria-labelledby="start-title">
          <h2 id="start-title">Seu próximo repasse começa aqui</h2>
          <p>
            Publique um plantão, encontre uma oferta ou acompanhe seus acordos.
          </p>
          <nav className="actions" aria-label="Ações de plantão">
            <Link
              href="/plantoes/novo?modo=grupo"
              className="button button-primary"
            >
              Publicar plantão em grupo
            </Link>
            <Link
              href="/plantoes/novo?modo=livre"
              className="button button-secondary"
            >
              Publicar plantão livre
            </Link>
            <Link
              href="/acordos/registrados/novo"
              className="button button-secondary"
            >
              Registrar acordo
            </Link>
            <Link href="/plantoes" className="button button-secondary">
              Encontrar plantão
            </Link>
            <Link href="/historico" className="button button-secondary">
              Acompanhar repasses
            </Link>
          </nav>
        </section>
      ) : profile.status === "approved" && profile.role === "approver" ? (
        <section className="workspace-start">
          <h2>Acompanhe os repasses dos seus grupos</h2>
          <p>
            As decisões institucionais dependem do seu vínculo ativo como
            aprovador em cada grupo.
          </p>
          <Link href="/plantoes" className="button button-primary">
            Abrir central de repasses
          </Link>
        </section>
      ) : (
        <section className="workspace-start">
          <h2>
            {profile.status === "approved"
              ? "Atualize sua verificação profissional"
              : "Continue seu cadastro"}
          </h2>
          <p>
            Acompanhe a análise e confira as orientações da equipe antes de
            realizar repasses.
          </p>
          <Link href="/cadastro/completar" className="button button-primary">
            Acompanhar cadastro
          </Link>
        </section>
      )}
      {profile.role === "doctor" && (
        <section
          className="workspace-start"
          aria-label="Acordos combinados fora do app"
        >
          <h2>Acordos combinados fora do app</h2>
          <p>
            Confira convites e acompanhe os pagamentos. Para registrar um
            acordo, complete seu cadastro; a análise pode estar pendente.
          </p>
          <nav className="actions" aria-label="Registros de acordos">
            {!canPublish && (
              <Link
                className="button button-primary"
                href="/acordos/registrados/novo"
              >
                Registrar acordo
              </Link>
            )}
            <Link
              className="button button-secondary"
              href="/acordos/registrados"
            >
              Acordos registrados
            </Link>
          </nav>
        </section>
      )}
      {profile.role === "approver" && (
        <p>
          <Link href="/acordos/registrados">
            Aprovar acordos registrados dos meus grupos
          </Link>
        </p>
      )}
      {profile.verification_notes ? (
        <section className="card" aria-label="Orientação administrativa">
          <h2>Orientação da equipe</h2>
          <p>{profile.verification_notes}</p>
        </section>
      ) : null}
      <div className="dashboard-grid">
        <section className="card">
          <h2>Dados profissionais</h2>
          <p>
            {profile.display_name} — CRM {profile.crm_number ?? "Não informado"}
            /{profile.crm_state ?? "—"}
          </p>
          <Link className="button button-secondary" href="/cadastro/completar">
            Completar cadastro ou solicitar alteração
          </Link>
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
        <Link className="button button-secondary" href="/perfil">
          Meu perfil
        </Link>
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
      {administrativeAccess ? (
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
