# Documentação do acabamento da landing — 30/09/2026

Disposition: documented. A revisão independente em `landing-hero-finish-2026-09-30.md` mantém disposition `ship`, sem correções materiais.

## Escopo

Atualização por leitura do artefato final, conforme `.github/agents/impeccable-documenter.agent.md` e `.github/skills/impeccable/reference/document.md`. Foram lidos `DESIGN.md`, `.impeccable/design.json`, `PRODUCT.md`, o contrato `.impeccable/surfaces/src-app-page-tsx.md`, a revisão final e os cinco arquivos da implementação: `src/app/page.tsx`, `src/app/page.module.css`, `src/components/repasse-preview.tsx`, `src/components/landing-signup-link.tsx` e `src/features/marketing/repasse-steps.ts`. O CSS global foi consultado para conferir o tratamento de foco.

A autoridade é o refinamento aprovado do mundo existente. Esta passagem sincroniza descrições locais desatualizadas e preserva o frontmatter, a paleta, as famílias tipográficas e os componentes operacionais. Nenhum token global foi criado a partir dos valores locais da landing.

## Registro sincronizado

- `DESIGN.md`: título móvel atual, ajustes locais do título desktop, largura de leitura e metadados; figura proporcional limitada ao espaço, legenda ilustrativa e composição responsiva; lista ordenada plana; três ações principais “Criar conta” com destino comum; tabs do processo, teclado, aprovação condicional e movimento por seleção.
- `.impeccable/design.json`: extensão de movimento público corrigida para 160ms e traçado local de 600ms, com preferência de movimento reduzido; amostra autocontida do CTA de aquisição com SVG inline, hover e foco. A narrativa existente permanece idêntica à narrativa correspondente de `DESIGN.md`.
- O telefone estático substitui a descrição antiga de flutuação. O processo não usa autoplay, e a preferência de movimento reduzido conserva seleção e texto.

## Validação e limites

JSON verificado por parsing e diff dos dois arquivos revisado; `git diff --check` limitado aos arquivos desta documentação. Nenhum código da aplicação ou imagem foi editado. Testes e detectores não foram reexecutados nesta passagem documental; a evidência funcional e visual permanece na revisão final e no contrato da superfície.

Os 19 avisos tipográficos consultivos recebidos refletem a escala global incompleta e valores locais/legados; não foram canonizados como novos tokens nem tratados como defeitos obrigatórios. Os ajustes do display da landing estão explicitamente documentados como locais, preservando o frontmatter incumbente. Drift preexistente de outras superfícies permanece fora do escopo.
