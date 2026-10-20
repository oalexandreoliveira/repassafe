# Plano de adequação — confiabilidade documental

Data de referência: 08/10/2026 · Base: [auditoria-confiabilidade.md](auditoria-confiabilidade.md) e [matriz-conformidade.md](matriz-conformidade.md)
**Status: proposta para deliberação. Nada aqui foi implementado.** Nenhuma etapa avança sem autorização expressa.

## H. Arquitetura-alvo (menor complexidade razoável)

Princípio: **preservar o que funciona** (Supabase, RPCs transacionais, cadeia de eventos, RLS) e acrescentar
três coisas que hoje faltam: _aceite ligado à versão exibida_, _artefato final com hash_ e _prova que não dependa
só do banco do Repassafe_.

```text
Aceite (UI) ──► RPC transacional ──► documento canônico v2 (JSON + texto renderizado + template_version)
                                      │            ▲ hash enviado pelo cliente deve coincidir
                                      ▼
                           eventos encadeados (hash) ──► topo da cadeia
                                      │
Worker de emissão (servidor) ─────────┤
   1. gera PDF/A do canônico          │
   2. SHA-256 do arquivo ─► bucket privado `agreement-documents` (sem UPDATE/DELETE)
   3. carimbo RFC 3161 (ou assinatura de provedor) sobre hash do PDF + topo da cadeia
   4. grava evento `document_issued` / `timestamped` com o recibo do provedor
                                      │
Central de Evidências ──► dossiê ZIP (contrato, relatório, eventos.json, manifest.json, instruções)
Verificador offline (script) ──► recalcula hashes, cadeia e valida carimbo/assinatura
```

Decisões de arquitetura (justificadas):

1. **Manter Postgres/Supabase como fonte de verdade.** Reescrever seria custo sem ganho probatório.
2. **Tratar a cadeia interna como _detecção_, não como prova independente.** Independência vem de âncora
   externa (carimbo do tempo ou provedor), não de mais hashing interno.
3. **Preferir componentes consolidados** (RFC 3161, PDF/A, provedor de assinatura) a criptografia própria. Sem
   blockchain.
4. **Um modelo de documento para os dois fluxos** (v2), sem migrar acordos antigos retroativamente: documentos
   v1 continuam verificáveis com o algoritmo v1, marcados "sem aceite ligado à versão".
5. **Estados:** manter os existentes; acrescentar `CHANGES_REQUESTED` e `SUPERSEDED` somente com versões/aditivos.
6. **Assinatura é opcional e incremental:** o fluxo funciona só com carimbo; provedor de assinatura entra por
   fase, atrás de uma interface (`SignatureProvider`) para trocar sem reescrever.
7. **Sem afirmação de executividade.** Nenhum texto de produto usa "título executivo", "garantido", "blindado".

### Resposta direta: onde intervir

| Camada | Intervenção | Esforço relativo |
| --- | --- | --- |
| Persistência | Endurecer privilégios, testes de integridade, backup de Storage/Auth, retenção | Baixa–média |
| Formação | Aceite com hash no fluxo A, canônico v2, vencimento estruturado, versões/aditivos | Média |
| Assinatura/evidência | Step-up de autenticação, PDF final, carimbo/assinatura, dossiê, verificador | Alta |

## I. Backlog de adequação

Complexidade: B = baixa, M = média, A = alta. Todas as tarefas de banco exigem migração nova e reversível
(**nenhuma** edição de migration já aplicada).

### P0 — Controles fundamentais

| ID | Tarefa | Requisitos | Componentes | Dependências | Banco | Compl. | Critério de aceite |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P0-01 | **Reconciliar migrations e promover a staging**: migração `20261001…` ausente do histórico local; migração externa só local | SEG-003 | `supabase/migrations`, staging | Nenhuma | Aplicação em staging | B | `supabase migration list` coerente; `supabase test db` verde em staging |
| P0-02 | **Aceite do fluxo A ligado à versão**: gerar o documento antes do aceite; `confirm_substitution` e `publish/update_offer` exigem hash | FID-004, AUT-004 | `process_workflow_command`, `/plantoes/[id]`, `create_agreement_dossier` | P0-03 | Nova versão da função; coluna `accepted_document_sha256` nos eventos | M | pgTAP: hash divergente → erro; evento contém hash (TC-003) |
| P0-03 | **Canônico v2**: `template_version`, texto renderizado, `notes`, local, CRM/UF, vencimento (A); verificação v1 preservada | FID-001/002/007, INT-001 | Funções de dossiê, páginas de documento | Decisão L-4 | `schema_version='2.0'`; sem alterar linhas v1 | M | Documento v2 reproduz exatamente o texto exibido; v1 segue verificável |
| P0-04 | **Endurecimento de privilégios**: revogar `UPDATE/DELETE/TRUNCATE` de `service_role` e de papéis de aplicação nas tabelas de evidência; gatilho de transição de estado em `external_agreements` (`confirmed` terminal; `received_at` uma vez); gatilho de `TRUNCATE` | INT-002/005, AUD-005 | Migração nova | Nenhuma | Triggers/grants | B–M | `has_table_privilege` falso; pgTAP de transição proibida |
| P0-05 | **Testes de integridade ausentes**: imutabilidade de `agreement_documents`/`evidence_events`; adulteração de bytes (TC-002); `verifyAgreementEvidence` com dados corrompidos; concorrência de comandos | INT-004, TC-001/002/005 | `supabase/tests`, `tests/` | Nenhuma | Nenhuma | B–M | Testes falham quando 1 byte muda e passam no fluxo íntegro |
| P0-06 | **Política de retenção e descarte** (evidência × dados pessoais × LGPD) | SEG-005, SEG-006 | Documento jurídico + rotina | Parecer jurídico | Possível tabela de política | M | Documento aprovado; teste da rotina em staging |
| P0-07 | **Backup completo**: Storage (comprovantes) e Auth; destino off-site; PITR em produção; teste de restauração do acordo + comprovante | SEG-004, TC-012 | `scripts/create-logical-backup.ps1`, runbook | Decisão L-7 | Nenhuma | M | Relatório de restauração com acordo e anexo verificados por hash |
| P0-08 | **Evidência de criptografia e região** (TLS/repouso/região/plano) | SEG-002 | Documentação | Acesso aos painéis | Nenhuma | B | Documento com configuração comprovada |
| P0-09 | **Revisão de linguagem** (garantir ausência de "prova", "garantido", "executivo", "certificado judicialmente") com teste automatizado de léxico | Seção 13 | `src`, `tests/` | Nenhuma | Nenhuma | B | Teste de léxico no CI |

### P1 — Aprimoramento probatório

| ID | Tarefa | Requisitos | Componentes | Dependências | Banco | Compl. | Critério de aceite |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P1-01 | **PDF final no servidor** + hash do arquivo + bucket `agreement-documents` | PRV-001, INT-001 | Worker/Server Action, Storage | P0-03 | Tabela `agreement_artifacts` (hash, caminho, tipo) | M | Hash do PDF baixado = hash em banco |
| P1-02 | **Carimbo do tempo RFC 3161** sobre hash do PDF + topo da cadeia, atrás de `TimestampProvider`/`SignatureProvider` (ADR-012); autoridade a escolher por cotação | INT-006, AUD-003 | Worker, evento `timestamped` | P1-01, cotação | Colunas de recibo | M–A | Verificador offline valida o carimbo; trocar de autoridade não altera chamadores |
| P1-03 | **Confirmação de transação por senha** (reautenticação, ADR-013) com política de nível por ato (preparada para TOTP); registro do método no evento | AUT-001/005 | Auth, ações, evento | ADR-013 | Metadado do método no evento | M | Ato sem reautenticação recente falha; evento traz método, nunca a credencial |
| P1-04 | **Central de Evidências + dossiê ZIP** (`manifest.json` com schema versionado, hashes, `instrucoes-verificacao.txt`) | PRV-004/005, AUD-007 | Rota `/acordos/.../dossie`, UI | P1-01 | Nenhuma | M–A | TC-007 |
| P1-05 | **Verificador offline** (script em Node, sem rede) | INT-006, PRV-005 | `scripts/verify-dossier.mjs` + doc | P1-04 | Nenhuma | M | Pacote adulterado é reprovado |
| P1-06 | **Versões e aditivos** (`version`, `supersedes_id`, `parent_agreement_id`; `CHANGES_REQUESTED`/`SUPERSEDED`) | FID-005/008, PRV-003 | Funções, UI | P0-03 | Colunas e FKs | A | TC-001, TC-009 |
| P1-07 | **Registro de execução no fluxo B** (declarado × confirmado), reusando o modelo bilateral de A | PRV-006 | RPC, UI | Decisão L-6 | Tabela nova | M | TC-010 |
| P1-08 | **Registro de tentativas rejeitadas** fora da transação | AUD-006 | Server Action + tabela | Nenhuma | `contract_rejections` | B–M | Tentativa inválida deixa rastro sem dado sensível |
| P1-09 | **Log de acesso mínimo** (download de comprovante/dossiê, acesso admin) | SEG-008 | Rotas, tabela | Nenhuma | `access_events` | B | Evento por download |
| P1-10 | **Provedor de assinatura** atrás de `SignatureProvider`, webhook com HMAC, idempotência e reconciliação | AUT-003/004/005, PRV-002 | Rota de webhook, tabela de assinaturas | L-1 | `signature_requests`, `signature_events` | A | TC-003, TC-005, TC-006 |
| P1-11 | **Dados sensíveis em texto livre**: aviso, validação heurística, canal de remoção | SEG-007 | Formulários | Nenhuma | Nenhuma | B | Teste de rejeição |
| P1-12 | ~~PJ e representantes~~ **Cancelado nesta fase (ADR-011, 08/10/2026)** | AUT-006 | — | — | — | — | Substituído por teste negativo: PJ/representante não consegue ser parte |

### P2

P2-01 verificação pública controlada por hash (sem dados pessoais) · P2-02 rotina periódica de reverificação das
cadeias com alerta · P2-03 painel de integridade/observabilidade · P2-04 IP/dispositivo minimizados (após base
legal) · P2-05 automação de checagens documentais _sem_ conclusões jurídicas.

### Detalhes das tarefas mais sensíveis

**P0-02 — aceite ligado à versão (fluxo A).** _Problema:_ o consentimento do substituto ocorre antes do documento
existir; o vínculo é retroativo. _Alternativas:_ (a) materializar o documento na seleção do candidato e exigir
seu hash na confirmação; (b) migrar o fluxo A para o modelo B. _Escolha sugerida:_ (a) por reuso.
_Impacto na UX:_ nenhum visível além de mostrar o resumo que já existe. _Estratégia de migração:_ comandos novos
exigem hash; acordos antigos continuam v1. _Riscos:_ janela de 30 minutos de confirmação e mudanças da oferta
entre seleção e confirmação (já bloqueadas). _Testes:_ TC-003 e novo pgTAP.

**P0-04 — endurecimento.** _Risco:_ funções `security definer` e rotinas de manutenção podem depender dos grants
atuais; revogar sem mapear quebra o fluxo. _Estratégia:_ inventariar com `has_table_privilege` em staging,
aplicar em duas migrações (revoke + gatilhos), manter reversão documentada.

**P1-02 / P1-10 — âncora externa.** _Alternativas:_ (i) apenas carimbo do tempo; (ii) assinatura de provedor com
relatório; (iii) ambos. Cada opção muda a promessa do produto e o custo — ver L-1. Nenhuma implica
executividade (§3.2 da especificação: depende dos requisitos legais e do provedor efetivamente usado).

## J. Estratégia de testes

| TC | Cenário | Camada | Existe hoje | Ação |
| --- | --- | --- | --- | --- |
| TC-001 | Alterar valor/data/prazo/objeto após aceite | pgTAP | Parcial: snapshot A e condições B | Estender a `agreement_documents`, `evidence_events` e campos de status (P0-04/05) |
| TC-002 | Adulterar bytes do arquivo final | Vitest + pgTAP | **Não** | Criar (P0-05); depois sobre PDF (P1-01) |
| TC-003 | Assinatura/aceite da versão A aplicada à B | pgTAP | B ✔ (`terms_hash`); A ✘ | Criar após P0-02 |
| TC-004 | Acesso a contrato de terceiro | pgTAP + E2E | ✔ matriz RLS e B | Acrescentar E2E das rotas `/acordos/[id]` e `/comprovante` |
| TC-005 | Webhook duplicado | Integração | N/A hoje; idempotência de comando ✔ | Criar com P1-10 |
| TC-006 | Assinatura incompleta ⇒ não formalizado | Integração | N/A | Criar com P1-10 |
| TC-007 | Dossiê e hashes | Integração | **Não** | Criar com P1-04/05 |
| TC-008 | Cronologia criar→alterar→revisar→assinar | E2E | Parcial (B) | Estender com versões (P1-06) |
| TC-009 | Aditivo preserva original | pgTAP + E2E | **Não** | Criar com P1-06 |
| TC-010 | Formalizar sem execução ⇒ sem afirmar execução | E2E | Implícito em B (sem tela); A ✔ | Teste explícito de léxico/estado |
| TC-011 | PJ/representante **não** consegue ser parte (ADR-011) | pgTAP | **Não** | Criar teste negativo na Etapa 1 |
| TC-012 | Recuperação do backup | Operacional | Parcial (sem Storage/Auth) | Repetir com P0-07 |

Camadas: **unitários** (canonização, hash, verificador) · **integração/pgTAP** (RLS, triggers, transições,
concorrência real com dois clientes) · **contrato de API** (webhook) · **E2E** (aceite, dossiê, rotas) ·
**segurança** (IDOR, `service_role` fora do cliente — `scripts/security-audit.mjs` já cobre parte).
Não considerar suficiente a contagem atual de testes; critério é cada requisito P0 com um teste que falhe sem o
controle.

## K. Plano de execução incremental (pequeno, reversível, com gates)

| Etapa | Escopo | Gate de saída |
| --- | --- | --- |
| 0 | Decisões L-1…L-11; conferência das normas; parecer jurídico preliminar | Registro das decisões em ADR. **Andamento (08/10/2026):** L-2 decidida ([ADR-011](adr/ADR-011-escopo-de-partes.md)); normas conferidas ([conferência](conferencia-normas-2026-10-08.md)), exceto LGPD; pendentes: parecer jurídico e L-1, L-3…L-11 |
| 1 | P0-01, P0-05, P0-08, P0-09 (sem mudança funcional) | CI verde; testes novos falham sem o controle; histórico de migrations coerente |
| 2 | P0-04 (privilégios e transições) | `supabase test db` + advisors; teste de reversão em staging |
| 3 | P0-03 e P0-02 (canônico v2 e aceite com hash) | pgTAP A e B; E2E; documentos v1 ainda verificam |
| 4 | P0-06, P0-07 (retenção, backup completo, restauração testada) | Relatório de restauração com anexo |
| 5 | P1-01, P1-03, P1-08, P1-09 | PDF verificável; step-up funcionando |
| 6 | P1-02 ou P1-10 conforme L-1; P1-04/05 | Verificador offline valida pacote real de staging |
| 7 | P1-06, P1-07 (versões/aditivos/execução B) | TC-001/009/010 |
| 8 | Piloto com produção provisionada (L-7) | Checklist de prontidão |

Cada etapa: branch própria, migração nova reversível, publicação em staging antes de produção, nenhum dado real
em desenvolvimento/testes.

## L. Pendências para decisão humana

| # | Decisão | Opções / observações | Quem decide |
| --- | --- | --- | --- |
| L-1 | **DECIDIDO em 09/10/2026 (direção)**: carimbo do tempo primeiro; código preparado para provedor de assinatura depois | [ADR-012](adr/ADR-012-ancora-de-tempo-e-provedor-de-assinatura.md). Pesquisa feita em [pesquisa-fornecedores-2026-10-09.md](pesquisa-fornecedores-2026-10-09.md). **Pendente:** escolher fornecedor de carimbo (cotação) e aprovar custo; provedor de assinatura só após parecer jurídico | Responsável do projeto (direção feita; contratação pendente) |
| L-2 | ~~Escopo de partes~~ **DECIDIDO em 08/10/2026**: pessoas jurídicas como contratantes ficam fora por ora | Registrado na [ADR-011](adr/ADR-011-escopo-de-partes.md), com gatilhos de reabertura | Responsável do projeto (feito) |
| L-3 | **DECIDIDO em 09/10/2026**: reautenticação por **senha** nos atos de compromisso; PIN não adotado; MFA (TOTP) preparado como política por ato | [ADR-013](adr/ADR-013-autenticacao-de-transacao.md). Pendente só o detalhe (duração da janela de reautenticação) | Responsável do projeto (feito) |
| L-4 | **Modelo contratual**: texto do instrumento, cláusulas de pagador/beneficiário, vencimento, cancelamento, efeito da aprovação institucional | Já sinalizado como pendente em `agreement-evidence-dossier.md` | Jurídico |
| L-5 | **Dados pessoais**: IP/UA/geolocalização; base legal; retenção; campos livres | LGPD; minimização | Jurídico + DPO |
| L-6 | **Execução do serviço no fluxo B**: aceitar confirmação bilateral? | Preserva separação contrato × execução | Produto |
| L-7 | **Infraestrutura**: provisionar produção (região `sa-east-1`?), PITR, off-site, plano pago | Custo; transferência internacional atual (`us-east-2`) | Responsável do projeto |
| L-8 | **Alterações irreversíveis**: revogar grants, tornar `confirmed` terminal, política de descarte | Exige janela e backup prévio | Responsável do projeto |
| L-9 | ~~**Commit/publicação**~~ **Resolvido**: o "Registrar acordo" entrou na `main` (#29, `9a9e190`). **Novo:** a `main` avançou (#30–#33, com migrations `20261007150000_peer_group_kinds`, `20261007150100_peer_groups`, `20261008120000_shift_end_notifications`) depois da auditoria; é preciso revisar esse delta (grupos de colegas podem afetar aprovação e vínculo) | Auditoria de delta (Etapa 1) |
| L-9-orig | **Commit/publicação** do subsistema "acordo externo" (hoje só no working tree e no banco local) | Pré-requisito de P0-01 | Responsável do projeto |
| L-11 | **DECIDIDO em 09/10/2026**: CPF mascarado + compromisso criptográfico (sal secreto) nos documentos; apresentação do CPF completo **adiada** | [ADR-014](adr/ADR-014-cpf-nos-documentos.md). Contexto: CPC 798, II, b ([conferência](conferencia-normas-2026-10-08.md)). Pendente: formato da máscara e política de revelação | Responsável do projeto (feito); jurídico + DPO (revelação) |
| L-10 | **Retroatividade**: aceitar que acordos v1 permanecem sem aceite ligado à versão | Alternativa: re-aceite voluntário | Produto + jurídico |

## Critério de encerramento desta fase

A auditoria cumpre os critérios do §15 quando: cada achado cita evidência (feito), nada foi declarado existente
sem confirmação (feito; limites no §0 da auditoria), pendências estão marcadas como NÃO VERIFICADO (SEG-002,
estado remoto das migrations, painéis de provedores) e nenhuma alteração de produção foi feita.
**Aguardando autorização para iniciar a Etapa 0 e a Etapa 1.**
