disposition: fix

Entradas ausentes: cartão QUALITY BAR; não há comp aprovado, spec ou relatório comp-diff, coerentemente com a extensão local em código. Revisão independente de fontes e das sete capturas fornecidas; não houve navegador, nova captura, detector ou execução própria dos testes.

## persistence

Pass para a identidade e o contrato persistidos: PRODUCT.md, DESIGN.md, docs/reviews/landing-motion-2026-09-30.md e .impeccable/surfaces/src-app-page-tsx.md existem. O contrato registra explicitamente a objeção do usuário à interface inventada e a substituição por componentes reais. A extensão local não exige rodada de conceitos, seed, comp ou estado de reprodução. DESIGN.md ainda descreve o telefone e o painel antigo de cinco etapas; sua atualização é uma pendência documental do encerramento, já prevista depois deste review.

Evidência visual válida: foram abertas motion-desktop.png, motion-tablet.png, motion-mobile.png, motion-narrow.png, motion-reduced.png, motion-fill-desktop.png e motion-confirm-desktop.png em .impeccable/review/. Correspondem às larguras de 1440, 768, 390 e 320px informadas; mostram o topo da landing e estados coerentes, sem regiões vazias de renderização nem overlays de desenvolvimento. As capturas verticais estendidas documentam o hero completo nas telas menores. O recorte vertical dentro da demonstração é parte do mecanismo declarado, não uma captura truncada da página.

## fidelity

Inventário visual observado antes da leitura do contrato: navegação em cápsula; título e duas ações; janela de demonstração com marca e identificação própria; cartão de oferta, formulário parcialmente percorrido, campos nativos e aceite; etapas externas, reprodução e repetição; descrição, aviso de dados fictícios e transcrição. A versão estreita empilha ações, demonstração e controles sem corte horizontal do cartão publicado.

| Elemento ou promessa | Estado | Evidência |
| --- | --- | --- |
| TYPE | match | Urbanist nos títulos e Jakarta no conteúdo preservam caráter, peso e hierarquia do sistema existente. As capturas não apresentam voz tipográfica de outro produto. |
| MATERIAL | match | Campos nativos, cartão branco, borda suave e sombra difusa são os materiais reais do app. Não há telefone pintado, tela raster imaginada ou efeito físico substituto. |
| GROUND | match | Campo branco da landing e superfície quente clara da janela seguem o CSS existente e o token surface de DESIGN.md. Não existe comp externo para comparação pixel a pixel. |
| THESIS / campos de publicação | match | PublishShiftFields extrai de /plantoes/novo, contra 2914986, os mesmos labels, names, tipos, limites, required, opções, aceite e submit. Capturas reduced, fill-desktop e confirm-desktop mostram esses mesmos controles e textos. |
| Espaçamento dos datetime-local | contradicted | Em motion-reduced.png, as cápsulas de Início e Término se encostam, enquanto Setor/Valor mantêm separação. O campo Término também ultrapassa o alinhamento direito do select. A grade declara gap de 1rem, mas a largura mínima nativa do controle não é contida apenas por max-width: 100%. |
| OWN-WORLD / cartão publicado | match | ShiftOfferCard preserva, contra 2914986, rótulo de oferta, setor, status, formatadores, datas, valor e ação Gerenciar. A captura mostra Oferta livre, Clínica médica, Aberto, 07:00–19:00 e R$ 1.200,00; nenhuma informação visual contradiz o componente operacional. |
| STORY / significado da publicação | match | Publicado termina em oferta Aberto; a descrição e a transcrição explicitam que candidatura e confirmações ainda são necessárias. Não há acordo ficticiamente concluído nem aprovação institucional presumida. |
| FIRST VIEWPORT / composição | adaptation | O pedido de substituir a ilustração por preenchimento real fundamenta a janela maior. Desktop conserva promessa/CTA à esquerda e demonstração à direita; telas menores colocam a demonstração depois das ações, como exige o contrato. |
| FORM / recorte e controles externos | adaptation | O contrato autoriza janela de altura estável com rolagem do conteúdo. Cabeçalho “Demonstração”, etapas, reprodução, repetição e transcrição identificam a apresentação; não se fazem passar por navegação operacional. |
| Movimento e acesso alternativo | match | Fontes mostram execução única de 13s, interrupção por visibilidade e foco, seleção por teclado, inert/aria-hidden e transcrição. A captura reduced mostra a orientação sem animação e seleção manual. Os sete E2E, 48 testes unitários, lint, formato e build foram reportados pelo executor, não reexecutados nesta revisão. |
| Dados demonstrativos | match | Datas, setor, valor e condição de pagamento são autorados no componente; o aviso Dados fictícios está visível em todas as larguras. A oferta sem grupo corresponde ao percurso demonstrado. |

O rótulo “Oferta livre” pertence aos dados operacionais do cartão existente, embora sua classe histórica se chame eyebrow; aqui ele identifica o escopo da oferta, não introduz um kicker decorativo novo. O cartão dentro da janela é o conteúdo real que o usuário pediu para ver, não uma nova composição de cartões promocionais.

## ceiling

A janela usa mecanismos nativos do produto — preenchimento, conferência e cartão de oferta — com um único percurso de movimento. Não há autoridade para exigir ornamentação ou um mundo visual adicional: o cartão QUALITY BAR não foi fornecido, e o escopo é a fidelidade ao app existente. A falha de encaixe dos campos nativos impede considerar o acabamento concluído.

## material_fixes

1. Conter os datetime-local na largura efetiva de suas colunas na demonstração, preservando respiro e alinhamento direito, ou empilhar essa linha quando o conteúdo nativo não couber; recapturar motion-reduced.png no mesmo tamanho e verificar que a solução também comporta 320/390px. Evidência: cápsulas contíguas e desalinhamento direito em motion-reduced.png; critérios de spacing/type/browser surfaces do craft floor e adaptação responsiva da auditoria existente.

## keep

Preservar os componentes operacionais compartilhados, o conteúdo de oferta livre, a distinção entre publicação e repasse confirmado, a declaração de dados fictícios, os controles acessíveis e a composição fiel ao sistema existente.
