import type { ReactNode } from "react";
import styles from "./key-value-list.module.css";

export type KeyValueItem = {
  label: string;
  value: ReactNode;
  /** Valor longo abaixo do rótulo (ex.: Responsabilidade). */
  stacked?: boolean;
};

export function KeyValueList({ items }: { items: KeyValueItem[] }) {
  return (
    <dl className={styles.list}>
      {items.map((item) => (
        <div
          key={item.label}
          className={`${styles.row} ${item.stacked ? styles.stacked : ""}`}
        >
          <dt className={styles.key}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
