---
name: Repassafe
description: Sistema visual existente para repasses e cadastro com acesso controlado.
colors:
  brand: "#14403f"
  brand-dark: "#0e2e2d"
  accent: "#e9a23b"
  surface: "#f7f6f1"
  text: "#14201f"
  muted: "#586b69"
  border: "#e4e2d6"
  success: "#246746"
  warning: "#9a671f"
  error: "#b52732"
  focus: "#2a5f5c"
  white: "#ffffff"
  success-surface: "#dcfae6"
  warning-surface: "#fff3cd"
  error-surface: "#fee4e2"
typography:
  display:
    fontFamily: '"Urbanist Variable", system-ui, sans-serif'
    fontSize: "clamp(2.75rem, 5vw, 4.25rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.045em"
  headline:
    fontFamily: '"Urbanist Variable", system-ui, sans-serif'
    fontSize: "clamp(1.8rem, 4vw, 2.7rem)"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: '"Urbanist Variable", system-ui, sans-serif'
    fontSize: "1.4rem"
    fontWeight: 700
  body:
    fontFamily: '"Plus Jakarta Sans Variable", system-ui, sans-serif'
  label:
    fontWeight: 650
rounded:
  control: "999px"
  card: "1.75rem"
  card-mobile: "1.25rem"
  auth: "2.5rem"
  feedback: "0.5rem"
spacing:
  field-gap: "0.4rem"
  stack: "1rem"
  section: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "0.7rem 1.75rem"
    height: "56px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.brand-dark}"
    rounded: "{rounded.control}"
    padding: "0.7rem 1.75rem"
  button-primary-hover:
    backgroundColor: "{colors.brand-dark}"
    textColor: "{colors.white}"
  button-secondary-hover:
    backgroundColor: "{colors.brand-dark}"
    textColor: "{colors.white}"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0.7rem 0.8rem"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.card}"
    padding: "2rem"
---

# Design System: Repassafe

## Overview

**Creative North Star: "Clareza operacional"**

Nome descritivo do sistema observado, derivado do compromisso de clareza em PRODUCT.md e da direção aprovada; não representa uma nova escolha de marca. Verde profundo, fundo claro e controles suaves sustentam leitura e conclusão de tarefas em português.

Este registro captura uma extensão da identidade existente. Este registro atualiza as regras implementadas, preservando o mundo visual. A composição específica do cadastro pertence ao seu contrato de direção, não vira obrigação para todas as páginas.

**Key Characteristics:**

- Verde profundo em ações e identidade.
- Fundo claro, bordas discretas e campos brancos.
- Formulários com rótulos completos, mensagens e foco visível.

## Colors

Paleta de verde profundo com neutros quentes; cores semânticas distinguem resultado e espera.

### Primary

- **Verde institucional:** brand nas ações principais; brand-dark na marca e ações secundárias.

### Secondary

- **Âmbar:** accent em avisos de atualização; warning em estados pendentes. Não é uma segunda cor de ação principal.

### Neutral

- **Fundo claro:** surface no corpo; white nos campos e cartões.
- **Texto profundo e apoio:** text no conteúdo; muted na orientação.
- **Divisão suave:** border delimita campos, cartões e seções.

Success e error têm papéis semânticos, acompanhados de fundos próprios; focus identifica navegação por teclado.

**The Estado explícito Rule.** Cor acompanha texto de estado e orientação, sem substituir a mensagem.

## Typography

**Display Font:** Urbanist Variable, com fallback system-ui/sans-serif, no alias --font-heading.
**Body Font:** Plus Jakarta Sans Variable, com fallback system-ui/sans-serif, no alias --font-body.

As duas famílias variáveis são carregadas em layout.tsx por @fontsource-variable (versão 5.3.0), com arquivos WOFF2 locais servidos pela aplicação. Urbanist compõe títulos e marca; Plus Jakarta Sans compõe corpo, controles e orientação. Fallback existe para recuperação, não como voz de display.

### Hierarchy

- **Display:** título público conserva família, tamanho e peso do frontmatter; o hero usa ajuste local de line-height 1.04 e letter-spacing -0.04em. Até 640px, usa clamp(2.375rem, 10vw, 2.75rem), line-height 1.06 e letter-spacing -0.035em. A largura máxima é 17ch.
- **Headline:** títulos de cadastro, autenticação e documentos, conforme frontmatter. Autenticação possui line-height posterior de 1.1.
- **Title:** títulos de seções do cadastro/documentos, conforme frontmatter.
- **Body:** família herdada; cadastro e documentos usam line-height 1.6. Tamanho de body não foi fixado pelo CSS global.
- **Label:** peso 650 nos rótulos de form-stack/form-grid; legendas usam 700.
- **Field error:** texto de erro localizado usa 0.9rem.

Na landing, o texto de apresentação limita a leitura a 52ch, com tamanho de 1.125rem no desktop e 1rem até 640px, e line-height 1.6. Apoio cadastral usa 0.875rem/1.5; a identificação de dados fictícios usa 0.75rem/1.5. Esses ajustes são papéis locais da superfície, sem ampliar a escala global.

## Layout

A página usa padding horizontal fluido clamp(1rem, 5vw, 5rem), com 1.25rem vertical. Cadastro e documentos têm limite de 850px, incluindo esse padding pelo box-sizing global. Autenticação limita o cartão a 34rem. Dashboard limita o conteúdo a 84rem. Administração usa limite de 100rem e grade de 230px mais conteúdo flexível, com navegação lateral sticky; até 800px vira uma coluna com navegação em duas colunas. A página pública usa container de 1200px e grade de duas colunas que passa a uma até 960px.

No hero público, ações antecedem a demonstração na ordem de leitura. A janela reutiliza campos e cartão reais do produto, com recorte de 450px no desktop e 560px até 640px. Controles externos têm altura mínima de 44px; no celular as três etapas ocupam uma linha própria. A descrição reserva espaço para o texto mais longo, evitando deslocamento da página. A explicação completa mantém cinco etapas em lista plana, que passa a uma coluna até 960px. Essa composição pertence à landing.

Campos agrupados usam colunas auto-fit com mínimo de 10rem e gap de 1rem. No cadastro, até 600px, form-row passa a uma coluna. Cartões reduzem padding e raio até 640px. Cabeçalhos flexíveis quebram linha, valores longos usam overflow-wrap. Seções do cadastro têm espaçamento vertical de 2rem e divisória inferior; não usam o cartão elevado como envoltório obrigatório. Registros administrativos se abrem sob demanda; filtros ficam antes da lista, com paginação quando necessário. Detalhes de cadastro agrupam identificação/contato, atuação, vínculo declarado, resposta às correções e demais informações, em pares de rótulo/valor com grade adaptável de mínimo 15rem. O detalhe limita a leitura a 70ch.

## Elevation & Depth

O sistema combina fundo tonal e sombras difusas, sem deslocamentos rígidos. Cartões usam 0 1px 2px #14201f0a e 0 8px 24px #14201f0f; autenticação usa 0 20px 60px #0a3b3714. O cadastro observado permanece diretamente sobre o fundo claro.

O menu móvel usa sombra 0 12px 30px #14201f20. A janela da demonstração usa 0 20px 48px #14201f12. Na landing, ações usam feedback de fundo e sombra em 160ms; suas setas se deslocam 3px em hover, com cubic-bezier(0.16, 1, 0.3, 1). A demonstração executa uma sequência de 13 segundos sem loop, pausada fora da viewport ou em aba oculta. Prefers-reduced-motion mantém dados estáticos e etapas manuais, removendo também o deslocamento das setas. Esses parâmetros pertencem à landing; movimentos públicos não tornam animação obrigatória nas áreas operacionais.

## Shapes

Campos de uma linha e botões têm contorno de cápsula. Textareas têm raio de 1.5rem; cartões e autenticação são suavemente arredondados. Feedback e foto usam feedback no frontmatter. A imagem profissional é quadrada (128px), com object-fit cover, e não constitui decoração pública.

## Components

### Buttons

Ações operacionais legíveis, com altura mínima de 56px. A página pública usa ações de 52px e CTA de navegação de 48px. Primary usa brand/white; secondary é transparente com brand-dark e borda brand. Foco visível tem outline de 3px, offset de 3px. Disabled usa opacity 0.65 e cursor wait. Hover de ambas as variantes operacionais usa brand-dark/white quando habilitadas. A página pública usa focus como fundo de hover da ação principal, com sombra e deslocamento da seta; a secundária usa fundo verde claro. Esses estados públicos permanecem locais à página.

Os três pontos principais de aquisição da landing — cabeçalho, hero e fechamento — compartilham rótulo “Criar conta”, destino /cadastro e seta decorativa. Cabeçalho e hero usam brand/white; o fechamento inverte o contraste sobre o fundo verde. O componente compartilhado mantém texto e destino consistentes. Criar conta continua separado da verificação profissional e da autorização institucional explicadas junto à ação.

### Cards / Containers

Cartões brancos têm borda fina e sombra difusa. Seus valores estão no frontmatter; no celular aplicam card-mobile e padding de 1.25rem. Cadastro organiza seções por divisórias, sem impor cards a cada grupo.

### Inputs / Fields

Campos brancos com borda border, altura mínima de 56px e família herdada. Foco visível usa outline de 3px e offset de 2px. aria-invalid em input/select altera a borda para error. Rótulo e mensagem localizada devem permanecer associados ao campo; registration, auth e suporte já exemplificam aria-describedby.

### Chips

Status são cápsulas de texto em negrito, padding de 0.4rem 0.75rem. Aprovado usa success; pendente/correção usa warning; rejeitado/suspenso usa error, cada um com seu fundo semântico.

### Navigation

A página pública mantém links textuais no desktop e menu expansível até 960px; o botão informa aria-expanded e controla links ocultos com hidden, fecha ao navegar e devolve foco ao botão quando Escape o fecha. Administração oferece sete áreas persistentes: fila de cadastros, pessoas, instituições/grupos, operação, ocorrências, suporte/privacidade e auditoria. Links administrativos têm altura mínima de 48px, hover branco/brand e área atual brand/white com aria-current; até 800px formam uma grade de duas colunas. Foco segue o outline compartilhado. O monograma R observado é identidade textual, não licença para usar caracteres como ícones de ações.

### Feedback

Mensagens têm raio feedback e padding de 0.75rem, com alert para erros e status para resultados nas superfícies revisadas. Pending muda o texto da ação e desabilita seu botão. Esses estados não substituem validação funcional.

### Demonstração do repasse

A demonstração apresenta Preencher, Conferir e Publicado, reutilizando PublishShiftFields e ShiftOfferCard. Os controles de pausa, reprodução e repetição ficam fora do recorte. Clique, setas e Home/End selecionam etapas; apenas a tab selecionada entra na sequência de Tab. Foco nas etapas pausa a reprodução. O recorte visual é inert e aria-hidden; descrição e transcrição oferecem o equivalente textual. Dados fictícios são identificados explicitamente. Publicado significa oferta Aberto, não acordo confirmado. O formulário real conserva edição, validação e envio; o recorte demonstrativo não envia dados. Datas nativas usam width: 100% e min-width: 0 no componente compartilhado.

## Do's and Don'ts

### Do:

- **Do** preservar verde profundo, fundo claro e a dupla de fontes locais com papéis de corpo e títulos.
- **Do** manter foco visível, mensagens por campo e resultados textuais nas ações.
- **Do** verificar composição e teclado no celular e desktop junto da validação funcional.

### Don't:

- **Don't** interpretar ausência de baseline como autorização para redesenhar a marca.
- **Don't** transformar o fallback de fonte ou uma foto quebrada em padrão visual.
- **Don't** propagar eyebrows decorativos encontrados fora do cadastro como regra do sistema.
