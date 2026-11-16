# Publicação da agenda e dos documentos 2026-11-15

Data: 16/11/2026, madrugada (horário de Fortaleza: noite de 15/11).
Roteiro seguido: [promocao-2026-11-agenda.md](../operations/promocao-2026-11-agenda.md).

## O que foi publicado

- Commit `8c70aa8` da `main`: agenda pessoal (#40), lembretes e cobrança
  (#41) e Termos e Política versão 2026-11-15 (#42). Os avisos críticos (#37)
  e as correções da revisão (#39) já tinham migrations no banco e passaram a
  ter o front-end publicado; `CRITICAL_EMAIL_ENABLED` segue desligado.
- Vercel: o build de Preview `repassafe-staging-nvoj1fwy3` foi promovido e
  gerou o deploy de produção `repassafe-staging-kmtyukdm4`, que serve
  `www.repassafe.com.br`. Retorno disponível: `repassafe-staging-1e8uokanv`
  (commit `67da4b2`).
- Supabase `gfcbnfzyucggdwjtybnm`: `supabase db push --linked` (CLI 2.117.0)
  aplicou `20261115120000_personal_agenda`, `20261115180000_agenda_reminders`
  e `20261115200000_legal_documents_2026_11_15`, após ensaio com `--dry-run`.

## Antes

- Backup do esquema e dos dados do banco publicado com `supabase db dump`,
  guardado fora do repositório.
- CI do #42 aprovado em todas as etapas, inclusive `supabase test db`, lint e
  advisors de segurança. Dois testes antigos dependiam do horário (data UTC
  como data de pagamento) e foram corrigidos no próprio PR.

## Verificação

- Histórico remoto com as três migrations; `cron.job` com
  `agenda-payment-reminders` ativo em `0 11 * * *`.
- Aviso `legal.updated` entregue às 4 contas existentes.
- Público: `/api/health` 200, `/api/ready` 401 sem token, `/entrar`,
  `/lista-de-espera`, `/termos` e `/privacidade` 200; os dois documentos
  mostram a versão 2026-11-15 e a seção da agenda; `/agenda` sem sessão leva a
  `/entrar`.
- Banco: leitura anônima de `agenda_entries` e `agenda_record_reminders` e
  execução anônima de `agenda_command` recusadas (401).

## Limites

- Sem teste autenticado em produção: não há conta de teste autorizada nesse
  ambiente. O fluxo autenticado foi validado no banco local com contas
  sintéticas.
- A primeira execução real da rotina de lembretes será às 8h de Fortaleza.
- A versão 2026-09-29 dos documentos ainda é aceita no envio do cadastro até
  17/11/2026 0h em Fortaleza; depois, só a versão atual.
- Pendentes nas minutas: encarregado, região e prazos de retenção.
