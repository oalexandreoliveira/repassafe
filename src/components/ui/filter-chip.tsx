import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./filter-chip.module.css";

/** Lista de filtros com rolagem horizontal. */
export function FilterChipList({
  label,
  children,
}: {
  /** Nome do grupo de filtros para leitores de tela. */
  label: string;
  children: ReactNode;
}) {
  return (
    <ul className={styles.list} aria-label={label}>
      {children}
    </ul>
  );
}

const className = (selected?: boolean) =>
  `${styles.chip} ${selected ? styles.selected : ""}`.trim();

/** Filtro que alterna estado na própria tela. */
export function FilterChip({
  selected = false,
  children,
  type = "button",
  ...props
}: { selected?: boolean; children: string } & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
>) {
  return (
    <li>
      <button
        type={type}
        aria-pressed={selected}
        className={className(selected)}
        {...props}
      >
        {children}
      </button>
    </li>
  );
}

/** Filtro que navega (por exemplo, por parâmetro de busca). */
export function FilterChipLink({
  selected = false,
  href,
  children,
}: {
  selected?: boolean;
  href: string;
  children: string;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={selected ? "true" : undefined}
        className={className(selected)}
        scroll={false}
      >
        {children}
      </Link>
    </li>
  );
}
