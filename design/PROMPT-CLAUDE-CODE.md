# Prompt para o Claude Code

Copie o bloco abaixo e cole no Claude Code, **com a pasta `design/` já copiada na raiz do repositório**.

---

```
Você vai aplicar a nova identidade visual do Repassafe neste código e implementar as telas aprovadas.
Toda a especificação está em ./design/ — leia nesta ordem antes de qualquer alteração:
  1. design/README.md
  2. design/DESIGN.md        (regras de marca, tokens, componentes, acessibilidade, microcopy)
  3. design/SCREENS.md       (11 telas aprovadas, navegação, estados)
  4. design/tokens/          (tokens.css, tailwind.preset.js, theme.ts, design-tokens.json)
  5. design/screens/png/*.png  (referências visuais — abra cada imagem)
  6. design/screens/html/*.html (referência estática com medidas e textos exatos)

Trabalhe em fases. Ao fim de cada fase, pare, me mostre um resumo do que mudou e espere meu OK antes da próxima.

FASE 0 — Diagnóstico (sem alterar código)
- Identifique stack, framework de UI, sistema de estilos, navegação, biblioteca de ícones e como as fontes são carregadas.
- Liste as telas/rotas existentes e monte uma tabela: tela existente → tela aprovada (S01–S11) → ação (adaptar / substituir / criar / manter). Aponte telas existentes sem correspondente e telas aprovadas sem implementação.
- Liste onde há cores, fontes, raios e espaçamentos hardcoded.
- Mapeie o enum/estados de plantão do domínio para os status da DESIGN.md §3 (não renomeie o domínio; crie um mapeamento de apresentação).
- Proponha o plano das fases 1–4 com a lista de arquivos que pretende tocar.

FASE 1 — Fundação
- Centralize os tokens no formato do stack (CSS vars, preset Tailwind ou theme.ts — use o arquivo correspondente de design/tokens/ como fonte; não invente valores).
- Carregue Sora, Figtree e JetBrains Mono corretamente para a plataforma.
- Substitua logo, ícone do app, splash e favicon pelos arquivos de design/assets/ (não redesenhe o símbolo).
- Remova hex/fontes hardcoded substituindo por tokens.

FASE 2 — Componentes
- Implemente os componentes da DESIGN.md §6 (Button, IconButton, StatusChip, FilterChip, ShiftCard, campos, SegmentedControl, InfoBanner, CandidateCard, KeyValueList, InfoTile, ProgressSteps, StepList, AuditTrail, RegistrySeal, NotificationItem, Toggle, FAB, TabBar, EmptyState), reaproveitando os existentes quando possível.
- Se o projeto tiver Storybook ou tela de catálogo, adicione os componentes lá.

FASE 3 — Adaptar telas existentes
- Aplique layout, componentes e microcopy das telas aprovadas às telas que já existem, preservando toda a lógica de negócio, chamadas de API e validações.
- Use os textos exatos do SCREENS.md e as frases fixas da DESIGN.md §8.

FASE 4 — Novas telas
- Implemente as telas aprovadas que não existem e a navegação descrita no mapa do SCREENS.md, incluindo estados de carregamento, vazio e erro.
- Para as telas "não desenhadas" do SCREENS.md, derive usando só componentes e padrões do sistema e liste-as no relatório.

FASE 5 — Verificação
- Compare cada tela implementada com o PNG de referência a 390×844 (screenshot ou preview) e corrija desvios de espaçamento, tipografia e cor.
- Verifique contraste, alvos de toque ≥ 44, rótulos de acessibilidade e fonte dinâmica a 130%.
- Rode lint, typecheck e testes existentes.
- Entregue um relatório: o que foi feito por tela, desvios intencionais, telas derivadas, pendências.

Regras invioláveis:
- Não alterar regras de negócio, banco de dados, autenticação ou contratos de API sem me perguntar.
- Nenhuma tela pode permitir ou sugerir dados de pacientes; o app não intermedeia pagamentos; acordo registrado não é editável.
- Sem emoji na interface. Sem cores fora dos tokens. Sem fontes fora de Sora/Figtree/JetBrains Mono.
- Faça commits pequenos por fase, com mensagens descritivas. Não faça push nem abra PR sem eu pedir.
- Se algo na especificação conflitar com o código existente ou estiver ambíguo, pergunte antes de decidir.
```

---

## Dica: deixe as regras permanentes no projeto

Depois da Fase 1, peça ao Claude Code para acrescentar o conteúdo de `design/CLAUDE.md.snippet` ao `CLAUDE.md` do repositório. Assim, qualquer sessão futura segue a identidade sem você repetir as instruções.
