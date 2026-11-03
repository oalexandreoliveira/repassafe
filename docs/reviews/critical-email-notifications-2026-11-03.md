# US-1003 — Avisos críticos por e-mail

Data: 03/11/2026. Origem: `US-1003` em `docs/product/mvp-scope-v1.md`, bloqueador de lançamento entregue apenas para o registro final do acordo.

## Problema

A seleção cria um prazo fixo de 30 minutos para o substituto confirmar, e o único aviso era uma linha na central interna. Quem estava com o app fechado perdia o prazo, a menos que o titular avisasse por fora. O mesmo silêncio valia para candidatura recebida, aprovação pendente, cancelamento e decisão de cadastro. Esta é uma conclusão a partir do código; não há expiração real observada, pois não há registro de acordo real entre duas pessoas no piloto.

## Comportamento

Um gatilho em `public.notifications` enfileira e-mails para uma lista fechada de eventos, na mesma transação do evento de origem. O trabalhador existente passou a atender as duas filas pelo mesmo endpoint, com os avisos críticos primeiro. A tabela de eventos, os limites e as consultas estão em [Envio pelo Resend](../operations/agreement-email-resend.md#avisos-críticos).

A central interna não mudou: cada candidatura, por exemplo, continua aparecendo no app mesmo quando não gera novo e-mail. Não houve alteração de interface, portanto a skill Impeccable não se aplica; os textos seguem o microcopy de `design/DESIGN.md` e reutilizam `PAYMENT_NOTICE`.

## Decisões de escopo

Acrescentados em relação à proposta inicial, por serem o mesmo tipo de silêncio:

- **Cancelamento e desistência de repasse confirmado.** Desistência e cancelamento com menos de 48 horas chegam à outra parte como `occurrence.opened`, com o título `Ocorrência aberta`. O gatilho depende desse título; `critical_notification_emails.sql` falha se ele mudar. As demais ocorrências seguem sem e-mail.
- **Rejeição institucional.** A aprovação gera o e-mail do registro final; sem este aviso, a rejeição seria a única saída silenciosa.
- **Aprovação pendente em acordo registrado direto.** O convite expira no início do plantão e depende do aprovador.

Deixados de fora de propósito:

- **Nova oferta publicada.** Em oferta livre alcançaria todos os perfis aprovados e se aproxima de campanha, que a US-1003 exclui.
- **Convite de acordo registrado.** A decisão de produto é o compartilhamento do link pelo próprio médico; além disso, enviar a um endereço digitado por terceiro abriria um canal de abuso.
- **Botão para avisar pelo WhatsApp.** Citado como complemento na análise; não faz parte desta entrega.

## Garantias

- Falha do provedor não desfaz o evento de origem, e um link fora do formato não aborta a transação.
- O envio tem ativação própria, `CRITICAL_EMAIL_ENABLED`, para que ligar os registros de acordo não ligue os avisos.
- `service_role` lê a fila e só altera as colunas de tentativa; não insere, não apaga, não trunca e não troca destinatário. Clientes não leem a fila.
- O corpo não traz dados do plantão, valores, nomes ou campos livres. Só endereços confirmados recebem.
- O aviso de seleção não sai depois do prazo. Os demais valem 23 horas, dentro da janela de 24 horas da chave de idempotência do Resend, o que dispensa reconciliação manual dessas tentativas.

## Refatoração

A lógica de aquisição, envio e repetição saiu de `agreement-email.ts` para `src/lib/email-queue.ts`, para as filas não duplicarem o controle de concorrência. O comportamento dos registros de acordo foi preservado: os testes existentes passaram sem alteração. O corpo do retorno do job mudou para `{ critical, agreements }`.

## Validação

- Vitest: 236 testes em 42 arquivos aprovados, incluindo `critical-email.test.ts` e `email-job-route.test.ts`.
- pgTAP: `critical_notification_emails.sql` com 35 asserções sobre os comandos reais do fluxo. Os 15 arquivos de `supabase/tests` passaram; os 3 TODOs são os preexistentes de P0-04.
- Mutação: remover o filtro de ocorrência, o do titular na aprovação, o agrupamento de candidaturas e a exigência de e-mail confirmado reprovou os testes 21, 16, 4 e 27, respectivamente.
- TypeScript, ESLint, Prettier, auditoria estática de segurança, escopo e prontidão operacional aprovados; compilação de produção local aprovada.
- O scanner geral de segredos não dá resultado limpo neste checkout: aponta arquivos locais preexistentes (`.env.local`, `.env.codex-production`, binários em `videos/`), nenhum desta entrega.

A suíte SQL rodou em um banco descartável no contêiner local, criado só com o schema do banco de desenvolvimento e depois removido, porque a CLI do Supabase não estava disponível. Banco de desenvolvimento, homologação e produção não foram alterados.

## Limites

Nenhum e-mail real foi enviado: o trabalhador foi testado com o provedor simulado, e o caminho PostgREST não foi exercitado de ponta a ponta. O privilégio por coluna foi verificado por SQL com o papel `service_role`. Playwright não foi executado, pois não houve mudança de interface. `sent` significa aceitação pela API, sem webhooks de entrega ou bounce. Um e-mail reduz o risco de perder os 30 minutos, mas não garante leitura durante um plantão; a taxa de expiração em `/admin/metricas` deve orientar qualquer mudança na regra.

## Pendências antes de ativar

1. Atualizar a política de privacidade para citar o Resend, com revisão jurídica e nova versão do texto. `legal.ts` e a minuta `LEG-02` citam apenas Supabase e Vercel.
2. Aplicar `20261103120000_critical_notification_emails.sql`, primeiro em homologação.
3. Configurar chave, token, remetente e o agendador de um minuto.
4. Testar em homologação com contas autorizadas e só então definir `CRITICAL_EMAIL_ENABLED=true` em produção.
