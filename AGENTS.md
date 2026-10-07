<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Design e cadastro

Em cada novo desenvolvimento de interface, use a skill Impeccable e aplique os
apontamentos de `docs/reviews/design-audit-critique-2026-09-29.md` ao escopo alterado.
Siga a identidade v2.1 definida em `design/` (resumo abaixo); verifique contraste,
erros por campo, teclado, estados e composição em desktop e celular. Não substituir
validação funcional por inspeção visual. Siga
`docs/product/registration-full-spec-review.md` para o cadastro completo,
preservando a independência entre identidade, habilitação profissional,
autorizações institucionais e concessões administrativas.

## Design system Repassafe (obrigatório para qualquer UI)

- Especificação completa: `design/DESIGN.md` e `design/SCREENS.md`. Referências visuais: `design/screens/png/`.
- Tokens são a única fonte de cores, fontes, raios e espaçamentos (`design/tokens/`, servidos em `src/styles/tokens.css` e `src/styles/theme.ts`). Proibido hex, fonte ou raio hardcoded.
- Fontes: Sora (títulos), Figtree (texto/UI), JetBrains Mono (apenas dados de registro: RPS, hash, carimbos de auditoria, eyebrows).
- Ação primária sempre Verde-repasse `--rs-teal` (#0F7C78). Fundo de tela `--rs-base`, cartões brancos sem sombra, raio 20. Botões/inputs raio 14, altura 52/50. Gutter 20.
- Status sempre com rótulo textual + cor da tabela de status (DESIGN.md §3).
- Logo e ícones do app só a partir de `design/assets/` — nunca redesenhar o símbolo (dois blocos quadrados arredondados em diagonal; nunca círculos).
- Produto: sem dados de pacientes (aviso fixo em campos livres), sem intermediação de pagamento (frase fixa), acordo registrado é imutável (sem ações de edição), médicos exibidos com "CRM verificado".
- Microcopy PT-BR: claro, preciso, sereno; verbos nos botões; sem exclamações; sem emoji.
- Acessibilidade: alvos ≥ 44, contraste AA, rótulos em botões de ícone, foco visível, reduzir movimento.
