# Landing e hero — Assessment A independente

Modo Persuade. Agente /root/hero_design_assessment. Alvo src/app/page.tsx, page.module.css e public/repassafe-hero.png; staging informado no commit a6e0b7b. Sem detector, sem alteração de produto. Li critique.md inteiro, PRODUCT.md, DESIGN.md, fonte e audit anterior. Inspecionei imagem original e landing em aba IAB própria heroATab: desktop default aproximadamente 1265×712 e mobile 390×844 após reload. Aba fechada e viewport reset. Screenshots em .impeccable/critique/landing-hero-desktop.jpg e landing-hero-mobile.jpg. A primeira captura desktop foi salva durante carregamento e pode mostrar só o halo; a inspeção desktop efetivamente viu imagem completa. Não exercitei cadastro, autenticação, leitor de tela ou navegação completa por teclado; notas não certificam acessibilidade.

## Especificidade e impressão

Especificidade moderada a boa no conteúdo, moderada na forma. Plantões, candidaturas, condições, decisão institucional e acordo preservado são próprios do produto. Verde profundo, fontes e ritmo tranquilos combinam com clareza operacional. O telefone inclinado, halos, cápsulas, cartões pastel e cartões flutuantes são uma composição SaaS bastante intercambiável. A oportunidade é fazer a imagem provar o processo real em vez de acrescentar uma segunda landing dentro da landing.

## Nielsen, 0–4

| # | Heurística | Nota | Evidência |
| --- | --- | --- | --- |
| 1 | Visibilidade do estado | n/a | Página informativa; estados assíncronos fora do escopo |
| 2 | Linguagem/mundo real | 3 | Linguagem do plantão; elegível e rede privada pedem contexto |
| 3 | Controle/liberdade | 3 | Links e âncoras permitem percurso livre; sem fluxo bloqueante |
| 4 | Consistência | 2 | Marca R na navegação e símbolo de pétalas na imagem; prioridade dos CTAs se inverte no fim |
| 5 | Prevenção de erros | 2 | Mockup sem identificação ilustrativa pode criar expectativas de funções/etapas |
| 6 | Reconhecimento | 3 | Ações nomeadas e etapas numeradas; conteúdo rasterizado pequeno |
| 7 | Flexibilidade/eficiência | n/a | Persuade, aceleradores operacionais não pertinentes |
| 8 | Minimalismo/estética | 2 | Texto promocional duplicado dentro da imagem e hero longo no celular |
| 9 | Recuperação de erros | n/a | Nenhuma submissão ou erro exercitado nesta superfície |
| 10 | Ajuda/documentação | n/a | Persuade; onboarding operacional fora do escopo |
| | Total | 15/24 (62,5%) | Aceitável, conjunto parcial e avaliação provisória |

## Forças

1. H1 nomeia a tarefa e benefício sem promessa quantitativa inventada. Corpo conecta elegibilidade, condições e registro.
2. Acordo abaixo do hero é um exemplo identificado como fictício, com responsabilidades, datas e aviso de imutabilidade: forte prova concreta de clareza operacional.
3. Verde, neutros quentes e dupla de fontes preservam a identidade. No mobile, ações textuais largas ficam visíveis antes da imagem; o menu tem rótulo textual e estado expandido no AX.

## Prioridades

1. **[P1] A imagem sugere um produto diferente.** Ela traz marca com pétalas, aba Mensagens, Perfil, filtros, datas de 2025 e linguagem de aplicativo; fluxo rasterizado vai de confirmação direto a acordo sem mostrar decisão institucional condicional. PRODUCT.md preserva identidades/autorização independentes. Isso é risco de confiança e expectativa, não prova de funcionalidade ausente. **Fix:** manter o asset como referência visual, editar a representação para elementos e marca reais verificados; identificar como ilustração e colocar a condição institucional em HTML próximo. Não transformar cada texto gerado em claim do produto. Comandos: /impeccable clarify, /impeccable harden.
2. **[P2] Dois sistemas de atenção dentro do hero.** H1 e ações disputam com logo grande, slogans, lista de benefícios, lista de ofertas, fluxo e card confirmado dentro do raster. Textos periféricos ficam pequenos e fracos na escala desktop; no celular são praticamente textura. **Fix:** criar recorte focado no telefone e no resultado/processo principal, remover textos promocionais embutidos redundantes e preservar informação necessária como HTML. Não apenas ampliar imagem inteira. Comandos: /impeccable distill, /impeccable layout.
3. **[P2] Hero mobile consome a primeira tela e corta sua evidência.** Em 390×844, título ocupa quatro linhas, ações e apoio vêm em seguida, e apenas topo do mockup aparece perto do rodapé. CSS amplia imagem a 122% com margem -11%, cortando logo periférico. **Fix:** variante/recorte mobile simples; ajustar espaçamento e escala para oferecer visual útil próximo das ações, mantendo tap targets e corpo legíveis. Comando: /impeccable adapt.
4. **[P2] A prioridade de conversão muda durante a jornada.** Hero destaca Entrar na plataforma, Criar conta é secundário; final destaca Criar conta. Para visitante novo, CTA principal parece pedir uma conta prévia antes da proposta estar estabelecida. **Fix:** escolher objetivo dominante com o usuário e repetir hierarquia; se aquisição for objetivo, tornar cadastro primário e login opção de usuário existente. Não presumir aquisição se landing também for portal de acesso. Comando: /impeccable clarify.
5. **[P2] Cinco etapas são tratadas como cinco cartões equivalentes.** Desktop divide 3+2; etapa institucional tem título longo e condição crítica. Mobile usa faixa horizontal sem orientação explícita no markup para descobrir sequência completa. **Fix:** percurso compacto com conexão/sequência visível, marcar etapa condicional sem ocultá-la e oferecer indicação de continuação ou lista vertical mobile. Comandos: /impeccable layout, /impeccable adapt.

## Carga cognitiva e jornada

Moderada: falham single focus (promessa textual + raster promocional) e chunking (cinco etapas equivalentes). Agrupamento, uma decisão por vez, memória e disclosure estrutural são adequados. Hierarquia principal passa; hierarquia interna da imagem falha. O cabeçalho tem quatro destinos principais, não é sobrecarga por si. Se contar logo/home, são cinco rotas; CTAs repetidos não são novas decisões. Os cinco passos são informação, não cinco opções clicáveis. Acordo apresenta oito campos em pares nomeados; é exemplo e não decisão com oito escolhas.

Jornada: início sereno e competente → familiaridade com ofertas → dúvida se mockup é interface real → vale de atenção na sequência longa → pico de confiança no acordo fictício com dados concretos → segurança → final repete H1, sem fechar a dúvida de acesso/elegibilidade. Reforçar antes do cadastro que criar conta não concede automaticamente habilitação nem autorização, sem inventar prazo de aprovação.

## Personas e notas menores

**Jordan:** clica cadastro secundário e ainda não sabe o que torna um profissional elegível; raster parece navegação real, mas não é interativo. **Riley:** confronta pétalas versus R, datas antigas e fluxo rasterizado sem etapa condicional; essas inconsistências afetam confiança mesmo se exemplo ilustrativo. **Casey:** encontra ações largas rapidamente, mas precisa rolar para compreender mockup; sequência horizontal exige descoberta e atenção.

Observações: badge Processo rastreável duplica a mensagem do mockup; animação flutuante é dispensável para compreender processo e possui reduced-motion no CSS; alt descreve mockup mas não reproduz suas informações, portanto conteúdo essencial não deve depender do raster. Não atribuo contraste WCAG ou quebra de teclado sem teste técnico. Não há P0 demonstrado.

## Questões de direção para síntese

1. Esta landing prioriza novos cadastros ou acesso de participantes existentes? Isso decide a inversão atual dos CTAs.
2. Podemos simplificar a imagem para telefone + processo, retirando branding/slogans embutidos, ou o usuário deseja preservar o pôster inteiro?
3. O próximo ajuste fica no hero ou inclui a sequência de cinco etapas para manter coerência da narrativa?
