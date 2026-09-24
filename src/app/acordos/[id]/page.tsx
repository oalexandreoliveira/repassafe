import { createHash } from "node:crypto";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintDocumentButton } from "@/components/print-document-button";
import { formatCurrency, formatDateTime } from "@/features/shifts/schemas";
import { getVerifiedIdentity, requireAdminIdentity } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

type AgreementContent = {
  document_type: string;
  schema_version: string;
  agreement_id: string;
  substitution_id: string;
  offer_id: string;
  parties: {
    owner: { profile_id: string; display_name: string };
    substitute: { profile_id: string; display_name: string };
  };
  group: { id: string; name: string; institution_name: string };
  agreement_confirmed_at: string;
  owner_offer_terms: {
    actor_id: string;
    acknowledged_at: string;
  } | null;
  terms: {
    starts_at: string;
    ends_at: string;
    sector: string;
    value_cents: number;
    payment_terms: string;
    confirmed_at: string;
    approved_by?: string;
  };
};

type EvidenceEvent = {
  id: string;
  agreement_id: string;
  event_type: string;
  actor_id: string | null;
  occurred_at: string;
  recorded_at: string;
  document_sha256: string;
  previous_event_sha256: string | null;
  event_sha256: string;
  event_content: string;
};

const eventLabels: Record<string, string> = {
  owner_terms_published: "Titular confirmou e publicou as condições",
  substitute_accepted: "Substituto confirmou o aceite",
  institution_approved: "Aprovador institucional autorizou o repasse",
  document_generated: "Documento eletrônico emitido",
};

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function verifyEventChain(events: EvidenceEvent[], documentHash: string) {
  if (events.length === 0) return false;
  let previousHash: string | null = null;
  for (const event of events) {
    let content: Record<string, unknown>;
    try {
      content = JSON.parse(event.event_content) as Record<string, unknown>;
    } catch {
      return false;
    }
    if (
      sha256(event.event_content) !== event.event_sha256 ||
      event.previous_event_sha256 !== previousHash ||
      content.id !== event.id ||
      content.agreement_id !== event.agreement_id ||
      content.event_type !== event.event_type ||
      content.actor_id !== event.actor_id ||
      content.recorded_at !== event.recorded_at ||
      content.document_sha256 !== event.document_sha256 ||
      event.document_sha256 !== documentHash ||
      content.previous_event_sha256 !== event.previous_event_sha256
    ) {
      return false;
    }
    previousHash = event.event_sha256;
  }
  return true;
}

export default async function AgreementDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");

  const { data: profile } = await identity.supabase
    .from("profiles")
    .select("role")
    .eq("id", identity.userId)
    .single();
  if (!profile) notFound();

  let dataClient = identity.supabase;
  if (profile.role === "admin") {
    await requireAdminIdentity();
    dataClient = createAdminClient();
  }

  const [{ data: document }, { data: events }] = await Promise.all([
    dataClient
      .from("agreement_documents")
      .select(
        "agreement_id,schema_version,canonical_content,canonical_content_text,document_sha256,generated_at",
      )
      .eq("agreement_id", id)
      .maybeSingle(),
    dataClient
      .from("agreement_evidence_events")
      .select(
        "id,agreement_id,event_type,actor_id,occurred_at,recorded_at,document_sha256,previous_event_sha256,event_sha256,event_content",
      )
      .eq("agreement_id", id)
      .order("recorded_at")
      .order("id"),
  ]);
  if (!document) notFound();

  const content = document.canonical_content as unknown as AgreementContent;
  const evidence = (events ?? []) as EvidenceEvent[];
  const documentHashValid =
    sha256(document.canonical_content_text) === document.document_sha256;
  const eventChainValid =
    evidence.at(-1)?.event_type === "document_generated" &&
    verifyEventChain(evidence, document.document_sha256);

  return (
    <main className="shell dashboard agreement-document">
      <header className="dashboard-header no-print">
        <Link href={`/plantoes/${content.offer_id}`} className="brand">
          <span aria-hidden="true">R</span> Repassafe
        </Link>
        <PrintDocumentButton />
      </header>
      <article className="card agreement-paper">
        <p className="eyebrow">
          Registro eletrônico · versão {document.schema_version}
        </p>
        <h1>{content.document_type}</h1>
        <p>
          Documento {content.agreement_id} · emitido em{" "}
          {formatDateTime(document.generated_at)}
        </p>

        <h2>Partes e contexto</h2>
        <dl className="facts">
          <div>
            <dt>Titular</dt>
            <dd>{content.parties.owner.display_name}</dd>
          </div>
          <div>
            <dt>Substituto</dt>
            <dd>{content.parties.substitute.display_name}</dd>
          </div>
          <div>
            <dt>Instituição</dt>
            <dd>{content.group.institution_name}</dd>
          </div>
          <div>
            <dt>Grupo</dt>
            <dd>{content.group.name}</dd>
          </div>
        </dl>

        <h2>Condições registradas</h2>
        <dl className="facts">
          <div>
            <dt>Setor</dt>
            <dd>{content.terms.sector}</dd>
          </div>
          <div>
            <dt>Início</dt>
            <dd>{formatDateTime(content.terms.starts_at)}</dd>
          </div>
          <div>
            <dt>Término</dt>
            <dd>{formatDateTime(content.terms.ends_at)}</dd>
          </div>
          <div>
            <dt>Valor</dt>
            <dd>{formatCurrency(content.terms.value_cents)}</dd>
          </div>
          <div>
            <dt>Pagamento</dt>
            <dd>{content.terms.payment_terms}</dd>
          </div>
          <div>
            <dt>Confirmado em</dt>
            <dd>{formatDateTime(content.agreement_confirmed_at)}</dd>
          </div>
          {content.terms.approved_by ? (
            <div>
              <dt>Aprovador institucional</dt>
              <dd>{content.terms.approved_by}</dd>
            </div>
          ) : null}
        </dl>

        <h2>Trilha de evidências</h2>
        <ol className="agreement-evidence-list">
          {evidence.map((event) => (
            <li key={event.id}>
              <strong>
                {eventLabels[event.event_type] ?? event.event_type}
              </strong>
              <span>
                Realizado em {formatDateTime(event.occurred_at)} · registrado na
                trilha em {formatDateTime(event.recorded_at)}
              </span>
              {event.actor_id ? <code>Ator: {event.actor_id}</code> : null}
              <code>SHA-256 do evento: {event.event_sha256}</code>
            </li>
          ))}
        </ol>

        <h2>Integridade</h2>
        <p>SHA-256 do conteúdo canônico:</p>
        <code className="agreement-hash">{document.document_sha256}</code>
        <p role="status">
          Verificação local: conteúdo{" "}
          {documentHashValid ? "íntegro" : "divergente"}; cadeia de eventos{" "}
          {eventChainValid ? "íntegra" : "divergente"}.
        </p>
        <p className="form-help">
          O hash e a cadeia ajudam a detectar alterações. Eles não equivalem a
          assinatura eletrônica qualificada, carimbo de tempo independente ou
          parecer jurídico sobre a validade do acordo.
        </p>
      </article>
    </main>
  );
}
