import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./info-tile.module.css";

/** Grade 2 colunas de dados do plantão (Data · Horário · Local · Duração). */
export function InfoTileGrid({
  label,
  children,
}: {
  /** Nome acessível da lista. */
  label: string;
  children: ReactNode;
}) {
  return (
    <ul className={styles.grid} aria-label={label}>
      {children}
    </ul>
  );
}

export function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <li className={styles.tile}>
      <span className={styles.icon}>
        <Icon size={20} />
      </span>
      <p className={styles.text}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
      </p>
    </li>
  );
}
