# P1 — Perfil profissional na escolha do substituto

Data: 03/11/2026. Escopo: item 11 do teste de usuário, conforme `tester-feedback-roadmap-2026-10-20.md`.

## Comportamento

S08 mantém o resumo individual com nome, CRM/UF, especialidade declarada, RQE e sua situação própria, validade com horário de Brasília e selo apenas para verificação vigente. Cada candidatura oferece **Ver perfil profissional**, expansível na própria lista. Consultar ou fechar detalhes não seleciona nem confirma alguém e preserva uma escolha anterior. O mesmo detalhe está disponível em S09, antes de enviar a escolha.

O controle nativo `details/summary` fica fora do rótulo do radio, tem nome acessível individual, foco visível e alvo mínimo de 44 px. O rodapé mantém a ação de revisão desabilitada enquanto ninguém estiver selecionado. Perfis ausentes, sem CRM/UF, com validade ausente/inválida/vencida ou verificação não vigente não habilitam seleção. Uma candidatura indisponível não impede escolher outra válida.

A rota de revisão consulta novamente o perfil no servidor. Se a situação mudar, retorna à lista com orientação explícita. Uma falha da consulta bloqueia a revisão pelo estado de erro existente. Se a validade vencer entre revisão e envio, o guard já existente no banco rejeita a transição e a ação mostra uma mensagem específica de revalidação.

## Acesso e exposição

Foi preservada a RPC `offer_candidate_profiles`: executável apenas pelo serviço, com filtro de titular da oferta e candidaturas ativas. O servidor só a chama após obter sessão verificada, oferta acessível pelas políticas existentes e correspondência entre titular e usuário autenticado. A consulta não concede acesso a concorrentes ou aprovadores institucionais.

A aplicação agora valida e remove campos extras com uma lista explícita: `id`, `crm`, `uf`, `specialty`, `rqe`, `rqe_verified`, `verified` e `valid_until`. Não foram ampliadas permissões nem alterado o esquema. CPF, nascimento, contatos, foto privada, documentos, evidências e notas internas não integram a projeção. Fotos e vínculos não foram acrescentados sem uma projeção autorizada própria. A especialidade permanece declarada; a situação do RQE é independente do CRM. O texto explica que verificação profissional não concede autorização institucional.

## Identidade e revisão de design

Extensão da identidade v2.1, preservando `DESIGN.md`, `design/DESIGN.md`, `design/SCREENS.md` e `.impeccable/design.json`. A nova folha de estilos usa os tokens existentes de cor, fonte, raio, espaçamento e alvo de toque. Foram conferidos contraste pelas combinações normativas, foco, quebra de texto, composição e interação em 1440, 390 e 360 px, além de texto ampliado a 200%.

- Paleta: Base, cartões brancos, Tinta e Verde-repasse; texto auxiliar com `--rs-text-muted`.
- Tipografia: títulos Sora e leitura/UI Figtree pelos tokens existentes.
- Forma: cartões raio 20 e controle de detalhe raio 14, sem sombra decorativa.
- Hierarquia: resumo comparável e detalhes sob demanda, sem modal ou navegação adicional.
- Estados: rótulos textuais individuais, seleção indisponível explícita e recuperação orientada.

O detector Impeccable retornou `[]` para os componentes alterados. A referência S08 antiga contém selo coletivo; essa redação foi superada pelo requisito de situação individual. Valores literais preexistentes fora do trecho alterado não foram promovidos a novas regras nem corrigidos lateralmente. A passagem documental foi feita pelo executor após o agente documental falhar por limite de uso.

A revisão independente final retornou **disposition: ship**, sem achados materiais no escopo. O revisor abriu as nove capturas estáveis e conferiu os fontes, preservação da identidade, consulta independente, estados e projeção mínima. Não repetiu os testes; os resultados funcionais abaixo são da execução principal.

## Validação reproduzível

- Suíte completa: 211 testes em 39 arquivos aprovados. Após acrescentar três casos, rodada focada de nove testes em dois arquivos aprovada; total de 214 casos únicos validados em 40 arquivos.
- Regressões novas: `candidate-profile.test.tsx`, `candidate-profile-data.test.ts`, `candidate-selection-access.test.tsx` e `candidate-selection-action.test.ts`. Cobrem audiência, projeção mínima, falha de consulta, expiração, candidatura retirada/alheia, seleção e mensagem de erro segura.
- Playwright: `tests/e2e/candidate-profile.spec.ts` aprovado em 1440/390/360 px, com Enter/Espaço, abertura sem seleção, preservação da escolha, leitura por rolagem, consulta na revisão, alvos e ausência de overflow, inclusive com fonte a 200%.
- Banco local: 42 asserções de `supabase/tests/mvp_acceptance_flow.sql` aprovadas, incluindo cinco novas sobre audiência, campos permitidos, retirada e situação vencida. Dados sintéticos em transação encerrada com `ROLLBACK`.
- TypeScript, ESLint, formatação dos arquivos alterados, auditoria estática de segurança (27 tabelas), verificação de escopo MVP e fundação aprovados.
- Compilação de produção local Next.js 16.4.1 com webpack aprovada, incluindo geração das 48 páginas estáticas.

Comandos usuais: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm exec playwright test tests/e2e/candidate-profile.spec.ts` e `supabase test db`. Nesta execução, os binários locais foram chamados diretamente porque Corepack tentou baixar pnpm sem rede; Vitest usou dois workers e a compilação local utilizou webpack. A configuração temporária de execução foi removida.

Capturas: `.impeccable/review/candidate-profile/{details,reading,review}-{1440,390,360}.png`. As capturas `reading` complementam as imagens de página inteira, nas quais o rodapé sticky aparece na posição do viewport.

Limites: navegador com dados fictícios e banco local; não houve publicação nem teste autenticado de produção. A verificação de teclado e semântica não equivale a uma certificação com leitores de tela.
