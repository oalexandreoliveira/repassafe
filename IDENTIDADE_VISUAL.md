# Identidade Visual — Repassafe

> Proposta-base para orientar o design do produto, a construção da marca e a implementação das interfaces do Repassafe.

## 1. Visão geral

O **Repassafe** é uma health tech/legal tech brasileira criada para formalizar o repasse de plantões médicos e proporcionar segurança jurídica aos profissionais envolvidos.

A identidade deve traduzir a ideia de **proteção sem burocracia**: uma marca confiável, ágil, humana e precisa, adequada à rotina de médicos plantonistas que precisam compreender informações e concluir ações rapidamente pelo celular.

### Atributos centrais

- **Confiável:** transmite segurança para assumir ou transferir uma responsabilidade profissional.
- **Ágil:** comunica um processo rápido e compatível com situações urgentes.
- **Humana:** reconhece o contexto de cansaço, pressão e colaboração entre médicos.
- **Precisa:** reduz ambiguidades em horários, condições, responsabilidades e confirmações.
- **Contemporânea:** apresenta-se como produto digital moderno, e não como sistema hospitalar, bancário ou governamental.

## 2. Conceito criativo

### Passagem segura

O conceito central da marca é a **passagem segura**. Ele representa o repasse de um plantão entre duas partes e a continuidade da responsabilidade assistencial mediante um fluxo formalizado.

O símbolo deve ser construído a partir de duas formas que se aproximam e completam uma passagem. O espaço negativo central sugere um **check**, incorporando segurança e confirmação ao próprio movimento de transferência.

Essa solução deve comunicar simultaneamente:

- duas partes envolvidas no repasse;
- transferência ou continuidade;
- confirmação do acordo;
- proteção integrada ao processo;
- conclusão simples e rápida.

O elemento de segurança não deve depender de um cadeado, escudo ou ícone jurídico literal. A proteção deve ser percebida como parte do fluxo.

## 3. Assinatura da marca

### Nome

**Repassafe**

O nome combina a função principal do produto — o repasse — com a promessa de segurança. Deve ser grafado como uma única palavra, com inicial maiúscula em textos corridos e conforme o desenho vetorial aprovado nas assinaturas oficiais.

### Wordmark

O wordmark deve utilizar uma sans-serif geométrica com personalidade, preferencialmente **Poppins SemiBold**, ou uma solução visual equivalente após ajuste óptico.

Diretrizes:

- preservar leitura imediata do nome;
- evitar estilizações que dificultem o teste do telefone;
- manter proporções amigáveis para cabeçalhos de aplicativo;
- não utilizar serifas tradicionais nem referências visuais cartoriais;
- ajustar kerning e terminais na versão vetorial final.

## 4. Paleta de cores

| Token | Cor | Hex | Uso principal |
|---|---|---:|---|
| `brand-primary` | Teal profundo | `#0F5C56` | Marca, navegação, controles selecionados e ações institucionais |
| `brand-dark` | Teal escuro | `#0A3B37` | Dark mode, fundos escuros e variações de contraste |
| `accent-action` | Âmbar/coral | `#F2994A` | Ações prioritárias, destaques breves e sinalização de atenção |
| `surface-base` | Off-white quente | `#F7F5F0` | Fundo principal da interface clara |
| `text-primary` | Cinza-chumbo quente | `#2B2A28` | Texto principal e informações de alta relevância |

### Regras de aplicação

- O teal profundo é a cor de assinatura e deve dominar a experiência de marca.
- O âmbar/coral deve ser usado com moderação, especialmente em pontos de ação ou atenção.
- O off-white quente substitui o branco clínico como fundo predominante.
- O cinza-chumbo deve substituir o preto puro em textos e elementos estruturais.
- Estados semânticos de sucesso, alerta, erro e informação devem receber tokens próprios na etapa de construção do design system; não devem ser representados exclusivamente pelas cores da marca.
- Nenhuma informação essencial pode depender apenas da cor. Ícone, rótulo ou mensagem devem complementar estados importantes.

### Combinações preferenciais

- Fundo off-white com texto cinza-chumbo.
- Fundo teal profundo com conteúdo claro de alto contraste.
- Fundo teal escuro em dark mode, com superfícies hierarquizadas.
- Âmbar/coral como destaque pontual sobre superfícies neutras ou teal, condicionado à validação de contraste.

## 5. Tipografia

### Display e marca

**Poppins SemiBold**

Aplicações sugeridas:

- wordmark;
- títulos de destaque;
- chamadas institucionais;
- telas de onboarding e estados de confirmação.

### Interface e corpo de texto

**Inter Regular e Medium**

Aplicações sugeridas:

- textos de interface;
- formulários;
- botões;
- informações sobre o plantão;
- mensagens de validação;
- termos e registros do repasse.

### Horários, datas e valores

Horários, datas, durações e valores devem utilizar **números tabulares**, por meio de `font-variant-numeric: tabular-nums`, para manter alinhamento e facilitar a comparação visual.

### Princípios de legibilidade

- priorizar leitura rápida em telas pequenas;
- evitar pesos muito leves;
- manter altura de linha confortável em textos jurídicos e operacionais;
- não usar caixa alta em blocos extensos;
- diferenciar claramente data, horário, local, valor e status do plantão.

## 6. Símbolo

### Construção conceitual

O símbolo deve combinar:

1. duas formas ou partes, representando quem repassa e quem assume;
2. um movimento de aproximação, passagem ou continuidade;
3. um check percebido pelo espaço negativo;
4. cantos suaves, que preservem proximidade e humanidade;
5. geometria horizontal, associada a fluxo e transferência.

### Requisitos funcionais

- permanecer reconhecível em `32 × 32 px`;
- funcionar como ícone de aplicativo e favicon;
- possuir versões positiva, negativa e monocromática;
- funcionar em fundo claro e escuro;
- manter leitura sem depender de degradê, sombra ou textura;
- permitir aplicação isolada e acompanhada do wordmark;
- evitar detalhes finos que desapareçam em tamanhos reduzidos.

### Área de proteção

A margem de proteção definitiva deverá ser estabelecida na reconstrução vetorial. Até a definição da grade, recomenda-se manter ao redor da assinatura uma área livre mínima equivalente à altura do elemento central do símbolo.

## 7. Direção de interface

A experiência visual deve reduzir a carga cognitiva em contextos de urgência e exaustão.

### Princípios

- uma decisão principal por tela sempre que possível;
- hierarquia evidente entre local, data, horário, especialidade, valor e status;
- estados de confirmação inequívocos;
- linguagem direta, sem juridiquês desnecessário;
- áreas de toque confortáveis em dispositivos móveis;
- componentes arredondados com moderação, evitando aparência infantil;
- animações breves e funcionais, usadas para confirmar transições ou mudanças de estado.

### Uso do acento

O âmbar/coral deve indicar ações prioritárias ou pontos de atenção, sem competir com o teal. Seu uso excessivo enfraquece a hierarquia e aproxima a interface de um estado permanente de alerta.

## 8. Linguagem visual

### Deve transmitir

- continuidade;
- acordo entre profissionais;
- confiança verificável;
- rapidez com responsabilidade;
- tecnologia acessível;
- segurança incorporada à experiência.

### Deve evitar

- cruz vermelha, estetoscópio e demais clichês hospitalares;
- branco clínico frio como base predominante;
- azul genérico de operadora ou plano de saúde;
- verde-menta associado a aplicativos de wellness;
- balança da justiça, martelo, coluna clássica e serifas de cartório;
- cadeado, escudo ou check usados de forma literal e isolada;
- aparência bancária, governamental ou excessivamente institucional;
- excesso de elementos decorativos que prejudiquem clareza e velocidade.

## 9. Acessibilidade e validação

Antes da implementação definitiva, todas as combinações devem ser testadas conforme as diretrizes **WCAG 2.2** aplicáveis ao produto.

Critérios mínimos:

- contraste adequado para textos, ícones e componentes interativos;
- tamanho e espaçamento compatíveis com uso móvel;
- foco visível para navegação por teclado;
- rótulos independentes de cor e posição;
- compreensão dos estados críticos por texto e ícone;
- teste do símbolo em `16 px`, `24 px`, `32 px`, `48 px` e tamanhos de loja de aplicativos;
- validação da interface em condições de brilho reduzido e dark mode.

## 10. Tokens iniciais para implementação

```css
:root {
  --color-brand-primary: #0f5c56;
  --color-brand-dark: #0a3b37;
  --color-accent-action: #f2994a;
  --color-surface-base: #f7f5f0;
  --color-text-primary: #2b2a28;

  --font-display: "Poppins", sans-serif;
  --font-ui: "Inter", sans-serif;
}

.numeric-data {
  font-variant-numeric: tabular-nums;
}
```

Estes tokens são uma base semântica inicial. A implementação deverá expandi-los para contemplar superfícies, bordas, textos secundários, estados interativos e cores semânticas.

## 11. Entregáveis da etapa de produção

Para transformar esta direção em identidade final, ainda deverão ser produzidos:

- símbolo reconstruído em vetor e ajustado por grade geométrica;
- wordmark com kerning revisado;
- assinaturas horizontal, vertical e símbolo isolado;
- versões positiva, negativa, monocromática e dark mode;
- arquivos `SVG`, `PDF`, `PNG` e ícones de aplicativo;
- especificação definitiva de área de proteção e tamanho mínimo;
- paleta expandida com testes de contraste;
- escala tipográfica e tokens completos do design system;
- biblioteca inicial de componentes mobile;
- guia de usos incorretos;
- validação do ícone em `32 × 32 px` e em dispositivos reais.

## 12. Referência visual

A prancha conceitual que originou esta especificação está disponível em:

[`../generated_images/exec-24996e39-05a8-4b99-aa60-c6dd9e32b33d.png`](../generated_images/exec-24996e39-05a8-4b99-aa60-c6dd9e32b33d.png)

Ela deve ser tratada como **direção visual**, não como arquivo final de marca. O símbolo e o wordmark precisam ser reconstruídos e validados em vetor antes do uso em produção.

## 13. Status da decisão

| Item | Estado |
|---|---|
| Posicionamento visual | Definido |
| Conceito “passagem segura” | Definido |
| Paleta principal | Definida |
| Famílias tipográficas | Propostas para adoção |
| Direção do símbolo | Definida |
| Desenho vetorial final | Pendente |
| Paleta expandida e contrastes | Pendente |
| Design system de interface | Pendente |
| Pacote final de marca | Pendente |

---

**Versão:** 1.0  
**Data:** 6 de agosto de 2026  
**Projeto:** Repassafe
