# ADR-012: Âncora de tempo primeiro; provedor de assinatura preparado, não contratado

- Status: **aceito** (direção); contratação de fornecedor **pendente**
- Data: 09/10/2026 · Decisor: responsável pelo projeto
- Origem: pendência L-1 de [plano-adequacao.md](../plano-adequacao.md)

## Decisão

1. O modelo inicial de integridade independente será o **carimbo do tempo** (RFC 3161) aplicado ao hash do
   documento final e ao topo da cadeia de eventos. Somente o **hash** sai do Repassafe; nenhum dado pessoal é
   enviado à autoridade de carimbo.
2. O código será desenhado para receber depois um **provedor de assinatura eletrônica**, sem reescrita: a
   aplicação depende de duas interfaces (`TimestampProvider`, `SignatureProvider`) e de eventos próprios, nunca de
   um fornecedor específico.
3. Será feita **pesquisa de fornecedores** ([pesquisa-fornecedores-2026-10-09.md](../pesquisa-fornecedores-2026-10-09.md)).
   Nada será contratado sem nova aprovação.

## Contrato das interfaces (esboço, a refinar na implementação)

```text
TimestampProvider.stamp({ digestSha256, requestId }) -> { token, issuedAt, authority, policyOid, serial }
TimestampProvider.verify({ digestSha256, token })   -> { valid, issuedAt, authority, reason? }

SignatureProvider.createRequest({ documentRef, signers[], idempotencyKey }) -> { providerRequestId }
SignatureProvider.parseWebhook({ rawBody, headers }) -> { eventId, type, providerRequestId, occurredAt }  // valida HMAC
SignatureProvider.fetchEvidence({ providerRequestId }) -> { signedFileRef, reportRef, signers[] }
```

Regras: webhooks idempotentes por `eventId`; evento fora de ordem reconciliado; falha do provedor **nunca** vira
"assinado"; recibo do carimbo e relatório do provedor são guardados em bruto, imutáveis, referenciados por hash
no dossiê. O estado `FORMALIZED` não depende do provedor enquanto este não estiver contratado.

## Consequências

- O carimbo prova **existência e integridade no tempo**; **não prova quem aceitou** (isso é L-3, ADR-013).
- Texto de produto: "registro com carimbo do tempo", nunca "assinado" ou "certificado".
- Implementação em P1-02 (carimbo) e P1-10 (provedor, só quando contratado). Ambientes de dev/teste usam
  autoridade de teste/fake; **produção usa autoridade credenciada** (a confirmar na pesquisa).

## Condição para contratar provedor de assinatura

Parecer jurídico sobre o objetivo (executividade ou apenas prova), conferência da integridade oferecida pelo
provedor para o CPC 784 § 4º, e aprovação de custo.
