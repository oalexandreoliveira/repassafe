---
version: 1
slug: "src-app-agenda-page-tsx"
primary_target: "src/app/agenda/page.tsx"
related_targets: ["src/components/screens/agenda.tsx","src/components/agenda-entry-form.tsx","src/components/screens/agenda-entry.tsx"]
---

# Agenda — direção de interface

Modo Operate. Superfície nova dentro do mundo v2.1, com estrutura definida pela
especificação aprovada (`docs/product/personal-agenda.md`): calendário do mês,
resumo de pagamentos e lista por dia. Sem rodada de conceitos: a composição foi
fixada pelo responsável ao aprovar a especificação.

## Direction contract

THESIS: o médico vê de relance onde trabalha e quando o dinheiro deve chegar.
Plantões aparecem no dia em que começam; pagamentos, no dia em que vencem.
Recusa o calendário de produtividade com eventos coloridos por categoria.

OWN-WORLD: fundo Base, cartões brancos sem sombra, Verde-repasse só em ação e
marca de plantão, Âmbar só no ponto de vencido. Status sempre com texto.
Mono apenas nos rótulos de dia da lista.

STORY: abrir o mês, notar o ponto âmbar, tocar no dia, ler o valor e quem
paga, marcar como recebido ou cobrar.

FIRST VIEWPORT: top bar raiz, título "Agenda", cartão do calendário com
navegação de mês e legenda (barra = plantão, anel = pagamento, ponto âmbar =
vencido). Resumo e lista abaixo. FAB "Adicionar plantão" acima da tab bar.

FORM: estrutura especificada pelo usuário; formulário em seções (Tipo, Quando,
Onde, Pagamento, Observações) com seletor de várias datas operável por
teclado. Seed: não aplicável (extensão especificada).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Restrições

- Anotação pessoal sempre identificada por texto ("Anotação pessoal"),
  distinta de "Repasse confirmado" e "Acordo registrado".
- Registros do app sem ação de edição; pagamentos do app abrem o
  acompanhamento existente.
- Aviso de dados de pacientes em observações e no nome do responsável.
- Frase fixa de não intermediação no resumo e no detalhe.

## Etapa 3 (16/11/2026)

- "Adicionar à agenda do celular" e "Repassar este plantão" seguem o padrão
  de bloco recolhível já usado em "Marcar como recebido": uma ação primária
  por tela continua sendo a do fluxo principal, e as secundárias não competem.
- Plantão repassado é identificado por texto ("Repassado a um colega"), não
  só por cor; o pagamento ao colega continua como cartão próprio no dia do
  vencimento.
- O aviso de que o arquivo não se atualiza fica antes do botão de download.

## Em aberto

- Nada da especificação; métricas agregadas do piloto ainda por decidir.
