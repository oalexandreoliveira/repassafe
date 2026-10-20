# Matriz de conformidade — confiabilidade documental

Data de referência: 08/10/2026 · Complementa [auditoria-confiabilidade.md](auditoria-confiabilidade.md) · Plano em [plano-adequacao.md](plano-adequacao.md)

**Legenda.** Estado: Implementado / Parcial / Ausente / Não verificado. "Implementado" significa que existe no
código e que há teste declarado; _não_ que eu reexecutei o teste (ver §0 da auditoria). **A** = fluxo de oferta
(grupo/livre, `shift_agreements`); **B** = "Registrar acordo" (`external_agreements`). Prioridade: P0 = fundamento
de confiabilidade/segurança; P1 = aprimoramento probatório; P2 = evolução.
Siglas de evidência: `M-dossiê` = `20260924153352_agreement_evidence_dossier.sql`; `M-ext` =
`20261007034010_external_agreement_registration.sql`; `M-core` = `20260923000759_core_shift_flow.sql`.

**Totais:** 42 requisitos · Implementado 4 · Parcial 27 · Ausente 9 · Fora de escopo 1 · Não verificado 1.

## 6.1 Fidelidade contratual

| ID | Requisito | Estado | Evidência | Lacuna | Impacto | Pri | Ação recomendada | Critério de aceite |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FID-001 | Identificação das partes | Parcial | A: `agreement_documents.canonical_content.parties` (UUID + nome de exibição). B: `private.external_person` (nome, CRM, UF, status) | A sem CRM/UF; sem nome civil (PJ fora de escopo, ADR-011) | Jurídico | P1 | Schema v2 do canônico com CRM/UF e nome civil; tratamento do CPF pendente (L-11) | Documento v2 contém identificadores; pgTAP compara com perfil na data do aceite |
| FID-002 | Condições essenciais | Parcial | A: `snapshot` (início, fim, setor, valor, `payment_terms` livre). B: `terms` (+ local, `due_date`, `payment_method`, notas) | A sem vencimento estruturado, sem local próprio e sem `notes`; objeto/duração só por horário | Jurídico | P1 | Levar `due_date`/`payment_method`/local ao fluxo A ou unificar no modelo B; incluir `notes` no snapshot | Acordo A novo exige vencimento; snapshot contém todos os campos exibidos |
| FID-003 | Pré-visualização integral antes do aceite | Parcial | B: resumo na tela e E2E (`external-agreements.spec.ts`, declarado); A: tela `/plantoes/[id]` não auditada em detalhe | Pré-visualização não é persistida como o que foi exibido; A não verificado | Jurídico/UX | P1 | Persistir o texto renderizado/versão do template aceito (ver FID-007); auditar tela de confirmação A | E2E confirma exibição de todos os campos antes do botão de aceite, nos dois fluxos |
| FID-004 | Concordância vinculada à versão | Parcial | B: `terms_hash` obrigatório no `accept` (pgTAP "acceptance binds exact terms"). A: aceite do substituto sem hash; documento gerado depois (`create_agreement_dossier` AFTER INSERT) | A prova a ligação só por inferência | Jurídico | **P0** | Exigir `terms_hash`/`document_sha256` no comando `confirm_substitution` e `publish/update_offer`; gerar o documento antes do aceite | pgTAP: confirmar com hash divergente falha; evento de aceite contém o hash |
| FID-005 | Controle de alterações materiais → nova versão + novo aceite | Parcial | A: `update_offer` só antes da 1ª candidatura; `select_candidate` exige ack mais recente que `updated_at`. B: condições imutáveis, "corrigir = novo convite" | Não há versão encadeada nem pedido de alteração | Jurídico | P1 | Introduzir `version`/`supersedes_id`; estado `CHANGES_REQUESTED` | Alterar material gera versão N+1 e zera aceites; versão N permanece legível |
| FID-006 | Sem preenchimento silencioso | Implementado | A: `shift_agreements_immutable`; B: `external_guard`; pgTAP em ambos | Papel privilegiado ignora triggers (ver INT-002) | Jurídico/Segurança | P0 | Manter + reduzir privilégios (SEG/INT) | pgTAP de UPDATE por `authenticated` e `service_role` falha em campos protegidos |
| FID-007 | Interface = conteúdo assinado (inclui anexos) | Parcial | Canônico estruturado em `canonical_content`/`document_text`; comprovantes referenciados por caminho com SHA-256 no nome | Sem `template_version` nem texto renderizado; A omite `notes`; hash do anexo não validado pelo banco | Jurídico | **P0** | Gravar `template_version` + texto renderizado no canônico v2; validar hash do anexo no evento | Teste compara texto exibido × texto guardado; alterar template não muda documentos antigos |
| FID-008 | Aditivos sem apagar histórico | Ausente | — | Sem relação entre instrumentos | Jurídico | P1 | `parent_agreement_id` + tipo `amendment`; novo aceite das duas partes | Aditivo formalizado mantém original intacto e verificável |

## 6.2 Identidade e assinatura

| ID | Requisito | Estado | Evidência | Lacuna | Impacto | Pri | Ação recomendada | Critério de aceite |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUT-001 | Identificação/autenticação proporcionais | Parcial | `external_eligible` (e-mail confirmado, nome civil, CPF, nascimento, telefone, CRM); análise administrativa; MFA só admin (`require-admin-mfa.ts`) | Sem step-up no aceite; sem registro do método (aal/amr) | Jurídico | P1 | Reautenticação ou TOTP (`aal2`) no aceite; gravar `aal`/`amr` no evento | Aceite sem step-up é recusado; evento traz método |
| AUT-002 | Aceite inequívoco | Implementado | B: `input.accepted='true'` + `terms_hash`; A: `terms_acknowledged` (`enforce_confirmation_business_rules`); pgTAP | Aceite afirmativo ≠ assinatura (não afirmar o contrário) | Jurídico | P0 | Manter; revisar texto do botão ("Aceito estas condições") | E2E: sem checkbox/flag não confirma |
| AUT-003 | Provedor de assinatura | Ausente | Sem SDK/integração (`package.json`) | Decisão de produto e jurídica pendente | Jurídico | P1 | RFC de seleção (critérios no plano §L) | Prova de conceito assina o PDF final e devolve relatório |
| AUT-004 | Assinatura referida ao conjunto final | Parcial | B: eventos carregam `document_hash`; A: eventos carregam `document_sha256` | Sem assinatura sobre o artefato; sem PDF | Jurídico | P1 | Assinar/atestar o PDF final e o hash do canônico | Assinatura valida apenas para o hash do documento final |
| AUT-005 | Evidências de assinatura preservadas | Parcial | `actor_id`, `occurred_at`, `recorded_at`, `event_hash` | Sem IP/UA (decisão adiada), sem método, sem comprovantes de provedor | Jurídico | P1 | Metadados minimizados (após base legal) + armazenar relatório do provedor | Pacote contém relatório original do provedor |
| AUT-006 | Poderes de representação | **Fora de escopo (ADR-011)** | `docs/adr/ADR-011-escopo-de-partes.md` | PJ como contratante excluída em 08/10/2026; sem lacuna a corrigir | — | — | Teste negativo (TC-011); reabrir pelos gatilhos da ADR | pgTAP confirma que só pessoa natural elegível é parte |

## 6.3 Integridade

| ID | Requisito | Estado | Evidência | Lacuna | Impacto | Pri | Ação recomendada | Critério de aceite |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| INT-001 | SHA-256 do conteúdo final assinado | Parcial | `document_sha256` (A), `document_hash` (B) sobre texto JSON canônico | Hash do JSON, não de um arquivo final; texto de `jsonb::text` não é canonização padronizada | Jurídico | P0 | Gerar PDF/A final, guardar SHA-256 do arquivo; canonização estável documentada | Hash do arquivo exportado = hash em banco |
| INT-002 | Imutabilidade lógica | Parcial | Triggers de A e B; pgTAP de `shift_agreements` e B | Sem teste para `agreement_documents`/`evidence_events`; B permite alterar `status`/`received_at` fora do comando; sem proteção de `TRUNCATE` | Segurança/Jurídico | **P0** | Trigger de transição de estado; `revoke truncate/update/delete` de todos os papéis exceto owner; testes | pgTAP: UPDATE de `status` de acordo `confirmed` falha para qualquer papel de aplicação |
| INT-003 | Versionamento preserva anteriores | Parcial | Eventos append-only; comprovante `upsert:false` | Documento tem uma só versão | Jurídico | P1 | Ver FID-005 | Versão N preservada após N+1 |
| INT-004 | Detecção de adulteração | Parcial | `verifyAgreementEvidence`, `verifyEventChain` (recalculam hash e cadeia) | Sem teste de bytes adulterados; quem controla o banco recalcula tudo | Jurídico/Segurança | **P0** | Teste automatizado de adulteração (TC-002) + âncora externa (INT-006) | Alterar 1 byte de `document_text` ou de evento → verificação falha |
| INT-005 | Persistência protegida (UPDATE/DELETE) | Parcial | RLS + `revoke all` + `grant select`; `service_role` com `grant all` em tabelas B | Privilégio de `service_role` amplo; uso de `createAdminClient` em ações | Segurança | **P0** | Reduzir grants de `service_role` nas tabelas de evidência a `select`/`insert` via função | `has_table_privilege('service_role', …, 'update')` = false nas tabelas de evidência |
| INT-006 | Verificação independente | Ausente | Verificação ocorre no servidor do Repassafe, com dados do Repassafe | Nenhum meio externo; nenhuma âncora de tempo/assinatura | Jurídico | P1 | Carimbo RFC 3161 sobre hash do documento e topo da cadeia + verificador offline | Terceiro valida sem acessar o Repassafe |

## 6.4 Auditoria

| ID | Requisito | Estado | Evidência | Lacuna | Impacto | Pri | Ação recomendada | Critério de aceite |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUD-001 | Registro dos eventos relevantes | Parcial | A: 4 tipos + `audit_events`; B: 9 tipos | A sem eventos de recusa/cancelamento no dossiê; sem visualização | Operacional/Jurídico | P1 | Ampliar tipos no A; evento de "documento visualizado" opcional | Cronologia completa nos dois fluxos |
| AUD-002 | Identidade do ator | Implementado | `actor_id` (B: `not null` FK); A: nulo apenas em `document_generated` (sistema) | — | Jurídico | P0 | Manter | pgTAP: evento humano sem ator é recusado |
| AUD-003 | Registro temporal confiável | Parcial | `now()`/`clock_timestamp()` em `timestamptz` | Sem carimbo de tempo independente | Jurídico | P1 | Ver INT-006 | Carimbo anexado ao dossiê |
| AUD-004 | Evento vinculado à versão | Parcial | A: `document_sha256` em todo evento; B: `terms_hash` em `created`/`accepted`; `document_hash` após confirmar | B: eventos de recusa/cancelamento sem hash | Jurídico | P1 | Incluir sempre `terms_hash` no canônico do evento | Todo evento B contém `terms_hash` |
| AUD-005 | Proteção dos logs | Parcial | Triggers de imutabilidade; hash encadeado; `audit_events_immutable` | Sem proteção contra privilégio alto; sem âncora do topo da cadeia | Segurança | P0 | Ver INT-002/005; verificação periódica automatizada | Job detecta cadeia quebrada e alerta |
| AUD-006 | Falhas e tentativas rejeitadas | Ausente | Exceções fazem _rollback_ sem registro (`external_command`) | Nada persiste sobre tentativa inválida de aceite/assinatura | Jurídico/Segurança | P1 | Registro fora da transação (server action) com código de motivo, sem dados sensíveis | Tentativa recusada gera linha em `contract_rejections` |
| AUD-007 | Histórico reconstruível | Parcial | Listas ordenadas por `sequence`/`recorded_at`; telas de histórico | Sem exportação cronológica | Operacional | P1 | `eventos.json` + `cronologia.pdf` no dossiê | Reconstrução idêntica a partir do pacote |

## 6.5 Evidência e exportação

| ID | Requisito | Estado | Evidência | Lacuna | Impacto | Pri | Ação recomendada | Critério de aceite |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PRV-001 | Documento final aceito | Parcial | Página imprimível (`/acordos/[id]`, `/acordos/registrados/[id]`) | Sem arquivo final preservado | Jurídico | P1 | PDF final gerado no servidor + hash | `contrato-final.pdf` baixável e verificável |
| PRV-002 | Relatório de assinaturas | Ausente | — | Sem provedor | Jurídico | P1 | Depende de AUT-003 | Relatório do provedor incluído |
| PRV-003 | Histórico de versões e concordâncias | Ausente | — | Sem versões | Jurídico | P1 | Depende de FID-005 | Linha do tempo de versões no dossiê |
| PRV-004 | Dossiê probatório | Ausente | Só "Imprimir/Salvar como PDF" | Sem pacote nem manifesto | Jurídico | P1 | Central de Evidências + ZIP (`manifest.json`) | TC-007 |
| PRV-005 | Verificação externa documentada | Ausente | — | Sem instruções nem verificador | Jurídico | P1 | `instrucoes-verificacao.txt` + script offline | Pessoa externa verifica seguindo o texto |
| PRV-006 | Execução do serviço separada | Parcial | A: `shift_completions` (um lado reporta, o outro confirma) e `shift_occurrences`; B: não há | B sem registro de execução | Jurídico | P1 | Reusar o modelo de A; rótulos "declarado"/"confirmado" | TC-010 nos dois fluxos |
| PRV-007 | Disponibilidade para as partes | Parcial | RLS permite leitura por ambas as partes | Sem download do arquivo final; retenção indefinida | Operacional | P1 | Exportação por parte + política de retenção | Cada parte baixa o dossiê |

## 6.6 Segurança e privacidade

| ID | Requisito | Estado | Evidência | Lacuna | Impacto | Pri | Ação recomendada | Critério de aceite |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEG-001 | Autorização por recurso | Implementado | RLS; `security_rls_matrix.sql`; `external_can_read`; storage policies | `service_role` em páginas admin e ações (ver INT-005) | Segurança | P0 | Manter matriz; adicionar caso para `/comprovante` e `/acordos/[id]` | Usuário de fora recebe 404/401 em ambas as rotas (E2E) |
| SEG-002 | Criptografia | Não verificado | Provedores gerenciados (TLS/repouso) — painéis não inspecionados | Sem evidência no repositório | Segurança | P0 | Anexar evidência do provedor (plano, região, TLS, repouso) | Documento de evidência com prints/links de configuração |
| SEG-003 | Segregação de ambientes | Parcial | `environments.md`; E2E recusa Supabase fora de localhost; seeds fictícios | Produção inexistente; staging recebe dados reais? (não verificado) | Segurança | P0 | Regra escrita "sem dados reais fora de produção" + verificação | Checklist assinado antes do piloto |
| SEG-004 | Backups | Parcial | `create-logical-backup.ps1`; validação 30/09 (RPO 24 h) | Sem Storage e sem Auth; operador local; sem PITR; restauração de comprovantes não testada | Operacional | **P0** | Backup do bucket + Auth; destino off-site; PITR em produção | TC-012 restaura acordo + comprovante + identidade |
| SEG-005 | Retenção | Ausente | Termos: encerramento "não apaga automaticamente evidências" | Sem prazos/fundamentos/descarte | Jurídico | **P0** | Política de retenção por categoria, aprovada juridicamente | Documento publicado + rotina testada |
| SEG-006 | Minimização | Parcial | Canônico B sem CPF; cadastro coleta CPF/nascimento para identidade | Sem registro de necessidade por campo | Jurídico | P1 | Inventário de dados (ROPA simplificado) | Cada campo tem finalidade e base legal |
| SEG-007 | Dados sensíveis/pacientes | Parcial | Termos proíbem; limites de tamanho nos campos | Campos livres (`notes`, `payment_terms`, `dispute.description`) sem controle técnico | Jurídico | P1 | Aviso no campo + validação heurística + canal de remoção | Teste rejeita padrões óbvios (CPF de paciente, "prontuário") |
| SEG-008 | Auditoria de acesso | Parcial | `audit_events` de comandos | Leitura de dossiê/comprovante e acesso admin via `service_role` sem registro | Segurança | P1 | Evento de leitura mínima (quem/quando/recurso) | Download de comprovante gera evento |

Nota: AUT-006 saiu do cômputo de lacunas por decisão registrada na ADR-011. Fundamentos normativos: [conferencia-normas-2026-10-08.md](conferencia-normas-2026-10-08.md).
