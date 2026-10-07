import Link from "next/link";
import "./style.css";
export default function RegisteredAgreementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="shell registration-shell external-agreement">
      <header className="dashboard-header">
        <Link href="/painel" className="brand">
          <span aria-hidden="true">R</span> Repassafe
        </Link>
        <nav className="actions" aria-label="Navegação de acordos">
          <Link href="/acordos/registrados">Meus registros</Link>
          <Link href="/painel">Painel</Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
