# Escopo executivo do MVP — Piloto privado v1

**Status:** baseline de execução  
**Data-base:** 22 de setembro de 2026  
**Responsável pela decisão de produto:** Product Owner do Repassafe  
**Referências:** especificação funcional v1.1, backlog priorizado e governança de permissões e estados

## 1. Objetivo do MVP

Validar, em operação privada e assistida, que médicos previamente verificados de um grupo institucional conseguem concluir uma substituição de plantão com autorização, rastreabilidade e segregação de acesso.

O MVP será considerado validado quando ao menos uma substituição percorrer o fluxo completo em ambiente de piloto, sem acesso indevido, ambiguidade de responsabilidade ou perda da trilha de auditoria.

## 2. Recorte operacional

- uma instituição piloto;
- de um a três grupos privados;
- acesso somente por convite ou liberação administrativa;
- verificação de CRM manual;
- três perfis: médico, aprovador institucional e administrador Repassafe;
- ofertas normais e emergenciais;
- aprovação institucional configurável por grupo;
- notificações essenciais dentro da aplicação e por e-mail;
- operação assistida, sem intermediação financeira;
- dados de pacientes proibidos em todos os campos, anexos e logs.

## 3. Jornada de valor obrigatória

1. Administrador cria o grupo e vincula seus responsáveis.
2. Médico cria a conta e confirma o e-mail.
3. Administrador verifica o CRM e libera o vínculo.
4. Médico aprovado publica uma oferta para seu grupo.
5. Outro médico elegível visualiza a oferta e se candidata.
6. Titular seleciona um candidato.
7. Candidato confirma as condições.
8. Aprovador decide, quando o grupo exigir aprovação.
9. Sistema registra um acordo imutável e auditável.
10. As partes registram a conclusão ou um cancelamento básico.

## 4. Escopo bloqueador do lançamento

### 4.1 Acesso e verificação

| História | Decisão para o MVP                                         |
| -------- | ---------------------------------------------------------- |
| US-0101  | Cadastro mínimo do médico                                  |
| US-0102  | Confirmação de e-mail; confirmação de telefone fica adiada |
| US-0103  | Login, logout e recuperação de acesso                      |
| US-0104  | Situação do cadastro visível ao usuário                    |
| US-0105  | Atualização apenas de dados cadastrais não críticos        |
| US-0201  | Fila administrativa de cadastros pendentes                 |
| US-0202  | Verificação manual do CRM com evidência mínima             |
| US-0203  | Aprovação, rejeição ou solicitação de correção             |

### 4.2 Grupos e autorização

| História | Decisão para o MVP                             |
| -------- | ---------------------------------------------- |
| US-0301  | Criação administrativa de grupo privado        |
| US-0302  | Aprovação institucional configurável por grupo |
| US-0303  | Vínculo administrativo de médico ao grupo      |
| US-0305  | Visibilidade restrita a vínculos ativos        |

### 4.3 Oferta, candidatura e escolha

| História | Decisão para o MVP                                                          |
| -------- | --------------------------------------------------------------------------- |
| US-0402  | Publicação de oferta com dados obrigatórios                                 |
| US-0403  | Classificação normal ou emergencial                                         |
| US-0405  | Expiração automática                                                        |
| US-0406  | Lista de ofertas elegíveis                                                  |
| US-0408  | Edição somente antes da primeira candidatura; depois, cancelar e republicar |
| US-0501  | Manifestação de interesse idempotente                                       |
| US-0502  | Retirada antes da seleção                                                   |
| US-0503  | Lista de candidatos para o titular                                          |
| US-0504  | Seleção única e transacional                                                |
| US-0505  | Prazo de confirmação e liberação após expiração                             |

### 4.4 Confirmação, aprovação e acordo

| História | Decisão para o MVP                                    |
| -------- | ----------------------------------------------------- |
| US-0601  | Confirmação explícita pelo substituto                 |
| US-0602  | Confirmação direta em grupo sem aprovador obrigatório |
| US-0603  | Encaminhamento ao aprovador quando configurado        |
| US-0604  | Aprovação ou rejeição institucional                   |
| US-0701  | Registro imutável do acordo confirmado                |
| US-0703  | Histórico pessoal                                     |
| US-0704  | Detalhes do acordo e sua trilha                       |

### 4.5 Encerramento e exceções mínimas

| História | Decisão para o MVP                                                   |
| -------- | -------------------------------------------------------------------- |
| US-0801  | Registro de realização do plantão                                    |
| US-0901  | Retirada de oferta sem acordo confirmado                             |
| US-0902  | Cancelamento confirmado com 48 horas ou mais                         |
| US-0903  | Cancelamento confirmado com menos de 48 horas e marcação operacional |
| US-0904  | Desistência do substituto e abertura de ocorrência                   |
| US-0906  | Tratamento administrativo básico da ocorrência                       |

### 4.6 Operação, segurança e medição

| História          | Decisão para o MVP                            |
| ----------------- | --------------------------------------------- |
| US-1001           | Central mínima de notificações críticas       |
| US-1003           | E-mails transacionais críticos, sem campanhas |
| US-1101           | Painel administrativo mínimo com pendências   |
| US-1102           | Aprovar, suspender e consultar usuários       |
| US-1103           | Criar e manter grupos e vínculos              |
| US-1104           | Consulta do fluxo e da auditoria              |
| US-1201 a US-1207 | Todas bloqueiam o lançamento                  |
| US-1301           | Eventos mínimos do funil, sem dados clínicos  |

## 5. Itens explicitamente adiados

| Itens                                                             | Destino     | Justificativa                                                   |
| ----------------------------------------------------------------- | ----------- | --------------------------------------------------------------- |
| Confirmação de telefone                                           | Pós-piloto  | E-mail é suficiente para autenticação inicial assistida         |
| US-0204 e US-0205 — selos e revalidação                           | Pós-MVP     | Não impedem a primeira jornada controlada                       |
| US-0304 — confirmação autônoma de vínculo                         | Pós-MVP     | Vínculo será administrativo                                     |
| US-0401, US-0404 e US-0407 — rascunho, conversão e filtros        | Pós-MVP     | Reduz estados e complexidade da primeira entrega                |
| US-0605 — solicitação de ajuste                                   | Pós-MVP     | Rejeitar e republicar cobre o piloto                            |
| US-0702 — alterações materiais versionadas                        | Pós-MVP     | Acordo confirmado será imutável; alterações exigem cancelamento |
| US-0802 a US-0805 — avaliação e reputação                         | Pós-piloto  | Requer volume e política de contestação                         |
| US-0905 e US-0907 — não comparecimento e reativação automatizados | Pós-piloto  | Tratamento administrativo manual no início                      |
| US-1002 — Web Push                                                | Pós-MVP     | E-mail e central interna cobrem eventos críticos                |
| US-1004 — WhatsApp                                                | Fora do MVP | Integração externa não é necessária à hipótese central          |
| US-1105 — registro próprio de suporte                             | Pós-piloto  | Operação usará processo assistido externo                       |
| US-1302 e US-1303 — dashboard e exportação                        | Pós-piloto  | Eventos brutos bastam para avaliação inicial                    |
| Pagamentos, chat, SMS, GPS, biometria, IA e integrações externas  | Fora do MVP | Não validam a hipótese central e ampliam risco                  |

## 6. Regras simplificadoras

- Oferta não recebe alteração material após a primeira candidatura.
- Acordo confirmado é imutável; correção exige cancelamento e nova oferta.
- Apenas um candidato pode ser selecionado por vez.
- Nenhuma aprovação ou seleção pode depender somente do cliente; a regra deve ser transacional no servidor e protegida por RLS.
- O administrador não pode assumir identidade de médico.
- Notificações não são fonte de verdade; o estado persistido na aplicação prevalece.
- Processos excepcionais sem automação serão tratados pela operação assistida e registrados na auditoria.

## 7. Sequência de entrega

| Onda                       | Resultado verificável                                                                                                   | Dependência |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------- |
| 0 — Fundação               | CI verde, ambientes, RLS-base e auditoria-base                                                                          | concluída   |
| 1 — Entrada                | Médico entra, é verificado e recebe vínculo ativo                                                                       | Onda 0      |
| 2 — Oferta                 | Médico elegível publica e outro médico visualiza                                                                        | Onda 1      |
| 3 — Escolha                | Candidatura, retirada, seleção e expiração funcionam                                                                    | Onda 2      |
| 4 — Acordo                 | Confirmação, aprovação configurável e acordo imutável                                                                   | Onda 3      |
| 5 — Piloto                 | Conclusão, cancelamento, notificações e operação assistida                                                              | Onda 4      |
| 6 — Comunicação e operação | Central de notificações, histórico pessoal, justificativas e fila de verificação CRM                                    | Onda 5      |
| 7 — Medição e polimento    | Eventos mínimos do funil, consulta operacional administrativa, mensagens de erro seguras e acessibilidade móvel/teclado | Ondas 5 e 6 |

Cada onda deve terminar com demonstração ponta a ponta, testes automatizados e aceite do Product Owner. Desenvolvimento paralelo é permitido somente quando não antecipa regras dependentes de uma onda posterior.

## 8. Critérios de aceite do MVP

- Dois cenários E2E aprovados: grupo com e sem aprovação institucional.
- Cenários de cancelamento antes e depois da confirmação aprovados.
- Usuário sem vínculo ativo não consegue ler nem alterar dados do grupo.
- Concorrência não permite dois substitutos confirmados para a mesma oferta.
- Toda transição crítica gera evento de auditoria com ator, entidade e horário.
- Nenhum segredo, documento profissional ou dado sensível aparece em logs.
- Todas as migrations são reproduzíveis em ambiente limpo.
- Auditoria de dependências sem vulnerabilidade crítica ou alta.
- Backup, restauração e rollback testados em homologação.
- Fluxo utilizável em viewport móvel e com acessibilidade básica.
- Suporte, responsáveis, termos e autorização institucional definidos antes de dados reais.

## 9. Indicadores do piloto

- usuários convidados, cadastrados, verificados e ativos;
- ofertas publicadas, expiradas, canceladas e confirmadas;
- tempo entre publicação e primeira candidatura;
- tempo entre seleção e confirmação;
- aprovações, rejeições e cancelamentos;
- erros técnicos e chamados por jornada;
- substituições concluídas sem intervenção operacional.

Não haverá meta estatística de reputação no MVP. O pequeno volume do piloto não sustenta uma pontuação confiável.

## 10. Controle de mudança

Uma entrada no escopo bloqueador exige registro de decisão contendo problema, urgência, risco, esforço, responsável e item removido ou postergado. Nenhuma nova funcionalidade entra no MVP apenas por conveniência comercial ou preferência de interface.

Este documento prevalece para priorização operacional sobre as classificações P0 amplas dos documentos anteriores. As regras de segurança, permissões, estados e auditoria dos documentos de origem permanecem vigentes.
