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
  headline:
    fontFamily: 'Urbanist, "Plus Jakarta Sans", system-ui, sans-serif'
    fontSize: "clamp(1.8rem, 4vw, 2.7rem)"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontSize: "1.4rem"
    fontWeight: 700
  body:
    fontFamily: 'Urbanist, "Plus Jakarta Sans", system-ui, sans-serif'
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

Este registro captura uma extensão da identidade existente. A ausência de DESIGN.md anterior não autoriza substituir o mundo visual. A composição específica do cadastro pertence ao seu contrato de direção, não vira obrigação para todas as páginas.

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

**Body Font:** Urbanist, Plus Jakarta Sans e fallback system-ui/sans-serif declarados nos dois aliases existentes, --font-inter e --font-poppins. Os nomes dos aliases não significam que Inter ou Poppins sejam carregados.

Não foi encontrado carregamento de Urbanist/Plus Jakarta Sans por @font-face ou next/font no escopo. As capturas podem usar uma fonte local ou fallback; não estabelecem uma nova família de marca. O fallback efetivo é uma limitação observada, não uma decisão de display a perpetuar.

### Hierarchy
- **Headline:** títulos de cadastro, autenticação e documentos, conforme frontmatter. Autenticação possui line-height posterior de 1.1.
- **Title:** títulos de seções do cadastro/documentos, conforme frontmatter.
- **Body:** família herdada; cadastro e documentos usam line-height 1.6. Tamanho de body não foi fixado pelo CSS global.
- **Label:** peso 650 nos rótulos de form-stack/form-grid; legendas usam 700.
- **Field error:** texto de erro localizado usa 0.9rem.

## Layout

A página usa padding horizontal fluido clamp(1rem, 5vw, 5rem), com 1.25rem vertical. Cadastro e documentos têm limite de 850px, incluindo esse padding pelo box-sizing global. Autenticação limita o cartão a 34rem. Dashboard limita o conteúdo a 84rem.

Campos agrupados usam colunas auto-fit com mínimo de 10rem e gap de 1rem. No cadastro, até 600px, form-row passa a uma coluna. Cartões reduzem padding e raio até 640px. Cabeçalhos flexíveis quebram linha, valores longos usam overflow-wrap. Seções do cadastro têm espaçamento vertical de 2rem e divisória inferior; não usam o cartão elevado como envoltório obrigatório.

## Elevation & Depth

O sistema combina fundo tonal e sombras difusas, sem deslocamentos rígidos. Cartões usam 0 1px 2px #14201f0a e 0 8px 24px #14201f0f; autenticação usa 0 20px 60px #0a3b3714. O cadastro observado permanece diretamente sobre o fundo claro.

## Shapes

Campos de uma linha e botões têm contorno de cápsula. Textareas têm raio de 1.5rem; cartões e autenticação são suavemente arredondados. Feedback e foto usam feedback no frontmatter. A imagem profissional é quadrada (128px), com object-fit cover, e não constitui decoração pública.

## Components

### Buttons
Ações legíveis, com altura mínima de 56px. Primary usa brand/white; secondary é transparente com brand-dark e borda brand. Foco visível tem outline de 3px, offset de 3px. Disabled usa opacity 0.65 e cursor wait. Não há variante de hover própria no CSS observado; não inventar token para ela.

### Cards / Containers
Cartões brancos têm borda fina e sombra difusa. Seus valores estão no frontmatter; no celular aplicam card-mobile e padding de 1.25rem. Cadastro organiza seções por divisórias, sem impor cards a cada grupo.

### Inputs / Fields
Campos brancos com borda border, altura mínima de 56px e família herdada. Foco visível usa outline de 3px e offset de 2px. aria-invalid em input/select altera a borda para error. Rótulo e mensagem localizada devem permanecer associados ao campo; registration, auth e suporte já exemplificam aria-describedby.

### Chips
Status são cápsulas de texto em negrito, padding de 0.4rem 0.75rem. Aprovado usa success; pendente/correção usa warning; rejeitado/suspenso usa error, cada um com seu fundo semântico.

### Navigation
Marca e navegação ficam em cabeçalho flexível que pode quebrar linha. Links permanecem textuais e usam o foco compartilhado. O monograma R observado é identidade textual, não licença para usar caracteres como ícones de ações.

### Feedback
Mensagens têm raio feedback e padding de 0.75rem, com alert para erros e status para resultados nas superfícies revisadas. Pending muda o texto da ação e desabilita seu botão. Esses estados não substituem validação funcional.

## Do's and Don'ts

### Do:
- **Do** preservar verde profundo, fundo claro e a família declarada existente.
- **Do** manter foco visível, mensagens por campo e resultados textuais nas ações.
- **Do** verificar composição e teclado no celular e desktop junto da validação funcional.

### Don't:
- **Don't** interpretar ausência de baseline como autorização para redesenhar a marca.
- **Don't** transformar o fallback de fonte ou uma foto quebrada em padrão visual.
- **Don't** propagar eyebrows decorativos encontrados fora do cadastro como regra do sistema.
