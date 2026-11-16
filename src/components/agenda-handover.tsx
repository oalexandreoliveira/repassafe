import { CalendarPlus } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/field";
import { InfoBanner } from "@/components/ui/info-banner";
import type { Handover } from "@/features/agenda/model";
import styles from "./screens/screens.module.css";

/**
 * Arquivo .ics do plantão e do vencimento (etapa 3), gerado na hora. O
 * arquivo não se atualiza; valor e nomes só entram se o usuário marcar.
 */
export function CalendarExport({
  action,
  withDue,
  detailsLabel,
}: {
  /** Rota que gera o arquivo. */
  action: string;
  /** Inclui o evento do vencimento, com alarme. */
  withDue: boolean;
  detailsLabel: string;
}) {
  return (
    <details className={styles.disclosure}>
      <summary>Adicionar à agenda do celular</summary>
      <form method="get" action={action} className={styles.disclosureBody}>
        <p className={styles.help}>
          {withDue
            ? "O arquivo traz o plantão e o vencimento do pagamento, com alarme às 8h."
            : "O arquivo traz o plantão."}{" "}
          Ele não se atualiza: se o pagamento chegar ou o plantão mudar, apague
          o evento no celular.
        </p>
        <CheckboxField name="detalhes" value="1" label={detailsLabel} />
        <p className={styles.help}>
          Sem essa opção, vão só local, setor e horários. Se a agenda do celular
          sincroniza com outro serviço, como Google ou Apple, o evento fica
          também nesse serviço.
        </p>
        <Button
          type="submit"
          variant="secondary"
          block
          icon={<CalendarPlus size={20} />}
        >
          Baixar arquivo da agenda
        </Button>
      </form>
    </details>
  );
}

/** "Repassar este plantão": leva os dados de "Meu plantão" ao fluxo escolhido. */
export function HandOverShift({
  entryId,
  canPublish,
}: {
  entryId: string;
  canPublish: boolean;
}) {
  return (
    <details className={styles.disclosure}>
      <summary>Repassar este plantão</summary>
      <div className={styles.disclosureBody}>
        <p className={styles.help}>
          Data, horário, local e setor vão preenchidos. O valor e o pagamento ao
          colega você define no repasse; o valor da instituição continua nesta
          anotação.
        </p>
        {canPublish ? (
          <>
            <ButtonLink href={`/plantoes/novo?agenda=${entryId}`} block>
              Publicar plantão
            </ButtonLink>
            <p className={styles.help}>
              Colegas dos seus grupos se candidatam e você escolhe quem assume.
            </p>
          </>
        ) : null}
        <ButtonLink
          href={`/acordos/registrados/novo?agenda=${entryId}`}
          variant="secondary"
          block
        >
          Registrar acordo
        </ButtonLink>
        <p className={styles.help}>
          {canPublish
            ? "Para um colega com quem você já combinou: ele confirma pelo convite."
            : "Para um colega com quem você já combinou: ele confirma pelo convite. Publicar no mural exige cadastro aprovado e verificação profissional em dia."}
        </p>
      </div>
    </details>
  );
}

/** Situação do repasse criado a partir da anotação. */
export function HandoverStatus({ handover }: { handover: Handover }) {
  if (handover.state === "pending")
    return (
      <div className={styles.stack}>
        <InfoBanner>
          Repasse em andamento. Quando o colega confirmar, este plantão aparece
          na agenda como repassado.
        </InfoBanner>
        <ButtonLink href={handover.href} variant="secondary" block>
          Acompanhar repasse
        </ButtonLink>
      </div>
    );
  return (
    <div className={styles.stack}>
      <InfoBanner>
        Plantão repassado a um colega. O valor da instituição continua a receber
        nesta anotação; o pagamento ao colega aparece à parte na agenda.
      </InfoBanner>
      <ButtonLink href={handover.paymentHref} variant="secondary" block>
        Ver pagamento ao colega
      </ButtonLink>
      <ButtonLink href={handover.href} variant="ghost" block>
        Ver repasse
      </ButtonLink>
    </div>
  );
}
