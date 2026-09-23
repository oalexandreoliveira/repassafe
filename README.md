# Repassafe

MVP em construção do Repassafe. A fundação técnica, identidade, administração e o fluxo central de repasse estão implementados.

## Execução local

Requer Node.js 22 e pnpm 11. Copie `.env.example` para `.env.local`, use credenciais de um projeto Supabase não produtivo e execute `pnpm install` e `pnpm dev`.

## Validação

`pnpm check` executa formato, tipos, lint, testes, limites de escopo, detecção básica de segredos e build. `pnpm test:e2e` executa Playwright após instalar o navegador. Migrations e testes de RLS ficam em `supabase/`.

## Ambientes

Desenvolvimento, homologação e produção usam projetos Supabase, variáveis e destinos Vercel separados. Produção deve ser promovida manualmente após aprovação.

Os runbooks estão em `docs/operations`, a estratégia de segurança em `docs/security` e os ADRs em `docs/adr`.

O fluxo de configuração, bootstrap e revogação administrativa está em
[`docs/operations/access-administration.md`](docs/operations/access-administration.md).

O fluxo transacional de publicação, candidatura, seleção, aprovação e acordo está
em [`docs/operations/core-shift-flow.md`](docs/operations/core-shift-flow.md).

## Escopo do MVP

O recorte executivo, as histórias bloqueadoras, os itens adiados e os critérios
de lançamento estão em [`docs/product/mvp-scope-v1.md`](docs/product/mvp-scope-v1.md).
