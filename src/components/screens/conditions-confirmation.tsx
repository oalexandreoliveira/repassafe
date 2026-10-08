import { AppScreen, TopBar } from "@/components/ui/app-shell";
import { CheckboxField } from "@/components/ui/field";
import { InfoBanner } from "@/components/ui/info-banner";
import {
  KeyValueList,
  type KeyValueItem,
} from "@/components/ui/key-value-list";
import { ProgressSteps } from "@/components/ui/progress";
import { SelectionSubmit } from "@/components/ui/selection-submit";
import { SubmitButton } from "@/components/ui/submit-button";
import { AGREEMENT_CONSENT, PAYMENT_NOTICE } from "@/features/shifts/copy";
import { formatPeriod } from "@/features/shifts/format";
import { offerTitle, type OfferSummary } from "@/features/shifts/offer-view";
import { formatCurrency } from "@/features/shifts/schemas";
import { CommandFields, type FormAction } from "./command-fields";
import styles from "./screens.module.css";

const ACCEPT_FORM_ID = "aceitar-condicoes";

/** Legenda do progresso no momento da confirmação das condições (etapa 3). */
export function confirmationProgress(requiresApproval: boolean) {
  return requiresApproval
    ? {
        total: 5,
        caption: "Etapa 3 de 5 · depois: aprovação da coordenação e registro",
      }
    : { total: 4, caption: "Etapa 3 de 4 · depois: registro do acordo" };
}

/** Condições exibidas em S09 (as mesmas que vão para o registro do acordo). */
export function conditionItems(
  offer: OfferSummary,
  parties: { owner: string; substitute: string },
): KeyValueItem[] {
  return [
    { label: "Plantão", value: offerTitle(offer) },
    { label: "Período", value: formatPeriod(offer.startsAt, offer.endsAt) },
    { label: "Repassa", value: parties.owner },
    { label: "Assume", value: parties.substitute },
    ...(offer.valueCents !== undefined
      ? [
          { label: "Valor", value: formatCurrency(offer.valueCents) },
          {
            label: "Condições de pagamento",
            value: offer.paymentTerms ?? "",
            stacked: true,
          },
        ]
      : []),
  ];
}

function Conditions({
  offer,
  parties,
}: {
  offer: OfferSummary;
  parties: { owner: string; substitute: string };
}) {
  const progress = confirmationProgress(offer.requiresApproval);
  return (
    <>
      <ProgressSteps
        total={progress.total}
        current={3}
        caption={progress.caption}
      />
      <KeyValueList items={conditionItems(offer, parties)} />
      <InfoBanner>{PAYMENT_NOTICE}</InfoBanner>
    </>
  );
}

/** S09 · Titular revisa as condições e envia a escolha ao substituto. */
export function OwnerConditionsReview({
  offer,
  applicationId,
  candidateName,
  select,
}: {
  offer: OfferSummary;
  applicationId: string;
  candidateName: string;
  select: FormAction;
}) {
  return (
    <AppScreen
      header={
        <TopBar
          title="Confirmar condições"
          backHref={`/plantoes/${offer.id}/candidaturas`}
        />
      }
      footer={
        <form action={select}>
          <CommandFields targetId={applicationId} />
          <SubmitButton block>Selecionar e enviar ao substituto</SubmitButton>
        </form>
      }
    >
      <Conditions
        offer={offer}
        parties={{ owner: "Você", substitute: candidateName }}
      />
      <p className={styles.help}>
        Quem assume recebe um aviso para confirmar estas mesmas condições.
      </p>
    </AppScreen>
  );
}

/** S09 · Substituto aceita (ou recusa) as condições com a concordância obrigatória. */
export function SubstituteConditions({
  offer,
  substitutionId,
  confirm,
}: {
  offer: OfferSummary;
  substitutionId: string;
  confirm: FormAction;
}) {
  return (
    <AppScreen
      header={
        <TopBar
          title="Confirmar condições"
          backHref={`/plantoes/${offer.id}`}
        />
      }
      footer={
        <>
          <SelectionSubmit
            form={ACCEPT_FORM_ID}
            requires="input[name=termsAcknowledged]:checked"
          >
            Aceitar condições
          </SelectionSubmit>
          <form action={confirm}>
            <CommandFields targetId={substitutionId} />
            <input type="hidden" name="accepted" value="false" />
            <SubmitButton variant="ghost" block>
              Recusar
            </SubmitButton>
          </form>
        </>
      }
    >
      <Conditions
        offer={offer}
        parties={{ owner: "Quem publicou o plantão", substitute: "Você" }}
      />
      <form id={ACCEPT_FORM_ID} action={confirm}>
        <CommandFields targetId={substitutionId} />
        <input type="hidden" name="accepted" value="true" />
        <CheckboxField
          name="termsAcknowledged"
          value="true"
          required
          label={AGREEMENT_CONSENT}
        />
      </form>
    </AppScreen>
  );
}
