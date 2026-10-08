import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./registry.module.css";

/** Cartão branco com título e conteúdo de registro (ex.: "Registro do acordo"). */
export function RegistryCard({
  title,
  badge,
  children,
}: {
  title: string;
  /** Normalmente o StatusChip "Imutável". */
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.card} aria-label={title}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

/** Dados imutáveis em JetBrains Mono: ACORDO {id} · registrado {data hora} · sha256 {hash}. */
export function RegistryBlock({ lines }: { lines: ReactNode[] }) {
  return (
    <p className={styles.block}>
      {lines.map((line, index) => (
        <span key={index}>{line}</span>
      ))}
    </p>
  );
}

export type AuditEvent = {
  label: string;
  /** Texto exibido: "10/10 09:12". */
  time: string;
  /** ISO 8601 para o elemento <time>. */
  dateTime: string;
};

export function AuditTrail({
  title = "Trilha de auditoria",
  events,
}: {
  title?: string;
  events: AuditEvent[];
}) {
  return (
    <RegistryCard title={title}>
      <ol className={styles.trail}>
        {events.map((event) => (
          <li key={`${event.label}-${event.dateTime}`} className={styles.event}>
            <span className={styles.eventLabel}>{event.label}</span>
            <time className={styles.eventTime} dateTime={event.dateTime}>
              {event.time}
            </time>
          </li>
        ))}
      </ol>
    </RegistryCard>
  );
}

/** Selo de acordo registrado (cartão Tinta). */
export function RegistrySeal({
  title,
  detail,
}: {
  title: string;
  /** Linha Mono: "RPS-[ID] · sha256 [HASH] · [DATA E HORA]". */
  detail: ReactNode;
}) {
  return (
    <div className={styles.seal}>
      <span className={styles.sealIcon}>
        <ShieldCheck size={26} />
      </span>
      <p className={styles.sealText}>
        <span className={styles.sealTitle}>{title}</span>
        <span className={styles.sealDetail}>{detail}</span>
      </p>
    </div>
  );
}
