import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Bell,
  Calendar,
  Check,
  CircleAlert,
  CircleCheck,
  CircleX,
  ClipboardCheck,
  FileText,
  UserMinus,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { AppScreen, TopBar } from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  NotificationItem,
  type NotificationTone,
} from "@/components/ui/notification-item";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatNotificationTime } from "@/features/shifts/format";
import type { FormAction } from "./command-fields";
import styles from "./screens.module.css";

export type NotificationRow = {
  id: string;
  event_type: string;
  title: string;
  body: string;
  href: string;
  created_at: string;
  read_at: string | null;
};

type Presentation = {
  tone: NotificationTone;
  icon: LucideIcon;
  cta?: string;
  /** Sub-rota do plantão para onde o CTA leva (ex.: S09). */
  ctaPath?: string;
};

/** Leva o CTA para a etapa certa quando o link aponta para um plantão. */
export function ctaHref(href: string, ctaPath?: string) {
  return ctaPath && /^\/plantoes\/[^/?#]+$/.test(href)
    ? `${href}/${ctaPath}`
    : href;
}

/** Apresentação por tipo de evento (o texto vem do domínio e não muda). */
export function notificationPresentation(eventType: string): Presentation {
  switch (eventType) {
    case "substitution.selected":
      return {
        tone: "action",
        icon: Check,
        cta: "Confirmar condições",
        ctaPath: "condicoes",
      };
    case "approval.pending":
      return { tone: "action", icon: ClipboardCheck };
    case "completion.pending":
      return { tone: "action", icon: CircleCheck };
    case "offer.published":
      return { tone: "info", icon: Calendar };
    case "application.created":
      return { tone: "info", icon: Users };
    case "substitution.approved":
      return { tone: "info", icon: BadgeCheck };
    case "completion.confirmed":
      return { tone: "info", icon: CircleCheck };
    case "substitution.confirmed":
      return { tone: "history", icon: FileText };
    case "substitution.cancelled":
    case "substitution.rejected":
    case "substitution.declined":
    case "substitution.confirmation_expired":
    case "substitution.withdrawn_by_substitute":
      return { tone: "history", icon: CircleX };
    case "occurrence.opened":
    case "occurrence.reviewed":
    case "completion.disputed":
      return { tone: "history", icon: CircleAlert };
    case "registration.reviewed":
    case "profile.reviewed":
      return { tone: "history", icon: UserRound };
    case "group.member_joined":
      return { tone: "info", icon: UserPlus };
    case "group.manager_transferred":
      return { tone: "action", icon: Users, cta: "Abrir grupo" };
    case "group.member_removed":
      return { tone: "history", icon: UserMinus };
    default:
      return { tone: "history", icon: Bell };
  }
}

/** S11 · Notificações. */
export function NotificationsList({
  notifications,
  onlyUnread,
  hasUnread,
  markAllRead,
  now,
}: {
  notifications: NotificationRow[];
  onlyUnread: boolean;
  hasUnread: boolean;
  markAllRead: FormAction;
  now: Date;
}) {
  return (
    <AppScreen header={<TopBar title="Notificações" backHref="/plantoes" />}>
      <SegmentedControl
        label="Filtrar notificações"
        segments={[
          { label: "Todas", href: "/notificacoes", active: !onlyUnread },
          {
            label: "Não lidas",
            href: "/notificacoes?status=unread",
            active: onlyUnread,
          },
        ]}
      />
      {notifications.length ? (
        <ul className={styles.list}>
          {notifications.map((notification) => {
            const { tone, icon, cta, ctaPath } = notificationPresentation(
              notification.event_type,
            );
            return (
              <li key={notification.id}>
                <NotificationItem
                  tone={tone}
                  icon={icon}
                  title={notification.title}
                  body={notification.body}
                  time={formatNotificationTime(notification.created_at, now)}
                  dateTime={notification.created_at}
                  href={notification.href}
                  unread={!notification.read_at}
                  action={
                    cta ? (
                      <ButtonLink
                        href={ctaHref(notification.href, ctaPath)}
                        size="sm"
                        block
                      >
                        {cta}
                      </ButtonLink>
                    ) : undefined
                  }
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={Bell} title="Nenhuma notificação">
          Novas atualizações do seu fluxo aparecerão aqui.
        </EmptyState>
      )}
      {hasUnread ? (
        <form action={markAllRead}>
          <SubmitButton variant="ghost" block>
            Marcar todas como lidas
          </SubmitButton>
        </form>
      ) : null}
      <p className={styles.help}>
        Exibimos as 100 notificações mais recentes. O estado do repasse no
        aplicativo continua sendo a fonte oficial.
      </p>
    </AppScreen>
  );
}
