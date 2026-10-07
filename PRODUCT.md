# Repassafe

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Médicos que oferecem e assumem substituições de plantão.
- Aprovadores institucionais que decidem substituições de seus grupos e podem
  não atuar como médicos.
- Administradores Repassafe que verificam profissionais e operam a plataforma,
  com concessão gerencial independente de perfil profissional e vínculo de
  grupo.

## Product Purpose

Organizar a substituição de plantões entre profissionais elegíveis, mantendo as
condições acordadas, as decisões institucionais aplicáveis e a trilha de
responsabilidade consultáveis pelas pessoas autorizadas.

O objetivo do piloto é validar ao menos uma substituição de ponta a ponta em
operação assistida, sem acesso indevido, ambiguidade de responsabilidade ou
perda da trilha de auditoria.

## Positioning

O mecanismo distintivo do Repassafe é um fluxo operacional assistido e
auditável que conecta profissionais verificados, autorização institucional por
grupo quando aplicável e registro imutável do acordo. A habilitação profissional,
a autorização institucional e a concessão administrativa são decisões
independentes; uma não substitui a outra.

## Operating Context

O primeiro recorte é um piloto privado e assistido com uma instituição e de um
a três grupos. O acesso é por convite ou liberação administrativa, a verificação
do CRM é manual e a aprovação institucional pode variar conforme o grupo.
Ofertas podem ser vinculadas a grupos ou abertas a profissionais aprovados.
Notificações essenciais ocorrem na aplicação e por e-mail.

Os participantes concluem cadastro, confirmação de e-mail, análise profissional
e vínculo antes de operar. No fluxo de substituição, o titular publica a oferta,
outros profissionais elegíveis se candidatam, o titular seleciona alguém, o
substituto confirma e o aprovador decide quando a regra do grupo exigir. As
partes registram conclusão ou cancelamento; exceções seguem operação assistida
e trilha de auditoria.

## Capabilities and Constraints

- Cadastro por e-mail com confirmação, recuperação de acesso, rascunho
  retomável, dados civis protegidos, foto privada, aceite versionado, envio,
  correções e reenvio. A atuação médica é opcional para quem exerce apenas
  função de aprovação institucional.
- CRM e RQE têm verificações profissionais próprias. Declarações de instituição
  e setor não concedem acesso; vínculos, permissões por grupo e acesso
  administrativo são autorizações separadas.
- Ofertas normais ou emergenciais podem receber candidaturas, seleção,
  confirmação, aprovação institucional configurável, registro de acordo,
  conclusão, cancelamento e ocorrência.
- A área administrativa apresenta eventos agregados do piloto por grupo e
  período, com exportação CSV consolidada; não expõe registros individuais.
- Transições críticas são verificadas no servidor e no banco, com auditoria e
  acesso segregado. Dados de pacientes são proibidos em campos, anexos e logs.
- A operação inicial não intermedeia pagamentos. Pagamentos, chat, GPS,
  biometria, IA e integrações externas não fazem parte do MVP.
- A integração de confirmação por SMS existe, mas permanece desativada até a
  configuração do provedor. O preenchimento do telefone, por si só, não o
  confirma.
- A validade profissional é configurável; expirados não iniciam novas
  operações. A evidência de aprovação não equivale a autorização institucional.

## Brand Commitments

O produto se chama Repassafe e atende em português do Brasil. A identidade
visual v2.1 (símbolo de dois blocos em diagonal, Tinta, Verde-repasse, Menta,
Sora, Figtree e JetBrains Mono) foi aprovada e substitui a anterior; sua
especificação está em `design/`. Evoluções devem preservá-la sem redesenhar a
marca. Termos, suporte e políticas devem usar apenas dados e canais confirmados,
sem inventar CNPJ, endereço, contato ou prazo de atendimento.

## Evidence on Hand

- O escopo operacional vigente está em `docs/product/mvp-scope-v1.md`; o
  catálogo está em `backlog-priorizado.md`.
- O contrato da expansão do cadastro está em
  `docs/product/registration-full-spec-review.md`, e sua entrega e limites estão
  registrados em `docs/reviews/registration-release-validation-2026-09-29.md`.
- A validação de cadastro relata testes com contas sintéticas, CI e promoção ao
  staging. Ela não relata revisão jurídica externa nem entrega real de OTP por
  SMS.
- Não há depoimentos, benchmarks de mercado ou resultados de piloto que
  sustentem alegações públicas de eficácia; não inventá-los.

## Product Principles

- Separar identidade, habilitação profissional, autorização institucional e
  concessão administrativa.
- Autorizar cada leitura e transição conforme a pessoa, o grupo, o papel e o
  estado persistido.
- Preservar evidências e condições acordadas para que as partes e a operação
  entendam o que ocorreu.
- Coletar e expor apenas dados necessários; nunca introduzir dados de
  pacientes.
- Preferir operação assistida e escopo controlado enquanto o piloto valida a
  jornada central.

## Accessibility & Inclusion

O fluxo deve funcionar em celular e com teclado, indicar erros no campo
correspondente e expressar estados em texto, sem depender apenas de cor. Os
registros de validação existentes não afirmam certificação WCAG integral.
