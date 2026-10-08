"use client";

import { useRef, useState } from "react";
import {
  PublishShiftFields,
  type PublishGroup,
  type PublishMode,
} from "@/components/publish-shift-fields";
import { ButtonLink } from "@/components/ui/button";
import { PublishShiftReview } from "@/components/publish-shift-review";
import { AppScreen, TopBar } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/field";
import { InfoBanner } from "@/components/ui/info-banner";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  emptyShiftForm,
  validateShiftForm,
  type ShiftFormErrors,
  type ShiftFormField,
  type ShiftFormValues,
} from "@/features/shifts/form-values";
import type { FormAction } from "./command-fields";
import { PAYMENT_NOTICE } from "@/features/shifts/copy";

const fieldIds: Partial<Record<ShiftFormField, string>> = {
  groupId: "field-groupId",
  sector: "field-sector",
  date: "field-date",
  start: "field-start",
  end: "field-end",
  value: "field-value",
  paymentTerms: "field-paymentTerms",
};

function useShiftForm(
  initial: ShiftFormValues,
  minDate?: string,
  requireGroup = false,
) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<ShiftFormErrors>({});
  const onChange = (field: ShiftFormField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  /** Valida e leva o foco ao primeiro campo com erro. */
  const validate = () => {
    const found = validateShiftForm(values, { minDate, requireGroup });
    setErrors(found);
    const first = Object.keys(found)[0] as ShiftFormField | undefined;
    if (first) document.getElementById(fieldIds[first] ?? "")?.focus();
    return !first;
  };
  return { values, errors, onChange, validate };
}

/** S05 + S06 · Publicar plantão em duas etapas, enviando para publishOfferAction. */
export function PublishShiftForm({
  action,
  commandId,
  groups,
  minDate,
  initialValues,
  initialStep = 1,
  mode = "both",
}: {
  action: FormAction;
  commandId: string;
  groups: PublishGroup[];
  minDate: string;
  /** Vindo de "Publicar em grupo" ou "Publicar livre". */
  mode?: PublishMode;
  /** Valores iniciais (prévias de tela). */
  initialValues?: Partial<ShiftFormValues>;
  initialStep?: 1 | 2;
}) {
  const [step, setStep] = useState<1 | 2>(initialStep);
  const top = useRef<HTMLDivElement>(null);
  const form = useShiftForm(
    {
      ...emptyShiftForm,
      groupId: mode === "free" ? "" : (groups[0]?.id ?? ""),
      ...initialValues,
    },
    minDate,
    mode === "group",
  );
  const title =
    mode === "group"
      ? "Publicar plantão em grupo"
      : mode === "free"
        ? "Publicar plantão livre"
        : "Publicar plantão";
  const group = groups.find((item) => item.id === form.values.groupId);
  const goTo = (next: 1 | 2) => {
    setStep(next);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => top.current?.focus());
  };

  return (
    <form
      action={action}
      noValidate={step === 1}
      onSubmit={(event) => {
        // Enter na etapa 1 avança para a revisão em vez de publicar.
        if (step === 1) {
          event.preventDefault();
          if (form.validate()) goTo(2);
        }
      }}
    >
      <input type="hidden" name="commandId" value={commandId} />
      <AppScreen
        header={
          step === 1 ? (
            <TopBar title={title} backHref="/plantoes" />
          ) : (
            <TopBar
              title="Revisar e publicar"
              onBack={() => goTo(1)}
              backLabel="Voltar e editar"
            />
          )
        }
        footer={
          step === 1 ? (
            <Button
              type="button"
              block
              onClick={() => {
                if (form.validate()) goTo(2);
              }}
            >
              Continuar
            </Button>
          ) : (
            <SubmitButton block pendingLabel="Publicando">
              Publicar plantão
            </SubmitButton>
          )
        }
      >
        <div ref={top} tabIndex={-1} className="sr-only">
          {step === 1
            ? "Etapa 1 de 2: dados do plantão"
            : "Etapa 2 de 2: revisão"}
        </div>
        {Object.values(form.errors).some(Boolean) ? (
          <InfoBanner variant="warning" role="alert">
            Revise os campos indicados para continuar.
          </InfoBanner>
        ) : null}
        {mode === "group" && groups.length === 0 ? (
          <InfoBanner variant="warning">
            Você ainda não participa de nenhum grupo. Publique como plantão
            livre, aberto a todos os médicos aprovados.
          </InfoBanner>
        ) : null}
        {mode === "group" && groups.length === 0 ? (
          <ButtonLink
            href="/plantoes/novo?modo=livre"
            variant="secondary"
            block
          >
            Publicar plantão livre
          </ButtonLink>
        ) : null}
        {mode === "group" && groups.length === 0 ? (
          <ButtonLink href="/grupos/novo" variant="ghost" block>
            Criar grupo de colegas
          </ButtonLink>
        ) : null}
        <div hidden={step !== 1}>
          <PublishShiftFields
            values={form.values}
            onChange={form.onChange}
            errors={form.errors}
            groups={groups}
            mode={mode}
            minDate={minDate}
          />
        </div>
        {step === 2 ? (
          <PublishShiftReview values={form.values} group={group} />
        ) : null}
      </AppScreen>
    </form>
  );
}

/** Edição de oferta sem candidaturas (derivada de S05), enviando para updateOfferAction. */
export function EditShiftForm({
  action,
  commandId,
  offerId,
  initial,
  minDate,
}: {
  action: FormAction;
  commandId: string;
  offerId: string;
  initial: ShiftFormValues;
  minDate: string;
}) {
  const form = useShiftForm(initial, minDate);
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!form.validate()) event.preventDefault();
      }}
    >
      <input type="hidden" name="commandId" value={commandId} />
      <AppScreen
        header={
          <TopBar title="Editar plantão" backHref={`/plantoes/${offerId}`} />
        }
        footer={<SubmitButton block>Salvar alterações</SubmitButton>}
      >
        {Object.values(form.errors).some(Boolean) ? (
          <InfoBanner variant="warning" role="alert">
            Revise os campos indicados para salvar.
          </InfoBanner>
        ) : null}
        <PublishShiftFields
          values={form.values}
          onChange={form.onChange}
          errors={form.errors}
          showGroup={false}
          minDate={minDate}
        />
        <InfoBanner>{PAYMENT_NOTICE}</InfoBanner>
        <CheckboxField
          name="ownerTermsAcknowledged"
          value="true"
          required
          label="Confirmo que revisei e aceito as condições atualizadas desta oferta."
        />
      </AppScreen>
    </form>
  );
}
