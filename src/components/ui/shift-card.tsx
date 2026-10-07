import Link from "next/link";
import { Calendar, Clock, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { StatusPresentation } from "@/features/shifts/presentation";
import { StatusChip } from "@/components/ui/status-chip";
import styles from "./shift-card.module.css";

export function ShiftCard({
  status,
  group,
  title,
  date,
  time,
  meta,
  action,
  href,
  selected = false,
  headingLevel = "h3",
}: {
  status: StatusPresentation;
  /** Nome do grupo (ou "Oferta livre"). */
  group?: string;
  /** "Setor · Hospital" */
  title: string;
  /** "Sáb, 12/10" ou "12/10" */
  date: string;
  /** "19h – 07h" */
  time: string;
  /** Linha de apoio: "Publicado há 20 min · 2 candidaturas". */
  meta?: ReactNode;
  /** Ação opcional (Button 44). */
  action?: ReactNode;
  /** Torna o cartão inteiro tocável. */
  href?: string;
  selected?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <article className={`${styles.card} ${selected ? styles.selected : ""}`}>
      <div className={styles.top}>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
        {group ? (
          <span className={styles.group}>
            <Users size={14} />
            {group}
          </span>
        ) : null}
      </div>
      <Heading className={styles.title}>
        {href ? (
          <Link href={href} className={styles.link}>
            {title}
          </Link>
        ) : (
          title
        )}
      </Heading>
      <p className={styles.when}>
        <span>
          <Calendar size={16} />
          {date}
        </span>
        <span>
          <Clock size={16} />
          {time}
        </span>
      </p>
      {meta ? <p className={styles.meta}>{meta}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </article>
  );
}

/** Placeholder de carregamento com a mesma geometria do cartão. */
export function ShiftCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <span className={styles.skeleton} style={{ width: 72, height: 26 }} />
      <span className={styles.skeleton} style={{ width: "70%", height: 20 }} />
      <span className={styles.skeleton} style={{ width: "50%", height: 18 }} />
      <span className={styles.skeleton} style={{ width: "60%", height: 16 }} />
    </div>
  );
}
