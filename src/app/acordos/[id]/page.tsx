import { createHash } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { AgreementRegistered } from "@/components/screens/agreement-registered";
import {
  getAdministrativeAccess,
  getVerifiedIdentity,
  requireAdminIdentity,
} from "@/lib/auth/session";
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
  group: { id: string; name: string; institution_name: string } | null;
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

  let dataClient = identity.supabase;
  const isAdministrator = Boolean(await getAdministrativeAccess(identity));
  if (isAdministrator) {
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

  const { data: substitution } = await dataClient
    .from("substitutions")
    .select("selected_at")
    .eq("id", content.substitution_id)
    .maybeSingle();

  return (
    <AgreementRegistered
      content={content}
      schemaVersion={document.schema_version}
      generatedAt={document.generated_at}
      documentSha256={document.document_sha256}
      evidence={evidence}
      selectedAt={substitution?.selected_at ?? undefined}
      documentHashValid={documentHashValid}
      eventChainValid={eventChainValid}
      backHref={isAdministrator ? "/admin" : "/plantoes"}
    />
  );
}
