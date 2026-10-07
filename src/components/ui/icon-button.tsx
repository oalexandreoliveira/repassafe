import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./icon-button.module.css";

type Common = {
  /** Nome acessível obrigatório (o botão só tem ícone). */
  label: string;
  /** Ícone de 20px. */
  icon: ReactNode;
  /** Ponto âmbar de novidade; o rótulo deve mencionar o estado. */
  badge?: boolean;
  className?: string;
};

function Inner({ icon, badge }: Pick<Common, "icon" | "badge">) {
  return (
    <>
      {icon}
      {badge ? <span className={styles.badge} aria-hidden="true" /> : null}
    </>
  );
}

export function IconButton({
  label,
  icon,
  badge,
  className = "",
  type = "button",
  ...props
}: Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`${styles.iconButton} ${className}`.trim()}
      {...props}
    >
      <Inner icon={icon} badge={badge} />
    </button>
  );
}

export function IconLink({
  label,
  icon,
  badge,
  className = "",
  href,
}: Common & { href: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`${styles.iconButton} ${className}`.trim()}
    >
      <Inner icon={icon} badge={badge} />
    </Link>
  );
}
