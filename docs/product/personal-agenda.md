# Agenda de plantões e repasses

Status: etapas 1 e 2 implementadas e validadas localmente (ver “Etapa 1
entregue” e “Etapa 2 entregue”); etapa 3 não iniciada; nada publicado.
Atualizado em: 15/11/2026.
Origem: decisões do responsável pelo produto nesta conversa.

## Objetivo

Dar ao médico um espaço próprio para controlar a sua agenda de plantões e o
que tem a receber ou a pagar por eles. A principal dor relatada no produto é
não receber o pagamento. Ela se agrava nos prazos longos, comuns quando
hospitais e cooperativas pagam 30, 60 ou 90 dias depois do plantão: o valor
sai do radar e ninguém cobra. A agenda reúne datas, valores, prazos e
responsáveis pelo pagamento, e lembra o médico de cobrar.

A agenda é pessoal. Ela não substitui o registro bilateral do acordo, não cria
compromisso com terceiros e não intermedeia pagamentos.

## Decisões confirmadas

### Origem dos itens

- **Registros do app, automáticos e só leitura.** Entram sozinhos os repasses
  confirmados a partir de ofertas do mural e os acordos registrados
  confirmados em que o usuário é parte. Papel, valor, data-limite e situação
  do pagamento vêm do acompanhamento já existente. Abrem as telas atuais do
  repasse ou do acordo. Não exibem ações de edição.
- **Anotações pessoais.** O usuário cadastra os demais plantões. Elas são
  visíveis apenas para ele, sem aceite de outra parte e sem valor de acordo.

### Tipos de anotação pessoal

| Tipo | Quem paga | Lembrete |
| --- | --- | --- |
| Meu plantão | Instituição, cooperativa ou empresa informada pelo usuário | Cobrança |
| Assumi de um colega | O colega informado | Cobrança |
| Repassei a um colega | O próprio usuário | Pagamento a fazer |

Nos dois tipos com colega, a agenda sugere “Registrar acordo” e explica que a
anotação pessoal não tem o aceite da outra parte. A sugestão não bloqueia o
cadastro.

### Dados da anotação

- Data, início e término (o término pode cair no dia seguinte).
- Instituição e local; setor opcional.
- Valor previsto.
- Data-limite de pagamento, com atalhos “30”, “60” e “90 dias após o plantão”
  que preenchem a data. O prazo é sempre gravado como data.
- Forma de pagamento, opcional.
- Nome do responsável pelo pagamento (“Quem recebe” no tipo “Repassei”).
  Texto curto, sem CPF, telefone ou e-mail.
- Observações, com o aviso fixo de não incluir dados de pacientes.

Valor e data-limite são opcionais para o plantão aparecer na agenda. O
lembrete de cobrança só fica disponível quando os dois estão preenchidos.

### Várias datas de uma vez

Para plantões fixos, o usuário marca várias datas num calendário. Cada data
vira uma anotação independente, com pagamento e lembrete próprios. Não existe
série: editar ou excluir uma anotação não altera as outras.

### Recebimento

Ao marcar “Recebido”, o usuário confirma ou corrige a data e o valor recebidos,
pré-preenchidos com o previsto. A agenda mostra a diferença em relação ao
previsto (retenções, glosas, descontos da cooperativa). No tipo “Repassei”, a
ação é “Paguei”, com os mesmos campos.

Nos registros do app, a situação continua sendo a do acompanhamento existente:
“Recebimento confirmado” depende do beneficiário, conforme
[external-agreement-registration.md](external-agreement-registration.md). A
agenda não oferece atalho que contorne essa regra.

### Lembrete

- **Canais:** central de notificações do app e arquivo `.ics` por plantão.
  Sem e-mail, push, SMS ou WhatsApp automático nesta versão.
- **Configuração:** ao informar a data-limite, o app sugere aviso no dia do
  vencimento e repetição semanal até marcar “Recebido” ou “Paguei”. O usuário
  muda a antecedência (no dia, 1, 3 ou 7 dias antes), o intervalo (semanal,
  quinzenal ou sem repetição) ou desliga.
- **Abrangência:** vale para anotações pessoais e para registros do app em que
  o usuário recebe ou paga. Nos registros do app, a configuração é pessoal e
  não altera o acordo.
- **Cobrança:** o lembrete chega só ao usuário. A tela oferece “Cobrar pelo
  WhatsApp”, que abre o WhatsApp do próprio usuário com uma mensagem editável.
  O app não envia nada automaticamente e não guarda telefone do pagador.

Mensagem sugerida, com dados ilustrativos:

> Olá, tudo bem? Passando para lembrar do pagamento do plantão de 12/10
> (Hospital X), no valor de R$ 1.500,00, com vencimento em 11/12. Pode me
> informar a previsão? Obrigado.

### Agenda do celular (.ics)

Botão “Adicionar à agenda do celular” em cada plantão baixa um arquivo `.ics`
com o evento do plantão e, se houver data-limite, um evento no vencimento com
alarme. O arquivo não se atualiza depois: se o pagamento chegar, o aviso do
celular continua, e a tela diz isso antes do download. Valor e nome do
responsável ficam fora por padrão; uma opção desligada permite incluí-los.

### Repassar a partir da agenda

Em “Meu plantão” futuro, o botão “Repassar este plantão” abre “Publicar
plantão” ou “Registrar acordo” com data, horário, local e setor preenchidos.
Valor e condições de pagamento do repasse são definidos no fluxo de repasse.

Regra derivada, a confirmar: o plantão próprio repassado continua na agenda
como valor a receber da instituição, porque no modelo do Repassafe quem
repassa segue como pagador do colega. A agenda mostra que a escala passou ao
colega e acrescenta o valor a pagar do repasse, sem duplicar o plantão.

### Navegação e resumo

- Nova aba “Agenda” na barra inferior, entre “Repasses” e “Perfil”.
  Aprovadores sem atuação médica não a veem.
- Resumo do mês: a receber, recebido, a pagar e vencido, separando acordos
  do app e anotações pessoais. É descritivo e exibe a frase fixa de não
  intermediação de pagamentos.

## Padrões assumidos, a validar

- **Acesso:** contas com atuação médica e identificação preenchida, mesmo com
  análise cadastral pendente, porque as anotações são privadas e não criam
  compromisso com terceiros. Usar a agenda não concede habilitação, vínculo ou
  autorização institucional.
- **Privacidade:** anotações visíveis só para o autor, inclusive perante
  aprovadores e administração na interface. Métricas do piloto, se houver,
  apenas agregadas e sem conteúdo.
- **Edição:** anotações pessoais podem ser editadas e excluídas pelo autor,
  com confirmação na exclusão. A imutabilidade vale para acordos registrados,
  que seguem sem ações de edição.
- **Conflito de horário:** aviso, sem bloqueio, quando plantões da agenda se
  sobrepõem.
- **Fuso e vencimento:** `America/Fortaleza`; o vencimento ocorre na virada
  para o dia seguinte, como no acordo registrado.
- **Texto da notificação:** sem valor e sem nome do responsável, por exemplo
  “Pagamento a receber vence hoje · Plantão de 12/10”. Os detalhes ficam na
  tela.

## Telas

Todas são derivadas do design system v2.1, sem referência desenhada em
`design/screens/`, e devem ser listadas como tal ao final da entrega.

- **Agenda (raiz):** top bar raiz, título “Agenda”, navegação entre meses,
  grade mensal com marcador e contagem por dia (com rótulo acessível), resumo
  do mês e lista agrupada por dia. Filtros: todos, plantões, pagamentos. FAB
  “Adicionar plantão”.
- **Adicionar plantão:** tipo, datas (uma ou várias), horários, local, setor,
  valor, data-limite com atalhos, forma de pagamento, responsável,
  observações com aviso e bloco de lembrete. Revisão antes de salvar quando
  houver várias datas.
- **Detalhe da anotação:** dados, situação do pagamento e ações: marcar como
  recebido ou pago, cobrar pelo WhatsApp, adicionar à agenda do celular,
  repassar, editar e excluir.
- **Registros do app:** abrem as telas atuais de repasse e de acordo.

Pontos de desenho: anotação pessoal e acordo registrado precisam ser
distinguíveis por texto e não só por cor (chip “Anotação pessoal” ante
“Repasse confirmado” e “Acordo registrado”). A aba “Plantões” já usa o ícone
`calendar`; a aba “Agenda” precisa de ícone distinto da biblioteca Lucide.
A barra com cinco abas deve ser verificada em 360 px. A inclusão da aba
altera `design/DESIGN.md` §5 e o mapa de navegação de `design/SCREENS.md`.

## Critérios de aceite

1. Sem nenhum cadastro, o usuário vê os repasses confirmados e os acordos
   registrados confirmados em que é parte, com papel, valor, data-limite e
   situação do pagamento iguais aos das telas de origem, e sem ações de edição.
2. Outro usuário, aprovador do grupo ou sessão anônima não lê, altera nem
   exclui anotação pessoal alheia. Testes de banco cobrem cada papel.
3. Cadastro e edição validam no servidor, com erro associado a cada campo:
   término posterior ao início, valor positivo, data-limite válida e limites
   de tamanho dos textos.
4. Várias datas geram o mesmo número de anotações independentes, de forma
   atômica e idempotente; excluir uma não afeta as outras. Há limite por envio.
5. Com valor e data-limite, o lembrete sugerido é o do dia do vencimento com
   repetição semanal. A rotina gera no máximo uma notificação por item por
   dia e para ao marcar recebido ou pago, ao desligar ou ao excluir. A
   fronteira do dia em `America/Fortaleza` é testada.
6. As notificações da agenda não entram na fila de e-mails críticos.
7. “Cobrar pelo WhatsApp” abre o compositor do usuário com o texto editável.
   Nada é enviado pelo Repassafe e nenhum telefone é armazenado.
8. O `.ics` é válido segundo a RFC 5545, tem o evento do plantão e, se houver
   prazo, o evento do vencimento com alarme. Valor e nome ficam fora salvo
   opção explícita. A tela informa que o arquivo não se atualiza.
9. Marcar recebido ou pago registra data e valor; a diferença em relação ao
   previsto aparece na anotação e no resumo.
10. Os totais do resumo do mês coincidem com a soma dos itens listados no mês
    e separam acordos do app de anotações pessoais.
11. “Repassar este plantão” preenche data, horário, local e setor no fluxo
    escolhido, só aparece em “Meu plantão” futuro e não altera a validação
    desses fluxos.
12. A aba aparece para quem tem atuação médica e não aparece para aprovadores
    sem atuação. Teclado, foco visível, alvos de 44 px, contraste AA, estados
    vazio, carregando e erro, e composição em 360, 390 e 1440 px são
    verificados em navegador.
13. Observações e nome do responsável exibem o aviso de dados de pacientes.

## Fora desta versão

E-mail, push, SMS e WhatsApp automático; assinatura `.ics` que se atualiza ou
sincronização com Google e Apple; importação de escala do hospital; séries
editáveis em bloco; vários pagamentos parciais por plantão; anexos e
comprovantes em anotações pessoais; compartilhar a agenda ou exibi-la à
coordenação; uso de anotações como evidência de acordo.

## Entrega proposta

1. **Agenda e anotações.** Tabela própria com acesso restrito ao autor,
   leitura unificada dos registros do app, telas de agenda, cadastro,
   detalhe, edição e exclusão, várias datas, resumo do mês e nova aba.
2. **Pagamento e lembretes.** Recebido e pago com valor, configuração de
   lembrete, rotina agendada no banco gerando notificações internas, lembretes
   em registros do app e “Cobrar pelo WhatsApp”.
3. **Celular e repasse.** Arquivo `.ics` por plantão e “Repassar este
   plantão” com dados preenchidos.

Cada etapa segue a skill Impeccable, a auditoria de design existente e a
validação funcional por testes de banco, unitários e de navegador.

## Etapa 1 entregue

Inclui o que a etapa 1 previa e antecipa “Recebido” e “Paguei” da etapa 2,
porque o resumo do mês e o estado “Vencido” não teriam saída sem eles.
Lembretes, “Cobrar pelo WhatsApp”, `.ics` e “Repassar este plantão” seguem
nas etapas 2 e 3.

Decisões de implementação, a validar no piloto:

- **Prazo de pagamento:** “Sem prazo definido”, “Até uma data” ou “Dias após
  o plantão” (atalhos 30, 60 e 90). Com várias datas, “Dias após” gera a
  data-limite de cada plantão e “Até uma data” aplica a mesma data a todos.
  O prazo é sempre gravado como data, entre o dia do plantão e um ano depois.
- **Datas aceitas:** de dois anos atrás a um ano à frente, para registrar
  plantões já trabalhados que ainda aguardam pagamento. No máximo 31 datas
  por envio e 3.000 anotações por conta.
- **Horários:** término igual ou anterior ao início vai para o dia seguinte
  (plantão noturno ou de 24 horas); duração máxima de 48 horas.
- **Resumo do mês:** soma os pagamentos com vencimento no mês, em quatro
  linhas exclusivas: “Recebido”, “A receber”, “Vencido a receber” e
  “A pagar”. Pagamentos sem valor não entram nos totais e são contados à
  parte. “Ver por origem” separa repasses do app e anotações pessoais.
- **Registros do app:** repasses do mural entram como “Repasse confirmado” e
  acordos registrados confirmados como “Acordo registrado”, com o papel do
  usuário (“Você repassou” ou “Você assumiu”). Repasse cancelado depois da
  confirmação aparece como “Repasse cancelado” e sai dos pagamentos.
  Pagamentos do app abrem o acompanhamento existente.
- **Acesso:** médicos com análise pendente, aprovada ou em correção. Contas
  rejeitadas ou suspensas e aprovadores sem atuação médica não usam a agenda.
  O painel oferece a agenda a quem ainda não vê a barra de abas.
- **Privacidade:** somente o autor lê as anotações; aprovadores,
  administração e `service_role` não têm grant nem política. Os comandos da
  agenda não criam notificação nem evento de auditoria com conteúdo.

Validação: 43 asserções pgTAP em `supabase/tests/personal_agenda.sql`
(banco descartável), testes unitários de regras e telas, e prévias em
`/dev/telas/agenda*` verificadas em 360, 375 e 1440 px com teclado.

Fluxo autenticado em 15/11/2026, no banco local com as migrations em dia e
contas sintéticas: médica com análise pendente entra pelo painel, vê um acordo
registrado confirmado (plantão e “A receber”), cadastra duas datas com prazo
de 60 dias, edita uma delas para um prazo vencido, marca recebimento com valor
menor, desfaz, recebe erro por campo vindo do servidor e exclui a outra
anotação. O colega da mesma conta de acordo vê o pagamento como “A pagar” e
recebe 404 ao abrir a anotação dela. O aprovador sem atuação médica é levado
ao painel. Não verificado: leitores de tela, zoom de 200% e um repasse do
mural no fluxo autenticado (coberto apenas pelos testes de regra).

## Etapa 2 entregue

Decisões confirmadas para esta etapa:

- **Registros do app com lembrete ligado por padrão.** Todo repasse do mural e
  acordo registrado confirmado com data-limite recebe o lembrete sugerido (no
  vencimento e depois semanal), para quem recebe e para quem paga. Cada parte
  pode ajustar ou desligar; a preferência é pessoal e não altera o acordo.
- **Repetição por até 6 meses** após o vencimento (182 dias), ou até marcar
  recebido ou pago.
- **Configuração dos registros do app na própria agenda.** O pagamento de um
  repasse do app abre `/agenda/pagamento/repasse/{id}` ou
  `/agenda/pagamento/acordo/{id}`, com situação, lembrete, cobrança e o caminho
  para confirmar ou informar no acordo. As telas de repasse e de acordo não
  mudaram.
- **Horário:** uma vez por dia, às 8h de Fortaleza (rotina `pg_cron` às 11h UTC).

Como funciona:

- Opções: primeiro aviso no dia do vencimento ou 1, 3 ou 7 dias antes;
  depois do vencimento, repetir toda semana, a cada 15 dias ou não repetir.
- A rotina envia só o aviso mais recente previsto até o dia e registra o envio
  por item e data. Rodar de novo, ou depois de uma pausa, não duplica avisos
  nem dispara os atrasados de uma vez.
- Os avisos param ao marcar recebido ou pago, ao desligar o lembrete, ao
  excluir a anotação, com repasse cancelado ou conta fora da agenda. Nos
  registros do app, quem paga deixa de ser lembrado ao informar o pagamento;
  quem recebe passa a ver “Pagamento informado: confirme se recebeu”.
- Texto do aviso sem valor, nomes ou local: “Pagamento a receber vence em 3
  dias · Plantão de 12/10. Confira na agenda.” Os avisos ficam só na central
  (evento `agenda.payment_reminder`), fora da fila de e-mails críticos.
- “Cobrar pelo WhatsApp” aparece para quem recebe, com pagamento em aberto.
  Abre `wa.me` sem destinatário, com a mensagem pronta e editável, sem
  nomes; o tempo verbal muda depois do vencimento (“que venceu em …”).
  Nenhum telefone é armazenado e nada é enviado pelo Repassafe.

Validação: 43 asserções pgTAP em `supabase/tests/agenda_reminders.sql`
(datas previstas, repetição e limite de 6 meses, idempotência, quem paga após
informar, repasse cancelado, conta suspensa, preferência pessoal e acesso de
terceiros, ausência de e-mail), além das suítes da etapa 1, de RLS e de acordos
registrados. Testes unitários do cálculo do próximo aviso, da mensagem e das
telas. No banco local, a rotina ficou agendada; o aviso apareceu na central com
“Abrir na agenda”; a preferência de um acordo foi salva só para quem a
alterou; desligar o lembrete pela edição foi refletido no detalhe.

## Pendências fora do código

- A política de privacidade precisa citar a nova finalidade e o nome de
  terceiro informado pelo usuário, com revisão jurídica e nova versão do
  texto, como já ocorre com a menção ao Resend.
- Decidir se o uso da agenda entra nas métricas agregadas do piloto.
