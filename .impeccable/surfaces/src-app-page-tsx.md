---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/repasse-preview.tsx","src/components/repasse-preview.module.css","src/components/publish-shift-fields.tsx","src/components/shift-offer-card.tsx"]
---

# Demonstração fiel do hero

O usuário identificou uma quebra de confiança: a interface do telefone ilustrativo não correspondia ao app. Essa evidência substitui o parecer anterior sobre a adequação da imagem. A direção agora é mostrar o funcionamento existente, com preenchimento de dados e movimento controlável.

## Direction contract

THESIS: o visitante entende a publicação de um plantão vendo os mesmos campos e o mesmo cartão usados no produto.

OWN-WORLD: identidade v2.1 de `design/` (Tinta, Verde-repasse, Base, Sora, Figtree e JetBrains Mono; logo oficial em SVG). A demonstração reutiliza PublishShiftFields e ShiftOfferCard, também usados em /plantoes/novo e /plantoes. Não inventar menus, estados, telas móveis ou funcionalidades.

STORY: um profissional aprovado preenche uma oferta livre, confere e aceita as condições, publica e encontra o cartão em Plantões disponíveis com estado Aberto. Isso não equivale a acordo confirmado. Candidatura e demais confirmações seguem explicadas abaixo do hero.

FIRST VIEWPORT: promessa e Criar conta à esquerda; recorte da interface em movimento à direita. Controles e identificação de dados fictícios junto ao recorte. No celular a demonstração entra após as ações.

FORM: extensão em código do mundo existente. Sem comp ou imagem gerada. A composição é uma janela para componentes reais, não uma reprodução de interface imaginada. A referência JusRatio informa a demonstração de mecanismo, não os campos ou a aparência do produto.

FINISH: fresh independent review of the user's fidelity objection; document the shipped components and motion after review.

## Movimento

Foco: preenchimento dos campos, conferência do aceite obrigatório e transição para oferta Aberto. Uma execução de 13 segundos; sem loop automático. Rolagem limitada ao recorte acompanha o campo preenchido. Pausa, reprodução, repetição e navegação por etapas são externas à demonstração; nenhum formulário de demonstração envia dados.

Interrupção: pausa fora de vista e em aba oculta; foco nas etapas interrompe o automático. Movimento reduzido exibe dados estáticos e seleção manual. Conteúdo acessível em descrição e transcrição; o recorte visual é inert/aria-hidden para não criar controles falsamente operacionais nem narrar cada letra digitada.

Orçamento: sem nova dependência, vídeo, raster, canvas ou efeitos contínuos. Atualização limitada à demonstração durante reprodução; painel de altura estável, sem deslocar a página.

## Evidência e limites

Os campos preservam names, validação HTML, opções dos grupos, aceite e botão submit do formulário real. A ação no servidor e a consulta autorizada de grupos permanecem na rota autenticada. O cartão preserva labels, formatadores de data/moeda, status, ações e conteúdo de candidaturas/substituições da lista real. A diferença do recorte é o espaço disponível e a navegação de reprodução, identificada como demonstração.

Dados totalmente fictícios; não usa sessão, consulta de dados reais ou ação de publicação. Exemplo específico de oferta livre, sem aprovação institucional. O resultado é apenas oferta aberta, nunca confirmação automática de substituição ou acordo. Os rasters rejeitados foram retirados de public e ficam no histórico Git.
