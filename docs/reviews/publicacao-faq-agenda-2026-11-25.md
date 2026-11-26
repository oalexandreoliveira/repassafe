# Publicação da pergunta "Já uso um app de agenda de plantões"

Data: 25/11/2026, noite (horário de Fortaleza).
Origem: objeção relatada por usuários de um aplicativo de agenda de plantões.
Estratégia de SEO: [seo.md](../product/seo.md).

## O que foi publicado

- Commit `edbbf06` da `main` (PR #53): nova pergunta no FAQ da página
  inicial, logo depois de "O que é o Repassafe?": "Já uso um app de agenda de
  plantões. Preciso do Repassafe?". O JSON-LD `FAQPage` acompanha, gerado do
  mesmo texto.
- A resposta concorda que a agenda é essencial, lembra que o Repassafe tem uma
  e explica o que ele acrescenta: aceite das duas partes, data-limite de
  pagamento e registro sem edição. Nenhum aplicativo é citado.
- `PRODUCT.md` passou a registrar a agenda pessoal e as regras de pagamento do
  acordo registrado, já publicadas antes desta entrega, porque o FAQ só usa
  fatos que constam ali.
- Supabase `gfcbnfzyucggdwjtybnm`: sem migration nesta entrega.
- Vercel: o build de Preview `repassafe-staging-ifktnka0e` (commit `edbbf06`) foi promovido e
  gerou o deploy de produção `repassafe-staging-7tunqrdi4`, que serve `www.repassafe.com.br`.
  Retorno disponível: `repassafe-staging-hmj4rkl9l` (deploy anterior).
- Documentos legais: sem nova versão.

## Antes

- CI do #53: ``validate`, `e2e` (inclui abrir uma pergunta e seguir para o guia), `database` e build da Vercel aprovados`.
- Localmente: `format:check`, `typecheck`, `lint`, `check:scope`,
  `check:scope:mvp`, `check:security`, `check:operations` e `build`; 307
  testes do `vitest` com `--testTimeout=30000` (sem o prazo maior, a máquina
  carregada estoura 5 s em testes de tela não relacionados).
- Build de produção no navegador, em 1440 px e 375 px: sem rolagem horizontal,
  pergunta aberta pelo teclado com foco visível, sem erros no console.

## Verificação em produção

- Página inicial: a pergunta aparece na seção `#perguntas` e no JSON-LD
  `FAQPage`, com o texto completo da resposta.
- `/`, `/repasse-de-plantao`, `/entrar`, `/lista-de-espera`, `/sitemap.xml`,
  `/robots.txt`, `/opengraph-image` e `/api/health` 200; `/api/ready` 401 sem
  token; `/painel` sem sessão leva a `/entrar`.
- Banco: `db push --linked --dry-run` confirmou que não havia migration
  pendente.

## Peças de divulgação

O carrossel, os stories e o guia de respostas da mesma objeção ficam em
`conteudo/objecao-agenda-basta-2026-11/`, fora do Git, como as campanhas
anteriores.

## Limites

- A mudança não altera telas autenticadas nem o banco; sem teste autenticado
  em produção.
