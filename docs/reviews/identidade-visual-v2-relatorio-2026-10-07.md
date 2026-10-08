# Identidade visual v2.1 — relatório de implementação

Data: 2026-10-07 · Branch: `feat/identidade-visual-v2` (worktree, sem push) ·
Referência: `design/` (README, DESIGN.md, SCREENS.md, tokens, PNG/HTML).

## 1. Resumo

As 11 telas aprovadas (S01–S11) foram aplicadas em fases. As telas não
desenhadas foram derivadas do mesmo sistema, sem estilo novo. Nenhuma regra de
negócio, tabela, política RLS, contrato de API ou fluxo de autenticação foi
alterado. Nas actions, só mudaram os dois redirecionamentos aprovados:
candidatar-se leva à S04 e publicar leva à S07.

| Fase | Commits | Conteúdo |
|---|---|---|
| 1 · Fundação | `b380678` `64a4709` `1855eb8` | Pacote de handoff; tokens, fontes locais (Sora, Figtree, JetBrains Mono), logo, ícones, manifest (splash S01); contexto de design |
| 2 · Componentes | `4618652` `d997988` `b9eb1df` | Mapeamento de status; 20 componentes da §6 e estruturas da §5; catálogo `/dev/componentes` |
| 3 · Telas existentes | `b07a557` … `57e7aa4` (6) | S02, S03, S05/S06, edição, S10, S11, perfil, painel; prévias `/dev/telas` |
| 4 · Telas novas | `fb26e9a` … `48c9e22` (7) | S04, S07, S08, S09, lista de acordos, histórico; limpeza de CSS legado |
| Merge `main` | `f179861` `89052db` | Acordos externos (#29) e ajustes de cadastro, levados ao design system |
| 5 · Verificação | `2f40d0b` … `747441b` (5) | Login, cadastro, senha e MFA; correções de acessibilidade; teste de contraste |

## 2. Por tela

| Tela | Rota | O que foi feito | Desvios intencionais |
|---|---|---|---|
| S01 Splash | `manifest.ts` | Fundo Tinta, ícone maskable, `theme-color` Base nas telas | Splash do PWA vem do manifest (web app, não nativo) |
| S02 Mural | `/plantoes` | Busca, filtros, plantões por dia, FAB, tab bar; estados de carregamento, vazio, filtro sem resultado e erro | Filtro padrão "Esta semana", com saída "Ver todos os plantões" |
| S03 Detalhe | `/plantoes/[id]` | Layout S03; encaminha titular para S08 e substituto para S09; coordenação, conclusão, avaliação e ocorrências mantidas como seções | Sem "Publicado por": RLS de `profiles` só permite ler o próprio perfil |
| S04 Candidatura enviada | `/plantoes/[id]/candidatura` | Passos seguintes; cancelar pede confirmação | "Quem publicou" sem nome (RLS); sem prazo de candidatura (não existe); etapa da coordenação só quando o grupo exige |
| S05 Publicar (1/2) | `/plantoes/novo` | Erro por campo; grupo obrigatório no modo grupo; modo livre | Data em linha própria; valor e condições de pagamento mantidos; limite de 24 h |
| S06 Revisar (2/2) | `/plantoes/novo` | Revisão e aceite do titular; mesma action | — |
| S07 Meus publicados | `/plantoes/publicados` | Abertos, Andamento, Registrados; toast "Plantão publicado"; compartilhar no WhatsApp | Sem prazo de escolha e sem contagem de colegas avisados (dados inexistentes); sem FAB, como no PNG |
| S08 Escolher substituto | `/plantoes/[id]/candidaturas` | Botão habilitado só após a escolha | Sem "Especialidade · CRM" (RLS); sem a nota de aviso aos demais candidatos (hoje eles não são avisados) |
| S09 Confirmar condições | `/plantoes/[id]/condicoes` | Titular: "Selecionar e enviar ao substituto". Substituto: "Aceitar condições" após concordância, ou "Recusar" | Sem a linha "Responsabilidade" (não consta no documento registrado); "Repassa" vira "Quem publicou o plantão" (RLS); o botão do rodapé não mostra spinner (envio duplo é idempotente) |
| S10 Acordo registrado | `/acordos/[id]` | Cabeçalho S10, documento completo, cadeia de evidências e verificação de integridade abaixo e na impressão | Texto de sucesso ajustado ("podem consultá-lo a qualquer momento"); PDF via impressão do navegador |
| S11 Notificações | `/notificacoes` | Tile e CTA pelo tipo de evento | Títulos vêm do banco |

### Desvios globais

- **Raios fora da escala:** 18, 30 e 32 viraram 20 e 28, porque não há token e
  raio literal é proibido.
- **Alvos de toque:** o CTA da notificação e o SegmentedControl ficaram com 44
  em vez de 40. O FilterChip mantém 38 visuais e tem área de toque de 44.
- **Logo:** é o SVG oficial, sem recriar o wordmark com fonte.
- **Landing:** saíram os gradientes e efeitos decorativos sem token.
- **Preset Tailwind:** não usado (está no formato v3; o projeto usa v4 sem
  utilitários).
- **Spinner com movimento reduzido:** desacelera em vez de parar.

## 3. Telas derivadas

| Rota | Base |
|---|---|
| `/plantoes/[id]/editar` | S05; ofertas com mais de 24 h mostram aviso em vez do formulário |
| `/acordos` | Lista de acordos, incluindo o painel "Acordos combinados fora do app" |
| `/acordos/registrados/*` | Acordos externos (#29), só com tokens |
| `/historico`, `/perfil`, `/painel` | Componentes do sistema; médico aprovado vai do painel para `/plantoes` |
| `/entrar`, `/cadastro`, `/senha/esqueci`, `/senha/nova`, `/confirmar-email`, `/mfa` | `AuthScreen` (logo + título + formulário); mesmas actions, campos e textos |
| `/cadastro/completar` | Etapas com âncoras, seções em cartões, erro por campo vindo da validação ou das correções da equipe; conta, verificação profissional e autorização institucional continuam independentes |
| `/admin/*`, `/suporte`, `/termos`, `/privacidade` | Só tokens |

## 4. Verificação (Fase 5)

| Item | Resultado |
|---|---|
| `format:check`, `typecheck`, `lint` | Passam |
| Testes unitários | 104 passam (24 arquivos) |
| `next build --webpack` | Compila todas as rotas |
| Comparação com os PNGs a 390×844 | S02–S11 conferidas nas Fases 3 e 4 pelas prévias; S05 reconferida após o merge |
| Alvos de toque ≥ 44 | Todas as telas do app passam. Corrigidos: links das etapas do cadastro (18 → 53), links do topo e inline, rodapé da landing (24 → 44) |
| Rótulos de acessibilidade | Nenhum controle sem nome acessível, um `h1` por tela, nenhuma imagem sem `alt` nas telas auditadas |
| Foco | O botão de busca oculto do mural saiu da ordem de foco (antes recebia foco invisível) |
| Contraste de texto | Todos os pares AA, de 4,72:1 (Verde sobre Base) a 14,86:1. Teste novo trava os pares |
| Links em rótulos | "Termos de uso" e "Política de privacidade" não se distinguiam do texto; agora estão sublinhados e em verde-escuro |
| Fonte a 130% | Zoom de 1,3 a 390 px (≈ 300 px efetivos): sem rolagem horizontal nem texto cortado |

**Não verificado aqui:** as rotas reais com login e dados (precisam de Supabase
local) e os e2e do Playwright (precisam de Supabase e dos navegadores). Os e2e
foram atualizados para a nova estrutura.

## 5. Pendências e decisões

1. **Contorno dos campos (resolvido na v2.2).** O token novo
   `--rs-field-border` (#7A8C96) dá 3,49:1 sobre branco e 3,27:1 sobre Base
   em campos, busca e toggle desligado.
2. **Escala de fonte do sistema (resolvido na v2.2).** A tipografia passou para
   rem: a preferência de fonte do navegador aumenta o texto. A 130%, as telas
   não rolam na horizontal.
3. **Criação de grupos pelo usuário (implementada).** Veja a seção 7.
4. **Dados ausentes no domínio**, que explicam os desvios da seção 2:
   - prazo de candidatura e de escolha;
   - aviso aos candidatos não escolhidos;
   - cláusula de responsabilidade no documento;
   - nome de quem publicou, visível a outros médicos (RLS).
5. **Configuração de avisos.** Não existe no backend; o cartão foi omitido.
6. **Administração.** Recebeu só os tokens; o layout não foi redesenhado.
7. **Copy do WhatsApp.** Atualizar com "uma camada a mais de proteção" e com a
   criação de grupos quando a funcionalidade existir.

## 6. Proposta — criação de grupos pelo usuário (próxima fase)

**Hoje:**

- `institutions` → `groups` (`institution_id` obrigatório, `requires_approval`)
  → `group_memberships` (`role` `doctor` | `approver`).
- Só a administração cria grupos e vínculos.
- A RLS deixa cada pessoa ler os próprios vínculos e os grupos e instituições
  de que participa.

**Proposta:**

- **Dois tipos de grupo.**
  - "Grupo de colegas" (`kind = 'peer'`): criado por um médico aprovado, sem
    instituição e sem aprovação da coordenação.
  - "Grupo institucional": continua criado pela administração, com
    instituição, aprovadores e `requires_approval`.
  - Um grupo de colegas nunca concede autorização institucional. Isso preserva
    a independência exigida pela especificação de cadastro.
- **Gestão.** Quem cria vira gestor do grupo, com um papel novo de membership,
  `manager`. O gestor pode:
  - gerar e revogar links de convite;
  - remover membros;
  - transferir a gestão;
  - arquivar o grupo.
- **Entrada.** Por link de convite, compartilhável no WhatsApp:
  - token com prazo e limite de usos;
  - só para médicos aprovados;
  - quem não tem conta passa pelo cadastro e volta ao convite.
  - Opcional: o gestor aprova cada entrada.
- **Membros visíveis.** Uma RPC que devolve só nome de apresentação e selo
  "CRM verificado" dos colegas do mesmo grupo, sem abrir `profiles`.
- **Banco:**
  - `groups.kind`;
  - `groups.created_by`;
  - `institution_id` opcional, com check por tipo;
  - valor `manager` no enum;
  - tabela `group_invites`;
  - RPCs para criar grupo, convidar, entrar, sair, remover e listar membros;
  - políticas RLS, auditoria e testes em `supabase/tests`.
- **Telas:**
  - Perfil → "Meus grupos" → "Criar grupo";
  - página do grupo com membros e "Compartilhar convite";
  - seletor de grupo da S05 com os dois tipos e rótulo distinto.

## 7. Fase 6 — grupos de colegas (implementado em 2026-10-08)

Especificação em `docs/product/peer-groups.md`. Decisões: entrada direta pelo
link (sem aprovação do gestor) e retorno ao convite depois do login.

| Camada | O que entrou |
|---|---|
| Banco | `groups.kind` e `created_by`, papel `manager`, `group_invites` (só hash do token), `group_command`, `group_context`, `group_invite_preview`; acordos externos e dossiê aceitam grupo sem instituição |
| Login | `/entrar?proximo=` aceita só `/grupos/convite/<token>` como destino |
| Telas | `/grupos`, `/grupos/novo`, `/grupos/[id]` (gestor, membro, institucional), `/grupos/convite/[token]` (aberto, cadastro pendente, indisponível, sem login) |
| Integrações | Perfil → "Meus grupos"; publicação com "Grupo de colegas" no seletor, grupos arquivados fora e grupo pré-selecionado; três notificações novas; administração rotula grupos de colegas e esconde opções que o banco recusa |

**Verificação.**

- **Banco:** as 24 migrations aplicam do zero num Postgres descartável, com a
  mesma imagem do Supabase local. Todos os testes pgTAP passam, incluindo os
  52 de `peer_groups.sql`.
- **Aplicação:** `format:check`, `typecheck`, `lint`, os 126 testes
  unitários, as checagens de segurança, segredos e escopo e o
  `next build --webpack` passam.
- **Prévias a 390×844:** sem rolagem horizontal, controles com nome acessível,
  alvos de pelo menos 44 px e um `h1` por tela.

**Não verificado aqui.** O fluxo real com sessão e o e2e, porque o worktree não
tem `.env.local` com Supabase. A migration também não foi aplicada no seu banco
local nem em staging.
