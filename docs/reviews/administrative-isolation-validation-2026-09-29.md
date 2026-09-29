# Validação do isolamento administrativo — 29/09/2026

Implementação local na branch `codex/free-shift-offers`. Nenhuma migração foi
aplicada ao remoto e nenhuma alteração deste trabalho foi commitada.

## Evidência

- 40 testes Vitest aprovados em 15 arquivos, incluindo identidade administrativa
  sem consulta ao perfil, aal1 versus aal2, revogação, leitura indisponível e
  sessão inválida. Comando: `pnpm test --exclude '**/.codex-worktrees/**'`.
- `pnpm typecheck` e `pnpm lint` aprovados.
- `pnpm build --webpack` aprovado, incluindo todas as rotas administrativas,
  de autenticação e do produto. Turbopack falhou na compilação CSS neste ambiente;
  o build foi verificado com webpack.
- Auditoria estática `pnpm check:security` aprovada: 21 tabelas públicas com
  RLS/revogação de grants verificadas pelas regras do script.
- 20 cenários pgTAP de `supabase/tests/administrative_access.sql` aprovados no
  PostgreSQL local `supabase_db_repassafe` 17.6, dentro de transação com rollback.

O banco local estava na versão `20260924001301`. Para testar o schema atual,
as migrações posteriores foram carregadas temporariamente na mesma transação.
Funções legadas locais continham CRLF; seus textos foram normalizados para LF
somente dentro dessa transação, porque a migração antiga de ofertas livres
compara trechos literais. A migração nova normaliza seu próprio lookup de
função. O teste não altera permanentemente funções, registros, cron ou schema.
Isso não comprova que migrações antigas com CRLF sejam aplicáveis sem ajustes
em qualquer outro ambiente; validar a cadeia no ambiente de destino antes de
publicar o código.

Os advisors de segurança também retornaram sem issues no banco local
persistente. Esse resultado se refere ao schema anterior, já que o schema novo
foi revertido; não equivale a um advisor executado no schema novo publicado.

## Cenários do banco

1. Concessão não cria perfil médico.
2. Concessão gera auditoria.
3. Equipe lê sua própria existência/estado em aal1 para iniciar MFA.
4. Cliente não lê justificativas internas.
5. Cliente não atualiza concessões.
6. Cliente não cria concessões/autopromoção.
7. Análise de ocorrência é negada em aal1 no banco.
8. Profissional não descobre concessões de terceiros.
9. aal2 sozinho não concede administração.
10. Papel legado admin sem concessão não autoriza análise.
11. Administrador sem CRM/perfil analisa ocorrência em aal2.
12. Concessão gerencial não autoriza conclusão médica.
13. Ocorrência identifica o revisor por identidade Auth.
14. Auditoria aceita ator gerencial sem perfil médico.
15. Evidência CRM aceita verificador sem perfil médico.
16. Suspensão profissional não altera a concessão gerencial.
17. Revogação gera auditoria.
18. Histórico de concessão não pode ser apagado.
19. Revogação nega nova ação mesmo com JWT aal2 ainda válido.
20. Visitante anônimo não descobre concessões.

## Limites e publicação

Administração autenticada no navegador e SMS não foram exercitados. A revisão
visual se limitou a homepage e cadastro; a crítica detalha essas limitações.
Aplicar a migração nova após suas predecessoras e antes de publicar o código
que consulta `administrative_access`. Provisionamento da equipe usa Auth e
concessão confiável documentados em `docs/operations/access-administration.md`.
