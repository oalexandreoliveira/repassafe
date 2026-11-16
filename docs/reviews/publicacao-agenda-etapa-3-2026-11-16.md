# Publicação da agenda, etapa 3

Data: 16/11/2026, manhã (horário de Fortaleza).
Roteiro seguido: [promocao-2026-11-agenda.md](../operations/promocao-2026-11-agenda.md)
(mesma ordem: banco antes da aplicação).

## O que foi publicado

- Commit `61b4982` da `main` (PR #44): arquivo para a agenda do celular
  (`.ics`) nas anotações e nos pagamentos do app, “Repassar este plantão” com
  dados preenchidos e plantão repassado unificado na agenda.
- Supabase `gfcbnfzyucggdwjtybnm`: `supabase db push --linked` (CLI 2.117.0)
  aplicou `20261116120000_agenda_handover`, após ensaio com `--dry-run`. A
  migration é aditiva (duas colunas em `agenda_entries` e a função
  `agenda_link_handover`); o front-end anterior segue funcionando com ela.
- Vercel: o build de Preview `repassafe-staging-15fdmtamz` (commit `61b4982`)
  foi promovido e gerou o deploy de produção `repassafe-staging-i76gu4088`,
  que serve `www.repassafe.com.br`. Retorno disponível:
  `repassafe-staging-kmtyukdm4` (commit `8c70aa8`).
- Documentos legais: sem nova versão; avaliação e texto para a próxima revisão
  em `docs/legal/minutas/LEG-01` e `LEG-02`.

## Antes

- Backup do esquema e dos dados do banco publicado com `supabase db dump`,
  guardado fora do repositório.
- CI do #44 aprovado em todas as etapas.

## Verificação

- Histórico remoto com `20261116120000`.
- Banco: execução anônima de `agenda_link_handover` e leitura anônima de
  `agenda_entries` recusadas (401).
- Público: `/api/health` 200, `/api/ready` 401 sem token, `/entrar`, `/termos`
  e `/privacidade` 200; `/agenda` sem sessão leva a `/entrar`; as rotas do
  arquivo da agenda (`/agenda/{id}/calendario` e
  `/agenda/pagamento/{origem}/{id}/calendario`) sem sessão levam a `/entrar`.

## Limites

- Sem teste autenticado em produção: não há conta de teste autorizada nesse
  ambiente. O fluxo autenticado foi validado no banco local com contas
  sintéticas: download do arquivo, acordo preenchido a partir da agenda,
  vínculo gravado, “Repasse em andamento”, confirmação pelo colega e plantão
  único “Repassado a um colega” com o pagamento ao colega no vencimento.
- O fluxo “Publicar plantão” a partir da agenda foi validado por testes das
  ações e das telas; no ambiente local, a conta de teste com análise pendente
  só pode registrar acordo.
