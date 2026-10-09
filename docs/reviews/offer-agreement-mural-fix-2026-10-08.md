# Ofertas, confirmações e filtros do mural — 08/10/2026

## Causa e evidência

A última oferta livre consultada no banco vinculado, de Pediatria em
08/10/2026, foi publicada às 11:44:14, teve um candidato selecionado às
11:46:12 e a substituição confirmada às 11:46:54 (America/Sao_Paulo).
A auditoria registra `shift_offer.published`, `substitution.selected` e
`substitution.confirmed`. A oferta ficou `closed_confirmed`, com um registro
em `shift_agreements` e sem acordo externo correspondente em
`external_agreements`. Não houve criação de acordo externo ao publicar.

A confusão estava na apresentação: `offerPresentation` e
`substitutionPresentation` traduziam confirmação como “Acordo registrado”.
Detalhe, lista, próximos passos e navegação repetiam essa classificação,
apesar de os comandos e tabelas dos dois fluxos já serem separados.

No mural, o texto considerava apenas a quantidade de grupos; o período padrão
era “Esta semana”; e a consulta incluía ofertas futuras encerradas/canceladas,
pois filtrava apenas data, sem estado. Também não projetava `group_id`,
necessário para um filtro de origem independente da disponibilidade do nome.

## Alterações

- Confirmados a partir de ofertas recebem “Repasse confirmado”, com tom
  `confirmed`, aba “Confirmados”, navegação “Repasses” e comprovante cuja
  origem fica explícita. O documento imutável e seus aceites são preservados.
- Acordos negociados fora do aplicativo mantêm sua entrada e listagem
  exclusivas em `/acordos/registrados`. Nenhum registro real foi alterado.
- Mural inicia com todas as ofertas futuras abertas (`open_normal` ou
  `open_emergency`) acessíveis pela sessão autenticada, sem limitar a semana.
- Filtro opcional por todas, livres, grupos do usuário ou grupo específico,
  combinável com período/setor e busca por setor, hospital ou grupo.
  Seleções persistem na URL; limpar restaura todos os disponíveis.
- RLS e vínculos continuam definindo acesso. Grupo fora dos vínculos não
  entra no seletor nem expõe suas ofertas através de URL manipulada.
- Os componentes e tokens v2.2 são reutilizados. A atualização do contrato
  está documentada em `design/SCREENS.md`.

## Validação

- 132 testes unitários e de componente passaram (28 arquivos).
- TypeScript e ESLint dos arquivos alterados passaram.
- Build de produção (`pnpm build`) passou.
- Playwright com contas sintéticas e Supabase local passou: publicação não
  cria acordo, confirmação cria somente o comprovante da oferta, mural
  inclui oferta livre além de sete dias e dois grupos acessíveis, todos os
  filtros funcionam, recarga preserva seleção e grupo restrito fica invisível.
- Capturas do mural e da lista de repasses em 1440 e 390 px inspecionadas;
  sem overflow da página.
  O detector Impeccable não apontou ocorrências nas superfícies verificadas.

Implementação na branch `codex/ofertas-e-acordos`, baseada em `origin/main`
(`d0ed31a`), em checkout isolado. O checkout original tinha versão anterior da
interface e alterações não publicadas, inclusive a correção de cadastro, que
foram preservadas. Não houve migração nem escrita no banco remoto ou deploy.
