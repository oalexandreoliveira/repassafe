# Troca recíproca de plantões: descoberta antes da implementação

30/10/2026 — continuação do pacote 6 da trilha do teste de usuário.

A sugestão envolve dois compromissos vinculados. O fluxo de repasse atual não representa uma troca e não deve simular reciprocidade com duas ofertas independentes ou de valor zero. Esta entrega não habilita trocas.

## Roteiro de validação

Obter com médicos e responsáveis pelos grupos exemplos recentes de troca e registrar:

- Instituição e grupo de cada plantão; possibilidade de instituições distintas.
- Duração, atividade e horários dos dois plantões; conflitos com compromissos já aceitos.
- Remuneração mantida ou compensação financeira; responsável por cada obrigação.
- Aprovação por nenhuma, uma ou duas coordenações e prazo para cada decisão.
- Tratamento esperado para recusa, expiração e retirada antes da confirmação conjunta.
- Ocorrência posterior à realização de apenas um dos plantões, sem apagar o compromisso já cumprido.

Critério de entrada na implementação: registrar a demanda observada no piloto e fechar essas variantes com produto e coordenação. A frequência não pode ser inferida de um único testador.

## Modelo proposto para discussão

Um registro de troca contém dois plantões, duas partes, condições versionadas e aprovações independentes. O estado inicial é `rascunho`; após convite, `aguardando aceites`; depois, quando aplicável, `aguardando aprovações`; somente então `confirmada`. Recusa ou expiração antes da confirmação termina a proposta completa. Nenhum dos dois plantões recebe confirmação isolada.

A transação de confirmação deve bloquear os dois plantões em ordem estável, revalidar identidade/habilitação/vínculos e sobreposição de agenda e gravar os dois compromissos atomicamente. Notificações e e-mails devem sair de uma fila vinculada à confirmação conjunta. Após confirmar, o registro é imutável; ocorrências, realização e eventual pagamento são eventos separados por plantão.

## Testes obrigatórios da futura entrega

Confirmações concorrentes, uma aprovação negada, expiração durante aceite, perda de vínculo, verificação profissional vencida, sobreposição de horários e retirada anterior à confirmação não podem deixar uma parte confirmada sozinha. Ambas as partes devem consultar o mesmo registro e os dois compromissos. Validar cancelamento/ocorrência após uma realização com os responsáveis antes de definir a regra de produto.
