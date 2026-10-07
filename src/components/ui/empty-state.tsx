import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./empty-state.module.css";

/** Estado vazio ou de conclusão (ex.: "Candidatura enviada"). */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  headingLevel = "h2",
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  /** CTA primário. */
  action?: ReactNode;
  /** h1 quando o estado ocupa a tela inteira. */
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;
  return (
    <section className={styles.empty}>
      <span className={styles.tile}>
        <Icon size={48} />
      </span>
      <Heading className={styles.title}>{title}</Heading>
      {children ? <p className={styles.text}>{children}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </section>
  );
}
