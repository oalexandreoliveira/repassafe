import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getVerifiedIdentity: vi.fn() }));

import { verifyAgreementEvidence } from "@/lib/agreements";

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const agreementId = "99000000-0000-4000-8000-000000000001";
const actorId = "99000000-0000-4000-8000-000000000002";

type Event = Parameters<typeof verifyAgreementEvidence>[2][number];

function buildChain(kinds: string[]): Event[] {
  const events: Event[] = [];
  let previous: string | null = null;
  kinds.forEach((kind, index) => {
    const payload = { step: index + 1 };
    const canonical = JSON.stringify({
      agreement_id: agreementId,
      sequence: index + 1,
      actor_id: actorId,
      kind,
      payload,
      previous_hash: previous,
    });
    const hash = sha(canonical);
    events.push({
      agreement_id: agreementId,
      sequence: index + 1,
      actor_id: actorId,
      kind,
      payload,
      previous_hash: previous,
      canonical_text: canonical,
      event_hash: hash,
    });
    previous = hash;
  });
  return events;
}

const snapshot = { version: 1, terms: { value_cents: 150000 } };
const documentText = JSON.stringify(snapshot);
const documentHash = sha(documentText);
const clone = <T>(value: T): T => structuredClone(value);

describe("verificação da evidência do acordo (TC-002)", () => {
  const chain = buildChain(["created", "accepted", "payment_reported"]);

  it("aceita documento e cadeia íntegros", () => {
    expect(
      verifyAgreementEvidence(documentText, documentHash, chain, snapshot),
    ).toBe(true);
  });

  it("aceita acordo sem documento final quando o hash também está vazio", () => {
    expect(verifyAgreementEvidence(null, null, chain)).toBe(true);
    expect(verifyAgreementEvidence(null, documentHash, chain)).toBe(false);
  });

  it("detecta um byte a mais no documento final", () => {
    expect(
      verifyAgreementEvidence(
        `${documentText} `,
        documentHash,
        chain,
        snapshot,
      ),
    ).toBe(false);
  });

  it("detecta troca do hash do documento", () => {
    expect(
      verifyAgreementEvidence(documentText, sha("outro"), chain, snapshot),
    ).toBe(false);
  });

  it("detecta snapshot divergente do texto assinado", () => {
    expect(
      verifyAgreementEvidence(documentText, documentHash, chain, {
        ...snapshot,
        terms: { value_cents: 999 },
      }),
    ).toBe(false);
  });

  it("detecta alteração de um byte no texto canônico de um evento", () => {
    const altered = clone(chain);
    altered[1].canonical_text += " ";
    expect(
      verifyAgreementEvidence(documentText, documentHash, altered, snapshot),
    ).toBe(false);
  });

  it("detecta evento removido do meio da cadeia", () => {
    const altered = [chain[0], chain[2]];
    expect(
      verifyAgreementEvidence(documentText, documentHash, altered, snapshot),
    ).toBe(false);
  });

  it("detecta eventos reordenados", () => {
    const altered = [chain[1], chain[0], chain[2]];
    expect(
      verifyAgreementEvidence(documentText, documentHash, altered, snapshot),
    ).toBe(false);
  });

  it("detecta quebra do encadeamento (hash anterior trocado)", () => {
    const altered = clone(chain);
    altered[2].previous_hash = sha("falso");
    expect(
      verifyAgreementEvidence(documentText, documentHash, altered, snapshot),
    ).toBe(false);
  });

  it("detecta payload exibido diferente do que foi assinado no evento", () => {
    const altered = clone(chain);
    altered[2].payload = { step: 99 };
    expect(
      verifyAgreementEvidence(documentText, documentHash, altered, snapshot),
    ).toBe(false);
  });

  it("detecta ator trocado na linha do evento", () => {
    const altered = clone(chain);
    altered[0].actor_id = "99000000-0000-4000-8000-0000000000ff";
    expect(
      verifyAgreementEvidence(documentText, documentHash, altered, snapshot),
    ).toBe(false);
  });

  it("detecta evento de outro acordo na cadeia", () => {
    const altered = clone(chain);
    altered[1].agreement_id = "99000000-0000-4000-8000-0000000000aa";
    expect(
      verifyAgreementEvidence(documentText, documentHash, altered, snapshot),
    ).toBe(false);
  });

  it("rejeita texto canônico que não é JSON", () => {
    const altered = clone(chain);
    altered[0].canonical_text = "não é json";
    altered[0].event_hash = sha("não é json");
    expect(
      verifyAgreementEvidence(documentText, documentHash, altered, snapshot),
    ).toBe(false);
  });
});

describe("limite conhecido da verificação interna", () => {
  it("não detecta quem reescreve texto, hashes e cadeia de forma coerente", () => {
    // Quem controla o banco pode refazer toda a cadeia. É por isso que a
    // integridade independente depende de âncora externa (ADR-012).
    const rewritten = buildChain(["created", "accepted", "payment_reported"]);
    rewritten[2] = buildChain(["created", "accepted", "disputed"])[2];
    expect(
      verifyAgreementEvidence(documentText, documentHash, rewritten, snapshot),
    ).toBe(true);
  });
});
