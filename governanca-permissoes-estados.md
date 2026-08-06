# REPASSAFE  
# ANEXO DE GOVERNANÇA, PERMISSÕES, ESTADOS E CONTROLE DE ESCOPO

**Código:** RPS-GOV-001  
**Versão:** 1.0  
**Status:** Aprovado para desenvolvimento  
**Documento vinculado:** RPS-FUNC-001 — Baseline v1.1  

---

# 1. MATRIZ DE PERFIS E PERMISSÕES

Os perfis poderão ser acumulados. Um coordenador poderá também atuar como médico, desde que possua as duas permissões.

| Ação | Médico | Aprovador institucional | Admin Repassafe |
|---|---:|---:|---:|
| Criar conta | Sim | Sim | Sim |
| Confirmar telefone e e-mail | Próprios | Próprios | Próprios |
| Alterar dados pessoais | Próprios | Próprios | Suporte auditado |
| Verificar CRM | Não | Não | Sim |
| Aprovar conta Repassafe | Não | Não | Sim |
| Rejeitar conta | Não | Não | Sim |
| Solicitar correção cadastral | Não | Não | Sim |
| Criar grupo | Não | Não | Sim |
| Alterar regras do grupo | Não | Sugere | Sim |
| Vincular médico ao grupo | Não | Solicita/confirma | Sim |
| Confirmar vínculo institucional | Não | Sim | Registra evidência |
| Autorizar setor | Não | Sim | Registra decisão |
| Visualizar ofertas do grupo | Sim, se vinculado | Sim | Sim |
| Publicar oferta | Sim, se habilitado | Sim, se médico | Apenas suporte auditado |
| Editar oferta própria | Sim, conforme estado | Não | Intervenção auditada |
| Cancelar oferta própria | Sim | Não | Intervenção auditada |
| Candidatar-se | Sim | Sim, se médico | Não |
| Retirar candidatura própria | Sim | Sim, se médico | Intervenção auditada |
| Visualizar candidatos | Titular | Quando necessário | Sim |
| Selecionar candidato | Titular | Não | Somente suporte excepcional |
| Confirmar substituição | Selecionado | Se selecionado como médico | Não |
| Aprovar institucionalmente | Não | Sim | Não |
| Rejeitar institucionalmente | Não | Sim | Não |
| Solicitar ajuste institucional | Não | Sim | Não |
| Confirmar realização | Partes | Sim, se autorizado | Intervenção auditada |
| Avaliar transação | Partes | Se participou | Não |
| Abrir ocorrência | Sim | Sim | Sim |
| Analisar ocorrência | Não | Envia manifestação | Sim |
| Suspender usuário | Não | Solicita | Sim |
| Reativar usuário | Não | Opina | Sim |
| Consultar próprio histórico | Sim | Sim | Sim |
| Consultar histórico do grupo | Dados permitidos | Sim | Sim |
| Consultar auditoria completa | Não | Eventos do grupo, limitados | Sim |
| Exportar dados | Não | Relatório agregado | Sim |
| Ver notas administrativas internas | Não | Não | Sim |
| Acessar telefone/e-mail antes da seleção | Não | Apenas se necessário | Sim |
| Acessar telefone/e-mail após seleção | Partes | Sim, quando aplicável | Sim |

---

# 2. REGRAS DE VISIBILIDADE

## 2.1 Perfil apresentado aos interessados

Um médico que visualiza uma oferta poderá ver do titular:

- nome;
- fotografia;
- CRM e UF;
- verificação;
- vínculo;
- setor;
- indicadores reputacionais;
- quantidade de repasses concluídos.

Telefone e e-mail não serão apresentados antes da candidatura selecionada.

## 2.2 Perfil apresentado ao titular

Antes da seleção:

- nome;
- fotografia;
- CRM;
- RQE;
- vínculos;
- setores;
- indicadores;
- reputação.

Depois da seleção:

- telefone;
- e-mail;
- demais dados estritamente necessários.

## 2.3 Dados administrativos

Serão exclusivos do Repassafe:

- CPF;
- data de nascimento;
- notas internas;
- documentos administrativos;
- justificativas protegidas;
- histórico completo de suspensão;
- informações de suporte;
- logs técnicos.

## 2.4 Auditoria

O médico poderá consultar eventos que o afetem.

O aprovador poderá consultar eventos de seu grupo.

O administrador poderá consultar a auditoria completa conforme sua permissão.

---

# 3. SEPARAÇÃO DAS MÁQUINAS DE ESTADO

Para evitar ambiguidades, o sistema utilizará estados separados para:

1. oferta;
2. candidatura;
3. substituição;
4. ocorrência;
5. usuário.

---

# 4. ESTADOS DA OFERTA

## DRAFT

Oferta salva, ainda não publicada.

### Ações permitidas

- editar;
- excluir;
- publicar.

---

## OPEN_NORMAL

Oferta publicada com mais de 48 horas de antecedência.

### Ações permitidas

- receber candidaturas;
- editar conforme regras;
- retirar;
- selecionar candidato;
- converter em emergencial.

---

## OPEN_EMERGENCY

Oferta publicada ou convertida com menos de 48 horas.

### Ações permitidas

- receber candidaturas;
- selecionar candidato;
- retirar;
- permanecer ativa até o início.

---

## SELECTION_IN_PROGRESS

Há candidato selecionado aguardando confirmação.

### Ações permitidas

- selecionado confirma;
- selecionado recusa;
- prazo expira;
- titular cancela seleção;
- administrador intervém.

Os demais candidatos permanecem registrados.

---

## CLOSED_CONFIRMED

A oferta originou substituição confirmada.

Não recebe candidaturas.

---

## CANCELLED_BY_OWNER

Oferta retirada pelo titular antes da confirmação.

---

## CANCELLED_ADMIN

Oferta encerrada pelo administrador por segurança, fraude, erro ou ordem institucional.

---

## EXPIRED

Prazo terminou sem substituição confirmada.

---

# 5. TRANSIÇÕES DA OFERTA

| Origem | Evento | Destino | Ator |
|---|---|---|---|
| DRAFT | Publicar com mais de 48h | OPEN_NORMAL | Titular |
| DRAFT | Publicar com menos de 48h | OPEN_EMERGENCY | Titular |
| OPEN_NORMAL | Chegar à janela de 48h e converter | OPEN_EMERGENCY | Titular |
| OPEN_NORMAL | Prazo encerrar sem conversão | EXPIRED | Sistema |
| OPEN_EMERGENCY | Horário do plantão chegar | EXPIRED | Sistema |
| OPEN_NORMAL | Selecionar candidato | SELECTION_IN_PROGRESS | Titular |
| OPEN_EMERGENCY | Selecionar candidato | SELECTION_IN_PROGRESS | Titular |
| SELECTION_IN_PROGRESS | Candidato recusar | Estado aberto anterior | Candidato |
| SELECTION_IN_PROGRESS | Prazo expirar | Estado aberto compatível | Sistema |
| SELECTION_IN_PROGRESS | Candidato confirmar | Aguardar fluxo da substituição | Sistema |
| Qualquer aberta | Titular retirar | CANCELLED_BY_OWNER | Titular |
| Qualquer operacional | Encerramento administrativo | CANCELLED_ADMIN | Admin |
| Fluxo confirmado | Substituição confirmada | CLOSED_CONFIRMED | Sistema |

---

# 6. ESTADOS DA CANDIDATURA

## ACTIVE

Candidatura válida.

## WITHDRAWN

Retirada pelo candidato antes da seleção.

## SELECTED_PENDING_CONFIRMATION

Selecionada e aguardando confirmação.

## CONFIRMED

Candidato aceitou as condições.

## DECLINED

Candidato recusou após seleção.

## CONFIRMATION_EXPIRED

Não respondeu no prazo.

## NOT_SELECTED

Outro candidato concluiu o fluxo.

## INVALIDATED

Candidatura invalidada por alteração material, perda de autorização ou intervenção administrativa.

---

# 7. ESTADOS DA SUBSTITUIÇÃO

## PENDING_SUBSTITUTE_CONFIRMATION

Candidato selecionado, ainda sem confirmação.

## PENDING_INSTITUTIONAL_APPROVAL

Substituto confirmou, mas o grupo exige homologação.

## CONFIRMED

Todas as confirmações obrigatórias foram concluídas.

## REJECTED_INSTITUTIONALLY

Aprovador rejeitou.

## ADJUSTMENT_REQUESTED

Aprovador solicitou mudança.

## CANCELLED_BY_OWNER

Titular cancelou depois da formação da substituição.

## CANCELLED_BY_SUBSTITUTE

Substituto desistiu.

## OCCURRENCE_OPEN

Existe ocorrência que impede encerramento normal ou exige análise.

## COMPLETION_PENDING_CONFIRMATION

Uma parte declarou conclusão, aguardando confirmação.

## COMPLETED

Plantão concluído.

## DISPUTED

Há divergência formal.

## CLOSED_ADMIN

Ocorrência encerrada administrativamente.

---

# 8. TRANSIÇÕES DA SUBSTITUIÇÃO

| Origem | Evento | Destino |
|---|---|---|
| PENDING_SUBSTITUTE_CONFIRMATION | Substituto confirma, sem aprovação institucional | CONFIRMED |
| PENDING_SUBSTITUTE_CONFIRMATION | Substituto confirma, com aprovação obrigatória | PENDING_INSTITUTIONAL_APPROVAL |
| PENDING_SUBSTITUTE_CONFIRMATION | Substituto recusa | Encerrar e reabrir oferta |
| PENDING_SUBSTITUTE_CONFIRMATION | Prazo expira | Encerrar e reabrir oferta |
| PENDING_INSTITUTIONAL_APPROVAL | Aprovador aprova | CONFIRMED |
| PENDING_INSTITUTIONAL_APPROVAL | Aprovador rejeita | REJECTED_INSTITUTIONALLY |
| PENDING_INSTITUTIONAL_APPROVAL | Aprovador solicita ajuste | ADJUSTMENT_REQUESTED |
| ADJUSTMENT_REQUESTED | Partes reconfirmam | PENDING_INSTITUTIONAL_APPROVAL ou CONFIRMED |
| CONFIRMED | Titular cancela | CANCELLED_BY_OWNER |
| CONFIRMED | Substituto desiste | CANCELLED_BY_SUBSTITUTE |
| CONFIRMED | Ocorrência relevante | OCCURRENCE_OPEN |
| CONFIRMED | Substituto declara conclusão | COMPLETION_PENDING_CONFIRMATION |
| COMPLETION_PENDING_CONFIRMATION | Outra parte confirma | COMPLETED |
| COMPLETION_PENDING_CONFIRMATION | Outra parte contesta | DISPUTED |
| OCCURRENCE_OPEN | Administrador resolve | CLOSED_ADMIN ou retorno permitido |
| DISPUTED | Administrador resolve | COMPLETED ou CLOSED_ADMIN |

---

# 9. INVARIANTES DO SISTEMA

As seguintes regras nunca poderão ser violadas:

1. Uma oferta não poderá possuir dois substitutos confirmados.
2. Uma candidatura não poderá ser duplicada pelo mesmo médico.
3. O titular não poderá candidatar-se à própria oferta.
4. Usuário não autorizado não poderá visualizar grupo alheio.
5. Usuário suspenso não poderá publicar ou candidatar-se.
6. Oferta expirada não receberá candidatura.
7. Substituição com aprovação institucional obrigatória não poderá chegar a CONFIRMED sem aprovação.
8. O administrador não poderá aprovar em nome da instituição.
9. Alteração material invalidará as confirmações anteriores.
10. Registro confirmado não poderá ser apagado.
11. Cancelamentos permanecerão auditados.
12. Avaliação somente ocorrerá após conclusão.
13. Uma parte não poderá avaliar duas vezes a mesma transação.
14. Dados de contato não serão públicos antes da seleção.
15. Dados de pacientes não terão campo próprio.
16. Eventos críticos deverão ser idempotentes para evitar duplicação.
17. Horários serão interpretados em America/Fortaleza.
18. Valores serão armazenados em centavos.
19. Toda ação administrativa crítica exigirá justificativa.
20. Suspensão preventiva não será tratada como decisão definitiva.

---

# 10. ALTERAÇÕES MATERIAIS

Serão materiais:

- data;
- horário inicial;
- horário final;
- setor;
- valor;
- pagador;
- forma de pagamento;
- prazo de pagamento;
- instituição;
- exigência de aprovação.

Quando ocorrer alteração material:

1. nova versão será criada;
2. confirmações anteriores serão invalidadas;
3. partes serão notificadas;
4. novo aceite será exigido;
5. aprovador decidirá novamente, quando aplicável.

Alterações meramente descritivas poderão ser registradas sem reiniciar o fluxo, desde que não modifiquem obrigações.

---

# 11. POLÍTICA DE CONCORRÊNCIA

Para evitar conflitos:

- seleção deverá utilizar operação transacional;
- apenas um candidato poderá ser selecionado;
- confirmação deverá validar o estado atual;
- requisições duplicadas não poderão gerar múltiplos acordos;
- expiração deverá ser processada por rotina idempotente;
- mudanças de estado deverão ser registradas atomicamente.

---

# 12. CONGELAMENTO DO ESCOPO

O escopo da beta está oficialmente congelado.

## P0 Core

Referências principais:

- EP-00;
- EP-01;
- EP-02;
- EP-03;
- EP-04;
- EP-05;
- EP-06;
- EP-07.

## P0 Operacional

- EP-08;
- EP-09;
- EP-10;
- EP-11;
- EP-13.

## P0 Segurança

- EP-12.

## Regra de alteração

Uma nova funcionalidade somente entrará no P0 quando:

- corrigir risco grave;
- for necessária para concluir o fluxo;
- atender exigência institucional obrigatória;
- corrigir falha de segurança.

Toda alteração deverá registrar:

- motivo;
- impacto;
- urgência;
- esforço;
- item que será removido ou postergado;
- responsável pela decisão.

---

# 13. DEFINITION OF READY

Uma história estará pronta para desenvolvimento quando possuir:

- descrição;
- ator;
- benefício;
- critérios de aceite;
- regras associadas;
- estados afetados;
- permissões;
- dados envolvidos;
- eventos de auditoria;
- cenários de erro;
- dependências;
- design ou wireframe suficiente.

---

# 14. DEFINITION OF DONE

Uma história estará concluída quando:

- código implementado;
- revisão realizada;
- testes automatizados;
- testes manuais críticos;
- acessibilidade básica verificada;
- funcionamento móvel confirmado;
- RLS testada;
- auditoria implementada;
- erros tratados;
- documentação atualizada;
- deploy em homologação;
- aceite de produto concluído.

---

# 15. GATES DE LIBERAÇÃO

## Gate A — Alpha técnico

Requisitos:

- ambientes;
- autenticação;
- banco;
- design system;
- permissões-base;
- auditoria-base.

## Gate B — Fluxo Core

Requisitos:

- cadastro;
- verificação;
- grupo;
- publicação;
- candidatura;
- seleção;
- confirmação;
- aprovação;
- acordo.

## Gate C — Beta fechada simulada

Requisitos:

- conclusão;
- avaliação;
- cancelamento;
- ocorrência;
- painel;
- notificações;
- testes de acesso.

## Gate D — Piloto com situações reais

Exige adicionalmente:

- autorização institucional necessária;
- termos vigentes;
- suporte operacional;
- responsáveis definidos;
- plano de contingência;
- teste de backup;
- treinamento dos participantes.