# ADR-011: Escopo de partes — pessoas jurídicas como contratantes ficam fora por ora

- Status: **aceito**
- Data: 08/10/2026
- Decisor: responsável pelo projeto (Alexandre Oliveira)
- Origem: pendência L-2 de [plano-adequacao.md](../plano-adequacao.md)

## Contexto

A especificação de confiabilidade documental menciona contratantes, pessoas jurídicas e representantes. O produto
implementado é o repasse de plantões **entre médicos** (quem repassa × quem assume). Instituições e grupos existem
como contexto e como fonte de aprovação institucional, não como parte do acordo.

## Decisão

1. **Pessoas jurídicas não são partes contratantes** dos acordos do Repassafe neste momento. As duas partes de todo
   acordo são pessoas naturais, médicos com cadastro elegível.
2. **Não serão construídos**, nesta fase: cadastro de PJ/CNPJ como parte, representante legal, declaração ou
   comprovação de poderes de assinatura.
3. A instituição/grupo continua sendo **contexto** do plantão e, quando exigido, a **aprovação institucional** de um
   aprovador vinculado. Essa aprovação **não** é assinatura nem manifestação de vontade da pessoa jurídica.
4. O texto do produto não deve sugerir que hospital, clínica ou empresa é parte, devedor ou garantidor do acordo.
   A regra existente "a data-limite vale mesmo se o hospital atrasar" permanece.

## Consequências no plano

| Item | Efeito |
| --- | --- |
| P1-12 (PJ e representantes) | **Cancelado nesta fase**; reavaliar conforme gatilhos abaixo |
| AUT-006 (poderes de representação) | Marcado **Fora de escopo (ADR-011)**; sem lacuna a corrigir |
| TC-011 (fluxos de PJ) | Substituído por teste negativo: nenhuma PJ ou representante consegue ser parte |
| FID-001 | Mantém-se a identificação de pessoas naturais (nome civil, CRM/UF); sem campos de PJ |
| Risco R11 (representante sem poderes) | Não aplicável enquanto a decisão vigorar |

## Controles que sustentam a decisão (a verificar/testar)

- Elegibilidade já exige pessoa natural médica: `private.external_eligible` (CRM, CPF, nascimento, e-mail confirmado).
  Criar teste que prove que perfil sem esses dados, ou conta de papel não médico, não se torna parte.
- Revisão de linguagem (P0-09) deve incluir ausência de termos que atribuam parte contratual à instituição.

## Gatilhos para reabrir

Reabrir esta decisão se: (a) um hospital/clínica quiser contratar ou pagar diretamente pelo aplicativo; (b) médico
passar a atuar por pessoa jurídica própria (consultório/PJ) e assinar em nome dela; (c) houver exigência do jurídico
ou de instituição parceira. Nesse caso, será necessário novo ADR, modelo de dados de PJ e representação,
e atualização de FID-001, AUT-006, R11, TC-011 e P1-12.

## Limites

Esta ADR é decisão de produto/escopo, não parecer jurídico. Não impede que médicos, na prática, atuem por PJ fora do
aplicativo; o Repassafe apenas não modelará nem comprovará essa representação.
