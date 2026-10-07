import Link from "next/link";
import { Bell, ChevronLeft, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton, IconLink } from "@/components/ui/icon-button";
import { Logo } from "@/components/ui/logo";
import styles from "./app-shell.module.css";

/**
 * Estrutura de tela do app: top bar, conteúdo com rolagem, rodapé fixo com a
 * ação primária e, nas telas raiz, tab bar e FAB.
 */
export function AppScreen({
  header,
  footer,
  tabBar,
  floating,
  children,
}: {
  header?: ReactNode;
  /** Ação primária de largura total (fica fixa na base da tela). */
  footer?: ReactNode;
  tabBar?: ReactNode;
  /** FAB das telas raiz. */
  floating?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`${styles.screen} ${tabBar ? styles.withTabBar : ""}`}>
      {header}
      <main id="conteudo" className={styles.content}>
        {children}
      </main>
      {footer ? <div className={styles.footer}>{footer}</div> : null}
      {floating}
      {tabBar}
    </div>
  );
}

/** Top bar com voltar (44×44, círculo branco) e título Sora 22. */
export function TopBar({
  title,
  backLabel = "Voltar",
  ...back
}: {
  title: string;
  backLabel?: string;
} & (
  | { backHref: string; onBack?: never }
  /** Voltar dentro da mesma tela (ex.: etapa anterior de um formulário). */
  | { onBack: () => void; backHref?: never }
)) {
  return (
    <header className={styles.topBar}>
      {back.backHref !== undefined ? (
        <IconLink
          href={back.backHref}
          label={backLabel}
          icon={<ChevronLeft size={20} />}
        />
      ) : (
        <IconButton
          label={backLabel}
          icon={<ChevronLeft size={20} />}
          onClick={back.onBack}
        />
      )}
      <h1 className={styles.topTitle}>{title}</h1>
    </header>
  );
}

/** Top bar das telas raiz: logo + sino com badge quando há não lidas. */
export function RootTopBar({
  unread = false,
  notificationsHref = "/notificacoes",
}: {
  unread?: boolean;
  notificationsHref?: string;
}) {
  return (
    <header className={`${styles.topBar} ${styles.rootBar}`}>
      <Logo priority />
      <IconLink
        href={notificationsHref}
        label={unread ? "Notificações, há novas" : "Notificações"}
        icon={<Bell size={20} />}
        badge={unread}
      />
    </header>
  );
}

/** Barra com o logo (link para o início) e ações opcionais à direita. */
export function BrandTopBar({
  href = "/",
  children,
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <header className={`${styles.topBar} ${styles.rootBar}`}>
      <Link href={href} className={styles.brandLink}>
        <Logo priority />
      </Link>
      {children ? <nav className={styles.brandNav}>{children}</nav> : null}
    </header>
  );
}

/** Título de tela raiz (Sora 26) com linha de apoio. */
export function ScreenHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: ReactNode;
}) {
  return (
    <div className={styles.heading}>
      <h1 className={styles.headingTitle}>{title}</h1>
      {subtitle ? <p className={styles.headingSubtitle}>{subtitle}</p> : null}
    </div>
  );
}

/** Rótulo de agrupamento em Mono maiúsculo (ex.: "SÁBADO, 12 OUT"). */
export function GroupLabel({ children }: { children: string }) {
  return <h2 className={styles.groupLabel}>{children}</h2>;
}

/** Botão flutuante "Publicar plantão", 20px acima da tab bar. */
export function Fab({
  href,
  children,
  placement = "fixed",
}: {
  href: string;
  children: string;
  /** "static" apenas para o catálogo de componentes. */
  placement?: "fixed" | "static";
}) {
  return (
    <Link
      href={href}
      className={`${styles.fab} ${placement === "static" ? styles.fabStatic : ""}`}
    >
      <Plus size={20} strokeWidth={2.4} />
      {children}
    </Link>
  );
}
