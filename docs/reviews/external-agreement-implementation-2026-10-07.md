# Registro de acordo — implementação e validação

Data: 07/10/2026. Ambiente: aplicação e Supabase locais. Não houve publicação
nem aplicação de migração em projeto remoto.

## Entrega

O painel oferece publicação em grupo, publicação livre e registro de acordo.
O registro admite início por qualquer uma das partes, convite por e-mail
compartilhável pelo WhatsApp, revisão das condições e aceite autenticado de
ambos. Quem repassa paga; quem assume recebe. Valor, vencimento obrigatório e
responsabilidade pelo pagamento aparecem no resumo antes do aceite e no registro.
O atraso do hospital não altera o vencimento.

Cadastro profissional pendente pode concluir o registro quando identificação,
dados profissionais e e-mail confirmado estiverem presentes. Vínculo e aprovação
institucionais continuam independentes. O aceite não aprova o cadastro.

O acompanhamento separa pagamento informado, recebimento confirmado e
divergência. Comprovantes opcionais são privados, limitados às duas partes.
Condições e histórico são preservados, com documento canônico e cadeia SHA-256;
a impressão usa o navegador. Não há assinatura digital externa nem garantia
de pagamento oferecida pelo sistema.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| Vitest, suíte da aplicação | 19 arquivos, 59 testes aprovados |
| pgTAP, suíte completa local | 10 arquivos, 161 testes aprovados |
| pgTAP, novo registro de acordo | 45 testes após revisão pré-PR |
| TypeScript e ESLint | Aprovados |
| Build de produção, Next/webpack | Aprovado |
| Playwright, fluxo completo no build de produção local | 1 teste aprovado, 18,3 segundos de execução |
| Supabase lint e advisors de segurança locais | Nenhum problema reportado |
| Verificação de escopo MVP | Aprovada, 61 histórias |
| Scanner de segredos no código, SQL, testes, documentação e configuração | Nenhuma ocorrência nos 1.709 arquivos verificados |

O teste de navegador usa três contas sintéticas no Supabase local. Cobre erros
por campo, revisão e retorno sem perda de dados, criação, aceite com verificação
profissional pendente, informação de pagamento com comprovante, download
autorizado, recusa de acesso por terceiro e confirmação de recebimento.
Verifica ausência de transbordamento em 1.440, 390 e 320 pixels.

O banco cobre também inversão do papel de quem inicia, elegibilidade, controles
por grupo, autorização por ator, vencimento, imutabilidade, idempotência,
integridade dos eventos e proibição de escrita direta. Os bloqueios são
transacionais; não foi executado teste de carga concorrente.

## Revisão pré-PR

- Removida a exclusão administrativa de comprovantes após erro de RPC. Uma
  resposta perdida pode ocultar uma transação já confirmada; excluir o objeto
  destruiria a evidência. O teste simula essa falha e confirma a repetição
  idempotente com o mesmo arquivo. Objetos órfãos permanecem privados; eventual
  limpeza deve ser operacional, fora do caminho de gravação.
- O banco rejeita datas de pagamento não finitas, inclusive chamadas diretas
  à API. Acrescentado teste pgTAP de regressão.
- Declarações de revogação de acesso foram separadas para compatibilidade com
  o auditor estático existente, preservando as mesmas permissões.
- O teste opcional de cadastro foi atualizado para a nova entrada de publicação
  em grupo. As demais alterações anteriores de cadastro ficaram fora do PR.
- Preparação em worktree isolado sobre a `main` atualizada. Scanner global de
  segredos, auditoria estática de segurança, formatação, lint e verificações de
  escopo/operação passaram nesse checkout, antes de adicionar o ambiente local
  ignorado pelo Git.

## Evidência visual

Aplicada a skill Impeccable e a auditoria de design de 29/09/2026, preservando
PRODUCT.md, DESIGN.md e a identidade existente. O detector não apontou desvios
no escopo. A revisão de acabamento pediu destaque inicial para pagador,
beneficiário, valor e vencimento; esse ajuste foi aplicado ao resumo e ao detalhe.
As quatro capturas foram renovadas no build de produção. O Verdict Pass marcou
o ajuste como `resolved`, sem regressões visuais, e retornou `disposition: ship`.
A aprovação final pontua esse ajuste; a primeira revisão cobre o restante da
superfície. DESIGN.md foi preservado por se tratar de extensão da identidade.

Capturas com dados sintéticos:

- `.impeccable/review/agreement-desktop.png`
- `.impeccable/review/agreement-mobile.png`
- `.impeccable/review/agreement-record-desktop.png`
- `.impeccable/review/agreement-record-mobile.png`

## Ambiente e limites da evidência

- Migração entregue: `20261007034010_external_agreement_registration.sql`,
  aplicada e registrada somente no banco local. Uma migração anterior de
  métricas (`20261001120000`) já estava ausente do histórico local e não foi
  aplicada como parte deste trabalho. Conferir o histórico do ambiente de
  destino antes de publicar.
- O Windows bloqueou o SWC nativo. O build usou o pacote WASM oficial da mesma
  versão do Next, em cache local ignorado pelo Git, sem alterar dependências.
  A rodada final usou o Node 24.19.0 disponível no host; o projeto declara Node
  22. A compatibilidade com o runtime declarado deve ser confirmada no CI antes
  de publicar. Os executáveis locais foram chamados diretamente, pois o pnpm
  disponível tentou reinstalar módulos e abortou sem terminal interativo.
- Uma repetição em `next dev` falhou na navegação após a primeira compilação
  da rota de detalhe, com recarga do formulário. A rodada final foi feita com
  `next start`, sobre o build de produção, e passou integralmente.
- O scanner global de segredos não passou: ele inclui o `.env.local` ignorado
  com credenciais locais de teste e binários preexistentes em `videos/`.
  O scanner limitado aos arquivos de aplicação acima passou. Não se declara
  que o comando agregado `pnpm check` esteja inteiramente verde.
- O teste de navegador usa contas preparadas pela API administrativa local.
  O fluxo completo de novo cadastro com entrega de e-mail não foi repetido
  neste E2E. A elegibilidade e a confirmação de e-mail são verificadas pelo banco.
- As contas e evidências sintéticas ficam apenas no ambiente local. Não foram
  enviadas mensagens pelo WhatsApp nem utilizados dados de pessoas reais.

## Reprodução

Com as dependências instaladas, Supabase local ativo e `.env.local` local:

```powershell
node node_modules/vitest/vitest.mjs run
pnpm dlx supabase test db
node node_modules/next/dist/bin/next build --webpack
# Inicie o app em http://127.0.0.1:3100 antes do E2E.
$env:RUN_EXTERNAL_AGREEMENT_E2E='1'
node node_modules/@playwright/test/cli.js test --config=playwright.agreements.config.ts
```

O E2E rejeita URL de Supabase fora de localhost/127.0.0.1. Neste Windows, build e
servidor também exigiram `NEXT_TEST_WASM=1` e `NEXT_TEST_WASM_DIR` apontando
para `node_modules/.cache/next-wasm/package`. Alterações anteriores do usuário
em cadastro, autenticação e dependências foram preservadas.
