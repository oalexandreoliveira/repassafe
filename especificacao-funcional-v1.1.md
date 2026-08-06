# REPASSAFE  
# ESPECIFICAÇÃO FUNCIONAL CONSOLIDADA — BASELINE V1.1

**Código do documento:** RPS-FUNC-001  
**Produto:** Repassafe  
**Versão:** 1.1  
**Status:** Aprovado para início do desenvolvimento técnico  
**Data-base:** 6 de agosto de 2026  
**Fuso horário oficial:** America/Fortaleza  
**Responsável pelo produto:** [preencher]  
**Responsável técnico:** [preencher após formação da equipe]  
**Piloto inicial:** Equipe de Urgência e Emergência — Socorrão II, São Luís/MA  
**Modelo de lançamento:** Beta privada, fechada e assistida  

---

## 1. CONTROLE E PRECEDÊNCIA DOS DOCUMENTOS

Esta baseline consolida as decisões funcionais adotadas até o momento e substitui as versões anteriores da Especificação Funcional quando houver conflito.

A ordem de precedência será:

1. **Especificação Funcional Consolidada — Baseline v1.1**
2. **Anexo de Governança, Permissões e Máquina de Estados**
3. **Backlog Priorizado do Repassafe v1.0**
4. **Manual Operacional da Beta**
5. Documentos e versões anteriores

Em caso de divergência, prevalecerá o documento de maior posição nessa ordem.

O backlog continua válido, mas deverá ser interpretado conforme as regras desta baseline.

---

## 2. VISÃO DO PRODUTO

O Repassafe é uma plataforma destinada a organizar, formalizar e tornar mais seguras as substituições de plantões médicos.

O produto permitirá que um médico:

1. publique um plantão que precisa repassar;
2. receba manifestações de interesse;
3. escolha um candidato;
4. obtenha a confirmação do substituto;
5. submeta a substituição à aprovação institucional, quando exigida;
6. registre as condições do acordo;
7. acompanhe a conclusão;
8. construa um histórico objetivo de confiabilidade.

O MVP será uma aplicação web responsiva e instalável como PWA, desenvolvida prioritariamente para uso em smartphones.

---

## 3. PROPOSTA DE VALOR

> O Repassafe permite que médicos repassem plantões dentro de redes verificadas, com condições claras, seleção do substituto, aprovação institucional configurável e registro rastreável de toda a operação.

A jornada principal do MVP será:

> **Publicar → candidatar-se → selecionar → confirmar → aprovar, quando necessário → registrar → concluir → avaliar.**

---

## 4. OBJETIVO DO MVP

O MVP deverá validar se médicos e coordenadores utilizam um fluxo específico para repasses quando ele:

- mantém a agilidade do processo atual;
- organiza as informações essenciais;
- reduz a dependência de conversas dispersas;
- apresenta profissionais verificados;
- registra as confirmações;
- permite aprovação institucional;
- mantém histórico de cancelamentos e conclusões;
- melhora a confiança entre os participantes.

A métrica principal será:

> **Percentual de ofertas publicadas que chegam ao status de substituição confirmada.**

---

## 5. ESCOPO DO PILOTO

### 5.1 Participantes iniciais

- médicos da equipe-piloto;
- médicos previamente convidados;
- coordenadores ou aprovadores institucionais, quando aplicável;
- administradores do Repassafe;
- equipe de suporte da beta.

### 5.2 Modelo de acesso

O acesso será fechado.

Não haverá:

- cadastro público com aprovação automática;
- visualização pública de ofertas;
- candidatura por usuário não verificado;
- acesso a grupos sem vínculo;
- participação automática apenas por possuir CRM ativo.

### 5.3 Escala inicial

O primeiro piloto será direcionado à equipe de Urgência e Emergência do Socorrão II.

UTI e Ala Vermelha permanecem fora do primeiro ciclo, salvo decisão posterior formalizada por alteração da baseline.

---

## 6. TERMINOLOGIA OFICIAL

### Médico titular ou repassante

Médico originalmente responsável pelo plantão e que publica a necessidade de substituição.

### Candidato

Médico que manifesta interesse em assumir uma oferta.

### Substituto

Candidato selecionado que confirma as condições do repasse.

### Aprovador institucional

Coordenador, gestor ou representante autorizado a homologar substituições em determinado grupo.

### Administrador Repassafe

Integrante da equipe do Repassafe responsável por verificação profissional, administração, suporte e aplicação das regras da plataforma.

### Grupo

Rede fechada de usuários vinculada a uma instituição, equipe, setor ou escala.

### Oferta

Publicação contendo as condições do plantão disponível para repasse.

### Substituição

Relação formada depois da escolha e confirmação do substituto, sujeita ou não à aprovação institucional.

### Acordo registrado

Versão consolidada e preservada das condições confirmadas.

---

## 7. PERFIS DO SISTEMA

### 7.1 Médico

Poderá atuar como:

- titular;
- candidato;
- substituto;
- avaliador de transações concluídas.

### 7.2 Aprovador institucional

Poderá:

- visualizar solicitações do grupo sob sua responsabilidade;
- aprovar;
- rejeitar;
- solicitar ajuste;
- consultar histórico do grupo;
- registrar ocorrência institucional.

O aprovador poderá também possuir perfil médico.

### 7.3 Administrador Repassafe

Poderá:

- verificar cadastros;
- aprovar ou rejeitar contas;
- criar grupos;
- vincular usuários;
- configurar regras;
- suspender e reativar usuários;
- analisar ocorrências;
- consultar auditoria;
- prestar suporte.

O administrador não poderá substituir uma aprovação institucional exigida pelo grupo.

---

## 8. VERIFICAÇÃO DO USUÁRIO

A verificação possuirá níveis separados.

### 8.1 Verificação da conta pelo Repassafe

Responsabilidade da equipe Repassafe.

Abrangerá:

- CPF informado;
- telefone confirmado;
- e-mail confirmado;
- nome;
- CRM;
- unidade federativa;
- situação profissional;
- especialidade;
- RQE, quando disponível;
- consistência dos dados.

Na beta, a consulta do CRM será manual no portal oficial correspondente.

### 8.2 Autorização institucional

Será exigida apenas quando configurada pelo grupo.

Poderá abranger:

- vínculo com a instituição;
- autorização para o setor;
- inclusão em escala;
- credenciamento;
- validação do coordenador.

### 8.3 Selos

O perfil poderá apresentar:

- telefone confirmado;
- e-mail confirmado;
- CRM verificado;
- RQE verificado;
- vínculo declarado;
- vínculo confirmado;
- setor autorizado;
- verificação expirada.

O selo “CRM verificado” não significará credenciamento institucional.

### 8.4 Revalidação

A verificação profissional possuirá validade operacional inicial de 90 dias.

A periodicidade será configurável.

Ao expirar:

- o histórico continuará acessível;
- novas publicações ou candidaturas poderão ser bloqueadas;
- o usuário deverá ser revalidado.

---

## 9. GRUPOS E APROVAÇÃO INSTITUCIONAL

Cada grupo deverá possuir uma política própria.

### Configurações possíveis

- aprovação obrigatória em todas as substituições;
- aprovação obrigatória apenas para médicos sem vínculo confirmado;
- aprovação obrigatória apenas em setores determinados;
- aprovação institucional não exigida.

Todo grupo deverá possuir:

- administrador responsável;
- instituição;
- setor ou abrangência;
- regras de candidatura;
- regras de cancelamento;
- política de aprovação.

Um coordenador somente será obrigatório quando o grupo exigir aprovação institucional.

---

## 10. OFERTAS DE PLANTÃO

### 10.1 Dados obrigatórios

- grupo;
- instituição;
- setor;
- data;
- horário inicial;
- horário final;
- valor;
- responsável pelo pagamento;
- forma de pagamento;
- prazo de pagamento;
- observações operacionais;
- prazo para candidaturas.

### 10.2 Oferta normal

Será classificada como normal quando publicada com mais de 48 horas de antecedência.

Por padrão:

- permanecerá aberta até 48 horas antes do plantão;
- poderá ser encerrada antes, caso haja confirmação;
- poderá ser convertida em emergencial.

### 10.3 Oferta emergencial

Será classificada como emergencial quando:

- for publicada com menos de 48 horas de antecedência; ou
- for convertida de oferta normal.

Poderá permanecer aberta até:

- confirmação de substituto;
- cancelamento;
- horário de início do plantão.

### 10.4 Conversão

Quando uma oferta normal chegar à janela de 48 horas sem substituto confirmado, o titular será consultado.

Opções:

- converter em emergencial;
- encerrar a oferta.

Sem resposta até o limite configurado, a oferta expirará.

### 10.5 Prazo de confirmação do candidato

Parâmetros iniciais:

- oferta normal: 4 horas;
- oferta emergencial: 30 minutos;
- nunca além do horário de início.

Os prazos serão configuráveis por grupo.

---

## 11. CANDIDATURA E SELEÇÃO

### 11.1 Manifestação de interesse

A candidatura não formará o acordo.

O candidato deverá declarar:

- disponibilidade;
- ciência de data e horário;
- ciência do setor;
- ciência do valor;
- ciência da forma e prazo de pagamento;
- atendimento dos requisitos apresentados.

### 11.2 Retirada

O candidato poderá retirar sua candidatura enquanto não tiver sido selecionado.

A retirada ficará registrada.

### 11.3 Seleção

O titular poderá selecionar apenas um candidato por vez.

A seleção:

- não confirma a substituição;
- inicia o prazo de confirmação;
- mantém os demais candidatos disponíveis até a confirmação do escolhido.

Caso o selecionado recuse ou não responda no prazo:

- a seleção expirará;
- o titular poderá escolher outro candidato;
- a oferta voltará ao estado compatível.

---

## 12. INFORMAÇÕES VISÍVEIS

### 12.1 Antes da seleção

O titular poderá visualizar:

- nome;
- fotografia;
- CRM e UF;
- situação de verificação;
- RQE;
- especialidades;
- vínculos;
- setores autorizados;
- repasses ofertados;
- repasses assumidos;
- repasses concluídos;
- cancelamentos;
- média de avaliações;
- quantidade de avaliações.

### 12.2 Dados de contato

Telefone e e-mail não serão exibidos antes da seleção.

Após a seleção, poderão ser visualizados por:

- titular;
- candidato escolhido;
- aprovador institucional, quando necessário;
- administrador Repassafe.

### 12.3 Reputação

A nota pública será exibida a partir de três avaliações válidas.

Antes disso:

> Novo na plataforma — avaliações insuficientes.

Quantidade de ofertas, candidaturas e conclusões serão apresentadas separadamente.

---

## 13. CONFIRMAÇÃO E APROVAÇÃO

### 13.1 Confirmação do substituto

O selecionado deverá revisar e confirmar:

- data;
- horário;
- setor;
- valor;
- responsável pelo pagamento;
- forma e prazo de pagamento;
- regras de cancelamento;
- eventual necessidade de aprovação institucional.

### 13.2 Grupo sem aprovação institucional

A substituição será confirmada após:

1. seleção pelo titular;
2. confirmação do substituto.

### 13.3 Grupo com aprovação institucional

A substituição será confirmada após:

1. seleção pelo titular;
2. confirmação do substituto;
3. aprovação do responsável institucional.

### 13.4 Rejeição

A rejeição institucional exigirá justificativa.

O sistema poderá:

- reabrir a oferta;
- permitir nova seleção;
- encerrar a oferta, conforme regra do grupo.

### 13.5 Solicitação de ajuste

Alterações em:

- data;
- horário;
- setor;
- valor;
- responsável pelo pagamento;
- forma de pagamento;
- prazo de pagamento;

serão consideradas materiais e exigirão nova confirmação das partes.

---

## 14. REGISTRO DO ACORDO

Depois da confirmação, o sistema deverá preservar uma versão imutável contendo:

- identificador;
- titular;
- substituto;
- aprovador, quando aplicável;
- grupo;
- instituição;
- setor;
- data;
- horário;
- valor;
- forma e prazo de pagamento;
- condições;
- datas das confirmações;
- versão;
- status.

Nenhuma alteração poderá sobrescrever silenciosamente uma versão anterior.

Cada versão deverá identificar:

- autor;
- data;
- horário;
- campos alterados;
- estado anterior;
- estado posterior.

---

## 15. CONCLUSÃO E AVALIAÇÃO

### 15.1 Conclusão

O substituto poderá declarar a realização do plantão.

O titular ou aprovador poderá confirmar.

Divergência gerará ocorrência administrativa.

### 15.2 Avaliação

Apenas transações concluídas poderão ser avaliadas.

Critérios do substituto:

- comparecimento;
- pontualidade;
- comunicação;
- cumprimento do horário;
- atendimento das exigências administrativas.

Critérios do titular:

- clareza;
- precisão;
- comunicação;
- cumprimento do valor;
- pagamento no prazo;
- correspondência entre oferta e realidade.

Não haverá comentários públicos livres no MVP.

Não haverá avaliação de qualidade clínica.

---

## 16. CANCELAMENTO E DESISTÊNCIA

### 16.1 Retirada de oferta sem substituição confirmada

- permitida;
- sem taxa;
- candidaturas encerradas;
- interessados notificados;
- registro preservado.

### 16.2 Cancelamento confirmado com 48 horas ou mais

- justificativa obrigatória;
- sem taxa;
- registro no histórico;
- notificação das partes;
- notificação institucional, quando aplicável.

### 16.3 Cancelamento confirmado com menos de 48 horas

- gera ocorrência;
- pode gerar taxa;
- pode gerar bloqueio preventivo;
- exige análise administrativa;
- admite justificativa por força maior.

### 16.4 Desistência do substituto

- justificativa obrigatória;
- notificação imediata;
- possibilidade de reabertura da oferta;
- registro reputacional;
- suspensão preventiva quando próximo ao plantão.

### 16.5 Não comparecimento

Assumir um repasse confirmado e não comparecer gerará:

- suspensão preventiva imediata;
- bloqueio de novas candidaturas;
- abertura de ocorrência;
- direito de justificativa;
- análise administrativa.

### 16.6 Desistência do titular

Quando o titular cancelar após confirmação:

- poderá perder temporariamente a possibilidade de publicar;
- continuará podendo consultar histórico;
- a sanção definitiva dependerá de análise.

### 16.7 Taxa na beta

O MVP deverá possuir estrutura técnica para registrar:

- taxa aplicável;
- tipo da taxa;
- valor;
- responsável;
- status;
- regularização.

A cobrança automática ficará fora do MVP.

Até aprovação dos termos financeiros:

- a aplicação não cobrará automaticamente;
- o bloqueio administrativo será a medida operacional principal;
- a taxa poderá ser registrada manualmente.

---

## 17. NOTIFICAÇÕES

### P0

- central interna;
- Web Push;
- e-mail transacional;
- compartilhamento manual pelo WhatsApp.

### P1

- WhatsApp Business automatizado.

### P2

- SMS de contingência.

### Eventos mínimos

- cadastro recebido;
- aprovação;
- correção solicitada;
- nova oferta;
- oferta emergencial;
- candidatura;
- seleção;
- prazo de confirmação;
- aprovação pendente;
- aprovação;
- rejeição;
- expiração;
- cancelamento;
- ocorrência;
- suspensão;
- conclusão;
- avaliação pendente.

---

## 18. ADMINISTRAÇÃO

O painel administrativo deverá permitir:

- visualizar cadastros;
- verificar CRM;
- aprovar;
- rejeitar;
- solicitar correção;
- criar grupos;
- vincular usuários;
- configurar aprovação;
- consultar ofertas;
- consultar substituições;
- registrar suporte;
- abrir e analisar ocorrências;
- suspender;
- reativar;
- consultar auditoria;
- exportar indicadores.

Toda ação administrativa relevante deverá ser auditada.

---

## 19. REQUISITOS NÃO FUNCIONAIS

### 19.1 Arquitetura

- Next.js;
- TypeScript;
- PWA;
- Supabase;
- PostgreSQL;
- Supabase Auth;
- Supabase Storage;
- Vercel;
- GitHub.

### 19.2 Região

- banco e serviços principais em São Paulo, quando disponíveis;
- aplicação executada preferencialmente na região mais próxima.

### 19.3 Segurança

- HTTPS;
- MFA obrigatório para administradores;
- senhas gerenciadas por serviço de autenticação;
- Row Level Security;
- menor privilégio;
- proteção contra tentativas excessivas;
- segredos fora do código;
- trilha de auditoria;
- rate limiting;
- sessões expiráveis.

### 19.4 Privacidade

- coleta mínima;
- acesso por necessidade;
- exposição progressiva;
- proibição de dados de pacientes;
- versionamento dos termos;
- registro de aceite;
- exclusão lógica;
- retenção configurável.

### 19.5 Desempenho

O fluxo principal deverá ser utilizável em conexão móvel comum.

Metas iniciais:

- carregamento das telas principais em até 3 segundos em condições normais;
- resposta visual imediata após ações;
- tratamento de conexão lenta;
- prevenção contra envio duplicado.

### 19.6 Disponibilidade

A aplicação estará disponível continuamente, mas não será apresentada como único meio para resolver situações assistenciais urgentes.

### 19.7 Backup e recuperação

- backup automatizado;
- retenção definida;
- procedimento de restauração;
- teste antes da beta real.

---

## 20. MODELO DE DADOS MÍNIMO

Entidades obrigatórias:

- User;
- ProfessionalProfile;
- CRMVerification;
- Institution;
- Group;
- GroupMembership;
- SectorAuthorization;
- ShiftOffer;
- Application;
- Substitution;
- AgreementVersion;
- InstitutionalApproval;
- Completion;
- Rating;
- Cancellation;
- Occurrence;
- Suspension;
- Notification;
- SupportTicket;
- AuditEvent;
- TermsAcceptance;
- FeatureConfiguration.

Identificadores deverão ser únicos e não sequenciais quando expostos externamente.

Datas serão armazenadas com fuso e exibidas em America/Fortaleza.

Valores serão armazenados em centavos de real.

---

## 21. ESCOPO CONGELADO DA BETA

### P0 Core

- cadastro;
- autenticação;
- verificação;
- grupos;
- publicação;
- candidaturas;
- seleção;
- confirmação;
- aprovação configurável;
- acordo versionado;
- histórico.

### P0 Operacional

- conclusão;
- avaliação;
- reputação;
- cancelamento;
- ocorrência;
- suspensão;
- notificações;
- painel administrativo;
- métricas do piloto.

### P0 Segurança

- controle de acesso;
- RLS;
- MFA administrativo;
- auditoria;
- termos;
- privacidade;
- backups;
- monitoramento.

### Fora do MVP

- custódia financeira;
- pagamento garantido;
- carteira;
- pagamento automático;
- WhatsApp automatizado;
- SMS;
- chat completo;
- aplicativo nativo;
- GPS;
- biometria;
- integração hospitalar;
- integração automática com conselho;
- marketplace público;
- IA;
- avaliação clínica.

---

## 22. CRITÉRIO DE PRONTO PARA BETA

A beta estará tecnicamente pronta quando:

1. um médico criar conta;
2. o Repassafe verificar seus dados;
3. o médico ingressar em um grupo;
4. publicar uma oferta;
5. outro médico se candidatar;
6. o titular selecionar;
7. o selecionado confirmar;
8. o aprovador decidir, quando exigido;
9. o acordo ficar versionado;
10. o plantão ser concluído;
11. as partes avaliarem;
12. o administrador consultar toda a trilha;
13. cancelamentos serem tratados;
14. acessos indevidos serem bloqueados;
15. notificações essenciais funcionarem;
16. backups e restauração terem sido testados.

---

## 23. DEFINIÇÃO DE PRONTO

Uma história somente será considerada concluída quando:

- atender aos critérios de aceite;
- possuir testes;
- funcionar em dispositivo móvel;
- tratar erros;
- respeitar permissões;
- gerar eventos de auditoria;
- estar documentada;
- ter sido validada em homologação;
- possuir revisão técnica;
- não introduzir vulnerabilidade conhecida crítica.

---

## 24. DECISÕES NÃO BLOQUEANTES PARA DESENVOLVIMENTO

Os itens abaixo não bloqueiam a Sprint 0:

- valor definitivo da taxa;
- autorização formal para uso real no Socorrão II;
- modelo definitivo de monetização;
- parceiro financeiro;
- automação do WhatsApp;
- termos jurídicos finais;
- identidade visual completa além do guideline existente.

Esses itens constituem gates de operação ou evolução, não gates de desenvolvimento.