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
- src/app/termos/page.tsx, src/app/privacidade/page.tsx e src/app/admin/cadastros/page.tsx: revisão de fonte. Administração permanece sem evidência visual autenticada nesta passagem.
- .impeccable/review/registration-desktop.png (1440px) e registration-mobile.png (390px): novas capturas locais de cadastro sintético, examinadas após a correção da foto. Origem: tests/e2e/registration.spec.ts; PASS informado pelo responsável pela execução, incluindo imagem complete e naturalWidth maior que zero. O documenter não repetiu os testes funcionais.
- .impeccable/review/{cadastro,suporte,termos,privacidade}-{desktop,mobile}.png: novas capturas de tests/e2e/registration-surfaces.spec.ts, com PASS informado pelo responsável. Inspeção visual confirmou continuidade da paleta, controles e composição no celular e desktop.
- tests/e2e/registration-surfaces.spec.ts: fonte revisada; cobre ausência de overflow a 390px e com CSS zoom 200%, Tab entre e-mail, assunto e solicitação do suporte, além de redirecionamento não autenticado da rota de foto. Zoom CSS não equivale a auditoria completa de ampliação do navegador ou acessibilidade.
- src/app/cadastro/foto/route.ts: entrega autenticada da própria foto privada, cache-control private, no-store, sem publicar arquivo sintético.

## Resultado e limites

DESIGN.md descreve apenas regras duráveis observadas. A máquina lê primitives do frontmatter; o sidecar v2 contém sombras, breakpoints, snippets CSS sem Tailwind e narrativa correspondente. Não foram inventados hover, motion, tonal ramps ou componentes que alterem a identidade; rampas sintetizadas não são necessárias para uma referência fiel e não foram introduzidas como tokens de produto.

A stack Urbanist/Plus Jakarta Sans existe em ambos os aliases, mas não foi localizado @font-face/next/font. A fonte efetivamente renderizada não foi determinada por computed styles. Isso fica registrado como lacuna e não como autorização para canonizar system-ui como display.

As capturas atualizadas exibem o quadrado verde sintético de teste no lugar do indicador de imagem quebrada. O responsável identificou bloqueio CSP self da URL externa e corrigiu a entrega pela rota autenticada /cadastro/foto. O carregamento é sustentado pelo teste complete e naturalWidth maior que zero; o arquivo foi gerado por Sharp, não retrata profissional real e não é ativo publicado. ProfilePhoto conserva fallback textual onError em fonte; estas capturas demonstram o caminho de sucesso, não uma falha de rede forçada. A ocorrência anterior foi resolvida e não deve permanecer como alerta atual ou padrão visual.

Eyebrow decorativo encontrado no stylesheet fora do cadastro não foi promovido a padrão. Hover exclusivo não existe no CSS dos botões; os snippets refletem foco e disabled reais e não simulam comportamento inexistente. A documentação não certifica WCAG ou auditoria completa de teclado/zoom: a evidência funcional limita-se aos testes citados. Administração de cadastros permanece source-only; não há certificação de sua composição autenticada. Não foram determinados computed styles das famílias tipográficas nem realizadas medições de contraste nesta passagem.

## Resumo do sistema

Paleta: verde profundo, fundo claro quente e cores semânticas textuais.
Tipo: stack Urbanist/Plus Jakarta declarada; títulos responsivos e rótulos legíveis.
Forma: controles em cápsula, cartões suaves, cadastro separado por divisórias.
Espaço: 850px no cadastro/documentos e uma coluna de campos até 600px.
Regra: estado explícito combina cor, texto e orientação concreta.

