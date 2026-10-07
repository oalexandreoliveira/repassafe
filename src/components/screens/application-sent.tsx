import { Check } from "lucide-react";
import { AppScreen } from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { EmptyState } from "@/components/ui/empty-state";
import { StepList, type Step } from "@/components/ui/progress";
import { formatHourRangeShort, formatShiftDay } from "@/features/shifts/format";
import type { OfferSummary } from "@/features/shifts/offer-view";
import { CommandFields, type FormAction } from "./command-fields";
import styles from "./screens.module.css";

export function applicationSteps(offer: OfferSummary): Step[] {
  return [
    {
      title: "Candidatura enviada",
      description: `${offer.sector} · ${formatShiftDay(offer.startsAt)}, ${formatHourRangeShort(offer.startsAt, offer.endsAt)}`,
      state: "done",
    },
    {
      title: "Escolha de quem publicou",
      description: "Você recebe um aviso quando houver resposta",
      state: "current",
    },
    {
      title: "Confirmação das condições",
      description: "Os dois aceitam os mesmos termos",
      state: "upcoming",
    },
    ...(offer.requiresApproval
      ? [
          {
            title: "Aprovação da coordenação",
            description: "Exigida pelo grupo",
            state: "upcoming" as const,
          },
        ]
      : []),
    {
      title: "Acordo registrado",
      description: "Com data, hora e trilha de auditoria",
      state: "upcoming",
    },
  ];
}

/** S04 · Candidatura enviada. */
export function ApplicationSent({
  offer,
  applicationId,
  withdraw,
}: {
  offer: OfferSummary;
  applicationId: string;
  withdraw: FormAction;
}) {
  return (
    <AppScreen
      footer={
        <>
          <ButtonLink href="/plantoes" block>
            Ver outros plantões
          </ButtonLink>
          <form action={withdraw}>
            <CommandFields targetId={applicationId} />
            <ConfirmSubmit
              question="Cancelar sua candidatura a este plantão?"
              confirmLabel="Sim, cancelar candidatura"
              keepLabel="Manter candidatura"
            >
              Cancelar candidatura
            </ConfirmSubmit>
          </form>
        </>
      }
    >
      <div className={styles.topSpace}>
        <EmptyState icon={Check} title="Candidatura enviada" headingLevel="h1">
          Quem publicou vai escolher entre os candidatos. Você recebe um aviso
          assim que houver resposta.
        </EmptyState>
      </div>
      <StepList title="Próximos passos" steps={applicationSteps(offer)} />
    </AppScreen>
  );
}
