# Cadastro para o produto completo — revisão de 29/09/2026

Esta revisão usa a especificação funcional v1.1, o anexo de governança e as
histórias US-0101 a US-0205 do backlog completo. A solicitação de expansão do
cadastro passa a orientar esta frente; os adiamentos do recorte executivo do
MVP não são critérios de conclusão para o cadastro expandido. Este documento
revisa cobertura e define o fluxo e os critérios de implementação; os campos e
etapas propostos abaixo descrevem o diagnóstico anterior à implementação.
O resultado e os limites da entrega constam de
`docs/reviews/registration-release-validation-2026-09-29.md`.

## Diagnóstico

O cadastro atual não atende à especificação completa. `signupAction` cria uma
identidade por e-mail e um perfil com nome, CRM, UF e estado `pending`. Há
confirmação de e-mail, reenvio, recuperação de senha, limites de tentativa,
consulta manual de CRM e decisão administrativa. Esses mecanismos são uma
base aproveitável, mas um único `profiles.status` mistura aprovação cadastral
com habilitação profissional e não representa a jornada inteira.

| Exigência e referência | Cobertura atual | Trabalho necessário |
| --- | --- | --- |
| Nome completo — US-0101 | Parcial: nome profissional, sem identidade civil separada | Nome civil protegido e nome de apresentação com uso definido |
| CPF e nascimento — US-0101, governança §2.3 | Ausente | Validação de CPF, formato de data, unicidade e armazenamento administrativo protegido |
| Telefone — US-0101/0102 | Ausente | Normalização, unicidade, OTP com prazo, limites e reenvio controlado |
| E-mail confirmado — US-0102 | Implementado em Auth | Expor estado/data ao usuário; manter confirmação no provedor como evidência |
| Senha e recuperação — US-0103 | Implementado por e-mail | Login por telefone também é requisito do backlog completo |
| Foto — US-0101 e governança §2.1 | Ausente no fluxo | Upload próprio, limites, privacidade e remoção/substituição |
| CRM e UF — US-0101/0202 | Parcial | UF válida, estado profissional observado e validação de duplicidade no banco |
| Especialidade e RQE — US-0101/0202 | Ausente | Relação entre especialidade/RQE; RQE opcional quando não aplicável, verificação independente |
| Vínculos declarados — US-0101 | Ausente | Declaração não concede vínculo nem acesso institucional |
| Termos e privacidade — US-0101 | Ausente; links públicos usam `#` | Documentos reais/versionados e aceite explícito com data/hora, ator e versão |
| Cadastro incompleto — US-0104 | Ausente | Salvar progresso autenticado e permitir retomada |
| Pendente, correção, aprovado, rejeitado, suspenso — US-0104 | Implementados de forma básica | Separar estados; correção indica campos e caminho de resposta |
| Verificação expirada — US-0104/0205, especificação §8.4 | Ausente | Validade inicial de 90 dias configurável, alerta e bloqueio de novas operações |
| Atualização própria — US-0105 | Consulta apenas; identidade crítica bloqueada | Editar contatos/declarados; solicitações auditadas para nome/CRM/UF/RQE |
| Evidência profissional — US-0201/0202 | Parcial | Incluir situação, especialidade/RQE, histórico de correções e data de envio |
| Decisões e notificações — US-0203 | Parcial | Decisão por nível, campos a corrigir, histórico preservado e resposta do usuário |
| Selos separados — US-0204, especificação §8.3 | Ausente | E-mail/telefone, CRM, RQE, declaração, confirmação institucional e expiração |
| Aprovador institucional — especificação §7.2 | Papel por vínculo de grupo | Cadastro de identidade sem obrigar CRM se não atua como médico; permissão por grupo |
| Administrador — especificação §7.3 | Isolamento implementado nesta frente | Concessão em Auth, MFA obrigatório, provisionamento confiável, sem cadastro médico fictício |

E-mail é controlado por Supabase Auth, e CRM/UF têm índice único no banco.
Duplicidade de CPF/telefone precisa ser garantida no banco, inclusive para
submissões simultâneas. A resposta pública deve permanecer genérica quando
necessário para não enumerar identidades. Não registrar CPF, telefone, códigos
OTP ou senhas em logs e metadados de auditoria.

## Jornada proposta

1. **Criar a conta.** E-mail, senha e aceite dos documentos publicados. Mostrar
   que a conta ainda não está habilitada para repasses. Acesso continua sujeito
   à liberação prevista pelo produto; CRM ativo não equivale a aprovação.
2. **Confirmar contatos.** Confirmar e-mail e telefone por evidência do provedor.
   Expiração, tentativa excedida e reenvio têm ações claras. Coletar telefone
   não deve produzir o selo de telefone confirmado.
3. **Completar identificação e atuação.** Nome, CPF, nascimento e foto; para
   quem atua como médico, CRM/UF, especialidades/RQE e vínculos declarados.
   Agrupar identificação, dados profissionais e declarações em etapas curtas.
   Salvar progresso no servidor após autenticação, sem persistir PII/senha em
   armazenamento local do navegador.
4. **Enviar para verificação.** Resumo revisável, requisitos faltantes e envio
   explícito. Fila da operação separa incompletos, aguardando verificação,
   correções respondidas e revalidações. Exibir próximo passo e canal de suporte.
5. **Responder a correções.** Apontar campo e motivo; preservar versão submetida
   e resposta. Dados críticos viram proposta de alteração com revalidação; o
   usuário não altera silenciosamente uma identidade já verificada.
6. **Receber a habilitação profissional.** Decisão auditada, selos pertinentes,
   data de conferência e validade. Aprovação de CRM não confirma especialidade,
   RQE, instituição ou setor automaticamente.
7. **Obter autorização institucional quando aplicável.** Confirmar vínculo,
   setor e credenciamento por responsáveis do grupo. Sem vínculo, não há acesso
   ao grupo; ofertas livres seguem sua regra de elegibilidade profissional.
8. **Manter o cadastro.** Contatos alterados perdem a confirmação até novo OTP;
   nome/CRM/UF/RQE exigem nova verificação. Expiração mantém histórico acessível
   e impede novas publicações/candidaturas conforme a política do produto.

Um coordenador pode acumular atuação médica e aprovação de grupos. A permissão
de aprovador não deve exigir CRM quando não há atuação médica, nem conceder
capacidade de publicar/candidatar-se. A autorização gerencial é outra concessão,
independente desses estados. Não oferecer seleção pública de papel admin.

## Modelo recomendado

| Camada | Responsabilidade | Visibilidade |
| --- | --- | --- |
| `auth.users` | Identidade, senha, contatos confirmados e sessão | Provedor de autenticação e próprio titular |
| Identificação administrativa privada | CPF, nascimento, nome civil e documentos | Titular por fluxo próprio e operação autorizada; nunca perfis de candidatos |
| Perfil profissional | Nome de apresentação, foto, registro profissional e habilitação | Próprio usuário; projeções mínimas para outros usuários elegíveis |
| Registros profissionais/especialidades | CRM/UF, situação, especialidades, RQE | Evidência privada; selos/projeções públicas limitadas |
| Verificações versionadas | Quem conferiu, fonte, resultado, validade e correções | Operação; titular recebe decisão e orientação destinada a ele |
| Aceites versionados | Documento, versão, data/hora e identidade | Próprio titular e operação; histórico imutável |
| Declarações de vínculo | Instituição/setor informados pelo usuário | Não geram permissões; verificação posterior |
| Autorizações institucionais | Grupo, papel, setor, vigência, responsável e evidência | Pelo grupo/atribuição; nunca derivadas só do CRM |
| `administrative_access` | Concessão e revogação de gestão | Própria existência/estado; razões internas somente operação confiável |

Evitar acrescentar todos os dados a `profiles`: a governança diferencia
informação compartilhável, contato das partes e PII administrativa. Criar
projeções explícitas e RLS para cada audiência. Notas internas não devem usar o
mesmo campo da orientação exibida ao profissional; hoje `verification_notes`
é lido no painel, então seu conteúdo precisa ser tratado como visível ao titular.

Estados devem ser independentes: conta/incompletude, confirmação de contatos,
verificação profissional, validade de especialidade/RQE e autorização do grupo.
A elegibilidade é calculada a partir desses estados e aplicada no servidor e
nos comandos do banco, não apenas ocultando botões. O administrador não pode
substituir autorização institucional por sua concessão de gestão.

## Ordem de execução e aceite

1. Publicar os documentos reais de termos/privacidade; modelar PII protegida,
   aceites versionados e progresso. Definir provedor/configuração SMS antes da
   confirmação de telefone; nenhum número é marcado confirmado manualmente
   por preenchimento do formulário.
2. Implementar o cadastro em etapas, foto e validações por campo. Cobrir
   retomada após interrupção, duplicidade concorrente, senha preservada apenas
   na memória do formulário, falha de envio e acessibilidade de erros.
3. Expandir conferência profissional, selos, correções/reenvio e revalidação
   com prazo configurável. Cobrir expiração no banco, sem depender de acesso
   prévio ao painel ou tarefa periódica para bloquear uma nova operação.
4. Completar declarações e autorização institucional, incluindo aprovadores
   sem atuação médica. Testar acumulação de papéis e isolamento entre grupos.

Critérios essenciais: pendentes/incompletos/expirados não iniciam novas
operações; perfis aprovados não ganham acesso a grupos sem autorização;
administradores sem perfil profissional conseguem gerir; profissionais não
leem CPF/nascimento/notas internas de terceiros; trocas de contato invalidam
selos; correções críticas preservam histórico; envio repetido é idempotente;
cada aceite identifica uma versão efetivamente publicada.

Essa revisão estabelece o contrato para a expansão e identifica dependências
externas. Consulte o relatório de validação da entrega para a cobertura atual.
Confirmação por SMS permanece em espera até configurar o provedor.
