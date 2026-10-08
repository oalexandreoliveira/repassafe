import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./notification-item.module.css";

/** action = ação requerida (âmbar), info = novidade (Névoa), history = histórico. */
export type NotificationTone = "action" | "info" | "history";

export function NotificationItem({
  tone,
  icon: Icon,
  title,
  body,
  time,
  dateTime,
  href,
  action,
  unread = false,
}: {
  tone: NotificationTone;
  icon: LucideIcon;
  title: string;
  body?: ReactNode;
  /** "agora", "2 min", "ontem". */
  time: string;
  dateTime: string;
  /** Torna o item inteiro tocável quando não há CTA. */
  href?: string;
  /** CTA opcional (Button 44). */
  action?: ReactNode;
  unread?: boolean;
}) {
  return (
    <article className={`${styles.item} ${styles[tone]}`}>
      <span className={styles.tile}>
        <Icon size={20} />
      </span>
      <div className={styles.body}>
        <h2 className={styles.title}>
          {unread ? <span className="sr-only">Não lida: </span> : null}
          {href && !action ? (
            <Link href={href} className={styles.link}>
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
        {body ? <p className={styles.text}>{body}</p> : null}
        {action ? <div className={styles.cta}>{action}</div> : null}
      </div>
      <time className={styles.time} dateTime={dateTime}>
        {time}
      </time>
    </article>
  );
}
