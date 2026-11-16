# Publicação do SEO, etapa 2 (conteúdo)

Data: 16/11/2026, tarde (horário de Fortaleza).
Estratégia e próximos passos: [seo.md](../product/seo.md).

## O que foi publicado

- Commit `65b9fc7` da `main` (PR #48): perguntas frequentes na página inicial
  (com JSON-LD `FAQPage` gerado do texto visível), guia
  `/repasse-de-plantao` ("Como repassar um plantão médico com segurança",
  com `Article` e `BreadcrumbList`), guia no sitemap e links internos no
  menu, no menu do celular e no rodapé.
- Fontes do guia conferidas nos documentos oficiais: Código de Ética Médica
  (Resolução CFM nº 2.217/2018, art. 9º e parágrafo único) e Parecer CRM-PR
  nº 2.882/2022.
- Supabase `gfcbnfzyucggdwjtybnm`: sem migration nesta entrega.
- Vercel: o build de Preview `repassafe-staging-ire0dvyji` (commit `65b9fc7`)
  foi promovido e gerou o deploy de produção `repassafe-staging-94135m3lr`,
  que serve `www.repassafe.com.br`. Retorno disponível:
  `repassafe-staging-d2rzsuhri` (commit `1d18bc8`).
- Documentos legais: sem nova versão.

## Antes

- CI do #48 aprovado: `validate`, `e2e` (inclui abrir uma pergunta e seguir
  para o guia), `database` e build da Vercel.
- Build de produção conferida localmente no desktop e em 375 px: sem rolagem
  horizontal, sem erros no console, pergunta abre pelo teclado com foco
  visível.

## Verificação em produção

- `/repasse-de-plantao` 200 com título "Como repassar um plantão médico com
  segurança | Repassafe", `index, follow`, canônica própria, `og:type`
  `article` e JSON-LD `Article` e `BreadcrumbList`.
- Página inicial: seção `#perguntas`, JSON-LD `FAQPage` e três links para o
  guia (FAQ, rodapé e menu do celular).
- `/sitemap.xml` com o guia e `lastmod` 2026-11-16; `/robots.txt` e
  `/opengraph-image` 200.
- `/api/health` 200, `/api/ready` 401 sem token, `/entrar` e
  `/lista-de-espera` 200; `/painel` sem sessão leva a `/entrar`.

## Limites

- A mudança não altera telas autenticadas nem o banco; sem teste autenticado
  em produção.
- O guia é informativo e diz isso na página; não houve revisão jurídica
  externa do texto.
