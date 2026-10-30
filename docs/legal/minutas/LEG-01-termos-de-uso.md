# Termos de uso do Repassafe — MINUTA v0.1

Status: **minuta para revisão de advogado. Não publicar.** Itens `[PENDENTE: …]` bloqueiam a publicação.
Substitui a versão `2026-09-29` de `src/features/registration/legal.ts`. Vigência: `[PENDENTE: data]`.
Decisões aplicadas: responsável pessoa natural por ora (D-1), gratuito no piloto (D-2), ADR-011 (só pessoas naturais).

---

## 1. Quem somos e o que é o Repassafe

1.1. O Repassafe é uma plataforma que permite a médicos publicar, combinar e registrar repasses de plantões entre
si, com registro das condições aceitas, do acompanhamento do pagamento e do histórico.

1.2. O serviço é prestado por **Alexandre Oliveira**, pessoa natural, `[PENDENTE: CPF e endereço para notificações]`,
contato em `[PENDENTE: e-mail de contato]` (“Repassafe”, “nós”). Se a prestação passar a outra pessoa, jurídica ou
natural, avisaremos com antecedência de `[PENDENTE: 30]` dias e você poderá encerrar a conta.

1.3. O Repassafe **não** presta atendimento médico, **não** emprega nem representa os médicos, **não** é parte dos
acordos entre eles e **não processa, intermedia, garante ou cobra pagamentos**. Os valores são pagos diretamente
de quem repassa a quem assume.

> **Frase fixa (idêntica na interface e no instrumento):** `[PENDENTE: texto único aprovado]`. Sugestão: “O
> Repassafe registra o acordo e o acompanhamento do pagamento. Não recebe, intermedia nem garante pagamentos.”

## 2. Quem pode usar

2.1. Podem criar conta **pessoas naturais, médicos**, maiores de 18 anos e plenamente capazes, com CRM regular.
2.2. **Pessoas jurídicas, hospitais, clínicas e empresas não são partes** dos acordos registrados. Informar uma
instituição identifica o local do plantão e **não indica aval, vínculo ou responsabilidade** dela.
2.3. A conta é pessoal e intransferível. Você é responsável pelo uso da senha e deve avisar o suporte sobre uso
indevido.

## 3. Cadastro, verificação e permissões

3.1. Informe dados verdadeiros e mantenha-os atualizados. Declarações de vínculo **não confirmam** credenciamento
ou permissão institucional.
3.2. Quatro coisas são independentes: **identidade**, **habilitação profissional (CRM)**, **autorização
institucional** e **concessões administrativas**. A confirmação de e-mail não habilita ninguém. A verificação do CRM
não autoriza atuar em uma instituição. A aprovação de um grupo ou de um aprovador institucional não concede
direitos médicos e **não equivale à manifestação da instituição como parte**.
3.3. Contas com cadastro pendente, em correção, suspenso, rejeitado ou com verificação vencida podem ter acesso
limitado ou não assumir novos compromissos. Exibiremos à outra parte a situação da verificação.

## 4. Como funcionam os acordos

4.1. **Aceite.** O acordo se forma quando ambas as partes manifestam aceite no Repassafe às mesmas condições
exibidas (valor, datas, setor, local, vencimento, forma de pagamento e observações). O sistema vincula o aceite ao
conteúdo exato exibido, por meio de código de verificação (hash).
4.2. **Natureza do aceite.** O aceite é um **aceite eletrônico autenticado** por meio da sua conta e da
`[PENDENTE: confirmação por senha — ADR-013]`. Não é assinatura eletrônica avançada nem qualificada, nos termos da
Lei 14.063/2020, e o documento gerado **não é, por si, título executivo**.
4.3. **Pagador e beneficiário.** Quem repassa é o pagador; quem assume é o beneficiário, qualquer que seja a parte que
iniciou o registro.
4.4. **Data-limite.** Todo acordo tem uma data-limite de pagamento aceita pelas duas partes. Ela vale mesmo que o
hospital ou terceiro atrase o pagamento a quem repassa. Observações sobre “pago quando o hospital pagar” não
substituem nem suspendem a data-limite.
4.5. **Acordo registrado é imutável.** Depois do segundo aceite, as condições não são editadas. Para mudar algo,
registram-se novas condições (novo acordo ou aditivo) com novo aceite de ambos. O histórico anterior é mantido.
4.6. **Pagamento.** “Informei o pagamento” é declaração do pagador. “Recebi” é declaração do beneficiário. Anexar
comprovante **não** confirma o recebimento. Após o vencimento sem confirmação, a plataforma exibe “Prazo vencido —
recebimento não confirmado”; isso **não** equivale a declarar que não houve pagamento.
4.7. **Execução do plantão.** O registro do acordo é distinto da realização do plantão. O Repassafe não verifica
presença nem qualidade do serviço. `[PENDENTE: L-6 — confirmação bilateral de execução]`.
4.8. **Divergência.** Qualquer parte pode registrar divergência, com autor e momento preservados. O Repassafe
registra e organiza; **não decide** disputas entre as partes `[PENDENTE: D-8 — confirmar ausência de mediação]`.
4.9. **Admissão do método de comprovação.** As partes **reconhecem como válido** o método usado pelo Repassafe para
comprovar autoria e integridade (autenticação da conta, registro de data e hora, código de verificação e cadeia de
eventos), sem prejuízo de qualquer outro meio de prova e dos direitos de quem demonstrar falha ou fraude.
`[PENDENTE: D-6 — redação final e limites da convenção probatória, CPC art. 373 § 3º e MP 2.200-2 art. 10 § 2º]`.
4.10. **Cópias impressas.** Cópias em papel ou PDF do acordo trazem código de verificação e instruções para conferir
a integridade `[PENDENTE: PRV-005]`.

## 5. Grupos

5.1. **Grupo de colegas** é criado por médico com cadastro aprovado e vigente, que se torna seu gestor. **Grupo
institucional** é criado pela administração do Repassafe e exige instituição.
5.2. Grupo de colegas não concede autorização institucional. O gestor controla convites e remoções, mas não altera
acordos nem acessa dados civis dos membros. Regras completas: `[PENDENTE: LEG-05]`.
5.3. Membros veem o nome e o selo “CRM verificado” dos demais; a lista de membros de grupos institucionais não é
exposta.

## 6. Uso permitido

6.1. **Proibido** inserir informações de pacientes (nomes, leitos, prontuários, dados de saúde) em campos livres,
mensagens, fotos e anexos. Podemos remover o conteúdo e pedir correção.
6.2. Também é proibido: usar conta de outra pessoa, informar dados falsos, tentar acessar dados sem autorização,
automatizar o acesso em massa, interferir na segurança e usar o serviço para fim ilícito.
6.3. Conteúdo que você envia (foto, comprovante, observações) continua seu. Você nos autoriza a armazená-lo e
exibi-lo às partes autorizadas apenas para operar o serviço e preservar o registro dos acordos.

## 7. Moderação, suspensão e encerramento

7.1. Podemos pedir correção, limitar funções, suspender ou encerrar contas em caso de violação destes Termos, risco
à segurança ou determinação legal. Salvo risco imediato, informamos o motivo e damos `[PENDENTE: 5]` dias úteis para
resposta.
7.2. Você pode encerrar a conta a qualquer momento pelo suporte. Acordos confirmados, seus históricos e evidências
**permanecem** pelo prazo da Política de Retenção, pois interessam também à outra parte e à defesa de direitos.
7.3. Suspensão ou encerramento não extingue obrigações já aceitas.

## 8. Disponibilidade, mudanças e responsabilidade

8.1. O serviço é oferecido **gratuitamente** durante o piloto, no estado em que se encontra e sem garantia de
disponibilidade contínua. Falhas e manutenções podem ocorrer. Confira as confirmações registradas.
8.2. Antes de qualquer cobrança futura, avisaremos com `[PENDENTE: 30]` dias e você poderá encerrar a conta sem custo.
8.3. Respondemos por danos causados por dolo ou culpa nossa nos limites da lei. **Não respondemos** pelo
cumprimento dos acordos entre médicos, pelo pagamento, pelos atos de instituições, nem pelo conteúdo informado por
usuários. `[PENDENTE: D-8 e jurídico — limitação de responsabilidade e compatibilidade com o CDC, se aplicável]`.
8.4. Podemos alterar estes Termos. Mudanças relevantes geram nova versão, comunicada com `[PENDENTE: 15]` dias,
e pedem novo aceite. Aceites anteriores e as condições de acordos já confirmados permanecem registrados.

## 9. Dados pessoais

O tratamento de dados está descrito na Política de Privacidade, que integra estes Termos. O aceite de cada documento
é registrado separadamente, com versão e data.

## 10. Comunicações e suporte

Usaremos e-mail e notificações no aplicativo como comunicação válida. O suporte funciona em /suporte, que gera
protocolo e permite consultar a resposta. Pedidos de correção, contestação, encerramento e direitos de privacidade
seguem esse canal.

## 11. Lei aplicável e foro

Estes Termos regem-se pela lei brasileira. Fica eleito o foro `[PENDENTE: D-3]`, ressalvado o direito de foro que a
lei assegure ao usuário.

## 12. Disposições finais

A nulidade de uma cláusula não afeta as demais. Nossa tolerância não implica renúncia. Você não pode ceder sua
posição nestes Termos.
