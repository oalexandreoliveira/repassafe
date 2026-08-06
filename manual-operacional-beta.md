# REPASSAFE  
# MANUAL OPERACIONAL DA BETA E HANDOFF PARA DESENVOLVIMENTO

**Código:** RPS-OPS-001  
**Versão:** 1.0  
**Status:** Aprovado para preparação da beta  
**Fuso:** America/Fortaleza  

---

# 1. FINALIDADE

Este manual define como a equipe do Repassafe administrará a beta, verificará médicos, prestará suporte, analisará ocorrências e reagirá a falhas.

Também contém o checklist formal para transferência do produto à equipe técnica.

---

# 2. MODELO DE OPERAÇÃO

A beta será:

- fechada;
- por convite;
- assistida;
- restrita aos grupos aprovados;
- monitorada;
- sujeita a suspensão;
- não exclusiva para situações urgentes.

O aplicativo poderá ser acessado 24 horas por dia.

O suporte humano não será apresentado como ininterrupto enquanto não houver equipe formal de plantão.

---

# 3. HORÁRIO E CANAIS DE SUPORTE

## Horário inicial

- atendimento ordinário: 07h às 22h;
- todos os dias durante o piloto;
- fuso America/Fortaleza.

Fora desse horário:

- solicitações poderão ser registradas;
- incidentes críticos poderão ser enviados ao WhatsApp administrativo;
- não haverá garantia de resposta imediata.

## Canais

- painel interno;
- e-mail de suporte;
- WhatsApp administrativo;
- canal técnico interno para erros.

## Regra de segurança

O Repassafe não deverá ser o único canal para resolver ausência iminente de cobertura.

O usuário deverá ser orientado a utilizar também os procedimentos institucionais aplicáveis.

---

# 4. SLA OPERACIONAL

| Solicitação | Meta inicial |
|---|---:|
| Confirmação automática de recebimento | Imediata |
| Verificação cadastral enviada até 16h | Mesmo dia, quando possível |
| Verificação cadastral geral | Até 1 dia útil |
| Correção de dado simples | Até 1 dia útil |
| Primeiro retorno de ocorrência grave | Até 4 horas no horário de suporte |
| Primeiro retorno de ocorrência comum | Até 1 dia útil |
| Decisão administrativa ordinária | Até 2 dias úteis |
| Contestação de avaliação | Até 3 dias úteis |
| Reativação após decisão | Até 1 dia útil |

Os prazos serão revisados após duas semanas de beta.

---

# 5. VERIFICAÇÃO DO CRM

## Procedimento

1. Acessar o cadastro pendente.
2. Conferir nome, CRM e UF.
3. Realizar consulta manual.
4. Conferir situação.
5. Conferir especialidade e RQE.
6. Registrar data, hora e fonte.
7. Selecionar resultado.
8. Aprovar, rejeitar ou solicitar correção.

## Resultados possíveis

- verificado sem divergência;
- verificado com observação;
- divergência de nome;
- divergência de número;
- situação incompatível;
- RQE não localizado;
- informação insuficiente;
- consulta indisponível.

## Indisponibilidade do portal

Quando a fonte estiver indisponível:

- cadastro ficará pendente;
- usuário será informado;
- administrador tentará novamente;
- nenhuma aprovação será presumida.

---

# 6. CRIAÇÃO DE GRUPO

Antes de ativar um grupo, o administrador deverá registrar:

- instituição;
- equipe;
- setor;
- responsáveis;
- política de aprovação;
- política de candidatura;
- prazos;
- regra de cancelamento;
- participantes;
- canal institucional alternativo;
- responsável por decidir conflitos institucionais.

Nenhum grupo será ativado sem administrador responsável.

---

# 7. ONBOARDING DOS MÉDICOS

O onboarding deverá explicar:

1. o que o Repassafe faz;
2. o que ele não substitui;
3. diferença entre candidatura, seleção e confirmação;
4. aprovação institucional;
5. regras de cancelamento;
6. consequências do não comparecimento;
7. funcionamento das avaliações;
8. proteção dos dados;
9. proibição de dados de pacientes;
10. canais de suporte.

O aceite deverá ser registrado.

---

# 8. OCORRÊNCIAS

## Categorias

- cancelamento tardio;
- desistência;
- não comparecimento;
- atraso;
- divergência de horário;
- divergência de valor;
- pagamento;
- informação falsa;
- uso indevido;
- acesso indevido;
- dado de paciente;
- avaliação contestada;
- falha institucional;
- falha técnica.

## Elementos mínimos

- identificador;
- oferta;
- substituição;
- usuários envolvidos;
- descrição;
- data;
- evidências;
- criticidade;
- responsável;
- decisão;
- histórico.

---

# 9. CLASSIFICAÇÃO DE SEVERIDADE

## S1 — Crítica

Exemplos:

- possível exposição de dados de pacientes;
- acesso indevido relevante;
- fraude;
- comprometimento de conta administrativa;
- indisponibilidade generalizada próxima a plantões;
- duplicação de substitutos confirmados.

Ação:

- contenção imediata;
- suspensão de funções afetadas;
- comunicação aos responsáveis;
- preservação de evidências;
- acionamento técnico prioritário.

## S2 — Alta

Exemplos:

- não comparecimento;
- cancelamento tardio próximo ao horário;
- conta suspeita;
- alteração indevida de acordo;
- falha de aprovação institucional.

Ação:

- suspensão preventiva quando aplicável;
- contato com envolvidos;
- registro completo;
- decisão prioritária.

## S3 — Moderada

Exemplos:

- atraso;
- divergência financeira;
- avaliação contestada;
- dificuldade de acesso individual.

## S4 — Baixa

Exemplos:

- dúvida;
- correção de perfil;
- sugestão;
- falha visual sem impacto operacional.

---

# 10. ESCADA DE MEDIDAS ADMINISTRATIVAS

Possíveis decisões:

1. orientação;
2. arquivamento sem penalidade;
3. advertência;
4. bloqueio de funcionalidade;
5. suspensão temporária;
6. suspensão por prazo indeterminado;
7. exclusão;
8. comunicação institucional, quando necessária.

A decisão deverá considerar:

- gravidade;
- proximidade do plantão;
- dano;
- intenção;
- reincidência;
- justificativa;
- força maior;
- evidências.

---

# 11. NÃO COMPARECIMENTO

Ao receber denúncia:

1. abrir ocorrência S2;
2. suspender preventivamente candidaturas;
3. notificar o usuário;
4. solicitar justificativa;
5. ouvir titular e aprovador;
6. reunir evidências;
7. decidir;
8. registrar a conclusão.

Prazo inicial para justificativa:

- 24 horas, salvo impossibilidade comprovada.

Possíveis resultados:

- força maior reconhecida;
- advertência;
- suspensão;
- exclusão em situação grave ou reincidente.

---

# 12. CANCELAMENTO COM MENOS DE 48 HORAS

O sistema deverá:

- exigir justificativa;
- registrar ocorrência;
- informar as partes;
- marcar possibilidade de taxa;
- aplicar bloqueio preventivo configurado;
- encaminhar para análise.

Durante a beta:

- não haverá cobrança automática;
- o administrador poderá registrar valor manual;
- a liberação poderá depender de regularização;
- o valor da taxa será configuração do grupo.

A ausência de valor definitivo não bloqueia o desenvolvimento, pois o sistema utilizará parâmetro configurável.

---

# 13. CONTESTAÇÃO DE AVALIAÇÃO

O usuário poderá contestar em até 5 dias corridos.

A contestação deverá indicar:

- avaliação;
- motivo;
- evidência;
- resultado esperado.

O administrador poderá:

- manter;
- anular;
- corrigir vínculo da avaliação;
- suspender exibição temporariamente.

A nota deverá ser recalculada após decisão.

---

# 14. DADOS DE PACIENTES

Quando identificado conteúdo relacionado a paciente:

1. restringir imediatamente o acesso ao conteúdo;
2. preservar evidência administrativa mínima;
3. notificar responsável interno;
4. avaliar incidente;
5. remover o conteúdo operacionalmente;
6. orientar o usuário;
7. aplicar medida quando necessário.

Campos livres deverão exibir aviso permanente.

---

# 15. INDISPONIBILIDADE DO SISTEMA

## Comunicação

A equipe deverá manter:

- página ou canal de status;
- aviso no WhatsApp administrativo;
- mensagem aos grupos afetados.

## Contingência

Em indisponibilidade:

- usar procedimentos institucionais existentes;
- não considerar o Repassafe único canal;
- registrar posteriormente os fatos essenciais, quando apropriado;
- não criar registros retroativos sem identificação explícita.

## Recuperação

Após restabelecimento:

- verificar integridade;
- revisar eventos pendentes;
- identificar ações duplicadas;
- comunicar normalização.

---

# 16. SUPORTE ADMINISTRATIVO

O administrador poderá corrigir:

- telefone;
- e-mail;
- erro de grafia;
- vínculo;
- setor;
- status administrativo.

Não poderá alterar silenciosamente:

- valor;
- data;
- horário;
- substituto;
- aprovação;
- avaliação;
- histórico.

Correções em acordo exigirão versão e auditoria.

---

# 17. MONITORAMENTO DA BETA

Revisão diária:

- cadastros pendentes;
- ofertas emergenciais;
- confirmações pendentes;
- aprovações pendentes;
- ocorrências;
- falhas de notificação;
- usuários suspensos;
- erros críticos.

Revisão semanal:

- funil;
- tempo de confirmação;
- cancelamentos;
- satisfação;
- suporte;
- falhas;
- demandas não previstas;
- itens candidatos a P1.

---

# 18. CRITÉRIOS DE INTERRUPÇÃO DA BETA

A beta poderá ser pausada quando houver:

- falha grave de segurança;
- duplicação de acordos;
- acesso indevido sistêmico;
- risco assistencial relevante;
- ausência de suporte mínimo;
- determinação institucional;
- uso recorrente para dados de pacientes;
- falha de integridade dos registros.

A retomada exigirá:

- causa identificada;
- correção;
- testes;
- aprovação do produto;
- comunicação aos participantes.

---

# 19. PACOTE OFICIAL PARA A EQUIPE TÉCNICA

A equipe técnica deverá receber:

1. RPS-FUNC-001 — Baseline v1.1;
2. RPS-GOV-001 — Governança, permissões e estados;
3. RPS-OPS-001 — Manual operacional;
4. Backlog Priorizado v1.0;
5. guideline visual do Repassafe;
6. Termo de Abertura;
7. formulário de validação;
8. resultados da pesquisa, quando disponíveis.

---

# 20. SPRINT 0 — ESCOPO FORMAL

## Objetivo

Preparar a fundação técnica sem implementar todo o fluxo de negócio.

## Entregas obrigatórias

### Repositório

- GitHub;
- proteção da branch principal;
- pull requests;
- template de issues;
- convenções de commit;
- revisão obrigatória.

### Aplicação

- Next.js;
- TypeScript;
- lint;
- formatter;
- estrutura de pastas;
- tratamento de configuração;
- PWA inicial.

### Design

- tokens;
- paleta;
- tipografia;
- componentes-base;
- estados;
- ícones;
- responsividade.

### Supabase

- projetos separados;
- schema inicial;
- autenticação;
- RLS-base;
- migrations;
- seed de homologação;
- storage configurado.

### Segurança

- MFA administrativo;
- controle de segredos;
- rate limiting planejado;
- auditoria-base;
- políticas de sessão;
- revisão de dependências.

### CI/CD

- validação de tipos;
- lint;
- testes;
- build;
- preview;
- deploy de homologação;
- liberação controlada de produção.

### Observabilidade

- captura de erros;
- logs estruturados;
- identificação de ambiente;
- alertas críticos;
- health check.

### Testes

- framework unitário;
- framework de integração;
- E2E;
- dados de teste;
- estratégia de testes de RLS.

---

# 21. SAÍDA ESPERADA DA SPRINT 0

A Sprint 0 estará concluída quando:

- projeto compilar;
- homologação estiver acessível;
- autenticação-base funcionar;
- administrador utilizar MFA;
- banco receber migrations;
- RLS-base estiver ativa;
- design tokens estiverem aplicados;
- CI impedir merge com falha;
- erros forem monitorados;
- documentação de execução local estiver disponível;
- seed permitir demonstrar perfis e grupos fictícios.

---

# 22. DECISÕES TÉCNICAS INICIAIS — ADRs

A equipe técnica deverá registrar, no mínimo:

- ADR-001 — Next.js e arquitetura da aplicação;
- ADR-002 — Supabase e PostgreSQL;
- ADR-003 — autenticação;
- ADR-004 — Row Level Security;
- ADR-005 — máquina de estados;
- ADR-006 — auditoria;
- ADR-007 — versionamento de acordos;
- ADR-008 — notificações;
- ADR-009 — observabilidade;
- ADR-010 — ambientes e deploy.

---

# 23. PROMPT DE ABERTURA DO CHAT TÉCNICO

Use o texto abaixo para iniciar o novo chat ou projeto:

“Este chat será responsável pela execução técnica do MVP do Repassafe. Considere como fontes oficiais a Especificação Funcional Baseline v1.1, o Anexo de Governança, Permissões e Máquina de Estados, o Backlog Priorizado, o Manual Operacional da Beta e o guideline visual. Inicie pela Sprint 0. Estruture repositório, ambientes, arquitetura, banco de dados, autenticação, Row Level Security, auditoria, design system, CI/CD, observabilidade e estratégia de testes. Não altere regras de negócio silenciosamente. Qualquer ambiguidade deve ser registrada como decisão técnica ou encaminhada ao núcleo de produto. O stack inicial aprovado é Next.js, TypeScript, PWA, Supabase/PostgreSQL, Vercel e GitHub. Entregue primeiro o plano técnico da Sprint 0, a árvore inicial do projeto, o modelo de dados preliminar, as políticas de acesso e os ADRs necessários.”