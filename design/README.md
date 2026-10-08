# Repassafe — Pacote de handoff de design (v2.1)

Pacote para implementar a nova identidade visual e as telas aprovadas no código existente com o Claude Code.

## Como usar

1. Copie esta pasta para a raiz do repositório com o nome `design/`.
2. Abra o Claude Code no repositório.
3. Cole o prompt de `PROMPT-CLAUDE-CODE.md`.
4. Aprove fase a fase (diagnóstico → fundação → componentes → adaptação → novas telas → verificação).

## Conteúdo

| Caminho | O que é |
|---|---|
| `DESIGN.md` | Regras de marca, cores, tipografia, layout, componentes, acessibilidade e microcopy |
| `SCREENS.md` | Especificação das 11 telas aprovadas, mapa de navegação, estados e telas a derivar |
| `PROMPT-CLAUDE-CODE.md` | Prompt de partida, em fases, para o Claude Code |
| `CLAUDE.md.snippet` | Regras curtas para anexar ao `CLAUDE.md` do repositório |
| `tokens/tokens.css` | Variáveis CSS (`--rs-*`) |
| `tokens/tailwind.preset.js` | Preset Tailwind |
| `tokens/theme.ts` | Tema TypeScript (React Native/Expo ou ThemeProvider) |
| `tokens/design-tokens.json` | Tokens no formato W3C DTCG (Style Dictionary, Figma Tokens) |
| `screens/png/` | Referências visuais das telas (2×, base 390×844) |
| `screens/html/` | Referência estática de cada tela (medidas e textos exatos; não é código de produção) |
| `assets/logo/` | Logo em SVG: horizontal, vertical, símbolo, wordmark; cor, negativo, mono |
| `assets/icons-app/` | Ícones iOS, Android (adaptativo), web/favicon e avatar |

## Telas aprovadas

S01 Splash · S02 Mural de plantões · S03 Detalhe do plantão · S04 Candidatura enviada · S05 Publicar (1/2) · S06 Revisar e publicar (2/2) · S07 Meus plantões publicados · S08 Escolher substituto · S09 Confirmar condições · S10 Acordo registrado · S11 Notificações
