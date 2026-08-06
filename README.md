# Repassafe

Fundação técnica da beta privada do Repassafe. A Sprint 0 não implementa publicação, candidatura ou confirmação de plantões.

## Execução local

Requer Node.js 22 e pnpm 11. Copie `.env.example` para `.env.local`, use credenciais de um projeto Supabase não produtivo e execute `pnpm install` e `pnpm dev`.

## Validação

`pnpm check` executa tipos, lint, testes e build. `pnpm test:e2e` executa Playwright após instalar o navegador. Migrations e testes de RLS ficam em `supabase/`.

## Ambientes

Desenvolvimento, homologação e produção usam projetos Supabase, variáveis e destinos Vercel separados. Produção deve ser promovida manualmente após aprovação.
