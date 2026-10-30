// Contratos dos provedores de evidência externa (ADR-012). Somente tipos: nada
// aqui é usado em tempo de execução ainda. A aplicação depende destas interfaces,
// nunca de um fornecedor específico, para trocar de autoridade ou de provedor
// sem reescrever os chamadores.

export type Sha256Hex = string;

export type TimestampToken = {
  token: Uint8Array;
  issuedAt: string;
  authority: string;
  policyOid: string;
  serial: string;
};

export type TimestampVerification =
  | { valid: true; issuedAt: string; authority: string }
  | { valid: false; reason: string };

export interface TimestampProvider {
  /** Carimba somente o hash; nenhum dado pessoal sai do Repassafe. */
  stamp(input: {
    digestSha256: Sha256Hex;
    requestId: string;
  }): Promise<TimestampToken>;
  verify(input: {
    digestSha256: Sha256Hex;
    token: Uint8Array;
  }): Promise<TimestampVerification>;
}

export type SignatureSigner = {
  /** Identificador interno da parte; nunca CPF integral (ADR-014). */
  partyId: string;
  displayName: string;
  email: string;
};

export type SignatureWebhookEvent = {
  /** Identificador do evento no provedor; chave de idempotência. */
  eventId: string;
  type: "signed" | "refused" | "expired" | "completed" | "failed";
  providerRequestId: string;
  occurredAt: string;
};

export type SignatureEvidence = {
  signedFileRef: string;
  reportRef: string;
  signers: { partyId: string; signedAt: string; method: string }[];
};

export interface SignatureProvider {
  createRequest(input: {
    documentRef: string;
    documentSha256: Sha256Hex;
    signers: SignatureSigner[];
    idempotencyKey: string;
  }): Promise<{ providerRequestId: string }>;
  /**
   * Valida a autenticidade (HMAC e janela de tempo) sobre o corpo bruto e
   * devolve o evento normalizado. Deve lançar se a origem não for confiável.
   */
  parseWebhook(input: {
    rawBody: string;
    headers: Record<string, string | undefined>;
  }): Promise<SignatureWebhookEvent>;
  /** Recibos e relatórios em bruto, para guardar imutáveis no dossiê. */
  fetchEvidence(input: {
    providerRequestId: string;
  }): Promise<SignatureEvidence>;
}

/**
 * Regras de integração (invariantes da especificação, seção 7.1):
 * - falha ou ausência de resposta do provedor nunca equivale a "assinado";
 * - eventos duplicados são ignorados por `eventId`; fora de ordem, reconciliados;
 * - uma assinatura só vale para o `documentSha256` enviado na criação.
 */
