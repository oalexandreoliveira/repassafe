import { Calendar, FileText, Hourglass } from "lucide-react";
import {
  AppScreen,
  RootTopBar,
  ScreenHeading,
} from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ShareButton } from "@/components/ui/share-button";
import { ShiftCard } from "@/components/ui/shift-card";
import { TabBar } from "@/components/ui/tab-bar";
import { Toast } from "@/components/ui/toast";
import {
  formatHourRangeShort,
  formatPublishedAgo,
  formatShiftDay,
} from "@/features/shifts/format";
import { ownOfferTabs, type OwnOfferTab } from "@/features/shifts/my-offers";
import {
  offerGroupLabel,
  offerTitle,
  type OfferSummary,
} from "@/features/shifts/offer-view";
import type { StatusPresentation } from "@/features/shifts/presentation";
import styles from "./screens.module.css";

export type OwnOfferItem = {
  offer: OfferSummary;
  status: StatusPresentation;
  activeApplications: number;
  agreementId?: string;
};

const empty: Record<OwnOfferTab, { title: string; icon: typeof Calendar }> = {
  abertos: { title: "Nenhum plantão aberto", icon: Calendar },
  andamento: { title: "Nenhum repasse em andamento", icon: Hourglass },
  registrados: { title: "Nenhum repasse confirmado", icon: FileText },
};

function action(tab: OwnOfferTab, item: OwnOfferItem) {
  const { offer } = item;
  if (tab === "abertos")
    return item.activeApplications > 0 ? (
      <ButtonLink href={`/plantoes/${offer.id}/candidaturas`} size="sm" block>
        Ver candidaturas
      </ButtonLink>
    ) : (
      <ShareButton
        path={`/plantoes/${offer.id}`}
        title="Plantão disponível no Repassafe"
        text={`${offerTitle(offer)} · ${formatShiftDay(offer.startsAt)}, ${formatHourRangeShort(offer.startsAt, offer.endsAt)}`}
      />
    );
  if (tab === "registrados" && item.agreementId)
    return (
      <ButtonLink
        href={`/acordos/${item.agreementId}`}
        variant="secondary"
        size="sm"
        block
      >
        Ver comprovante do repasse
      </ButtonLink>
    );
  return (
    <ButtonLink
      href={`/plantoes/${offer.id}`}
      variant="secondary"
      size="sm"
      block
    >
      Ver plantão
    </ButtonLink>
  );
}

/** S07 · Meus plantões publicados. */
export function MyPublished({
  tab,
  items,
  counts,
  unread,
  published,
  canPublish,
  now,
}: {
  tab: OwnOfferTab;
  /** Itens da aba atual. */
  items: OwnOfferItem[];
  counts: Record<OwnOfferTab, number>;
  unread: boolean;
  /** Mostra o aviso "Plantão publicado". */
  published: boolean;
  canPublish: boolean;
  now: Date;
}) {
  const { title, icon } = empty[tab];
  return (
    <AppScreen
      header={<RootTopBar unread={unread} />}
      tabBar={<TabBar canPublish={canPublish} />}
    >
      <ScreenHeading title="Meus plantões publicados" />
      <SegmentedControl
        label="Situação dos plantões publicados"
        segments={ownOfferTabs.map((segment) => ({
          label: segment.label,
          href: `/plantoes/publicados?aba=${segment.id}`,
          count: segment.id === "registrados" ? undefined : counts[segment.id],
          active: segment.id === tab,
        }))}
      />
      {items.length ? (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.offer.id}>
              <ShiftCard
                status={item.status}
                group={offerGroupLabel(item.offer)}
                title={offerTitle(item.offer)}
                date={formatShiftDay(item.offer.startsAt)}
                time={formatHourRangeShort(
                  item.offer.startsAt,
                  item.offer.endsAt,
                )}
                meta={
                  item.offer.publishedAt
                    ? formatPublishedAgo(item.offer.publishedAt, now)
                    : undefined
                }
                action={action(tab, item)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={icon}
          title={title}
          action={
            tab === "abertos" && canPublish ? (
              <ButtonLink href="/plantoes/novo" block>
                Publicar plantão
              </ButtonLink>
            ) : undefined
          }
        />
      )}
      {tab === "abertos" &&
      items.some((item) => item.activeApplications === 0) ? (
        <p className={styles.tip}>
          Sem candidaturas? Divulgue o link no grupo do WhatsApp.
        </p>
      ) : null}
      {published ? (
        <Toast message="Plantão publicado" clearParam="publicado" />
      ) : null}
    </AppScreen>
  );
}
