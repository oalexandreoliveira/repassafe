import "server-only";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { getVerifiedIdentity } from "@/lib/auth/session";

export type AgreementPerson = {
  id: string;
  name: string;
  crm: string;
  uf: string;
  status: string;
  valid_until: string | null;
};
export type AgreementContext = {
  eligible: boolean;
  groups: { id: string; name: string }[];
  owner?: AgreementPerson;
  substitute?: AgreementPerson;
  isApprover?: boolean;
};
export async function agreementIdentity() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");
  return identity;
}
export async function agreementContext(id?: string) {
  const identity = await agreementIdentity();
  const { data, error } = await identity.supabase.rpc(
    "external_agreement_context",
    { agreement_ref: id ?? null },
  );
  if (error)
    throw new Error(
      "Não foi possível carregar o registro de acordos. Tente novamente.",
    );
  return { identity, context: data as AgreementContext };
}
export function verifyAgreementEvidence(
  document: string | null,
  hash: string | null,
  events: {
    canonical_text: string;
    event_hash: string;
    previous_hash: string | null;
    sequence: number;
    actor_id: string;
    kind: string;
    payload: unknown;
    agreement_id: string;
  }[],
  snapshot?: unknown,
) {
  const sha = (value: string) =>
    createHash("sha256").update(value).digest("hex");
  let previous: string | null = null;
  for (const [index, event] of events.entries()) {
    if (
      event.sequence !== index + 1 ||
      event.previous_hash !== previous ||
      sha(event.canonical_text) !== event.event_hash
    )
      return false;
    try {
      const canonical = JSON.parse(event.canonical_text);
      if (
        canonical.agreement_id !== event.agreement_id ||
        canonical.sequence !== event.sequence ||
        canonical.actor_id !== event.actor_id ||
        canonical.kind !== event.kind ||
        canonical.previous_hash !== previous ||
        !isDeepStrictEqual(canonical.payload, event.payload)
      )
        return false;
    } catch {
      return false;
    }
    previous = event.event_hash;
  }
  if (document === null) return hash === null;
  try {
    return (
      sha(document) === hash &&
      isDeepStrictEqual(JSON.parse(document), snapshot)
    );
  } catch {
    return false;
  }
}
