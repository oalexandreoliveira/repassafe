# Hero e landing: implementação

Modo Persuade. Público: profissionais conhecendo o Repassafe. Ação confirmada: criar conta. O usuário autorizou simplificar a imagem para telefone e processo e usar delight, typeset, animate e extract, com inspiração em https://jusratio.com.br/.

## Direction contract

THESIS: aproximar o visitante da criação de conta mostrando como o plantão se torna um acordo rastreável.

OWN-WORLD: verde profundo, fundo claro, Urbanist nos títulos, Jakarta no corpo, controles arredondados e foco visível do Repassafe.

STORY: o profissional reconhece a tarefa, entende a verificação separada do acesso institucional e explora cinco etapas antes de criar sua conta.

FIRST VIEWPORT: texto e ação à esquerda, telefone ilustrativo à direita e demonstração acessível do processo junto à imagem. No celular, ações vêm antes do telefone, sem recortes laterais; etapas seguem no fluxo normal.

FORM: refinamento do sistema existente, execução em código, sem nova identidade, seed ou comp de página. A referência externa informa princípios de hierarquia, conversão consistente e demonstração de mecanismo; não é uma composição a reproduzir pixel a pixel.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Extract da referência

Observado no JusRatio via navegador e conteúdo público: título de grande contraste, CTA de aquisição recorrente, demonstração do mecanismo ao lado da promessa e controles para explorar exemplos. Aproveitados esses princípios, mantendo fontes, paleta, linguagem e conteúdo do Repassafe. Textos, dados, marca, ativos e código do site de referência não foram incorporados.

Extração local: LandingSignupLink centraliza destino, rótulo e seta nos três pontos de aquisição (cabeçalho, hero e fechamento). Tokens locais de corpo/metadados, duração de feedback e chegada e easing evitam valores divergentes no novo conjunto. A sequência de domínio alimenta demonstração e explicação completa. Não se criou biblioteca genérica para elementos de uso único.

## Typeset

Duas avaliações isoladas antecederam a implementação. A: família e hierarquia coerentes, mas título móvel grande e escalas secundárias fragmentadas. B: 23 avisos consultivos design-system-font-size no CSS, decorrentes da escala estruturada incompleta; não são defeitos demonstrados. Mantidas fontes locais variáveis com swap. Hero móvel clamp(2.375rem,10vw,2.75rem)/1.06 e tracking -.035em; corpo 1rem/1.6, metadados .875rem/1.5. Lead limitado a 52ch. Verificação em 320,390,768,1440px e ampliação200%.

## Delight e animate

Tese: dar confiança ao revelar a relação entre publicação, candidatura, confirmação, aprovação condicional e acordo. A interação escolhida traça a conexão entre etapas em 600ms, seguida do traço de confirmação ao escolher acordo. Não há autoplay, espera artificial ou loops. Conteúdo inicial já visível no HTML. Teclado usa setas/Home/End; controles são tabs com painel identificado. Movimento reduzido mantém estado e cor, retirando traçado animado e deslocamentos.

## QUALITY BAR

Cadastro como ação principal nos três pontos, aprovação condicional explícita, imagem identificada como ilustrativa, ausência de recorte ou rolagem horizontal, controles utilizáveis com teclado/toque, conteúdo visível sem efeitos, fontes locais e raster com alpha/proveniência. Capturas reais, checks de tipos/lint/build e E2E do caminho alterado.

## Evidência da implementação

Build de produção, tipos, lint, formatação e 47 testes unitários aprovados. Playwright: 9 cenários públicos aprovados; os 2 cenários que exigem contas sintéticas e banco local foram pulados nesta rodada, cujo escopo é a landing. O novo cenário cobre destinos dos CTAs, setas/Home/End, aprovação condicional, 320/390/768/1440px, ampliação200%, limites da imagem e preferência de movimento reduzido.

Capturas locais em .impeccable/review/hero-{desktop,tablet,mobile,narrow,reduced-motion}.png e landing-{desktop,mobile}.png, geradas a partir do build de produção sem overlays do ambiente de desenvolvimento. A primeira inspeção revelou sobreposição da legenda no desktop; corrigida antes dessas capturas finais.

Scan tipográfico final:19 avisos consultivos design-system-font-size, sem outros tipos. Os avisos remanescentes comparam papéis locais explícitos e valores legados com a escala global incompleta; a revisão visual e os testes de responsividade complementam esse resultado. Nenhum scan geral adicional foi executado.

Imagem nova: public/repassafe-hero-phone.png,1024×1536, alpha real,1.42MB no arquivo fonte; entregue pela otimização de imagens do Next. Edição pela ferramenta nativa imagegen a partir de public/repassafe-hero.png; prompt exato em hero-image-prompt-2026-09-30.txt e nos metadados PNG. A arte original foi preservada com origem registrada. Scan public:2 rasters,0 sem proveniência.
