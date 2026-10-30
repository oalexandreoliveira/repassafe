# ADR-014: CPF mascarado e anonimizado nos documentos de repasse e acordo

- Status: **aceito**; forma de apresentação do CPF completo **adiada**
- Data: 09/10/2026 · Decisor: responsável pelo projeto
- Origem: pendência L-11 ([conferência das normas](../conferencia-normas-2026-10-08.md), CPC 798, II, b)

## Decisão

Combinar mascaramento e compromisso criptográfico:

1. Os documentos canônicos (fluxos de oferta e de acordo) **não contêm CPF completo**. Contêm o CPF
   **mascarado** e um **compromisso** (_commitment_) dele.
2. Como e para quem o CPF completo será apresentado fica **para decisão posterior** (jurídico + proteção de dados).
   O compromisso existe justamente para permitir essa revelação futura com prova de que é o CPF original.

## Requisitos do compromisso (importante)

- `compromisso = SHA-256(sal_secreto ‖ cpf_normalizado)`, com **sal aleatório de 128 bits por pessoa e acordo**,
  guardado em tabela privada. **O sal não vai no documento.**
- **Hash simples ou sal público não servem:** CPFs são enumeráveis (cerca de 10⁹ combinações válidas) e o hash
  seria quebrado por força bruta. O mascaramento deixa visíveis alguns dígitos, o que reduz ainda mais o espaço;
  por isso o sal secreto é indispensável.
- Revelação posterior: entrega-se `cpf` + `sal`; qualquer pessoa recalcula e compara com o compromisso gravado no
  documento (que está sob o hash do documento, e eventualmente carimbado — ADR-012).
- **Perda do sal = perda da capacidade de provar.** Sais entram no backup criptografado e na política de retenção.
- O compromisso continua sendo dado pessoal pseudonimizado (LGPD): vale a mesma base legal e retenção.

## Formato de máscara

Proposta: `***.NNN.NNN-**` ou menos dígitos visíveis; definir com o jurídico o mínimo necessário para identificar
sem expor. Dígitos visíveis ampliam o risco de reidentificação; menos é melhor.

## Consequências

- Documentos v2 (P0-03) incluem `cpf_masked` e `cpf_commitment` por parte; v1 permanece como está.
- O CPF completo permanece apenas no cadastro (`private.registration_drafts`), com acesso já restrito.
- Teste: documento exportado jamais contém 11 dígitos de CPF (verificação automatizada no dossiê).
