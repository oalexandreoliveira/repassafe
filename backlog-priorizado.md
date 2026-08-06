# BACKLOG PRIORIZADO DO REPASSAFE

## MVP — Beta privada e assistida

**Versão:** 1.0  
**Produto:** Repassafe  
**Piloto inicial:** Equipe de Urgência e Emergência — Socorrão II  
**Modelo:** Aplicação web responsiva e instalável — PWA  
**Tecnologia recomendada:** Next.js, TypeScript, Supabase, PostgreSQL, Vercel e GitHub  
**Objetivo da versão:** Permitir que um repasse seja publicado, receba candidatos, tenha um substituto selecionado e confirmado, passe por aprovação institucional quando necessária e permaneça registrado de forma rastreável.

---

# 1. CONVENÇÕES DO BACKLOG

## Prioridades

### P0 — Obrigatório para a beta

Sem a funcionalidade, o fluxo principal não pode ser utilizado com segurança.

### P1 — Pós-beta imediata

Funcionalidade importante, mas que não impede o primeiro ciclo controlado.

### P2 — Evolução estratégica

Funcionalidade destinada à diferenciação, monetização ou expansão do produto.

---

## Esforço relativo

- **P:** pequeno;
- **M:** médio;
- **G:** grande;
- **XG:** muito grande.

O esforço deverá ser recalculado pela equipe técnica depois da definição da arquitetura e da composição do time.

---

## Formato das histórias

> Como [perfil], quero [ação], para [resultado].

---

# 2. VISÃO GERAL DOS ÉPICOS

| Épico | Descrição | Prioridade |
|---|---|---:|
| EP-00 | Fundação técnica e visual | P0 |
| EP-01 | Cadastro e autenticação | P0 |
| EP-02 | Verificação profissional | P0 |
| EP-03 | Grupos e vínculos institucionais | P0 |
| EP-04 | Publicação e visualização de plantões | P0 |
| EP-05 | Candidaturas e seleção | P0 |
| EP-06 | Confirmação e aprovação institucional | P0 |
| EP-07 | Registro do acordo e histórico | P0 |
| EP-08 | Conclusão, avaliação e reputação | P0 |
| EP-09 | Cancelamentos, ocorrências e suspensões | P0 |
| EP-10 | Notificações | P0 |
| EP-11 | Administração e suporte | P0 |
| EP-12 | Segurança, privacidade e auditoria | P0 |
| EP-13 | Métricas do piloto | P0 |
| EP-14 | Pagamentos e comprovantes | P1 |
| EP-15 | Comunicação automatizada | P1 |
| EP-16 | Pagamento garantido | P2 |
| EP-17 | Integrações institucionais | P2 |

---

# 3. EP-00 — FUNDAÇÃO TÉCNICA E VISUAL

## US-0001 — Criar os ambientes do projeto

**Prioridade:** P0  
**Esforço:** M

> Como equipe técnica, quero ambientes separados de desenvolvimento, homologação e produção, para reduzir o risco de alterações indevidas na beta.

### Critérios de aceite

- Existência dos três ambientes.
- Banco e variáveis separados.
- Produção protegida contra alterações diretas.
- Dados reais não utilizados no ambiente de desenvolvimento.
- Implantação automatizada a partir do repositório.

---

## US-0002 — Configurar repositório e integração contínua

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Repositório criado no GitHub.
- Branch principal protegida.
- Alterações realizadas por pull request.
- Testes e validações executados antes do deploy.
- Deploy automático em homologação.
- Produção liberada somente após aprovação.

---

## US-0003 — Implementar identidade visual do Repassafe

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Utilização da paleta oficial.
- Componentes com estados normal, alerta, sucesso, erro e urgência.
- Tipografia legível em dispositivos móveis.
- Números tabulares em datas, horários e valores.
- Interface compatível com o guideline do Repassafe.
- Oferta emergencial visualmente distinta.
- Estados não identificados exclusivamente por cor.

---

## US-0004 — Criar sistema-base de componentes

**Prioridade:** P0  
**Esforço:** M

### Componentes mínimos

- botões;
- campos;
- seletores;
- cartões de plantão;
- etiquetas de status;
- modal de confirmação;
- alertas;
- navegação;
- tabelas administrativas;
- estados vazios;
- carregamento;
- mensagens de erro.

---

## US-0005 — Implementar PWA

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Aplicação instalável na tela inicial.
- Ícone e nome do Repassafe.
- Funcionamento responsivo.
- Configuração para notificações Web Push.
- Aviso de nova versão disponível.

---

# 4. EP-01 — CADASTRO E AUTENTICAÇÃO

## US-0101 — Cadastrar médico

**Prioridade:** P0  
**Esforço:** M

> Como médico, quero criar meu cadastro, para participar dos grupos e visualizar os plantões disponíveis.

### Dados mínimos

- nome completo;
- CPF;
- data de nascimento;
- telefone;
- e-mail;
- senha;
- foto;
- CRM;
- UF;
- especialidade;
- RQE, quando aplicável;
- vínculos declarados;
- aceite dos termos e do aviso de privacidade.

### Critérios de aceite

- CPF, telefone e e-mail não podem ser duplicados.
- Campos obrigatórios devem ser validados.
- Cadastro inicia com status “Aguardando verificação”.
- Usuário ainda não aprovado não acessa ofertas.
- Data e hora do aceite são registradas.

---

## US-0102 — Confirmar telefone e e-mail

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Código ou link de verificação.
- Código com validade limitada.
- Limite de tentativas.
- Reenvio controlado.
- Registro da data da confirmação.

---

## US-0103 — Autenticar usuário

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Login por e-mail ou telefone.
- Recuperação de senha.
- Encerramento da sessão.
- Bloqueio temporário por tentativas excessivas.
- Usuário suspenso não acessa funções operacionais.

---

## US-0104 — Exibir situação do cadastro

**Prioridade:** P0  
**Esforço:** P

### Estados

- cadastro incompleto;
- aguardando verificação;
- correção solicitada;
- aprovado;
- rejeitado;
- suspenso;
- verificação expirada.

---

## US-0105 — Atualizar perfil

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Médico pode alterar contatos e informações declaradas.
- Mudanças em CRM, UF, RQE ou nome exigem nova verificação.
- Alterações relevantes permanecem na auditoria.

---

# 5. EP-02 — VERIFICAÇÃO PROFISSIONAL

## US-0201 — Consultar cadastro pendente

**Prioridade:** P0  
**Esforço:** M

> Como administrador, quero consultar os dados e documentos do médico, para realizar sua verificação.

### Informações exibidas

- dados pessoais;
- CRM e UF;
- especialidade;
- RQE;
- vínculos declarados;
- histórico de correções;
- data de envio.

---

## US-0202 — Registrar verificação manual do CRM

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

O administrador deverá registrar:

- nome encontrado;
- CRM e UF;
- situação;
- especialidade;
- RQE;
- data e hora;
- fonte consultada;
- observações;
- resultado da verificação.

---

## US-0203 — Aprovar, rejeitar ou solicitar correção

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Toda decisão identifica o administrador.
- Rejeição exige justificativa.
- Correção informa os campos necessários.
- Médico recebe notificação.
- Decisão permanece registrada.

---

## US-0204 — Exibir selos de verificação

**Prioridade:** P0  
**Esforço:** P

### Selos possíveis

- identidade verificada;
- CRM verificado;
- RQE verificado;
- vínculo declarado;
- vínculo institucional confirmado;
- verificação pendente;
- verificação expirada.

---

## US-0205 — Controlar revalidação

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Verificação possui validade operacional configurável.
- Administrador recebe alerta de expiração.
- Nova publicação ou candidatura pode exigir revalidação.
- Histórico permanece acessível.

---

# 6. EP-03 — GRUPOS E VÍNCULOS INSTITUCIONAIS

## US-0301 — Criar grupo privado

**Prioridade:** P0  
**Esforço:** M

> Como administrador, quero criar grupos privados, para separar médicos, instituições e setores.

### Dados do grupo

- nome;
- instituição;
- cidade;
- setor;
- descrição;
- administrador;
- coordenador, quando aplicável;
- status;
- regras de aprovação;
- regras de cancelamento.

---

## US-0302 — Configurar aprovação institucional

**Prioridade:** P0  
**Esforço:** M

### Opções

- aprovação obrigatória em todos os casos;
- aprovação apenas para médicos sem vínculo;
- aprovação somente em determinados setores;
- aprovação não exigida.

### Critérios de aceite

- O fluxo muda conforme a configuração.
- A regra aparece antes da candidatura.
- Alterações não afetam retroativamente repasses confirmados.

---

## US-0303 — Vincular médico ao grupo

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Médico pode pertencer a vários grupos.
- Vínculo possui status próprio.
- Setores autorizados são definidos separadamente.
- Médico não acessa grupos sem vínculo aprovado.

---

## US-0304 — Confirmar vínculo institucional

**Prioridade:** P0  
**Esforço:** M

### Estados

- declarado;
- em análise;
- confirmado;
- rejeitado;
- expirado.

---

## US-0305 — Restringir acesso por grupo e setor

**Prioridade:** P0  
**Esforço:** G

### Critérios de aceite

- Usuário não acessa dados de outro grupo.
- Médico não se candidata a setor não autorizado.
- Coordenador visualiza apenas os grupos sob sua responsabilidade.
- Administrador do Repassafe possui acesso conforme sua função.

---

# 7. EP-04 — PUBLICAÇÃO E VISUALIZAÇÃO DE PLANTÕES

## US-0401 — Criar rascunho de oferta

**Prioridade:** P0  
**Esforço:** M

> Como médico, quero salvar uma oferta incompleta, para concluir sua publicação posteriormente.

---

## US-0402 — Publicar oferta de plantão

**Prioridade:** P0  
**Esforço:** G

### Campos obrigatórios

- grupo;
- instituição;
- setor;
- data;
- início;
- término;
- valor;
- responsável pelo pagamento;
- forma de pagamento;
- prazo de pagamento;
- observações;
- prazo de candidatura.

### Critérios de aceite

- Horário não pode estar no passado.
- Horário final deve ser posterior ao inicial.
- Valor pode ser zero.
- Médico confirma os dados antes da publicação.
- Publicação recebe identificador único.

---

## US-0403 — Classificar oferta como normal ou emergencial

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Mais de 48 horas: oferta normal.
- Menos de 48 horas: oferta emergencial.
- Oferta emergencial possui destaque.
- Classificação fica registrada.

---

## US-0404 — Converter oferta normal em emergencial

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Sistema avisa ao chegar à janela de 48 horas.
- Titular pode manter a oferta ativa como emergencial.
- Sem confirmação, a oferta expira.
- Conversão dispara notificações correspondentes.

---

## US-0405 — Expirar oferta automaticamente

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Oferta não confirmada expira no prazo estabelecido.
- Após o início do plantão, não aceita candidaturas.
- Interessados são notificados.
- Expiração permanece no histórico.

---

## US-0406 — Listar ofertas disponíveis

**Prioridade:** P0  
**Esforço:** M

### Informações do cartão

- setor;
- data;
- início e término;
- valor;
- tipo normal ou emergencial;
- prazo restante;
- quantidade de interessados;
- exigência de aprovação.

---

## US-0407 — Filtrar ofertas

**Prioridade:** P0  
**Esforço:** M

### Filtros mínimos

- data;
- setor;
- grupo;
- faixa de valor;
- normal ou emergencial;
- disponíveis;
- candidaturas realizadas.

---

## US-0408 — Editar oferta antes da confirmação

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Alterações ficam registradas.
- Candidatos são notificados.
- Alterações materiais exigem nova ciência.
- Oferta confirmada não pode ser silenciosamente alterada.

---

# 8. EP-05 — CANDIDATURAS E SELEÇÃO

## US-0501 — Manifestar interesse

**Prioridade:** P0  
**Esforço:** M

> Como médico, quero manifestar interesse em um plantão, para concorrer à substituição.

### Critérios de aceite

- Titular não se candidata à própria oferta.
- Médico não pode candidatar-se duas vezes.
- Setor deve ser compatível.
- Usuário confirma disponibilidade.
- A manifestação não forma o acordo.

---

## US-0502 — Retirar candidatura

**Prioridade:** P0  
**Esforço:** P

### Critérios de aceite

- Permitida antes da seleção.
- Titular é notificado.
- Retirada permanece registrada.

---

## US-0503 — Visualizar candidatos

**Prioridade:** P0  
**Esforço:** G

### Informações antes da seleção

- nome;
- foto;
- CRM e UF;
- RQE;
- selos;
- vínculos;
- setores autorizados;
- repasses ofertados;
- repasses assumidos;
- repasses concluídos;
- cancelamentos;
- nota e quantidade de avaliações.

Telefone e e-mail não serão exibidos nessa etapa.

---

## US-0504 — Selecionar candidato

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Apenas um candidato fica selecionado por vez.
- Seleção exige confirmação do titular.
- Escolhido recebe notificação.
- Demais candidatos permanecem disponíveis até a confirmação.

---

## US-0505 — Controlar prazo de confirmação

**Prioridade:** P0  
**Esforço:** M

### Regra inicial

- oferta normal: até 4 horas;
- oferta emergencial: até 30 minutos;
- prazo nunca ultrapassa o início.

### Critérios de aceite

- Contagem regressiva visível.
- Prazo expirado libera nova seleção.
- Titular é notificado.
- Evento fica na auditoria.

---

# 9. EP-06 — CONFIRMAÇÃO E APROVAÇÃO INSTITUCIONAL

## US-0601 — Confirmar condições como substituto

**Prioridade:** P0  
**Esforço:** M

> Como candidato escolhido, quero revisar e confirmar todas as condições, para assumir conscientemente o repasse.

### Critérios de aceite

- Exibição de todas as condições.
- Confirmação expressa do horário, valor e pagamento.
- Data e hora registradas.
- Recusa devolve a oferta à seleção.

---

## US-0602 — Confirmar sem aprovação institucional

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Aplicável somente a grupos sem aprovação obrigatória.
- Após a confirmação do substituto, o repasse fica confirmado.
- Novas candidaturas são encerradas.
- Registro final é gerado.

---

## US-0603 — Encaminhar para aprovação institucional

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Aplicável conforme configuração do grupo.
- Coordenador recebe notificação.
- Oferta passa para “Aguardando aprovação”.
- Partes visualizam o status.

---

## US-0604 — Aprovar ou rejeitar substituição

**Prioridade:** P0  
**Esforço:** M

> Como coordenador, quero aprovar ou rejeitar uma substituição, para manter o controle institucional da escala.

### Critérios de aceite

- Coordenador visualiza titular, substituto e condições.
- Rejeição exige justificativa.
- Aprovação fecha as candidaturas.
- Decisão registra autor, data e hora.
- Histórico não pode ser apagado.

---

## US-0605 — Solicitar ajuste

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Coordenador informa o ajuste necessário.
- Partes são notificadas.
- Alteração exige nova confirmação.
- Versões anteriores permanecem acessíveis.

---

# 10. EP-07 — REGISTRO DO ACORDO E HISTÓRICO

## US-0701 — Gerar registro imutável do repasse

**Prioridade:** P0  
**Esforço:** G

### Conteúdo

- identificador;
- titular;
- substituto;
- coordenador, quando aplicável;
- instituição;
- grupo;
- setor;
- data e horário;
- valor;
- pagamento;
- confirmações;
- aprovação;
- versão das condições;
- status.

---

## US-0702 — Versionar alterações

**Prioridade:** P0  
**Esforço:** G

### Critérios de aceite

- Nenhuma versão é sobrescrita.
- Cada versão identifica autor e horário.
- Alterações materiais exigem nova confirmação.
- Partes conseguem consultar versões anteriores.

---

## US-0703 — Consultar histórico pessoal

**Prioridade:** P0  
**Esforço:** M

### Filtros

- período;
- papel exercido;
- status;
- grupo;
- setor.

---

## US-0704 — Consultar detalhes do acordo

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Acesso restrito às partes, coordenador aplicável e administrador.
- Exibição da linha do tempo.
- Exibição das confirmações.
- Exibição das ocorrências.

---

# 11. EP-08 — CONCLUSÃO, AVALIAÇÃO E REPUTAÇÃO

## US-0801 — Confirmar realização do plantão

**Prioridade:** P0  
**Esforço:** M

> Como substituto ou responsável autorizado, quero registrar que o plantão foi realizado, para encerrar a transação.

### Critérios de aceite

- Substituto informa conclusão.
- Titular ou coordenador pode confirmar.
- Divergência gera ocorrência.
- Status muda para “Concluída”.

---

## US-0802 — Avaliar o substituto

**Prioridade:** P0  
**Esforço:** M

### Critérios

- comparecimento;
- pontualidade;
- comunicação;
- cumprimento do horário;
- cancelamento;
- atendimento das exigências administrativas.

---

## US-0803 — Avaliar o titular

**Prioridade:** P0  
**Esforço:** M

### Critérios

- clareza;
- precisão das informações;
- comunicação;
- cumprimento do valor;
- pagamento no prazo;
- divergências.

---

## US-0804 — Evitar avaliações indevidas

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Apenas transações concluídas podem ser avaliadas.
- Cada parte avalia apenas uma vez.
- Não há comentários públicos livres.
- Avaliação pode ser contestada administrativamente.

---

## US-0805 — Calcular reputação

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Nota considera somente avaliações válidas.
- Nota pública aparece a partir de três avaliações.
- Antes disso: “Novo na plataforma”.
- Número de avaliações fica visível.
- Cancelamentos e conclusões aparecem separadamente.

---

# 12. EP-09 — CANCELAMENTOS, OCORRÊNCIAS E SUSPENSÕES

## US-0901 — Retirar oferta não confirmada

**Prioridade:** P0  
**Esforço:** P

### Critérios de aceite

- Sem cobrança.
- Candidatos são notificados.
- Retirada fica registrada.
- Recorrência pode gerar análise.

---

## US-0902 — Cancelar repasse com mais de 48 horas

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Justificativa obrigatória.
- Sem taxa.
- Outra parte e coordenador são notificados.
- Cancelamento integra o histórico.

---

## US-0903 — Cancelar repasse com menos de 48 horas

**Prioridade:** P0  
**Esforço:** G

### Critérios de aceite

- Gera ocorrência.
- Taxa fica registrada.
- Parte responsável recebe bloqueio preventivo aplicável.
- Administrador analisa o caso.
- Força maior pode afastar a penalidade.

---

## US-0904 — Registrar desistência do substituto

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Justificativa obrigatória.
- Oferta pode ser reaberta.
- Titular e coordenador são notificados.
- Evento afeta o histórico objetivo.

---

## US-0905 — Registrar não comparecimento

**Prioridade:** P0  
**Esforço:** G

### Critérios de aceite

- Suspensão preventiva imediata.
- Bloqueio de candidaturas.
- Ocorrência administrativa.
- Direito de justificativa.
- Decisão final manual.

---

## US-0906 — Analisar ocorrência

**Prioridade:** P0  
**Esforço:** G

### Decisões possíveis

- arquivar sem penalidade;
- advertir;
- suspender temporariamente;
- suspender por prazo indeterminado;
- excluir cadastro;
- registrar taxa como regularizada.

---

## US-0907 — Reativar usuário

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Apenas administrador autorizado.
- Motivo obrigatório.
- Histórico preservado.
- Usuário é notificado.

---

# 13. EP-10 — NOTIFICAÇÕES

## US-1001 — Central de notificações

**Prioridade:** P0  
**Esforço:** M

### Eventos mínimos

- cadastro;
- aprovação;
- nova oferta;
- candidatura;
- seleção;
- confirmação;
- aprovação;
- rejeição;
- expiração;
- cancelamento;
- suspensão.

---

## US-1002 — Web Push

**Prioridade:** P0  
**Esforço:** G

### Critérios de aceite

- Usuário concede consentimento.
- Dispositivo é registrado.
- É possível revogar a permissão.
- Falhas ficam registradas.

---

## US-1003 — E-mails transacionais

**Prioridade:** P0  
**Esforço:** M

### Eventos mínimos

- confirmação de conta;
- aprovação ou rejeição;
- seleção;
- repasse confirmado;
- cancelamento;
- suspensão;
- recuperação de senha.

---

## US-1004 — Compartilhar oferta no WhatsApp

**Prioridade:** P0  
**Esforço:** P

### Critérios de aceite

- Mensagem resumida.
- Link direto para a oferta.
- Nenhum dado pessoal excessivo.
- Acesso permanece condicionado ao login e às permissões.

---

# 14. EP-11 — ADMINISTRAÇÃO E SUPORTE

## US-1101 — Dashboard administrativo

**Prioridade:** P0  
**Esforço:** G

### Informações mínimas

- cadastros pendentes;
- verificações expiradas;
- ofertas abertas;
- ofertas emergenciais;
- aprovações pendentes;
- cancelamentos;
- ocorrências;
- usuários suspensos.

---

## US-1102 — Gerenciar usuários

**Prioridade:** P0  
**Esforço:** G

### Ações

- aprovar;
- rejeitar;
- solicitar correção;
- suspender;
- reativar;
- corrigir cadastro;
- consultar histórico.

---

## US-1103 — Gerenciar grupos

**Prioridade:** P0  
**Esforço:** M

### Ações

- criar;
- editar;
- inativar;
- vincular usuários;
- configurar aprovação;
- definir setores;
- indicar coordenadores.

---

## US-1104 — Consultar operação

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

Busca por:

- identificador;
- médico;
- CRM;
- grupo;
- data;
- status.

---

## US-1105 — Registrar atendimento de suporte

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Registro interno da solicitação.
- Administrador responsável.
- Data e hora.
- Decisão tomada.
- Observação não visível aos demais usuários, quando necessário.

---

# 15. EP-12 — SEGURANÇA, PRIVACIDADE E AUDITORIA

## US-1201 — Implementar controle de acesso

**Prioridade:** P0  
**Esforço:** G

### Critérios de aceite

- Regras por perfil.
- Regras por grupo.
- Regras por setor.
- Row Level Security.
- Testes contra acesso indevido.

---

## US-1202 — Exigir MFA dos administradores

**Prioridade:** P0  
**Esforço:** M

---

## US-1203 — Registrar trilha de auditoria

**Prioridade:** P0  
**Esforço:** G

### Eventos

- cadastro;
- login;
- aprovação;
- alteração;
- publicação;
- candidatura;
- seleção;
- confirmação;
- decisão institucional;
- cancelamento;
- suspensão;
- alteração administrativa.

---

## US-1204 — Exibir termos e aviso de privacidade

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Aceite obrigatório.
- Versão identificada.
- Data e hora registradas.
- Novo aceite quando houver alteração material.

---

## US-1205 — Impedir compartilhamento de dados de pacientes

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Avisos visíveis nos campos livres.
- Termos proíbem expressamente.
- Denúncia ou ocorrência administrativa disponível.
- Ausência de campos destinados a informações clínicas.

---

## US-1206 — Monitorar erros e indisponibilidade

**Prioridade:** P0  
**Esforço:** M

---

## US-1207 — Configurar backups

**Prioridade:** P0  
**Esforço:** M

### Critérios de aceite

- Backup automático.
- Política de retenção.
- Procedimento de recuperação.
- Teste de restauração antes da beta.

---

# 16. EP-13 — MÉTRICAS DO PILOTO

## US-1301 — Registrar eventos do funil

**Prioridade:** P0  
**Esforço:** M

### Eventos

- cadastro iniciado;
- cadastro concluído;
- usuário aprovado;
- oferta publicada;
- candidatura realizada;
- candidato selecionado;
- confirmação realizada;
- aprovação realizada;
- repasse confirmado;
- repasse concluído;
- cancelamento;
- avaliação.

---

## US-1302 — Dashboard mínimo do piloto

**Prioridade:** P0  
**Esforço:** M

### Indicadores

- usuários cadastrados;
- usuários ativos;
- ofertas;
- candidaturas;
- taxa de confirmação;
- tempo até primeira candidatura;
- tempo até confirmação;
- cancelamentos;
- ocorrências;
- avaliações.

---

## US-1303 — Exportar dados consolidados

**Prioridade:** P0  
**Esforço:** P

### Critérios de aceite

- Exportação CSV.
- Sem exposição desnecessária de dados.
- Acesso exclusivo de administrador autorizado.

---

# 17. BACKLOG P1 — PÓS-BETA IMEDIATA

## EP-14 — Pagamentos e comprovantes

- registrar pagamento previsto;
- anexar comprovante;
- confirmar recebimento;
- registrar atraso;
- gerar alertas;
- gerar comprovante do repasse em PDF;
- dashboard financeiro básico;
- registrar manualmente taxa de cancelamento.

---

## EP-15 — Comunicação automatizada

- integração oficial com WhatsApp Business;
- consentimento específico;
- templates de mensagens;
- alertas emergenciais;
- lembrete de confirmação;
- contingência por SMS;
- painel de falhas de entrega.

---

## Melhorias P1

- anexos administrativos;
- delegação temporária do coordenador;
- filtros avançados;
- indicadores por grupo;
- denúncia de avaliação;
- suporte interno com protocolo;
- relatório de ocorrências;
- tela de pagamento pendente;
- cancelamentos parametrizáveis por grupo.

---

# 18. BACKLOG P2 — EVOLUÇÃO E DIFERENCIAÇÃO

## EP-16 — Pagamento garantido

- parceiro de pagamento;
- pagamento antecipado;
- valor reservado;
- split de pagamento;
- liberação após conclusão;
- contestação;
- estorno;
- taxa da plataforma;
- conciliação financeira.

---

## EP-17 — Integrações institucionais

- integração com escala hospitalar;
- integração formal com base profissional;
- check-in institucional;
- QR Code;
- API para hospitais;
- login corporativo;
- integração com empresas e cooperativas;
- atualização automática da escala.

---

## Outras evoluções P2

- chat interno;
- aplicativo nativo;
- expansão para UTI e Ala Vermelha;
- rede entre hospitais;
- recomendações de candidatos;
- filtros por distância;
- disponibilidade recorrente;
- gestão de certificações;
- seguro ou garantia operacional;
- assinatura eletrônica avançada;
- análise preditiva da cobertura.

---

# 19. ORDEM RECOMENDADA DE DESENVOLVIMENTO

## Sprint 0 — Fundação

- EP-00;
- estrutura inicial de EP-12;
- ambientes;
- banco;
- autenticação-base;
- design system;
- modelo inicial de permissões.

## Sprint 1 — Entrada na plataforma

- EP-01;
- EP-02;
- criação administrativa de grupos;
- vínculos e setores.

### Entrega

Médico consegue cadastrar-se e ser verificado pela equipe do Repassafe.

---

## Sprint 2 — Publicação

- EP-03;
- EP-04;
- listagem;
- filtros;
- ofertas normais e emergenciais;
- expiração.

### Entrega

Médico aprovado consegue publicar e visualizar ofertas compatíveis.

---

## Sprint 3 — Candidatura e escolha

- EP-05;
- exibição progressiva de perfil;
- seleção;
- prazos de confirmação.

### Entrega

Uma oferta consegue receber candidatos e ter um deles selecionado.

---

## Sprint 4 — Confirmação e aprovação

- EP-06;
- EP-07;
- versionamento;
- registro final;
- histórico.

### Entrega

Uma substituição consegue chegar ao status “Confirmada”.

---

## Sprint 5 — Encerramento e confiança

- EP-08;
- EP-09;
- conclusão;
- avaliações;
- reputação;
- cancelamentos;
- ocorrências;
- suspensões.

### Entrega

O fluxo consegue ser concluído e gerar histórico reputacional.

---

## Sprint 6 — Preparação da beta

- EP-10;
- EP-11;
- conclusão de EP-12;
- EP-13;
- testes;
- correção de falhas;
- homologação;
- preparação dos usuários.

### Entrega

Beta privada pronta para operação assistida.

---

# 20. CAMINHO CRÍTICO DA BETA

As histórias abaixo não podem atrasar sem afetar o lançamento:

1. US-0101 — Cadastro.
2. US-0202 — Verificação do CRM.
3. US-0303 — Vínculo com grupo.
4. US-0402 — Publicação.
5. US-0501 — Candidatura.
6. US-0504 — Seleção.
7. US-0601 — Confirmação.
8. US-0602 ou US-0604 — Confirmação conforme regra institucional.
9. US-0701 — Registro imutável.
10. US-0703 — Histórico.
11. US-1101 — Administração.
12. US-1201 — Controle de acesso.
13. US-1203 — Auditoria.

---

# 21. CRITÉRIO DE CORTE DO ESCOPO

Uma nova funcionalidade somente poderá entrar no P0 quando:

- for indispensável à segurança;
- for indispensável à conclusão do fluxo;
- responder a uma exigência institucional;
- corrigir risco grave identificado em teste.

Caso contrário, deverá entrar em P1 ou P2.

Se uma funcionalidade nova for adicionada ao P0, outra de esforço equivalente deverá ser retirada ou postergada.

---

# 22. CRITÉRIO PARA LIBERAR A BETA

A beta será liberada quando um teste completo comprovar que:

1. O médico realiza cadastro.
2. O Repassafe verifica seu CRM.
3. O médico é vinculado ao grupo.
4. Um plantão é publicado.
5. Outro médico se candidata.
6. O titular seleciona o candidato.
7. O escolhido confirma.
8. O coordenador aprova, quando necessário.
9. O acordo fica registrado.
10. O plantão é concluído.
11. As partes avaliam a transação.
12. O administrador consulta toda a trilha.
13. Um usuário não autorizado não acessa os dados.
14. Cancelamentos e ocorrências são corretamente tratados.

---

# 23. MÉTRICA PRINCIPAL DO MVP

> **Percentual de ofertas publicadas que chegam ao status “Confirmada”.**

## Métricas de apoio

- tempo até primeira candidatura;
- tempo até confirmação;
- número médio de candidatos;
- taxa de desistência;
- taxa de cancelamento;
- taxa de conclusão;
- percentual de avaliações;
- reincidência de uso;
- quantidade de ocorrências;
- satisfação dos médicos;
- satisfação do coordenador.

---

# 24. PRÓXIMA ETAPA

Com o backlog aprovado, o projeto deverá avançar simultaneamente para:

1. wireframes das telas P0;
2. modelo lógico do banco de dados;
3. matriz de perfis e permissões;
4. contratos de API;
5. planejamento detalhado da Sprint 0;
6. criação do repositório e dos ambientes;
7. definição da equipe técnica;
8. estimativa de esforço e custo;
9. recrutamento dos participantes da beta;
10. continuidade da pesquisa com médicos e coordenadores.