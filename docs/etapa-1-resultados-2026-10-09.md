# Etapa 1 — resultados (09/10/2026)

Escopo: sem mudança funcional. Auditoria do delta da `main`, testes de integridade, teste de linguagem,
esqueleto de interfaces e verificação local do banco. Plano: [plano-adequacao.md](plano-adequacao.md).

## 1. Como foi verificado

- **Banco:** nenhuma migration foi aplicada no banco de desenvolvimento. Criei duas cópias descartáveis no mesmo
  contêiner local (`audit_scratch`: cópia completa com os dados de dev; `audit_clean`: só o schema), apliquei nelas
  as migrations que faltavam e executei os testes pgTAP. **As duas cópias foram apagadas.** Nada remoto foi tocado.
- **Aplicação:** Vitest dos arquivos novos, ESLint e Prettier sobre eles, `tsc` (sem erros fora de `.next/`, onde
  há tipos gerados antigos de rota que não existe mais).
- **Não executado:** suíte Vitest completa, Playwright, `supabase db lint/advisors`, qualquer ambiente remoto.

## 2. Resultados dos testes

| Suíte | Resultado |
| --- | --- |
| pgTAP existente (12 arquivos) em cópia com as 4 migrations pendentes | Todos passam, exceto `security_rls_matrix.sql` com **3 falhas por dados de dev** (conta linhas visíveis e supõe banco vazio) |
| `security_rls_matrix.sql` em schema limpo | **17/17** |
| `mvp_acceptance_flow.sql`, `external_agreements.sql` em schema limpo | 20/20 e 45/45 |
| **Novo** `supabase/tests/evidence_integrity.sql` | 17 passam + **4 TODO** (lacunas conhecidas, abaixo); 0 falhas |
| **Novo** `tests/agreement-evidence-verification.test.ts` | 14 testes: adulteração de documento, hash, snapshot, evento, ordem, remoção, encadeamento, ator, acordo trocado |
| **Novo** `tests/product-language.test.ts` | 2 testes: vocabulário proibido (seção 13) e ausência de PJ nas telas de acordo (ADR-011) |

Observação sobre `security_rls_matrix.sql`: o teste não é hermético; falha em qualquer banco com dados de
desenvolvimento. Recomendo ajustá-lo para contar só as linhas que ele mesmo cria (item de manutenção, baixo).

## 3. Achados novos

**A1 — `service_role` tem privilégio total sobre as tabelas de evidência.** Os privilégios padrão do Supabase
concedem `ALL` (inclusive `TRUNCATE`) ao `service_role` em toda tabela de `public`; o `grant select ... to
service_role` das migrations não restringe isso. `UPDATE`/`DELETE` seguem barrados por gatilhos, mas **`TRUNCATE`
não é barrado** e o papel é usado pelo servidor (admin, métricas, limpeza de comprovantes). Evidência:
`information_schema.role_table_grants` na cópia limpa; teste TODO nº 12 e nº 20. → reforça **P0-04**.

**A2 — As partes podem não conseguir ler a trilha de evidências do fluxo de oferta.** A migration
`20260924165317_private_applicant_rls_helper.sql` executa `revoke all on public.agreement_evidence_events from
public, anon, authenticated` ("para a auditoria estática refletir o estado final"), mas `/acordos/[id]` lê essa
tabela com a sessão do usuário (só administradores usam `service_role`). Com o privilégio revogado a consulta
retorna erro; a página ignora o erro, recebe lista vazia e exibe "cadeia de eventos divergente" para as partes.
**Evidência:** erro `permission denied for table agreement_evidence_events` ao ler como `authenticated` (teste
TODO nº 15) e leitura no código (`src/app/acordos/[id]/page.tsx`). **A confirmar abrindo a página real com uma
conta de parte**, o que não fiz. Impacto: PRV-001, AUD-007 e a credibilidade da verificação exibida. Correção
provável: restaurar `GRANT SELECT` (a policy de leitura já existe) e fazer a página tratar erro de leitura como
"indisponível", não como "divergente".

**A3 — Deriva de migrations no banco local.** _Atualização: o histórico do staging foi conferido e tem as mesmas 25
versões do repositório; a deriva é só local (ver [evidencias-infraestrutura-2026-10-09.md](evidencias-infraestrutura-2026-10-09.md))._ O histórico do banco de desenvolvimento tem 21 versões e o
repositório tem 25. Faltam `20261001120000` (métricas), `20261007150000`/`150100` (grupos de colegas) e
`20261008120000` (fim de plantão). Esta última **foi aplicada sem registro de histórico** (a coluna
`substitutions.end_notified_at` já existe), o que confirma execução manual fora do fluxo de migrations. Estado de
staging: **não verificado**. Proposta: aplicar as pendentes em dev pela CLI e registrar o histórico (precisa da
sua autorização); depois promover a staging.

**A4 — Grupos de colegas ampliam o alcance dos acordos sem aprovação institucional.**
`20261007150100_peer_groups.sql` (a) permite acordos externos em grupos sem instituição (`external_member`), com
`requires_approval = false` por restrição, ou seja, dois aceites bastam; (b) **reescreve em tempo de migration** a
função `create_agreement_dossier` por substituição de texto (`pg_get_functiondef` + `replace`), então a definição
vigente não aparece em nenhum arquivo `.sql`; (c) deixa `institution_name` nulo no documento, enquanto o tipo da
página assume texto. Não é erro por si, mas: precisa de teste de dossiê com grupo de colegas e de um snapshot da
definição vigente da função para revisões estáticas. Isso é consistente com ADR-011 (a pessoa jurídica não é
parte), porém "grupo de colegas" não é "instituição": o texto do documento não deve sugerir aval institucional.

**A5 — `verifyEventChain` da página `/acordos/[id]` não está exportado nem testado.** A lógica equivalente do
fluxo B (`verifyAgreementEvidence`) agora tem testes; a do fluxo A vive dentro da página. Proposta: extraí-la
para `src/lib/` (refatoração pequena, a fazer só com sua aprovação por tocar uma tela em produção).

## 4. Situação dos itens P0

| Item | Estado |
| --- | --- |
| P0-01 reconciliar migrations | **Diagnosticado** (A3); aplicar em dev e promover a staging dependem de autorização |
| P0-02/03 aceite com hash, canônico v2 | Não iniciado (Etapa 3) |
| P0-04 endurecimento de privilégios | **Testes TODO criados** (nº 12, 20, 21); correção não iniciada (Etapa 2) |
| P0-05 testes de integridade | **Feito em parte**: imutabilidade, adulteração SQL e de verificação, RLS. Falta teste de concorrência real e extração do verificador do fluxo A (A5) |
| P0-06 retenção | Não iniciado (depende do jurídico) |
| P0-07 backup completo | Não iniciado |
| P0-08 evidência de criptografia e região | **Bloqueado**: exige acesso aos painéis Supabase/Vercel. Checklist abaixo |
| P0-09 linguagem | **Feito**: teste no CI (`tests/product-language.test.ts`) |
| TC-011 negativo (ADR-011) | **Feito** (`evidence_integrity.sql`, testes 17–19) |
| Interfaces de provedores (ADR-012) | **Feito** como tipos: `src/lib/evidence/providers.ts` (sem uso em runtime) |

### Checklist para P0-08 (você, com acesso aos painéis)

1. Supabase: região do projeto; plano; criptografia em repouso e TLS (documentação do plano); backups/PITR ativos?
2. Auth: política mínima de senha, confirmação de e-mail obrigatória, rate limits, MFA habilitado.
3. Storage: bucket `agreement-receipts` privado; políticas sem UPDATE/DELETE.
4. Vercel: região das funções, variáveis por ambiente, retenção de logs.
5. Registrar no repositório apenas a conclusão, sem identificadores nem chaves.

## 5. Decisões e próximos passos

1. **Etapa 2 (P0-04)** corrige A1 e fecha os TODO nº 12, 20 e 21; **antes disso, a A2** merece prioridade por
   afetar o que as partes veem hoje (confirmar no navegador).
2. Preciso da sua autorização para: (a) aplicar as migrations pendentes no banco de dev e registrar o histórico;
   (b) tocar `/acordos/[id]` (A2 e A5).
3. Fornecedores: cotação feita por você ([pesquisa](pesquisa-fornecedores-2026-10-09.md)).
