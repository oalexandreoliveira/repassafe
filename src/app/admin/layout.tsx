import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminIdentity } from "@/lib/auth/session";
import { logoutAction } from "@/app/auth/actions";
import { AdminNavigation } from "@/components/admin-navigation";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdminIdentity();
  } catch {
    redirect("/mfa");
  }
  return (
    <div className="admin-shell">
      <a href="#admin-main" className="skip-link">
        Ir para o conteúdo
      </a>
      <header className="admin-header">
        <Link href="/admin" className="brand">
          <span aria-hidden="true">R</span> Repassafe{" "}
          <strong>Administração</strong>
        </Link>
        <div className="admin-header-actions">
          <Link href="/">Ver site</Link>
          <form action={logoutAction}>
            <button className="button button-secondary">Sair</button>
          </form>
        </div>
      </header>
      <div className="admin-body">
        <aside>
          <AdminNavigation />
          <p className="form-help">
            Acesso gerencial independente do cadastro profissional.
          </p>
        </aside>
        <div id="admin-main">{children}</div>
      </div>
    </div>
  );
}
