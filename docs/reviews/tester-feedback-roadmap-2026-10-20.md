# Análise do teste de usuário e trilha de soluções

Data da análise: 20/10/2026.

Fonte: `C:/Users/Alexandre Oliveira/Downloads/sugestões.pdf`, quatro páginas, identificado como “Teste – 20/10/2026”. Foram lidos o texto e todas as páginas renderizadas, incluindo as capturas de tela. As sugestões do documento são evidências de pesquisa e propostas do testador; não constituem autorização para alterar regras ou implementar funcionalidades.

## Síntese

O relato revela insegurança em três momentos da jornada: conseguir se cadastrar, escolher quem assumirá o plantão e entender o compromisso financeiro até seu encerramento. Há também oportunidade de representar melhor a linguagem e as práticas reais dos médicos.

A principal descoberta ao confrontar o documento com o código é a diferença entre duas jornadas: **ofertar um plantão no mural** e **registrar diretamente um acordo já combinado**. O registro direto já contém vencimento estruturado e acompanhamento de pagamento; o fluxo do mural usa condições de pagamento em texto livre. Essa diferença pode explicar parte da percepção de ausência de recursos.

Prioridade recomendada: corrigir cadastro e orientação; explicitar a política de pagamento e aproximar as duas jornadas; melhorar a escolha do substituto e a entrega do registro; depois validar a expansão para trocas.

## Alcance e limites

- A análise confronta o relato com a documentação e o código deste checkout. Não houve reprodução autenticada, consulta a dados reais, envio de mensagens ou teste da versão publicada.
- “Existe no código” não significa que a funcionalidade esteja publicada, configurada e operando no ambiente usado pelo testador. A primeira atividade da trilha é identificar a versão e o ambiente do teste.
- Um participante fornece sinais úteis, mas não permite estimar frequência, prevalência ou prioridade para toda a base. As prioridades abaixo são propostas por impacto, dependências e risco de interpretação.
- A causa do erro de CRM permanece sem reprodução. A captura comprova uma mensagem pouco esclarecedora; não comprova duplicidade.
- Não foram alterados código de aplicação, dados ou decisões de produto. Não foram executadas suítes de teste, pois esta entrega é uma análise. Os testes descritos abaixo são critérios para as futuras correções.

## Matriz das sugestões

| Referência no PDF | Problema identificado | Situação encontrada | Encaminhamento |
| --- | --- | --- | --- |
| 1 e 7, pp. 1–2 | Incerteza sobre quem assume o risco do atraso da fonte pagadora | O registro direto exige data-limite mesmo com atraso do hospital; o mural recebe texto livre | P1: explicitar a regra e discutir eventual alternativa como decisão de produto, antes de implementá-la |
| 2, p. 1 | Demonstração pouco concreta e dúvida sobre quando o repasse se confirma | O exemplo atual omite local/atividade mais específicos; termina explicando que publicar ainda não confirma | P2: enriquecer o exemplo e mostrar a sequência até o aceite, sem prometer negociação inexistente |
| 3, p. 1 | Trabalho repetitivo ao descrever as condições | Há campos estruturados no registro direto, mas não foi encontrada biblioteca de modelos ajustáveis | P2: modelos de preenchimento com revisão explícita e versão preservada |
| 4, p. 1 | Troca recíproca de dois plantões não está representada | Não foi identificado fluxo de troca vinculando dois compromissos na aplicação consultada | P3: descoberta e desenho próprios; não simular troca com dois repasses independentes |
| 5, p. 2 | Erro de cadastro não informa causa nem caminho de recuperação | “Informe o CRM” é usado para formato inválido; envio valida dados já salvos e retorna só a primeira mensagem | P1: reproduzir e distinguir ausência, formato, estado não salvo e conflito de CRM/UF |
| 6, p. 2 | Falta de percurso específico para contestar uso indevido de CRM | Existe suporte geral, protocolo e resposta; não foi identificado tratamento específico dessa contestação | P1: aproveitar o suporte e adicionar triagem, prova de identidade por canal protegido e decisão auditada |
| 8, p. 2 | Usuário não sabe se ambas as partes recebem o registro final | Há consulta e impressão/PDF pelo navegador; não foi encontrado remetente transacional de comprovantes no código consultado | P1: garantir acesso ao registro; P2: entrega por e-mail com rastreio de falhas e reenvio |
| 9, p. 2 | Encerramento financeiro pouco visível ou inconsistente entre jornadas | Registro direto já tem “Informei o pagamento”, “Recebi” e divergência; isso não aparece no documento do repasse pelo mural | P1: tornar o recurso encontrável e planejar cobertura consistente dos acordos oriundos do mural |
| 10, p. 3 | Compartilhamento parece depender de um grupo específico e promete chegada direta | Texto fala em “no grupo do WhatsApp”; visitante sem sessão é encaminhado ao login, cujo retorno só aceita convites de grupo | P1: preservar destino após autenticação; P2: corrigir o texto conforme audiência e elegibilidade |
| 11, pp. 3–4 | Informação insuficiente para escolher o substituto | Cartões recebem nome e data da candidatura; selo coletivo não apresenta perfil profissional individual | P1: resumo profissional verificável e consulta de detalhes antes da escolha |
| Glossário, p. 4 | Atividade, setor e turno se misturam no campo “Setor” | Publicação possui setor, data e horários; não há campos próprios para rotina/round/SD/SN | P2: validar vocabulário e separar atividade, local/setor e horário |

P1 = resolver antes de ampliar o piloto; P2 = melhoria seguinte; P3 = expansão a validar. O documento, isoladamente, não demonstra um incidente crítico P0.

## Diagnóstico e direção de solução

### 1. Pagamento: tornar a responsabilidade compreensível

Os itens 1 e 7 expressam a mesma necessidade: o titular quer registrar o contexto de um atraso de terceiro e entender como isso afeta o compromisso assumido.

Existe uma decisão explícita em `docs/product/external-agreement-registration.md`: quem repassa é o pagador, quem assume é o beneficiário e a data-limite continua válida mesmo quando o hospital atrasa. Essa decisão também aparece em `src/features/agreements/schema.ts` e na tela do registro direto. Portanto, a sugestão do testador conflita com a política atual; não é apenas uma melhoria de texto.

**Proposta para a primeira entrega:** preservar essa política enquanto se avalia sua adequação, destacando antes do aceite quem paga, quem recebe, valor e data-limite. Separar a previsão de recebimento do hospital da data-limite combinada entre os profissionais. Uma previsão não deve ser apresentada como vencimento nem alterar o prazo silenciosamente.

O texto “em até 30 dias” precisa indicar o marco inicial e resultar em uma data concreta. A captura “Data provável: a partir de 30 dias, a contar de hoje” é especialmente ambígua: informa uma estimativa relativa, sem definir claramente uma data-limite. “Hoje” também perde significado quando o acordo é consultado mais tarde.

Pode ser útil oferecer “Relatar atraso da fonte pagadora” como evento contextual, com autor, data, descrição e, se necessário, evidência privada. Um comunicado do hospital ou uma previsão atualizada pode documentar o relato, mas não deve ser convertido automaticamente em prova de ausência de responsabilidade. A plataforma registra declarações e documentos; não determina culpa a partir de um checkbox.

Se o produto decidir admitir pagamento condicionado a recebimento de terceiro, será necessário definir uma modalidade própria: evento que inicia a contagem, limite de espera, dever de atualização, evidências, divergências e apresentação idêntica às duas partes. A redação e seus efeitos devem passar por revisão jurídica antes de serem oferecidos. Este relatório não conclui sobre responsabilidade jurídica individual.

**Aceite:** as duas partes conseguem explicar a data-limite e o efeito de um atraso do hospital; relatar atraso não muda as condições aceitas; não usar “inadimplente” como classificação automática pela mera ausência de confirmação.

### 2. CRM: corrigir o diagnóstico e permitir recuperação

Em `src/features/registration/schemas.ts`, “Informe o CRM” é emitido quando o número não corresponde a 4–12 dígitos. Isso inclui campo vazio e outros formatos, não apenas ausência. A validade desse limite também deve ser conferida antes de restringir registros legítimos.

Em `submitRegistrationAction`, a validação usa o rascunho salvo no servidor e devolve somente a primeira mensagem, sem `fieldErrors`. O formulário de edição e o envio para verificação são separados. É plausível que um valor recém-editado ainda não salvo gere a mensagem observada, mas isso é hipótese, não causa confirmada.

Além disso, `saveRegistrationAction` interpreta erro de unicidade `23505` como telefone quando encontra “phone” e como CPF em todos os demais casos. Se um conflito de CRM chegar por esse caminho, será classificado incorretamente. No envio, falhas da operação recebem uma mensagem genérica sobre e-mail, foto e documentos. É preciso localizar a operação efetivamente rejeitada antes de ajustar o tratamento.

**Proposta:** preservar os dados digitados, indicar o campo e o motivo, levar o foco ao erro e distinguir “Salvar progresso” de “Enviar para verificação”. Detectar alterações não salvas ou incorporar salvamento validado ao envio. Mapear conflitos por códigos/identificadores estáveis, sem expor nome ou contato de outra conta.

Texto sugerido para conflito confirmado: “Não foi possível vincular este CRM e UF ao cadastro. Confira os dados. Se estiverem corretos, solicite uma revisão.” Ação: “Solicitar revisão do CRM”.

**Aceite:** testar CRM ausente, formato inválido, par CRM/UF já utilizado, mesmo número em UF diferente, edição não salva, retomada de cadastro e duas submissões concorrentes. A interface deve apontar corretamente cada erro, sem atribuí-lo a CPF ou foto indevidamente.

### 3. Contestação de CRM: processo operacional explícito

O suporte existente pode ser a entrada. Adicionar assunto específico, protocolo vinculado ao cadastro, triagem interna e andamento visível ao solicitante. Definir responsável e prazo operacional realista antes de anunciar prazo ao usuário.

Não cancelar, transferir ou liberar automaticamente um CRM apenas porque outra pessoa o reivindicou. Confirmar identidade por canal protegido, revisar as evidências, avaliar medidas proporcionais e preservar histórico de decisões e acordos. O campo livre atual de suporte proíbe documentos; eventual coleta documental precisa de percurso próprio.

**Aceite:** o profissional consegue abrir e acompanhar a contestação; a equipe registra evidências e decisão; nenhuma informação da outra conta é revelada; identidade, habilitação profissional, autorização institucional e acesso administrativo continuam independentes.

### 4. Acompanhamento e comprovante: aproximar as jornadas

O registro direto já oferece “Aguardando pagamento”, “Pagamento informado — aguardando recebimento”, “Recebimento confirmado” e “Prazo vencido — recebimento não confirmado”. Há divergência e comprovante opcional; anexar comprovante não confirma recebimento. Pagamentos parciais são tratados como divergência nessa versão.

Esses recursos devem ser apresentados no caminho em que o usuário espera encontrá-los. Recomenda-se planejar estados e acesso consistentes para acordos originados no mural, reaproveitando as regras existentes. Isso exige adaptação de dados e permissões, não apenas inserir os mesmos botões em outra tela.

Manter três dimensões separadas: acordo confirmado, plantão realizado e recebimento confirmado. A ausência de ação no app não comprova falta de pagamento. Acordos antigos com prazo livre não devem receber uma data inventada nem ter o documento original alterado; é necessário definir tratamento explícito para o legado.

Para e-mail, distinguir o **registro do acordo** do **comprovante de pagamento**. Recomenda-se enviar às duas partes um resumo mínimo e link autenticado para o registro final. Gerar o envio somente quando o acordo estiver confirmado, incluindo aprovação institucional quando exigida. Se houver exigência de anexo PDF, preparar a geração a partir da mesma versão preservada do documento; a impressão atual no navegador não equivale a esse serviço.

**Aceite:** cada parte consulta o mesmo registro; uma falha de e-mail não desfaz um acordo confirmado; reprocessamento não duplica mensagens; há registro de tentativa, resultado e reenvio. Testar entrega real em homologação com contas de teste. Receber e-mail não substitui aceitar o acordo.

### 5. Escolha do substituto: contexto profissional suficiente

Apresentar nome, foto quando disponível, CRM/UF, estado e validade da verificação, especialidade/RQE com sua situação própria e vínculo institucional quando relevante e autorizado. Diferenciar dados declarados de dados verificados. Prever “Ver perfil profissional” antes da seleção.

Não é necessário criar ranking ou pontuação nesta entrega. A prioridade é permitir uma escolha informada com informações confiáveis. Não incluir CPF, nascimento, notas internas de verificação nem documentos pessoais nessa projeção.

**Aceite:** o titular compara candidatos sem sair da jornada; os dados exibidos têm audiência controlada; eventual expiração entre candidatura e seleção é tratada no servidor e na interface; o selo coletivo não oculta uma situação individual desatualizada.

### 6. Demonstração, compartilhamento e vocabulário

A proposta de exemplo mais concreto é pertinente, mas a frase sobre “ajuste de termos” pode sugerir uma negociação interna que o fluxo atual não oferece. No mural, a edição é permitida antes da primeira candidatura; depois, alterações exigem cancelar e republicar. O registro direto preserva as condições enviadas e exige novo convite para correções.

Texto proposto para o encerramento da demonstração: “Após publicar, o plantão fica disponível para candidaturas. O titular escolhe um substituto, que revisa e aceita as condições. Quando exigida pelo grupo, a coordenação também aprova. Então o repasse é registrado.” Usar local fictício, atividade clara e data futura ou explicitamente ilustrativa; 15/10/2026 já passou na data deste teste.

Texto proposto para oferta livre: “Depois de publicar, compartilhe o link do plantão em grupos de médicos no WhatsApp. Para consultar e se candidatar, é necessário entrar e estar habilitado no Repassafe.” Após implementar a retomada do destino, pode-se explicar que o usuário retornará ao plantão depois do login. Compartilhar o link não deve ampliar permissões de ofertas restritas a grupo.

O código atual permite retorno pós-login apenas a convites de grupo. Ampliar esse mecanismo com destinos internos validados para plantões e testar usuário autenticado, visitante, cadastro pendente e pessoa sem vínculo. Não aceitar URLs arbitrárias como destino.

No vocabulário, separar **atividade** (rotina, intercorrência, round), **setor/local** (UTI, enfermaria, instituição) e **turno/horário**. Rotina e round podem coexistir; não presumir que sejam alternativas exclusivas. SD/SN podem ser atalhos ajustáveis, sempre exibindo horário e data de término. Validar as definições com usuários de serviços distintos antes de universalizá-las. O relato serve como insumo de linguagem, não como norma assistencial.

**Aceite:** pessoas do piloto entendem publicação, seleção e confirmação como momentos distintos; links retomam a oferta correta após login; o turno noturno mostra término no dia seguinte; campos livres mantêm o aviso de proibição de dados de pacientes.

### 7. Modelos ajustáveis de condições

Começar com modelos de preenchimento do plantão e condições objetivas, evitando um editor livre de cláusulas como primeira entrega. Preencher atividade, setor/local, horários, valor e vencimento, deixando as informações revisáveis antes do aceite.

Separar modelo reutilizável de acordo registrado. Editar um modelo não pode alterar registros já aceitos. Mudanças nas condições exigem nova revisão e novos aceites conforme a jornada; não inserir silenciosamente termos de um modelo atualizado.

**Aceite:** ambas as partes veem a mesma versão; o resumo destaca dados variáveis; o modelo reduz o tempo de preenchimento sem aumentar erros ou diminuir a compreensão das obrigações.

### 8. Trocas de plantões: expansão própria

A troca descrita envolve dois plantões e compromissos recíprocos. Duas publicações independentes podem deixar uma parte comprometida sem a contrapartida da outra.

Validar primeiro a frequência e as variantes: mesma instituição ou instituições distintas, duração igual ou diferente, remuneração inalterada ou compensação, exigência de aprovação de uma ou duas coordenações. Definir também sobreposição de horários e o que ocorre se um dos plantões já tiver sido realizado quando surgir problema no segundo.

O modelo proposto é um registro de troca vinculando os dois plantões, com aceite das mesmas condições, aprovações necessárias e confirmação conjunta. Antes da confirmação, rejeição ou expiração de uma parte deve impedir que a outra fique isoladamente confirmada. Após a confirmação, preservar o registro e tratar ocorrências sem edição silenciosa. Não contornar a ausência de suporte com dois repasses de valor zero.

**Aceite:** testes comprovam que não existe confirmação parcial; recusas, expiração, concorrência, conflitos de agenda e permissões institucionais são tratados; os dois compromissos aparecem no histórico de ambas as partes.

## Trilha de execução proposta

As faixas de esforço são relativas, não estimativas de prazo. P = mudança localizada; M = fluxo com vários componentes; G = alteração de domínio e integrações. Confirmar estimativas após reproduzir o erro e definir a política de pagamento.

| Ordem | Pacote e entrega | Responsáveis sugeridos | Esforço | Dependência e critério de saída |
| --- | --- | --- | --- | --- |
| 0 | Identificar ambiente/versão do teste; reproduzir CRM; percorrer as duas jornadas | Engenharia + produto + testador | P | Evidência da operação que falha e inventário do que está publicado |
| 1A | Corrigir erros por campo, estado não salvo e entrada para contestação | Engenharia + operação | M | Cadastro recuperável e contestação rastreável; sem exposição de terceiros |
| 1B | Corrigir texto da demonstração/compartilhamento e retorno ao plantão após login | Design/conteúdo + engenharia | P–M | Promessas iguais ao comportamento; navegação preservada com permissões |
| 2 | Confirmar política de atraso; explicitar vencimento; definir acompanhamento para mural e legado | Produto + engenharia; revisão jurídica se houver mudança de termos | G | Condições sem ambiguidade e aceites preservados nas duas jornadas |
| 3 | Resumo profissional dos candidatos | Design + engenharia + operação de verificação | M | Escolha informada; estados atuais; dados privados protegidos |
| 4 | Entrega do registro às duas partes por e-mail | Engenharia + operação | M | Envio após confirmação final; falhas e reenvios observáveis |
| 5 | Modelos de preenchimento e vocabulário de atividades/turnos | Produto + design + médicos do piloto + engenharia | M | Menos esforço com igual ou melhor compreensão; horários explícitos |
| 6 | Descoberta e especificação de troca; implementação se validada | Produto + médicos/coordenadores + engenharia | G | Demanda demonstrada e regras de reciprocidade fechadas antes de desenvolver |

Os pacotes 1A e 1B podem avançar enquanto a política é discutida. O resumo de candidatos também pode ser desenvolvido de forma independente. Modelos de pagamento dependem da decisão do pacote 2; não consolidar em modelos uma política ainda em disputa.

Na implementação de interface, seguir `AGENTS.md`: skill Impeccable, identidade v2.1, tokens, auditoria de design existente, erros por campo, teclado, foco visível, contraste, estados e validação em celular e desktop. Nesta análise não houve desenvolvimento de interface nem aplicação da skill Impeccable.

## Próxima rodada de validação

Repetir com o participante original e incluir outros médicos que repassam e assumem plantões; incluir aprovador institucional para cenários de grupo. Essa rodada é qualitativa e não estima percentuais para toda a população.

Tarefas: corrigir um cadastro com erro; pedir revisão de CRM; abrir um link recebido sem sessão e retomar a oferta; escolher entre candidatos; explicar quem paga e quando; relatar atraso de hospital; localizar o registro final; informar pagamento e confirmar recebimento com contas diferentes.

Registrar conclusão sem ajuda, erros e retornos, tempo por tarefa e explicação das condições pelo participante. Para e-mail, medir tentativas, entrega quando observável e falhas; para modelos, comparar tempo e erros de preenchimento com a experiência anterior. Estabelecer uma linha de base antes de prometer metas numéricas.

Critério para ampliar o piloto: nenhum cenário crítico dessa rodada permanece bloqueado, os participantes distinguem previsão do hospital e vencimento acordado, conseguem recuperar o cadastro e encontrar o registro/pagamento, e os testes funcionais cobrem permissões, aceites, idempotência e preservação do histórico. Inspeção visual não substitui esses testes.

## Referências locais verificadas

- `docs/product/external-agreement-registration.md`: decisões de pagamento, estados, escopo e imutabilidade do registro direto.
- `docs/operations/core-shift-flow.md`: confirmação, edição e aprovação no mural.
- `docs/product/registration-full-spec-review.md`: independência das camadas de cadastro e critérios de recuperação.
- `docs/reviews/design-audit-critique-2026-09-29.md`: clareza de estados, próximos passos, recuperação e acessibilidade; diagnóstico histórico, não confirmação de defeitos atuais em todas as telas.
- `src/app/cadastro/actions.ts`, `src/features/registration/schemas.ts`, `src/components/registration-form.tsx`: validação, salvamento e envio do cadastro.
- `src/app/suporte/actions.ts`, `src/components/support-form.tsx`: entrada atual de suporte e protocolo.
- `src/components/screens/choose-substitute.tsx`, `src/components/screens/candidate-selection.tsx`, `src/lib/shifts/data.ts`: dados atuais da seleção.
- `src/components/publish-shift-fields.tsx`, `src/components/publish-shift-review.tsx`, `src/components/repasse-preview.tsx`: campos, compartilhamento e demonstração.
- `src/app/auth/actions.ts`, `src/features/groups/invite-path.ts`: destino após autenticação.
- `src/features/agreements/schema.ts`, `src/components/agreement-forms.tsx`, `src/app/acordos/registrados/[id]/page.tsx`: prazo, pagamento, recebimento e impressão do registro direto.
- `src/app/acordos/[id]/page.tsx`: documento do repasse originado no mural.

As buscas por remetente/fila de e-mail transacional no código e nos scripts consultados não localizaram implementação de envio do registro final. Isso não descarta uma integração externa configurada fora deste checkout; verificar o ambiente antes de afirmar ausência em produção.
