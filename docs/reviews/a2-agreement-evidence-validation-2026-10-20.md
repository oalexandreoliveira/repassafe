# A2 — leitura da trilha de evidências (20/10/2026)

Correção do achado A2 de `docs/etapa-1-resultados-2026-10-09.md`.

- A migration `20261020202508_restore_authenticated_evidence_read.sql` restaura
  somente `SELECT` para `authenticated` em `agreement_evidence_events`. Não altera
  policies, gatilhos, dados, funções privilegiadas ou acesso administrativo.
- `/acordos/[id]` verifica os erros das consultas. Falha de leitura da trilha
  produz estado indisponível, sem selo de integridade ou alegação de divergência;
  dados parciais são descartados. O documento legível continua disponível.
- Uma consulta bem-sucedida com cadeia vazia, incompleta ou adulterada continua
  divergente. Divergência detectada no documento não é ocultada por falha na trilha.
- Falha ao ler o documento tem aviso e nova tentativa; documento ausente ou
  ocultado por RLS, sem erro de consulta, continua retornando 404.
- A nova tentativa faz uma navegação completa para repetir as consultas. As
  partes continuam usando a sessão autenticada, sem fallback para `service_role`.

## Validação

| Verificação                                          | Resultado                                                                                                                                                                                                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vitest completo                                      | 31 arquivos, 163 testes aprovados                                                                                                                                                                                                              |
| Nova regressão da página                             | 15 testes: sessão da parte, permissões, timeout, falha de rede retornada pelo cliente, dados parciais/nulos, cadeia íntegra/vazia/adulterada/incompleta, JSON inválido, documento indisponível/ausente/adulterado e revalidação administrativa |
| `evidence_integrity.sql`                             | 28 aprovados e 3 TODOs preexistentes de P0-04; nenhuma falha inesperada                                                                                                                                                                        |
| `security_rls_matrix.sql`                            | 17/17                                                                                                                                                                                                                                          |
| `mvp_acceptance_flow.sql`                            | 20/20                                                                                                                                                                                                                                          |
| TypeScript, ESLint e Prettier dos arquivos alterados | Aprovados; tipos antigos de rotas em `.next` foram regenerados/removidos                                                                                                                                                                       |
| Auditoria estática de segurança                      | Aprovada: 24 tabelas públicas                                                                                                                                                                                                                  |
| Chromium, 390 × 900 e 1280 × 900                     | Estados íntegro, divergente e indisponível sem overflow horizontal; nova tentativa alcançável por Tab, foco visível e altura de 44 px                                                                                                          |

O teste SQL A2 deixou de ser TODO. Além do privilégio de tabela, agora exercita
leituras reais como titular, substituto, aprovador ativo, aprovador inativo,
terceiro, membro comum do grupo e `anon`. Verifica também RLS habilitada e ausência
de privilégios de escrita, truncamento e alteração estrutural para `authenticated`.
Os testes existentes de imutabilidade continuam passando.

Os testes SQL rodaram em `a2_regression_20261020`, uma base descartável no
contêiner local, com schema copiado sem dados de usuários e migrations ausentes
aplicadas apenas nessa cópia. A migration de fim de plantão já estava refletida
no schema de origem. O banco descartável foi removido após a execução.

A inspeção visual usou o componente real com fixtures sintéticas em uma rota
temporária, removida depois. Não houve teste E2E com conta real nem aplicação
da migration no banco de desenvolvimento, staging ou produção. Os três TODOs
restantes tratam de P0-04 e não fazem parte desta correção.
