# Registrar acordo combinado fora do app

Status: implementação e validação locais concluídas; publicação não realizada.
Atualizado em: 07/10/2026.
Origem: decisões do responsável pelo produto nesta conversa.

## Objetivo

Permitir que médicos mantenham a negociação pelo WhatsApp e registrem no
Repassafe as condições aceitas por ambos. A principal preocupação relatada é
não receber o pagamento. O produto deve dar destaque às condições de pagamento,
aos aceites e ao acompanhamento da quitação pelas duas partes.

## Decisões confirmadas

- Oferecer três entradas: “Publicar plantão em grupo”, “Publicar plantão livre”
  e “Registrar acordo”.
- Usar formulário similar ao de publicação, reaproveitando os dados do plantão.
- Quem repassa ou quem assume pode iniciar, com identificação explícita dos papéis.
- As duas partes precisam confirmar dentro do Repassafe para concluir o registro.
- Não oferecer registro pessoal unilateral como modalidade de acordo.
- Permitir compartilhar o convite imediatamente, inclusive com pessoa sem conta.
- Exigir cadastro para confirmar; a aprovação cadastral pendente não bloqueará
  a finalização deste registro.
- Permitir registro com ou sem grupo institucional.
- Quando houver grupo, preservar os requisitos de vínculo e de aprovação
  institucional aplicáveis àquele grupo.
- Começar por plantões futuros. Registro de plantões já iniciados ou concluídos
  fica fora da primeira versão.
- O médico que repassa é sempre o pagador; o médico que assume é o beneficiário,
  independentemente de quem iniciou o registro.
- Exigir data-limite de pagamento aceita pelas duas partes. Ela vale mesmo
  quando o hospital atrasar o pagamento ao médico que repassa.
- Incluir acompanhamento do pagamento: o pagador pode marcar “Informei o
  pagamento” e o beneficiário pode confirmar “Recebi”.
- Ao informar pagamento, pedir data e valor, permitindo comprovante opcional
  disponível à outra parte. O estado “Recebimento confirmado” depende da ação
  do beneficiário; anexar comprovante não substitui essa confirmação.
- Após o vencimento, sem confirmação de recebimento, mostrar “Prazo vencido —
  recebimento não confirmado”, permitindo informar divergência. Ausência de
  confirmação não equivale automaticamente a uma declaração de não pagamento.
- Exigir identificação e dados profissionais preenchidos e e-mail confirmado
  antes do aceite, permitindo análise cadastral pendente. Exibir a situação da
  verificação à outra parte.

## Alcance da exceção cadastral

A dispensa de aprovação cadastral para finalizar o registro é uma decisão
específica desta funcionalidade. Ela não altera por si as regras de publicação
de ofertas, candidatura ou acesso aos grupos.

O aceite de um acordo não concede habilitação profissional, vínculo institucional
ou acesso administrativo. A interface deve distinguir o estado do acordo do
estado de verificação dos profissionais.

O mínimo aprovado para o aceite é identificação e dados profissionais preenchidos
e e-mail confirmado. A análise pode estar pendente. Na implementação, o autor
precisa completar esses requisitos antes de enviar; o destinatário pode receber
o link antes de se cadastrar e completa os requisitos antes de aceitar. Contas
suspensas, rejeitadas, em correção ou aprovadas com verificação expirada precisam
regularizar o cadastro para assumir novos compromissos. Identidade, habilitação profissional, autorização
institucional e concessão administrativa continuam independentes, conforme
`registration-full-spec-review.md`.

## Jornada implementada

1. Escolher “Registrar acordo” e informar se repassa ou assume o plantão.
2. Preencher condições e identificar o outro profissional.
3. Revisar os dados e registrar o próprio aceite.
4. Compartilhar o convite pelo WhatsApp.
5. O destinatário acessa sua conta ou se cadastra, revisa e confirma.
6. Obter aprovação institucional quando o grupo exigir.
7. Disponibilizar o acordo confirmado e seu histórico às partes autorizadas.

Antes do segundo aceite, apresentar uma solicitação aguardando confirmação,
sem tratá-la como acordo concluído. Não há etapa de candidatura ou disputa
entre interessados nesta jornada proposta.

O desenho do convite precisa vincular o aceite ao destinatário correto;
possuir ou receber um link encaminhado não deve bastar para assumir sua identidade.

## Dados propostos

Reaproveitar início, término, setor, valor, condições de pagamento e observações
operacionais sem dados de pacientes. Identificar as duas partes e seus papéis;
para registros sem grupo, propor local/instituição e localização suficientes
para identificar o plantão. Informar uma instituição não comprova seu aval.

Como pagamento é a preocupação principal, propor campos explícitos para
valor total, vencimento e forma de pagamento. Pagador e beneficiário derivam
dos papéis das partes e devem aparecer no resumo do aceite; não são uma escolha
independente que possa inverter os papéis ou apontar o hospital como pagador.

## Pagamento: prazo e acompanhamento

Decisão confirmada: todo registro exige uma data-limite de pagamento, válida
mesmo se o hospital atrasar. O médico que repassa permanece identificado como
pagador. O recebimento de terceiros não adia automaticamente o vencimento.

O responsável pelo produto relatou que muitos médicos combinam “pago quando o
hospital me pagar”. Essa condição pode ser contextualizada nas observações,
mas não substitui nem suspende a data-limite aceita. Não oferecer modalidade
de prazo aberto nesta versão.

Texto proposto para o resumo, com valor e data ilustrativos: “Quem repassa
pagará R$ 1.500,00 a quem assume até 20/11/2026. Esta data-limite vale mesmo
se o hospital atrasar o pagamento.” Apresentar os nomes reais das partes no
registro e mostrar a mesma condição a ambas antes de cada aceite.

A data-limite é um campo estruturado e integra a versão das condições
confirmada pelas partes. O cálculo do vencimento usa essa data, sem depender
de interpretar observações em texto livre. O vencimento ocorre na virada para
o dia seguinte em America/Fortaleza (UTC−3), com teste da fronteira. Convite cuja
data-limite já passou não pode ser aceito: é necessário um novo registro.

O acompanhamento do pagamento é separado da confirmação do acordo e da
realização do plantão. Informar pagamento não confirma recebimento pela outra
parte. A confirmação “Recebi” deve ser atribuída ao beneficiário autenticado.
Relatos de divergência devem identificar autor e momento, preservando o histórico.

Data e valor informados no pagamento e comprovante opcional foram aprovados.
O comprovante fica disponível à outra parte. Sua existência não altera sozinha
o estado para “Recebimento confirmado”.

O beneficiário pode confirmar recebimento integral mesmo quando o pagador ainda
não registrou sua ação. A primeira versão registra pagamentos pelo valor total;
diferenças e pagamentos parciais podem ser relatados como divergência, sem marcar
quitação integral. Comprovantes privados aceitam PDF, PNG ou JPEG até 4 MB e são
acessíveis apenas às duas partes, inclusive quando houver aprovador institucional.

## Critérios de aceite derivados das decisões confirmadas

Estes critérios orientam a implementação. A evidência executada e seus limites
estão em `../reviews/external-agreement-implementation-2026-10-07.md`.

1. Quem repassa e quem assume conseguem iniciar o fluxo; os papéis de pagador
   e beneficiário permanecem corretos nos dois caminhos.
2. Nenhum registro é concluído com aceite de apenas uma parte. As duas precisam
   aceitar a mesma versão das condições.
3. Destinatário sem conta consegue receber convite e prosseguir pelo cadastro.
   O aceite exige identificação, dados profissionais e e-mail confirmado;
   análise pendente por si só não impede a conclusão deste registro.
4. Cada parte vê a situação da verificação profissional da outra; concluir
   o acordo não transforma verificação pendente em aprovada.
5. A regra específica de cadastro não remove requisitos de vínculo e aprovação
   de um grupo institucional.
6. A solicitação exige plantão futuro; o comportamento de solicitações ainda
   pendentes quando o plantão começar precisa seguir regra explicitamente definida.
7. Ausência de data-limite impede o envio para aceite, com erro associado ao
   campo. A validação também ocorre no servidor.
8. O resumo exibido às duas partes e o registro preservado incluem pagador,
   beneficiário, valor e data-limite, explicitando que atraso do hospital
   não altera esse prazo.
9. Informar atraso ou recebimento do hospital em observações não muda a
   data-limite nem remove o estado de prazo vencido.
10. O pagador informa data e valor do pagamento e pode anexar comprovante.
    A outra parte consegue consultar o comprovante autorizado.
11. Informar pagamento ou anexar comprovante não marca recebimento confirmado.
    Essa confirmação pertence ao beneficiário autenticado.
12. Depois do vencimento sem confirmação de recebimento, apresentar “Prazo
    vencido — recebimento não confirmado” e permitir informar divergência.
    Preservar qualquer informação de pagamento já registrada.
13. Cada aceite, informação de pagamento, confirmação de recebimento e
    divergência preserva autor e instante no histórico, sem sobrescrever
    condições previamente aceitas.

## Regras operacionais da primeira versão

- Convites pendentes de aceite ou aprovação expiram no início do plantão.
  A tela deriva esse estado do horário; o banco rejeita confirmações vencidas
  dentro da transação, sem depender de tarefa agendada.
- Condições ficam imutáveis após o envio. O destinatário pode recusar; o autor
  pode cancelar enquanto pendente. Correções exigem novo convite e novos aceites.
- Depois de confirmado, não há alteração silenciosa nem cancelamento unilateral
  automatizado. Divergências ficam no histórico e há acesso ao suporte.
- O convite usa o e-mail do destinatário e exige confirmação desse contato na
  conta autenticada. Um terceiro com o link não lê nem aceita o acordo.
- O painel lista convites destinados ao e-mail da conta, incluindo usuários que
  se cadastraram depois do envio. O link também pode ser reaberto após o cadastro.
- Partes consultam o histórico; aprovadores ativos consultam os registros de seu
  grupo. Comprovantes têm audiência mais restrita: somente pagador e beneficiário.
- Transições geram notificações internas aos envolvidos existentes e, quando
  necessário, aos aprovadores do grupo. Compartilhar no WhatsApp abre o compositor
  do usuário; não envia mensagens automaticamente e não importa conversas.
- Solicitações são idempotentes por ator e identificador; comandos conflitantes
  e aceites de conteúdo diferente são rejeitados. Bloqueios transacionais
  serializam atualizações; as tabelas não permitem edição direta pelo cliente.
- Documento final e eventos têm conteúdo canônico e hashes SHA-256. O registro
  oferece impressão/PDF pelo navegador; não é um PDF assinado gerado no servidor.
- Interface usa Impeccable e a auditoria de design existente, com erros por campo,
  revisão antes do envio, estados pendentes e composição móvel.

## Relação com o produto existente

A implementação atual documentada em `../operations/core-shift-flow.md` e
`../operations/agreement-evidence-dossier.md` oferece uma base para condições,
aceites e histórico. Seu reaproveitamento exige adaptação para início por
qualquer parte, convite direto e elegibilidade própria desta funcionalidade.

Este documento registra uma expansão de produto solicitada pelo responsável.
Não define ainda prazo, esforço ou inclusão no lançamento do piloto; essas
decisões de planejamento permanecem em aberto.
