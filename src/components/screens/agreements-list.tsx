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

/** Aba Acordos (derivada): acordos registrados em que a pessoa participa. */
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
        title="Acordos"
        subtitle="Repasses registrados, com data, hora e trilha de auditoria"
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
      {agreements.length ? (
        <ul className={styles.list}>
          {agreements.map((agreement) => (
            <li key={agreement.id}>
              <ShiftCard
                status={{ tone: "registered", label: "Acordo registrado" }}
                group={agreement.groupName ?? "Oferta livre"}
                title={agreement.sector}
                date={formatShiftDay(agreement.startsAt)}
                time={formatHourRangeShort(
                  agreement.startsAt,
                  agreement.endsAt,
                )}
                meta={`${roleText[agreement.role]} · registrado em ${formatShortDate(agreement.confirmedAt)}`}
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
        <EmptyState icon={FileText} title="Nenhum acordo registrado">
          Quando um repasse for confirmado, o acordo aparece aqui.
        </EmptyState>
      )}
    </AppScreen>
  );
}
