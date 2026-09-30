"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const sections = [
  ["/admin/cadastros", "Fila de cadastros"],
  ["/admin/pessoas", "Pessoas"],
  ["/admin/instituicoes", "Instituições e grupos"],
  ["/admin/operacao", "Operação"],
  ["/admin/ocorrencias", "Ocorrências"],
  ["/admin/suporte", "Suporte e privacidade"],
  ["/admin/auditoria", "Auditoria"],
] as const;
export function AdminNavigation() {
  const pathname = usePathname();
  return (
    <nav className="admin-navigation" aria-label="Áreas da administração">
      {sections.map(([href, label]) => (
        <Link
          href={href}
          key={href}
          aria-current={pathname === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
