# SEO do Repassafe

Início: 16/11/2026. Domínio canônico: `https://www.repassafe.com.br` (o domínio
sem `www` redireciona com 308).

## Diagnóstico antes da etapa 1

- `robots.txt` e `sitemap.xml` respondiam 404.
- Todas as páginas repetiam o mesmo título e a mesma descrição.
- Sem URL canônica, sem Open Graph e sem imagem de prévia: links no WhatsApp e
  em redes sociais saíam sem imagem.
- Telas autenticadas (`/plantoes`, `/historico`, `/grupos`) respondiam 200 sem
  `noindex` e podiam ser indexadas com a tela de login.

## Público e termos de busca

Médicos que precisam repassar ou assumir plantões, hoje resolvidos em grupos de
WhatsApp. Termos principais, na forma usada pelos médicos:

- repasse de plantão médico, repassar plantão;
- substituto de plantão, substituição de plantão;
- troca de plantão médico (secundário: o produto faz repasse, não permuta);
- plantão médico com CRM verificado (diferencial).

Evitar "passagem de plantão": o termo descreve a passagem de casos de
pacientes entre equipes, fora do escopo e da regra de não tratar dados de
pacientes.

## Etapa 1 — fundação técnica (esta entrega)

- Indexação negada por padrão no layout raiz; só as páginas públicas liberam
  (`publicPageMetadata` em `src/lib/seo.ts`): `/`, `/lista-de-espera`,
  `/cadastro`, `/entrar`, `/suporte`, `/termos`, `/privacidade`. Tela nova
  fica fora dos buscadores até ser incluída em `indexablePaths`.
- Título com modelo `%s | Repassafe`, descrição própria, URL canônica absoluta
  e Open Graph por página pública.
- `robots.txt` com o sitemap e bloqueio de `/api/`, `/auth/`, `/admin` e
  `/dev/`. As telas autenticadas continuam rastreáveis para que o `noindex`
  delas seja lido.
- `sitemap.xml` com as páginas públicas; só termos e privacidade levam data de
  alteração (versão dos documentos legais).
- Imagem de prévia 1200×630 gerada em `src/app/opengraph-image.tsx` com logo,
  cores e fontes da identidade v2.1.
- Dados estruturados `Organization` e `WebSite` na página inicial.
- Texto da página inicial com "médico com CRM verificado" e "repasse de
  plantões médicos".

Decisões:

- A origem canônica é fixa: a produção é uma build de Preview promovida, então
  nem `VERCEL_ENV` nem `NEXT_PUBLIC_APP_URL` da build identificam o domínio
  servido. A Vercel já envia `X-Robots-Tag: noindex` nas URLs de Preview.
- Sem `SoftwareApplication`, preço, avaliações ou depoimentos nos dados
  estruturados: não há dados confirmados (ver `PRODUCT.md`).

## Para o responsável

1. Google Search Console: adicionar a propriedade de domínio
   `repassafe.com.br` (verificação por registro TXT no DNS), enviar
   `https://www.repassafe.com.br/sitemap.xml` e pedir indexação da página
   inicial.
2. Bing Webmaster Tools: importar a propriedade do Search Console.
3. Perfis públicos do Repassafe (Instagram e outros) podem entrar em `sameAs`
   da `Organization` quando o endereço oficial for confirmado.

## Próximas etapas

- Conteúdo: seção de perguntas frequentes na página inicial e páginas sobre
  como repassar um plantão com segurança, responsabilidades do titular e do
  substituto e registro do acordo, com fontes do CFM e dos CRMs.
- Página local para o piloto (São Luís), quando a divulgação for aberta.
- Medir no Search Console consultas, cliques e páginas indexadas e revisar os
  títulos com base nesses dados.
