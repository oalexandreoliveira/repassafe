# Documentação do sistema visual — 2026-09-29

Atualização de DESIGN.md e .impeccable/design.json em scan mode, conforme o documenter e reference/document.md. Preservados paleta verde/clara, norte descritivo Clareza operacional, controles arredondados e guardrails existentes. Não há nova identidade nem seed.

Evidência: src/app/layout.tsx e package.json carregam Urbanist Variable e Plus Jakarta Sans Variable 5.3.0 localmente; src/app/globals.css atribui títulos/corpo, hover operacional, foco, navegação administrativa, breakpoints e pares de dados. src/app/page.module.css fundamenta display e estados públicos. src/components/mobile-navigation.tsx fundamenta hidden, Escape e aria-expanded; admin-navigation.tsx fundamenta sete áreas e aria-current. src/app/admin/cadastros/page.tsx fundamenta filtros, paginação, detalhes recolhíveis e ordem de domínio. PRODUCT.md e design-implementation-2026-09-29.md mantêm autoridade do produto/direção.

Corrigidas declarações desatualizadas de ausência de carregamento de fontes e hover; snippets do sidecar usam os aliases atuais e registram a navegação administrativa e o registro recolhível. Narrativa compartilhada sincronizada com DESIGN.md.

Verificação: JSON parseado; schemaVersion 2, sete snippets, referências de componentes e ordem das oito seções conferidas. Frontmatter inspecionado; parser YAML dedicado não está instalado. Não foram rerodados testes funcionais nem inspeção visual nesta etapa documental; a revisão final e capturas atualizadas pertencem ao agente principal.

Não canonizados: eyebrows decorativos e fallback tipográfico permanecem recusas herdadas, não regras para novas superfícies. Não foram inventados tonal ramps como tokens de produção nem alterado código da aplicação.
