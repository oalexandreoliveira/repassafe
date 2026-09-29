# Documentação visual do cadastro — 29/09/2026

Passagem impeccable-documenter em scan mode, com write boundary restrito a DESIGN.md, .impeccable/design.json e este relatório. Nenhum código alterado. Não havia DESIGN.md ou sidecar anterior. O registro estabelece uma referência extraída, sem autorização ou execução de mudança de identidade.

## Fontes

- PRODUCT.md: compromisso de preservar verde profundo, fundo claro e tipografia vigente.
- docs/reviews/registration-direction-2026-09-29.md: extensão de mundo existente; direção específica do cadastro.
- docs/reviews/design-audit-critique-2026-09-29.md: orientação de estados, ajuda, contraste e independência de verificações.
- src/app/globals.css: propriedades de cor, stacks declaradas, espaços, raios, foco e breakpoints.
- src/app/layout.tsx: ausência de carregamento explícito de fonte no layout examinado.
- src/app/cadastro/completar/page.tsx e src/components/registration-form.tsx: seções, progresso, mensagens localizadas e ações.
- src/components/auth-form.tsx, registration-decision-form.tsx e support-form.tsx: padrões compartilhados e estados pendentes.
- src/app/termos/page.tsx, src/app/privacidade/page.tsx e src/app/admin/cadastros/page.tsx: revisão de fonte; não há evidência visual autenticada dessas superfícies nesta passagem.
- .impeccable/review/registration-desktop.png (1440px) e registration-mobile.png (390px): capturas locais de cadastro sintético, examinadas nesta passagem. O responsável pelos testes forneceu a origem em tests/e2e/registration.spec.ts; o documenter não repetiu testes funcionais.

## Resultado e limites

DESIGN.md descreve apenas regras duráveis observadas. A máquina lê primitives do frontmatter; o sidecar v2 contém sombras, breakpoints, snippets CSS sem Tailwind e narrativa correspondente. Não foram inventados hover, motion, tonal ramps ou componentes que alterem a identidade; rampas sintetizadas não são necessárias para uma referência fiel e não foram introduzidas como tokens de produto.

A stack Urbanist/Plus Jakarta Sans existe em ambos os aliases, mas não foi localizado @font-face/next/font. A fonte efetivamente renderizada não foi determinada por computed styles. Isso fica registrado como lacuna e não como autorização para canonizar system-ui como display.

Ambas as capturas inspecionadas mostram indicador de foto não carregada, portanto não comprovam carregamento nem fallback recuperável. No momento desta passagem a fonte já usa ProfilePhoto com fallback textual onError; existe defasagem entre essa fonte e as capturas fornecidas. Revalidar o comportamento e recapturar pertence ao responsável pela implementação. Nenhum valor ou regra foi criado para legitimar essa falha.

Eyebrow decorativo encontrado no stylesheet fora do cadastro não foi promovido a padrão. Hover exclusivo não existe no CSS dos botões; os snippets refletem foco e disabled reais e não simulam comportamento inexistente. A documentação não certifica WCAG, teclado, zoom ou funcionalidade das superfícies avaliadas apenas por fonte.

## Resumo do sistema

Paleta: verde profundo, fundo claro quente e cores semânticas textuais.
Tipo: stack Urbanist/Plus Jakarta declarada; títulos responsivos e rótulos legíveis.
Forma: controles em cápsula, cartões suaves, cadastro separado por divisórias.
Espaço: 850px no cadastro/documentos e uma coluna de campos até 600px.
Regra: estado explícito combina cor, texto e orientação concreta.
