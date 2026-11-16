# Publicação do SEO, etapa 1

Data: 16/11/2026, manhã (horário de Fortaleza).
Estratégia e próximos passos: [seo.md](../product/seo.md).

## O que foi publicado

- Commit `1d18bc8` da `main` (PR #46): `robots.txt`, `sitemap.xml`,
  indexação negada por padrão com liberação nas sete páginas públicas,
  títulos, descrições, URLs canônicas e Open Graph por página, imagem de
  prévia 1200×630, dados estruturados `Organization` e `WebSite` na página
  inicial e texto da página inicial com "médico com CRM verificado".
- Supabase `gfcbnfzyucggdwjtybnm`: sem migration nesta entrega.
- Vercel: o build de Preview `repassafe-staging-hr0c8nttk` (commit `1d18bc8`)
  foi promovido e gerou o deploy de produção `repassafe-staging-d2rzsuhri`,
  que serve `www.repassafe.com.br`. Retorno disponível:
  `repassafe-staging-i76gu4088` (commit `61b4982`).
- Documentos legais: sem nova versão.

## Antes

- CI do #46 aprovado: `validate`, `e2e`, `database` e build da Vercel.

## Verificação em produção

- `/robots.txt` 200 com o sitemap e os bloqueios de `/api/`, `/auth/`,
  `/admin` e `/dev/`; `/sitemap.xml` 200 com 7 URLs; `/opengraph-image` 200
  (PNG, 70 KB).
- Página inicial: título "Repasse de plantão médico com CRM verificado |
  Repassafe", `index, follow`, canônica `https://www.repassafe.com.br`,
  imagem de prévia e JSON-LD presentes.
- `/entrar`: `index, follow` e canônica própria. `/historico`: `noindex,
  nofollow`.
- `/api/health` 200, `/api/ready` 401 sem token, `/termos`, `/privacidade` e
  `/lista-de-espera` 200; `/painel` e `/agenda` sem sessão levam a `/entrar`.
- O domínio de produção não envia `X-Robots-Tag`; a URL de Preview envia
  `noindex` e fica atrás do login da Vercel.

## Limites

- Sem teste autenticado em produção: a mudança não altera fluxos logados além
  dos títulos das telas da agenda.
- Indexação e cadastro no Google Search Console dependem do responsável (ver
  `seo.md`).
