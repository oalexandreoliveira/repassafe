# Promoção de novembro/2026: avisos críticos, correções e agenda

Status: em execução em 15/11/2026.
Referência: `docs/operations/deployment.md`, `environments.md`, `rollback.md`.

## O que entra

Produção serve hoje o commit `67da4b2` (PR #36, deploy de 04/11). A `main` está
em `e095f60`. Promover a `main` publica também:

| PR | Conteúdo | Migration |
| --- | --- | --- |
| #37 | Avisos críticos por e-mail (envio desligado por `CRITICAL_EMAIL_ENABLED=false`) | `20261103120000_critical_notification_emails.sql` |
| #39 | Correções da revisão independente | `20261110120000_review_blockers.sql`, `20261110130000_offer_terms_changed_at.sql` |
| #40 | Agenda, etapa 1 | `20261115120000_personal_agenda.sql` |
| #41 | Agenda, etapa 2 (lembretes, `pg_cron` às 11h UTC) | `20261115180000_agenda_reminders.sql` |
| este | Termos e Política versão 2026-11-15 | `20261115200000_legal_documents_2026_11_15.sql` |

Conferir também se `20261030170000_payment_events_service_role_privileges.sql`
já consta no histórico remoto.

## Ambiente

Destino: Vercel `repassafe-staging` (alvo `production`, `www.repassafe.com.br`)
e Supabase `gfcbnfzyucggdwjtybnm`, o ambiente que atende os usuários. Decisão
do responsável (15/11/2026): sem projeto Supabase adicional por ora.

Documentos legais: versão `2026-11-15` de Termos e Política (agenda pessoal e
Resend), com migration `20261115200000_legal_documents_2026_11_15.sql`. Novo
aceite no próximo envio do cadastro; a versão anterior vale até 17/11/2026 0h
em Fortaleza; todos os titulares recebem aviso na central.

## Compatibilidade

- As migrations da agenda e dos avisos são aditivas.
- `review_blockers` e `offer_terms_changed_at` endurecem regras existentes no
  servidor. O front-end em produção (`67da4b2`) já envia
  `owner_terms_acknowledged`, então continua funcionando com o schema novo.
- Ordem segura: **migrations primeiro, promoção depois**. O front-end novo
  falha sem as tabelas da agenda; o antigo funciona com o schema novo.
- Rollback da aplicação: promover de novo o deploy de `67da4b2`. O schema novo
  pode permanecer. Para parar os lembretes sem desfazer migration:
  `select cron.unschedule('agenda-payment-reminders');`.

## Passo a passo

1. **Backup:** exportar o banco `gfcbnfzyucggdwjtybnm` (o plano gratuito não tem
   backup do provedor) e guardar fora do Git.
2. **Conferir histórico:** `supabase migration list --linked`; listar as
   ausentes. Não usar `migration repair` para pular SQL.
3. **Aplicar em ordem**, cada uma numa transação: `supabase db push --linked`
   (CLI 2.117.0, como no CI). Interromper na primeira falha.
4. **Verificar no banco:**
   - `select version from supabase_migrations.schema_migrations order by version desc limit 6;`
   - `select jobname, schedule from cron.job where jobname in ('agenda-payment-reminders','expire-stale-shift-workflows');`
   - Security Advisors sem erro novo.
5. **Promover** o deploy de Preview de `e095f60` para produção na Vercel
   (`repassafe-staging-21pjymkex.vercel.app`). Confirmar
   `CRITICAL_EMAIL_ENABLED` ausente ou `false`.
6. **Smoke test** com conta de teste autorizada:
   - `/api/health` 200 e `/api/ready` 401 sem token;
   - `/agenda` sem sessão leva a `/entrar`;
   - criar duas datas, editar, marcar recebido, desfazer e excluir;
   - abrir `/agenda/pagamento/...` de um acordo de teste e salvar lembrete;
   - outra conta recebe 404 na anotação;
   - mural: publicar, candidatar e selecionar continuam funcionando.
7. **Monitorar 30 minutos** e, no dia seguinte, conferir que a rotina das 8h
   gerou avisos esperados (`event_type = 'agenda.payment_reminder'`) e nenhum
   e-mail desse tipo.
8. **Registrar** commit, deploy, migrations aplicadas e resultado do smoke test
   num relatório em `docs/reviews/`.

## Fora desta promoção

Ativar `CRITICAL_EMAIL_ENABLED` (exige Resend, token do job e agendador de um
minuto), agenda etapa 3, separação real entre homologação e produção.
