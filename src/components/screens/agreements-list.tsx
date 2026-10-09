import { FileText } from "lucide-react";
import {
  AppScreen,
  RootTopBar,
  ScreenHeading,
} from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ShiftCard } from "@/components/ui/shift-card";
import { TabBar } from "@/components/ui/tab-bar";
import {
  formatHourRangeShort,
  formatShiftDay,
  formatShortDate,
} from "@/features/shifts/format";
import styles from "./screens.module.css";

export type AgreementListItem = {
  id: string;
  offerId: string;
  role: "owner" | "substitute" | "coordination";
  confirmedAt: string;
  sector: string;
  startsAt: string;
  endsAt: string;
  groupName?: string;
  hasDocument: boolean;
};

const roleText: Record<AgreementListItem["role"], string> = {
  owner: "Você repassou",
  substitute: "Você assumiu",
  coordination: "Acompanhado pela coordenação",
};

/** Repasses confirmados a partir de ofertas; acordos externos têm fluxo próprio. */
export function AgreementsList({
  agreements,
  unread,
  canPublish,
}: {
  agreements: AgreementListItem[];
  unread: boolean;
  canPublish: boolean;
}) {
  return (
    <AppScreen
      header={<RootTopBar unread={unread} />}
      tabBar={<TabBar canPublish={canPublish} />}
    >
      <ScreenHeading
        title="Repasses confirmados"
        subtitle="Ofertas publicadas no Repassafe que tiveram a substituição confirmada"
      />
      <section className={styles.panel} aria-labelledby="external-heading">
        <h2 id="external-heading" className={styles.panelTitle}>
          Acordos combinados fora do app
        </h2>
        <p className={styles.panelText}>
          {canPublish
            ? "Registre um repasse combinado em outro canal e acompanhe o pagamento."
            : "Aprove os acordos registrados pelos médicos dos seus grupos."}
        </p>
        {canPublish ? (
          <ButtonLink href="/acordos/registrados/novo" block>
            Registrar acordo
          </ButtonLink>
        ) : null}
        <ButtonLink href="/acordos/registrados" variant="secondary" block>
          {canPublish
            ? "Acordos registrados e pagamentos"
            : "Aprovar acordos registrados dos meus grupos"}
        </ButtonLink>
      </section>
      <h2 className={styles.sectionTitle}>Confirmados a partir de ofertas</h2>
      {agreements.length ? (
        <ul className={styles.list}>
          {agreements.map((agreement) => (
            <li key={agreement.id}>
              <ShiftCard
                status={{ tone: "confirmed", label: "Repasse confirmado" }}
                group={agreement.groupName ?? "Oferta livre"}
                title={agreement.sector}
                date={formatShiftDay(agreement.startsAt)}
                time={formatHourRangeShort(
                  agreement.startsAt,
                  agreement.endsAt,
                )}
                meta={`${roleText[agreement.role]} · confirmado em ${formatShortDate(agreement.confirmedAt)}`}
                href={
                  agreement.hasDocument
                    ? `/acordos/${agreement.id}`
                    : `/plantoes/${agreement.offerId}`
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={FileText} title="Nenhum repasse confirmado">
          Depois da seleção e dos aceites necessários, o repasse da oferta
          aparece aqui.
        </EmptyState>
      )}
    </AppScreen>
  );
}
