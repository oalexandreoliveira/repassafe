import Link from "next/link";
import styles from "./segmented-control.module.css";

export type Segment = {
  label: string;
  href: string;
  /** Quantidade exibida após o rótulo ("Abertos 2"). */
  count?: number;
  active?: boolean;
};

/** Alterna entre vistas da mesma tela por URL (ex.: Abertos · Andamento · Registrados). */
export function SegmentedControl({
  label,
  segments,
}: {
  /** Nome acessível da navegação. */
  label: string;
  segments: Segment[];
}) {
  return (
    <nav aria-label={label}>
      <ul className={styles.track}>
        {segments.map((segment) => (
          <li key={segment.href}>
            <Link
              href={segment.href}
              scroll={false}
              aria-current={segment.active ? "page" : undefined}
              className={`${styles.item} ${segment.active ? styles.active : ""}`}
            >
              {segment.label}
              {segment.count !== undefined ? ` ${segment.count}` : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
