# Repassafe — Design System para implementação (v2.1)

Este documento é a referência obrigatória para qualquer código de interface do Repassafe.
Tokens: `tokens/` · Telas: `SCREENS.md` + `screens/png` + `screens/html` · Marca: `assets/logo`.

---

## 1. Produto em uma frase

Plataforma privada para **publicar, escolher e registrar** repasses de plantão médico.
Dois pilares, sempre presentes na interface:

| Pilar | O que o usuário faz | Telas |
|---|---|---|
| **Publicar** | Publica um plantão no mural dos seus grupos, recebe candidaturas, avisa colegas, compartilha link no WhatsApp | S02–S07, S11 |
| **Registrar** | Escolhe o substituto, as duas partes confirmam as condições, a coordenação aprova (se o grupo exigir) e o acordo é registrado de forma imutável e auditável | S08–S10 |

### Restrições de produto que a UI deve reforçar
- **Nunca** permitir ou sugerir registro de dados de pacientes. Campos livres (ex.: "Observações operacionais") exibem aviso fixo.
- **Nunca** intermediar pagamento. Onde valores aparecerem em contexto, exibir: "Valores e pagamento são combinados diretamente entre vocês. O Repassafe não intermedeia pagamentos."
- Todo médico exibido mostra **CRM verificado** (selo com ícone de escudo).
- Um acordo **registrado não pode ser editado**: não exibir ações de edição; só baixar PDF / compartilhar.

---

## 2. Marca

- Nome sempre em minúsculas no wordmark: **repas** (Tinta) + **safe** (Verde-repasse). Em fundo escuro: **repas** branco + **safe** Menta.
- Em texto corrido escreve-se "Repassafe".
- Use os SVGs de `assets/logo/` — **nunca** redesenhe o símbolo nem recrie o wordmark com fonte (o wordmark já está em curvas).
  - Header do app: `simbolo-cor.svg` (30px) + wordmark em Sora 700 20px, ou `logo-horizontal-cor.svg`.
  - Splash e fundos Tinta: `logo-vertical-negativo.svg` / `simbolo-negativo.svg`.
  - Abaixo de 32px: `simbolo-cor-reduzido.svg` (sem o check).
- Ícones de app: `assets/icons-app/` (iOS, Android adaptativo com fundo `#0F7C78`, favicon, apple-touch-icon).
- Proibido: girar, distorcer, aplicar gradiente/sombra, trocar cores, transformar os blocos em círculos, alinhar os blocos na horizontal.

---

## 3. Cores — regras de uso

| Token | Hex | Uso |
|---|---|---|
| `--rs-ink` | #0E2A3B | Texto principal, títulos, cabeçalhos escuros, FAB, botão secundário (contorno) |
| `--rs-teal` | #0F7C78 | **Única cor de ação primária**. Botões primários, ícones ativos, toggles ligados, barras de progresso |
| `--rs-teal-dark` | #0B5E5B | Texto verde sobre branco/Névoa (links, item ativo da tab bar, chips positivos) |
| `--rs-mint` | #8EE0CC | Destaques sobre fundo escuro, área do símbolo, segmento "atual" do progresso |
| `--rs-mist` | #D9F1EC | Fundo de banners informativos, tiles de ícone, chips "Aberto/Confirmado" |
| `--rs-base` | #F6F8F7 | Fundo de todas as telas |
| `#FFFFFF` | — | Cartões |
| `--rs-amber` | #F2B544 | Somente indicador de atenção (badge de notificação usa `#D99A1E`). **Nunca como cor de texto.** |

Proporção visual alvo: Base 55% · Tinta 20% · Verde 15% · Menta 7% · Âmbar 3%.

**Contraste (WCAG 2.1 AA, já verificado):** Tinta/Base 13.9:1 · Branco/Verde 5.0:1 · Tinta/Menta 9.7:1 · `#4A5B66`/branco 7.0:1. Não use cinza mais claro que `--rs-text-muted` para texto.

**Contorno de controles (v2.2):** campos, busca e toggle desligado usam `--rs-field-border` #7A8C96 (3.5:1 sobre branco, 3.3:1 sobre Base), para atender ao contraste de componentes (WCAG 1.4.11, mínimo 3:1). `--rs-border` #DCE3E1 fica para linhas, chips e botões secundários, que são identificados pelo texto.

### Status do plantão (sempre cor **+ texto** + ponto; nunca só cor)

| Estado (enum sugerido) | Rótulo PT-BR | Fundo | Texto | Ponto |
|---|---|---|---|---|
| `open` | Aberto / Aberto para candidaturas | #D9F1EC | #0B5E5B | #0F7C78 |
| `pending` | Aguardando candidato / N candidaturas | #FCEBC7 | #6E4300 | #D99A1E |
| `institutional` | Em aprovação institucional | #E3E9EE | #33454F | #5E7383 |
| `confirmed` | Confirmado | #D9F1EC | #0B5E5B | #0F7C78 |
| `registered` | Acordo registrado / Imutável | #0E2A3B | #FFFFFF | #8EE0CC |
| `cancelled` | Cancelado | #FBE3E1 | #8E2A22 | #C2453A |
| `empty` | Sem candidaturas | #F1F4F3 | #4A5B66 | #9AAAB3 |

Se o código já tiver um enum de status diferente, **mapeie** para esta tabela em vez de renomear o domínio.

---

## 4. Tipografia

| Papel | Fonte | Peso | Tamanho/linha | Tracking |
|---|---|---|---|---|
| Display (marketing, onboarding) | Sora | 700 | 44/52 | −0.03em |
| Título de tela (home, abas) | Sora | 700 | 26/31 | −0.02em |
| Título de tela com voltar | Sora | 700 | 22/28 | −0.02em |
| Título de seção | Sora | 600 | 17–18/24 | −0.01em |
| Título de cartão | Sora | 600 | 17/22 | 0 |
| Corpo | Figtree | 400 | 16/24 | 0 |
| Corpo pequeno | Figtree | 400 | 15/21 | 0 |
| Label de campo | Figtree | 600 | 13/18 | 0 |
| Legenda/meta | Figtree | 500 | 13/18 | 0 |
| Chip, tab bar | Figtree | 600 | 12/16 | 0 |
| Botão | Figtree | 600 | 16 | 0 |
| Registro (hash, ID, horário de auditoria, eyebrow) | JetBrains Mono | 400 | 12/20 | eyebrow: +0.06em, MAIÚSCULAS |

- Na web, a escala é servida em rem (valor/16; 16px = 1rem), para acompanhar o tamanho de fonte escolhido pela pessoa. Os valores da tabela continuam sendo a referência em px a 100%.
- JetBrains Mono é **exclusiva** de dados de registro (código RPS, sha256, carimbos de data/hora, trilha de auditoria) e de eyebrows de seção. Ela comunica "isto é imutável".
- Fontes do Google Fonts (licença OFL). No mobile nativo, embarque os arquivos (Expo: `@expo-google-fonts/sora`, `/figtree`, `/jetbrains-mono`).
- Não use Inter, Roboto ou Arial como fonte primária.

---

## 5. Layout

- Referência de tela: **390 × 844** (iPhone 14). Layout fluido de 360 a 430 de largura.
- Padding lateral das telas: **20px**. Espaço entre blocos: **12–14px**. Padding interno de cartão: **16px** (14 em listas densas).
- Estrutura padrão de tela:
  1. **Top bar**: botão voltar (44×44, círculo branco) + título Sora 22, ou logo + sino de notificações (com badge âmbar) nas telas raiz.
  2. **Conteúdo** com rolagem.
  3. **Rodapé fixo** com botão primário de largura total (altura 52–54), padding 16/20/28 (base com safe area).
  4. **Tab bar** (só nas telas raiz): Plantões · Publicar · Acordos · Perfil — altura 80 + safe area, ativo em `#0B5E5B` com ícone `#0F7C78`.
- Fundo da tela sempre `--rs-base`; cartões brancos sem borda e sem sombra (a separação é por cor).
- Web/desktop (se houver painel web): conteúdo em coluna de no máx. 480px para fluxos de app; dashboards de coordenação podem usar grid 12 colunas com max-width 1200.

---

## 6. Componentes

Crie estes componentes uma única vez e reutilize. Nomes sugeridos — adapte à convenção do projeto.

| Componente | Especificação |
|---|---|
| `Button` | Variantes: `primary` (bg Verde, texto branco), `secondary` (contorno 1.5px Tinta, fundo transparente), `ghost` (texto `#0B5E5B`), `dark` (bg Tinta, texto branco, usado no FAB). Altura 52 (rodapé) / 44 (em cartão). Raio 14. Figtree 600 16. Estados: hover −6% luminância, pressed −10%, disabled bg `#C9D4D1` texto branco, loading com spinner branco 18px. Ícone opcional à esquerda (gap 8). |
| `IconButton` | 44×44, raio 22, fundo branco, ícone 20px Tinta, `aria-label` obrigatório; variante com badge (ponto 9px `#D99A1E`, contorno branco 2px, topo-direita). |
| `StatusChip` | Pill, padding 5×10, ponto 7px + texto Figtree 600 12. Cores pela tabela de status. `align-self: flex-start` (nunca esticar). |
| `FilterChip` | Altura 38, pill, padding 0×14. Selecionado: bg Tinta texto branco. Não selecionado: branco com contorno `#DCE3E1`. Lista com rolagem horizontal. |
| `ShiftCard` | Cartão branco raio 20, padding 16, gap 8. Linha 1: `StatusChip` + nome do grupo (ícone pessoas 14px, 12px muted). Linha 2: título Sora 600 17 "Setor · Hospital". Linha 3: data e horário com ícones calendário/relógio 16px Verde. Linha 4: meta 13px muted. Ação opcional (Button 44). Variante selecionada: ring 2px Verde. |
| `TextField` / `Select` / `TextArea` | Label acima (13/600 `#33454F`, gap 6). Campo: altura mínima 50, raio 14, contorno 1.5px `--rs-field-border` #7A8C96, fundo branco, texto 16 Tinta, padding 0×14. Foco: contorno Verde + `--rs-focus-ring`. Erro: contorno `#C2453A` + mensagem 13px `#8E2A22`. |
| `SearchField` | Altura 46, raio 14, ícone lupa 18px muted à esquerda. |
| `SegmentedControl` | Trilho `#E3EAE8` raio 14 padding 4; item ativo branco raio 11; altura do item 40–44; Figtree 600 14–15. |
| `InfoBanner` | Raio 16, padding 12×14, ícone 18px + texto 13/1.45. Variantes: `info` (bg Névoa, texto `#0B5E5B`), `warning` (bg `#FCEBC7`, texto `#6E4300`), `neutral` (branco com tile de ícone `#E3E9EE`), `dark` (bg Tinta, texto branco, ícone Menta). |
| `PersonRow` / `CandidateCard` | Avatar quadrado arredondado 44–46 (raio 14) com iniciais Sora 700 15–16; nome Figtree 600 15–16; linha CRM/especialidade 13 muted; selo "CRM verificado" (escudo Verde 16 + texto 12/600 `#0B5E5B`). Seleção por radio 22px `accent-color: #0F7C78`; card inteiro é o `<label>`. |
| `KeyValueList` | Cartão branco raio 20, padding 2–6×16; linhas com divisor `#EDF1F0`, padding 12–13 vertical; chave 14 muted à esquerda, valor 14/600 à direita. |
| `InfoTile` | Grid 2 colunas no detalhe: tile de ícone 40×40 raio 12 bg Névoa + label 12 muted + valor 15/600. |
| `ProgressSteps` | Barra segmentada (altura 6, raio 3, gap 6): concluído Verde, atual Menta, futuro `#DCE3E1`; legenda 13 muted "Etapa X de Y · …". |
| `StepList` (timeline vertical) | Círculo 28px: concluído Verde com check branco; atual `#FCEBC7`; futuro `#E3EAE8`. Título 15/600 + sub 13 muted. |
| `AuditTrail` | Cartão branco: linhas com ponto 8px Verde + rótulo 14 + horário Mono 12 muted à direita. Bloco de registro: fundo Base, raio 12, Mono 12 `#0B5E5B`, linhas: `ACORDO RPS-{id}` · `registrado {data} {hora}` · `sha256 {hash}`. |
| `RegistrySeal` | Cartão Tinta raio 20: tile circular 56 Menta com escudo-check Tinta; título Sora 600 17 branco; linha Mono 12 `#B9C7CF`. |
| `NotificationItem` | Cartão branco raio 18 padding 14; tile 40 raio 12 (âmbar para ação requerida, Névoa para informação, `#E3E9EE` para histórico); título 14/600, texto 13 muted, horário 12 muted à direita; CTA opcional (Button 40). |
| `Toggle` | 46×28, raio 14; ligado Verde, desligado `#C9D4D1`; knob 22 branco. Use o switch nativo da plataforma estilizado. |
| `FAB` (Publicar plantão) | Altura 56, raio 18, bg Tinta, ícone + Menta 20, texto branco 15/600, sombra `--rs-shadow-fab`, 20px acima da tab bar, alinhado à direita. |
| `TabBar` | Ver Layout. Ícones de linha 22px (stroke 2). |
| `EmptyState` | Tile 96×96 raio 30 bg Névoa com ícone 48 Verde, título Sora 700 22–26, texto 15 secundário (máx. 300px), CTA primário. |

**Ícones:** traço (outline), stroke 2, cantos arredondados, grade 24. Equivalentes no Lucide: `chevron-left`, `bell`, `search`, `calendar`, `clock`, `map-pin`, `users`, `plus`, `check`, `share-2`, `info`, `shield-check`, `file-text`, `user`, `inbox`, `sliders-horizontal`, `building-2`, `alert-circle`. Use a biblioteca de ícones já existente no projeto se houver; senão, `lucide-react` / `lucide-react-native`. **Nada de emoji na interface.**

---

## 7. Acessibilidade (obrigatório)

- Alvos de toque ≥ 44×44.
- Texto ≥ 4.5:1 (≥ 3:1 a partir de 24px). Status sempre com rótulo textual.
- Controles reais: `<button>`, `<a>`, `<input>` + `<label>` (web) / `accessibilityRole` + `accessibilityLabel` (RN). Botões só com ícone exigem rótulo.
- Foco visível (`--rs-focus-ring`).
- Respeitar `prefers-reduced-motion` / "Reduzir movimento".
- Suporte a fonte dinâmica até 130% sem truncar CTAs (CTAs podem quebrar linha).

---

## 8. Voz e microcopy

Tom: **claro, preciso, sereno — colega, não chefe.** Sem juridiquês, sem exclamações, sem urgência artificial.

- Botões com verbo: "Publicar plantão", "Candidatar-me", "Selecionar e revisar condições", "Assinar e enviar para aprovação", "Baixar acordo em PDF", "Compartilhar no grupo".
- Datas: "Sáb, 12/10" ou "Sáb, 12 out"; horários "19h – 07h" (cartões) ou "19:00 – 07:00" (detalhes). Formato 24h. Locale `pt-BR`, fuso `America/Sao_Paulo`.
- Tratamento: "Dr." / "Dra." + nome.
- Frases fixas (use exatamente):
  - Aviso em campos livres: "Não inclua nomes, leitos ou qualquer dado de pacientes."
  - Pagamento: "Valores e pagamento são combinados diretamente entre vocês. O Repassafe não intermedeia pagamentos."
  - Confirmação de condições: "Li e concordo com as condições acima. Sei que, depois de registrado, o acordo não pode ser alterado."
  - Sucesso: "Repasse confirmado" / "O acordo foi registrado e os dois médicos e a coordenação receberam uma cópia."
- Evitar: "formalizado com sucesso!!", "Atenção!!!", termos como "cessão de obrigação".
