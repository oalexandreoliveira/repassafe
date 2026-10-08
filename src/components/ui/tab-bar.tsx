"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, FileText, Plus, User } from "lucide-react";
import styles from "./app-shell.module.css";

export type TabId = "plantoes" | "publicar" | "acordos" | "perfil";

const tabs = [
  { id: "plantoes", label: "Plantões", href: "/plantoes", icon: Calendar },
  {
    id: "publicar",
    label: "Publicar",
    href: "/plantoes/publicados",
    icon: Plus,
  },
  { id: "acordos", label: "Acordos", href: "/acordos", icon: FileText },
  { id: "perfil", label: "Perfil", href: "/perfil", icon: User },
] as const;

/** Aba correspondente à rota atual (sub-rotas herdam a aba de origem). */
export function activeTab(pathname: string): TabId | null {
  if (/^\/plantoes\/(publicados|novo)(\/|$)/.test(pathname)) return "publicar";
  if (/^\/plantoes(\/|$)/.test(pathname)) return "plantoes";
  if (/^\/acordos(\/|$)/.test(pathname)) return "acordos";
  if (/^\/(perfil|historico|grupos)(\/|$)/.test(pathname)) return "perfil";
  return null;
}

export function TabBar({
  canPublish = true,
  placement = "fixed",
  active,
}: {
  /** Aprovadores sem atuação médica não veem "Publicar". */
  canPublish?: boolean;
  /** "static" apenas para o catálogo de componentes. */
  placement?: "fixed" | "static";
  /** Força a aba ativa (catálogo); por padrão vem da rota. */
  active?: TabId | null;
}) {
  const pathname = usePathname();
  const current = active !== undefined ? active : activeTab(pathname ?? "");
  return (
    <nav
      aria-label="Navegação principal"
      className={`${styles.tabBar} ${placement === "static" ? styles.tabBarStatic : ""}`}
    >
      <ul className={styles.tabs}>
        {tabs
          .filter((tab) => canPublish || tab.id !== "publicar")
          .map(({ id, label, href, icon: Icon }) => (
            <li key={id}>
              <Link
                href={href}
                className={styles.tab}
                aria-current={current === id ? "page" : undefined}
              >
                <Icon size={22} />
                {label}
              </Link>
            </li>
          ))}
      </ul>
    </nav>
  );
}
