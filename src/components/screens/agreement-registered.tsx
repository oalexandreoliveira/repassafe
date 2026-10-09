import { PrintDocumentButton } from "@/components/print-document-button";
import { AppScreen } from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { InfoBanner } from "@/components/ui/info-banner";
import { KeyValueList } from "@/components/ui/key-value-list";
import { Logo } from "@/components/ui/logo";
import {
  AuditTrail,
  RegistryBlock,
  RegistryCard,
  type AuditEvent,
} from "@/components/ui/registry";
import { StatusChip } from "@/components/ui/status-chip";
import { SUCCESS_TITLE } from "@/features/shifts/copy";
import { formatAuditTime, formatPeriod } from "@/features/shifts/format";
import { formatCurrency, formatDateTime } from "@/features/shifts/schemas";
import styles from "./screens.module.css";

export type AgreementContent = {
  document_type: string;
  agreement_id: string;
  parties: {
    owner: { display_name: string };
    substitute: { display_name: string };
  };
  group: { name: string; institution_name: string } | null;
  agreement_confirmed_at: string;
  terms: {
    starts_at: string;
    ends_at: string;
    sector: string;
    value_cents: number;
    payment_terms: string;
    approved_by?: string;
  };
};

export type EvidenceItem = {
  id: string;
  event_type: string;
  actor_id: string | null;
  occurred_at: string;
  recorded_at: string;
  event_sha256: string;
};

/** Rótulos de S10 para a trilha; a cadeia completa segue no documento abaixo. */
const trailLabels: Record<string, string> = {
  owner_terms_published: "Plantão publicado",
  substitute_accepted: "Condições aceitas pelos dois",
  institution_approved: "Aprovado pela coordenação",
  document_generated: "Comprovante do repasse emitido",
};

const evidenceLabels: Record<string, string> = {
  owner_terms_published: "Titular confirmou e publicou as condições",
  substitute_accepted: "Substituto confirmou o aceite",
  institution_approved: "Aprovador institucional autorizou o repasse",
  document_generated: "Documento eletrônico emitido",
};

/** Comprovante do repasse originado de uma oferta, com o documento imutável. */
export function AgreementRegistered({
  content,
  schemaVersion,
  generatedAt,
  documentSha256,
  evidence,
  selectedAt,
  documentHashValid,
  eventChainValid,
  backHref,
}: {
  content: AgreementContent;
  schemaVersion: string;
  generatedAt: string;
  documentSha256: string;
  evidence: EvidenceItem[];
  /** Momento da escolha do substituto, quando disponível. */
  selectedAt?: string;
  documentHashValid: boolean;
  eventChainValid: boolean;
  backHref: string;
}) {
  const intact = documentHashValid && eventChainValid;
  const trail: AuditEvent[] = [
    ...evidence.map((event) => ({
      label: trailLabels[event.event_type] ?? event.event_type,
      time: formatAuditTime(event.occurred_at),
      dateTime: event.occurred_at,
    })),
    ...(selectedAt
      ? [
          {
            label: "Substituto selecionado",
            time: formatAuditTime(selectedAt),
            dateTime: selectedAt,
          },
        ]
      : []),
  ].sort((a, b) => a.dateTime.localeCompare(b.dateTime));

  return (
    <AppScreen
      footer={
        <div className={`${styles.actions} no-print`}>
          <PrintDocumentButton />
          <ButtonLink href={backHref} variant="secondary" block>
            Voltar aos plantões
          </ButtonLink>
        </div>
      }
    >
      <header className={`${styles.successHeader} no-print`}>
        <Logo variant="symbol-negative" height={88} alt="" priority />
        <h1 className={styles.successTitle}>{SUCCESS_TITLE}</h1>
        <p className={styles.successText}>
          {content.group
            ? "O repasse desta oferta foi confirmado. Os dois médicos e a coordenação podem consultar o comprovante a qualquer momento."
            : "O repasse desta oferta foi confirmado. As duas partes podem consultar o comprovante a qualquer momento."}
        </p>
        <p className={styles.successText}>
          Origem: oferta publicada no Repassafe.
        </p>
      </header>

      {!intact ? (
        <InfoBanner variant="warning" role="alert">
          A verificação local encontrou divergência neste registro. Procure o
          suporte antes de usar o documento.
        </InfoBanner>
      ) : null}

      <RegistryCard
        title="Comprovante do repasse"
        badge={
          intact ? (
            <StatusChip tone="registered">Imutável</StatusChip>
          ) : undefined
        }
      >
        <RegistryBlock
          lines={[
            `REGISTRO ${content.agreement_id}`,
            `registrado ${formatAuditTime(generatedAt)}`,
            `sha256 ${documentSha256}`,
          ]}
        />
      </RegistryCard>

      <AuditTrail events={trail} />

      <section className={styles.stack} aria-labelledby="document-heading">
        <h2 id="document-heading" className={styles.sectionTitle}>
          {content.document_type}
        </h2>
        <p className={styles.help}>
          Registro eletrônico · versão {schemaVersion} · emitido em{" "}
          {formatDateTime(generatedAt)}
        </p>
        <KeyValueList
          items={[
            { label: "Repassa", value: content.parties.owner.display_name },
            { label: "Assume", value: content.parties.substitute.display_name },
            {
              label: "Instituição",
              value: content.group?.institution_name ?? "Não se aplica",
            },
            { label: "Grupo", value: content.group?.name ?? "Oferta livre" },
          ]}
        />
        <KeyValueList
          items={[
            { label: "Setor", value: content.terms.sector },
            {
              label: "Período",
              value: formatPeriod(
                content.terms.starts_at,
                content.terms.ends_at,
              ),
            },
            {
              label: "Valor",
              value: formatCurrency(content.terms.value_cents),
            },
            {
              label: "Condições de pagamento",
              value: content.terms.payment_terms,
              stacked: true,
            },
            {
              label: "Confirmado em",
              value: formatDateTime(content.agreement_confirmed_at),
            },
            ...(content.terms.approved_by
              ? [
                  {
                    label: "Aprovador institucional",
                    value: content.terms.approved_by,
                  },
                ]
              : []),
          ]}
        />
        <RegistryCard title="Cadeia de evidências">
          <ol className={styles.list}>
            {evidence.map((event) => (
              <li key={event.id} className={styles.stack}>
                <strong>
                  {evidenceLabels[event.event_type] ?? event.event_type}
                </strong>
                <span className={styles.help}>
                  Realizado em {formatDateTime(event.occurred_at)} · registrado
                  na trilha em {formatDateTime(event.recorded_at)}
                </span>
                <RegistryBlock
                  lines={[
                    ...(event.actor_id ? [`ator ${event.actor_id}`] : []),
                    `sha256 ${event.event_sha256}`,
                  ]}
                />
              </li>
            ))}
          </ol>
        </RegistryCard>
        <p className={styles.help} role="status">
          Verificação local: conteúdo{" "}
          {documentHashValid ? "íntegro" : "divergente"}; cadeia de eventos{" "}
          {eventChainValid ? "íntegra" : "divergente"}.
        </p>
        <p className={styles.help}>
          O hash e a cadeia ajudam a detectar alterações. Eles não equivalem a
          assinatura eletrônica qualificada, carimbo de tempo independente ou
          parecer jurídico sobre a validade do acordo.
        </p>
      </section>
    </AppScreen>
  );
}
