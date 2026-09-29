# Audit e critique — Repassafe, 29/09/2026

Method: dual-agent (A: /root/design_review · B: /root/design_evidence)

Alvo estável: `src/app`, com `src/components` e estilos compartilhados como
contexto. Avaliação A independente por fontes, sem acesso ao detector; avaliação
B por detector e evidência de navegador. A terminou antes de B entregar os
resultados ao coordenador. As avaliações retratam a interface inicial desta
solicitação; a separação técnica do acesso administrativo foi implementada
durante a síntese e não é apresentada como um redesenho da administração.

Inspeção visual parcial: homepage e cadastro renderizaram no navegador após
usar webpack. Turbopack falhou ao criar processo de compilação CSS neste
ambiente. Administração autenticada, celular, zoom 200%, leitores de tela,
submissões reais e métricas de performance não foram exercitados. As notas são
provisórias, não certificam WCAG nem qualidade em todas as telas. A avaliação A
não conseguiu ver a interface renderizada; a evidência visual é de B.

## Veredicto

Especificidade moderada: CRM, plantão, vínculo, aprovação e registro do acordo
expressam o domínio, mas grades de cartões não diferenciam urgência, próxima
ação ou complexidade. O fluxo transmite segurança no discurso e perde clareza
na espera, na correção cadastral e na operação gerencial.

Integridade parcialmente reprovada: controles públicos aparentam entregar
consulta e documentos sem destino funcional. O detector não detectou esses
problemas; seus dois avisos de bordas laterais são ocorrências reais de uma
regra estilística, sem comprovação de prejuízo de usabilidade.

## Critique — heurísticas de Nielsen

| Heurística | Nota /4 | Principal evidência |
| --- | ---: | --- |
| Estado do sistema | 2 | Sem progresso por nível de verificação; feedback administrativo desigual |
| Linguagem e mundo real | 3 | Bom vocabulário do domínio; eventos de auditoria expõem identificadores técnicos |
| Controle e liberdade | 2 | Correção do perfil sem ação/canal direto |
| Consistência | 2 | Escudo na landing e R no produto; nomes diferentes para iniciar cadastro |
| Prevenção de erros | 2 | UF livre; aprovação e resultado verificado pré-selecionados |
| Reconhecimento | 3 | Labels e estados claros, mas próximos passos incompletos |
| Eficiência | 1 | Fila profissional sem busca/paginação; administração cartão a cartão |
| Minimalismo | 2 | Várias tarefas extensas empilhadas sem prioridade |
| Recuperação de erros | 2 | Auth usa erro geral; admin lança exceções sem retorno por campo |
| Ajuda | 1 | Orientação para procurar a equipe sem canal acionável |
| **Total** | **20/40** | **Aceitável; trabalho significativo necessário** |

## Audit — saúde técnica

| Dimensão | Nota /4 | Principal evidência |
| --- | ---: | --- |
| Acessibilidade | 2 | Textos de apoio e status abaixo de 4,5:1 |
| Performance | 3 | Hero com next/image; sem métricas reais |
| Responsividade | 3 | Layouts fluidos; navegação escondida sem menu correspondente |
| Theming | 2 | Tokens globais e paleta duplicada da landing |
| Integridade da implementação | 2 | Consulta inerte e links de documentos com # |
| **Total** | **12/20** | **Aceitável; trabalho significativo necessário** |

Modo claro explícito não é um defeito por si. Ausência de métricas ou de teste
em uma superfície não comprova que ela esteja lenta ou quebrada.

## Cinco prioridades de design

1. **[P1] Jornada de cadastro sem representação dos níveis.** O formulário
   mínimo não explica CPF, telefone, especialidade/RQE, correção e validade.
   Isso transfere complexidade ao usuário depois do primeiro envio. Mostrar
   conta → identificação/profissão → verificação → autorização institucional,
   com estado e próximo passo; não confundir CRM com credenciamento.
   Evidência: `src/components/auth-form.tsx`, `src/app/cadastro/page.tsx`,
   especificação §8 e backlog US-0101–0205. Comandos: `/impeccable onboard` e
   `/impeccable clarify`.
2. **[P1] Administração sem arquitetura de tarefas.** Verificação, criação de
   instituição/grupo, vínculo, ocorrência e auditoria dividem uma página longa.
   O operador precisa rolar e comparar formulários repetidos. Separar fila,
   pessoas, instituições/grupos, operação e auditoria; busca, filtros e detalhes
   sob demanda. A independência da autorização foi corrigida tecnicamente;
   essa organização visual continua recomendação. Evidência:
   `src/app/admin/page.tsx`, `src/app/admin/operacao/page.tsx`.
   Comandos: `/impeccable layout` e `/impeccable distill`.
3. **[P1] Confiança pública com ações sem resultado.** O botão Consultar
   registro do acordo não possui destino/handler e Privacidade/Termos apontam
   para `#`. Publicar documentos reais e identificar a demonstração como
   exemplo; conectar a consulta ou retirar aparência de ação. Evidência:
   `src/app/page.tsx:220`, `src/app/page.tsx:295`.
   Comandos: `/impeccable harden` e `/impeccable clarify`.
4. **[P1] Contraste insuficiente.** Cálculo sRGB dos valores declarados:
   `#8a9896` sobre branco = 2,99:1; sobre `#fbfaf6` = 2,87:1;
   sucesso `#3e8f6b` sobre `#dcfae6` = 3,53:1; erro `#d9484d` sobre
   `#fee4e2` = 3,49:1. Textos normais perdem legibilidade e não atendem ao
   critério WCAG 1.4.3 quando usados nessas combinações. Corrigir foregrounds
   e consolidar tokens. Evidência: `src/app/globals.css` e
   `src/app/page.module.css`. Comando: `/impeccable colorize`.
5. **[P2] Recuperação, navegação móvel e hierarquia desalinhadas.** Auth exibe
   um erro geral sem apontar o campo; admin precisa de pending/sucesso/erro.
   O CSS esconde links da navbar em 960px e o CTA em 640px, mas nenhum
   `menuButton` correspondente existe no JSX. O hero ainda permite entrar,
   portanto não é bloqueio completo. O título do cadastro perdeu tamanho/peso
   na renderização. Dar erro associado com `aria-invalid`/`aria-describedby`,
   canal de correção, navegação móvel acessível e escala de título explícita.
   Evidência: `src/components/auth-form.tsx`, `email-action-form.tsx`,
   `src/app/admin/actions.ts`, `globals.css:152`, `page.module.css:675`.
   Comandos: `/impeccable harden`, `/impeccable adapt`, `/impeccable typeset`.

A auditoria técnica isolada contém 2 P1 e 3 P2, sem P0 comprovado. A crítica
consolidada acima agrupa trabalho de produto e UX em 4 P1 e 1 P2; são contagens
de agrupamentos diferentes, não somar como defeitos independentes.

## Detector e falsos positivos

`impeccable detect --json src` executou com sucesso. Resultado integral:
`docs/reviews/design-detector-2026-09-29.json`.

Dois warnings `side-tab` / `slop`: `.update-notice` em `globals.css:134` usa
borda esquerda de 4px; `.agreement-card` em `globals.css:381` usa 5px. As bordas
reforçam estados já descritos em texto; não tratá-las como falha de contraste,
dependência exclusiva de cor ou prioridade de redesenho.

A API de avaliação do navegador é somente leitura. Mutação de título e
injeção de script não estavam disponíveis; não houve overlay, console do
detector no browser nem servidor de overlay. Inspeção comum funcionou em B.

## O que preservar

- Vocabulário em português, datas/condições identificadas e distinção de CRM
  versus autorização institucional nos textos.
- Labels e controles nativos, foco visível, botões principais com altura
  adequada, submit pendente desabilitado e mensagens de estado.
- next/image no hero, grids fluidos, registro preparado para impressão e
  alternativa de redução de movimento.

## Carga cognitiva, emoção e personas

A administração concentra ao menos cinco tipos de tarefa concorrentes sem
fila ou revelação progressiva. O select de evidência CRM tem oito opções,
mas elas não estão simultaneamente visíveis quando fechado; isso exige
organização, não comprova sobrecarga só pela contagem. O cadastro inicial é
curto, porém não representa a complexidade posterior.

A jornada começa com promessa de clareza. O ponto de maior fricção é esperar
ou receber correção sem prazo/canal/percurso estruturado. O encerramento do
cadastro deve orientar a próxima ação e as etapas restantes sem prometer
aprovação automática ou prazo que a operação não assumiu.

- **Jordan, primeiro acesso:** não encontra onde enviar informação adicional
  nem destino de suporte para uma correção.
- **Casey, médico no celular:** precisa digitar UF, não recebe retomada para
  uma jornada expandida e encontra ações de plantão após conteúdo cadastral.
- **Alex, operador experiente:** procura profissional por rolagem e repete
  decisões cartão a cartão; não separa a fila de verificação de outras tarefas.
- **Sam, teclado/leitor de tela:** labels ajudam, mas erros gerais não associam
  problema e campo; feedback administrativo precisa ser consistente.

## Observações e testes ainda necessários

Unificar marca escudo/R e nomenclatura de acesso, sem descartar a identidade
visual documentada. Os tokens chamados Inter/Poppins apontam para outras
famílias; evitar que nomes de tokens escondam a intenção tipográfica.
Para aprovados, priorizar publicar/encontrar/acompanhar repasses no painel.

Testar celular e zoom 200%, textos longos em flex/tabelas, scroll por teclado,
leitor de tela, fluxo de erros e submissão administrativa autenticada.
Checkbox pequeno pode ter alvo ampliado pelo label; não afirmar violação
WCAG de alvo sem medir espaçamento e área clicável. Supressão global de motion
com 0,01ms merece revisão, mas não foi comprovada como barreira neste produto.

## Sequência recomendada

Consolidar o contrato de cadastro documentado em
`docs/product/registration-full-spec-review.md`; aplicar onboard/clarify na
jornada; layout/distill na administração; colorize/harden nos contrastes e
ações reais; adapt/typeset em mobile e hierarquia. Encerrar com
`/impeccable polish` e repetir `/impeccable audit` após as correções.
As sugestões podem ser executadas individualmente, juntas ou em outra ordem.

Perguntas para a próxima rodada: priorizar a jornada de cadastro ou a fila
administrativa? Preservar a marca com ajustes pontuais, ou consolidar marca e
tokens em todo o produto? Essas perguntas orientam as melhorias de design;
não bloqueiam o isolamento administrativo já solicitado.
