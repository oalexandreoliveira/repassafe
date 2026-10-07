import { Calendar, SearchX } from "lucide-react";
import {
  AppScreen,
  Fab,
  GroupLabel,
  RootTopBar,
  ScreenHeading,
} from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/field";
import { FilterChipLink, FilterChipList } from "@/components/ui/filter-chip";
import { InfoBanner } from "@/components/ui/info-banner";
import { ShiftCard } from "@/components/ui/shift-card";
import { TabBar } from "@/components/ui/tab-bar";
import {
  formatDayHeading,
  formatHourRangeShort,
  formatPublishedAgo,
  formatShortDate,
} from "@/features/shifts/format";
import {
  groupByDay,
  muralFilters,
  type MuralFilter,
} from "@/features/shifts/mural-filters";
import {
  offerGroupLabel,
  offerTitle,
  type OfferSummary,
} from "@/features/shifts/offer-view";
import type { StatusPresentation } from "@/features/shifts/presentation";
import styles from "./screens.module.css";

export type MuralItem = {
  offer: OfferSummary;
  status: StatusPresentation;
  isOwner: boolean;
};

function muralHref(filter: MuralFilter, query?: string) {
  const params = new URLSearchParams();
  if (filter !== "semana") params.set("filtro", filter);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/plantoes?${search}` : "/plantoes";
}

function subtitle(groupsCount: number) {
  if (groupsCount === 0) return "Ofertas livres para profissionais aprovados";
  if (groupsCount === 1) return "Publicados no seu grupo";
  return `Publicados nos seus ${groupsCount} grupos`;
}

/** S02 · Mural de plantões. */
export function ShiftMural({
  items,
  totalCount,
  groupsCount,
  unread,
  canPublish,
  filter,
  query,
  failed = false,
  feedback,
  now,
}: {
  /** Ofertas já filtradas, em ordem de início. */
  items: MuralItem[];
  /** Total antes do filtro, para distinguir "vazio" de "sem resultado". */
  totalCount: number;
  groupsCount: number;
  unread: boolean;
  canPublish: boolean;
  filter: MuralFilter;
  query?: string;
  failed?: boolean;
  /** Mensagem de retorno de uma ação que não pôde ser concluída. */
  feedback?: string;
  now: Date;
}) {
  return (
    <AppScreen
      header={<RootTopBar unread={unread} />}
      tabBar={<TabBar canPublish={canPublish} />}
      floating={
        canPublish ? <Fab href="/plantoes/novo">Publicar plantão</Fab> : null
      }
    >
      <ScreenHeading
        title="Plantões abertos"
        subtitle={subtitle(groupsCount)}
      />
      {feedback ? (
        <InfoBanner variant="warning" role="alert">
          {feedback}
        </InfoBanner>
      ) : null}
      <form role="search" method="get" action="/plantoes">
        {filter !== "semana" ? (
          <input type="hidden" name="filtro" value={filter} />
        ) : null}
        <SearchField
          label="Buscar setor ou hospital"
          name="q"
          defaultValue={query}
          placeholder="Buscar setor ou hospital"
        />
        <button type="submit" className="sr-only">
          Buscar
        </button>
      </form>
      <FilterChipList label="Filtrar plantões">
        {muralFilters.map((chip) => (
          <FilterChipLink
            key={chip.id}
            selected={filter === chip.id}
            href={muralHref(filter === chip.id ? "todos" : chip.id, query)}
          >
            {chip.label}
          </FilterChipLink>
        ))}
      </FilterChipList>

      {failed ? (
        <div className={styles.stack}>
          <InfoBanner variant="warning" role="alert">
            Não foi possível carregar os plantões. Verifique sua conexão e tente
            de novo.
          </InfoBanner>
          <ButtonLink href={muralHref(filter, query)} variant="secondary" block>
            Tentar de novo
          </ButtonLink>
        </div>
      ) : items.length ? (
        groupByDay(items, (item) => item.offer.startsAt).map((day) => (
          <div key={day[0].offer.startsAt} className={styles.dayGroup}>
            <GroupLabel>{formatDayHeading(day[0].offer.startsAt)}</GroupLabel>
            {day.map(({ offer, status, isOwner }) => {
              const first = offer.id === items[0].offer.id;
              const meta = [
                offer.publishedAt
                  ? formatPublishedAgo(offer.publishedAt, now)
                  : null,
                isOwner ? "Seu plantão" : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <ShiftCard
                  key={offer.id}
                  status={status}
                  group={offerGroupLabel(offer)}
                  title={offerTitle(offer)}
                  date={formatShortDate(offer.startsAt)}
                  time={formatHourRangeShort(offer.startsAt, offer.endsAt)}
                  meta={meta || undefined}
                  href={first ? undefined : `/plantoes/${offer.id}`}
                  action={
                    first ? (
                      <ButtonLink
                        href={`/plantoes/${offer.id}`}
                        size="sm"
                        block
                      >
                        Ver plantão
                      </ButtonLink>
                    ) : undefined
                  }
                />
              );
            })}
          </div>
        ))
      ) : totalCount === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhum plantão aberto nos seus grupos"
          action={
            canPublish ? (
              <ButtonLink href="/plantoes/novo" block>
                Publicar plantão
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <EmptyState
          icon={SearchX}
          title="Nenhum plantão neste filtro"
          action={
            <ButtonLink href={muralHref("todos")} variant="secondary" block>
              Ver todos os plantões
            </ButtonLink>
          }
        >
          Há plantões publicados fora desta busca ou deste filtro.
        </EmptyState>
      )}
    </AppScreen>
  );
}
