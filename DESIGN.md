---
name: Repassafe
description: Identidade v2.1 para publicar, escolher e registrar repasses de plantão médico.
colors:
  ink: "#0E2A3B"
  ink-2: "#173B50"
  teal: "#0F7C78"
  teal-dark: "#0B5E5B"
  mint: "#8EE0CC"
  mist: "#D9F1EC"
  base: "#F6F8F7"
  white: "#FFFFFF"
  light: "#E9F5F2"
  amber: "#F2B544"
  text-body: "#1E3A47"
  text-secondary: "#33454F"
  text-muted: "#4A5B66"
  text-on-dark-muted: "#B9C7CF"
  border: "#DCE3E1"
  divider: "#EDF1F0"
  track: "#E3EAE8"
  neutral-100: "#F1F4F3"
  neutral-200: "#E3E9EE"
  disabled: "#C9D4D1"
  status-pending-bg: "#FCEBC7"
  status-pending-fg: "#6E4300"
  status-pending-dot: "#D99A1E"
  status-institutional-dot: "#5E7383"
  status-cancelled-bg: "#FBE3E1"
  status-cancelled-fg: "#8E2A22"
  status-cancelled-dot: "#C2453A"
  status-empty-dot: "#9AAAB3"
typography:
  display:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: "52px"
    letterSpacing: "-0.03em"
  h1:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: "31px"
    letterSpacing: "-0.02em"
  h1-sm:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: "28px"
    letterSpacing: "-0.02em"
  h2:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "24px"
    letterSpacing: "-0.01em"
  card-title:
    fontFamily: "Sora, ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: "22px"
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  body-sm:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "21px"
  label:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "18px"
  caption:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"
  micro:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
  button:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "20px"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "20px"
  eyebrow:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0.06em"
rounded:
  xs: "7px"
  sm: "11px"
  md: "14px"
  lg: "16px"
  xl: "20px"
  2xl: "28px"
  pill: "999px"
  icon: "12px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  3h: "14px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "7": "28px"
  "8": "32px"
  gutter: "20px"
  card-padding: "16px"
  stack-gap: "14px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: "52px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: "52px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.teal-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: "44px"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    height: "52px"
  button-disabled:
    backgroundColor: "{colors.disabled}"
    textColor: "{colors.white}"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "50px"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.xl}"
    padding: "16px"
  status-chip:
    typography: "{typography.micro}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"
  filter-chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    height: "38px"
  fab:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "18px"
    height: "56px"
---

# Design System: Repassafe

A especificação normativa está em `design/DESIGN.md` (marca, tokens, componentes,
acessibilidade, microcopy) e `design/SCREENS.md` (telas S01–S11, navegação,
estados). Referências visuais em `design/screens/png/` e medidas em
`design/screens/html/`. Este arquivo resume essas regras no formato lido pelas
ferramentas de design; em caso de divergência, vale `design/`.

## Overview

**Creative North Star: "Repasse sereno e registrado"**

Plataforma privada para publicar, escolher e registrar repasses de plantão. A
interface fala como um colega organizado no fim de um plantão: clara, precisa,
serena. A segurança aparece no que o app faz (CRM verificado, condições
confirmadas pelos dois, registro imutável), não em termos técnicos.

**Key Characteristics:**

- Fundo Base em todas as telas, cartões brancos sem borda nem sombra.
- Verde-repasse como única cor de ação primária; Tinta para texto e fundos escuros.
- Mono apenas para dados de registro, comunicando o que é imutável.
- Layout de app em coluna de 390 (360–430), gutter 20, rodapé com ação primária.

## Colors

Proporção visual alvo: Base 55% · Tinta 20% · Verde 15% · Menta 7% · Âmbar 3%.

- **Tinta** (`ink`): texto principal, títulos, cabeçalhos escuros, FAB e contorno do botão secundário.
- **Verde-repasse** (`teal`): botões primários, ícones ativos, toggles, progresso. Sobre branco ou Névoa, texto verde usa `teal-dark`.
- **Menta** e **Névoa** (`mint`, `mist`): destaques sobre escuro; fundos de banners, tiles e chips positivos.
- **Âmbar** (`amber`): somente indicador de atenção, nunca cor de texto. O badge de notificação usa `status-pending-dot`.
- **Status**: sempre cor + texto + ponto, pela tabela de `design/DESIGN.md` §3. Os enums do domínio são mapeados na apresentação, sem renomear estados.

**The Texto mínimo Rule.** Nenhum texto mais claro que `text-muted` (#4A5B66, 7.0:1 sobre branco).

## Typography

**Display Font:** Sora (títulos de tela, seção e cartão).
**Body Font:** Figtree (texto, rótulos, botões, chips).
**Mono Font:** JetBrains Mono, exclusiva de dados de registro (RPS/ID, sha256, carimbos de auditoria) e eyebrows de agrupamento.

As três famílias são servidas pela aplicação a partir de `@fontsource` (Sora 600/700, Figtree 400–700, JetBrains Mono 400), sem chamada a terceiros, compatível com a CSP `font-src 'self'`.

## Layout

Referência 390 × 844, fluido de 360 a 430. Padding lateral 20, espaço entre blocos 12–14, padding de cartão 16 (14 em listas densas). Estrutura de tela: top bar (voltar 44 em círculo branco + título Sora 22, ou logo + sino nas telas raiz), conteúdo com rolagem, rodapé fixo com botão primário de largura total e tab bar nas telas raiz (Plantões · Publicar · Acordos · Perfil). No desktop, fluxos de app em coluna de no máximo 480; painéis administrativos podem usar grid de 12 colunas com max-width 1200.

## Elevation & Depth

A separação é por cor, não por sombra. A única sombra é `--rs-shadow-fab` (botão flutuante e superfícies sobrepostas, como menus). Cartão selecionado usa anel de 2px Verde; foco usa `--rs-focus-ring` com contorno Verde.

## Shapes

Botões e campos raio 14; cartões 20; banners 16; chips e filtros em pílula; tiles de ícone 12 (40px) ou 14 (44–46px). O símbolo da marca são dois blocos quadrados arredondados em diagonal; nunca círculos, nunca alinhados na horizontal.

## Components

Button (primary, secondary, ghost, dark; 52 no rodapé, 44 em cartão), IconButton, StatusChip, FilterChip, ShiftCard, TextField/Select/TextArea, SearchField, SegmentedControl, InfoBanner, CandidateCard, KeyValueList, InfoTile, ProgressSteps, StepList, AuditTrail, RegistrySeal, NotificationItem, Toggle, FAB, TabBar e EmptyState, conforme `design/DESIGN.md` §6. Ícones Lucide de traço 2. Logo e ícones de app só a partir de `design/assets/` (servidos em `public/brand/` e `src/app/`).

## Do's and Don'ts

### Do:

- **Do** usar exclusivamente os tokens `--rs-*` (`src/styles/tokens.css`) ou `src/styles/theme.ts`.
- **Do** exibir status com rótulo textual, alvos de toque de 44 ou mais, foco visível e suporte a fonte em 130%.
- **Do** usar as frases fixas de `design/DESIGN.md` §8 (dados de pacientes, pagamento, concordância, sucesso).

### Don't:

- **Don't** usar hex, fonte ou raio fora dos tokens, nem fontes além de Sora, Figtree e JetBrains Mono.
- **Don't** redesenhar o símbolo, recriar o wordmark com fonte, aplicar gradiente ou sombra à marca.
- **Don't** sugerir dados de pacientes, intermediar pagamento ou exibir ação de edição em acordo registrado.
- **Don't** usar emoji, exclamações ou urgência artificial na interface.
