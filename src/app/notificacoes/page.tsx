import Link from "next/link";
import { redirect } from "next/navigation";
import { markNotificationsReadAction } from "@/app/auth/actions";
import { getVerifiedIdentity } from "@/lib/auth/session";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");
  const { status } = await searchParams;
  let query = identity.supabase
    .from("notifications")
    .select("id,event_type,title,body,href,created_at,read_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status === "unread") query = query.is("read_at", null);
  const { data: notifications } = await query;
  const hasUnread = notifications?.some(
    (notification) => !notification.read_at,
  );

  return (
    <main className="shell dashboard">
      <header className="dashboard-header">
        <Link href="/painel" className="brand">
          <span aria-hidden="true">R</span> Repassafe
        </Link>
        <Link href="/historico" className="button button-secondary">
          Meu histórico
        </Link>
      </header>
      <section className="dashboard-title">
        <div>
          <p className="eyebrow">Comunicação do piloto</p>
          <h1>Notificações</h1>
        </div>
        {hasUnread ? (
          <form action={markNotificationsReadAction}>
            <button className="button button-primary" type="submit">
              Marcar todas como lidas
            </button>
          </form>
        ) : null}
      </section>
      <nav className="actions" aria-label="Filtrar notificações">
        <Link className="button button-secondary" href="/notificacoes">
          Todas
        </Link>
        <Link
          className="button button-secondary"
          href="/notificacoes?status=unread"
        >
          Não lidas
        </Link>
      </nav>
      {notifications?.length ? (
        <ul className="clean-list notification-list">
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
      ) : (
        <section className="card empty-state">
          <h2>Nenhuma notificação</h2>
          <p>Novas atualizações do seu fluxo aparecerão aqui.</p>
        </section>
      )}
      <p className="form-help">
        Exibimos as 100 notificações mais recentes. O estado do repasse no
        aplicativo continua sendo a fonte oficial.
      </p>
    </main>
  );
}
