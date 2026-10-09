# Repassafe — Especificação das telas aprovadas (v2.1)

Cada tela tem: imagem de referência em `screens/png/` (renderizada a 2×, 390×844 lógicos) e HTML estático em `screens/html/` (abra no navegador para inspecionar medidas, cores e textos exatos). O HTML é **referência**, não código de produção.

Textos entre colchetes (`[HOSPITAL]`, `[NOME]`, `[ID]`, `[HASH]`) são dados dinâmicos. Horários e datas de exemplo são ilustrativos.

## Ajuste funcional — 08/10/2026

A solicitação de separar ofertas de acordos externos atualiza os textos das
referências abaixo, preservando seus componentes, tokens e composição:

- S02 abre com todas as ofertas futuras ainda abertas que o usuário pode ler:
  livres e dos grupos autorizados. O subtítulo explicita as duas origens.
  “Todos os períodos” é o padrão; “Esta semana” passa a ser opcional.
  “Origem das ofertas” permite todas, somente livres, todos os grupos do usuário
  ou um grupo específico. Busca, período e origem se combinam pela URL; limpar
  restaura o mural completo. O vazio geral é “Nenhum plantão disponível agora”.
- S07 chama a aba de ofertas encerradas com sucesso de “Confirmados”. Seus
  cartões usam o tom `confirmed` e “Repasse confirmado”. O parâmetro histórico
  `aba=registrados` continua válido para preservar links existentes.
- A aba principal antes chamada “Acordos” passa a “Repasses”, com título
  “Repasses confirmados” e seção “Confirmados a partir de ofertas”. O acesso
  a “Acordos combinados fora do app” continua em seção própria, com destino
  `/acordos/registrados` e sua ação exclusiva “Registrar acordo”.
- S03/S04/S09/S10 identificam o resultado da oferta como “Repasse confirmado”,
  com “Comprovante do repasse”. O comprovante informa sua origem na oferta.
  O documento e a trilha imutáveis não mudam; `registered` continua válido
  para o selo “Imutável”, sem classificar a oferta como acordo externo.

As imagens estáticas anteriores são referências visuais, não a fonte do novo
vocabulário. A implementação e seus testes seguem este ajuste funcional.

## Mapa de navegação

```
S01 Splash
 └─ (auth existente) ─► S02 Mural de plantões  ◄── Tab "Plantões" (raiz)
        ├─ card ─► S03 Detalhe do plantão ─► [Candidatar-me] ─► S04 Candidatura enviada
        ├─ FAB "Publicar plantão" ─► S05 Publicar (etapa 1/2) ─► S06 Revisar e publicar (2/2) ─► S07
        └─ sino ─► S11 Notificações
                     └─ "Você foi escolhido" ─► S09 Confirmar condições

Tab "Publicar" (raiz) ─► S07 Meus plantões publicados
        ├─ [Ver candidaturas] ─► S08 Escolher substituto ─► S09 Confirmar condições
        │                                                    └─ [Assinar e enviar] ─► (aprovação da coordenação, se exigida) ─► S10 Acordo registrado
        └─ [Compartilhar no grupo] ─► share sheet nativo (deep link para S03)

Tab "Acordos" (raiz) ─► lista de acordos (NÃO desenhada — derivar) ─► S10
Tab "Perfil" (raiz) ─► (NÃO desenhada — derivar)
```

## Ciclo de vida do plantão (para mapear ao domínio existente)

`open` (publicado, sem/ com candidaturas) → `pending` (aguardando escolha) → substituto escolhido → `confirmed` (as duas partes aceitaram) → `institutional` (aguardando coordenação, se o grupo exigir) → `registered` (acordo imutável). Saída lateral: `cancelled`. Exibição "Sem candidaturas" = `empty`.

---

## S01 · Splash
`screens/png/S01-splash.png`
- Fundo Tinta, símbolo negativo 120px centralizado, wordmark 36px abaixo (gap 20), tagline 13px `#B9C7CF` a 48px da base: "Repasse de plantão com segurança jurídica".
- Usar como splash nativo (Expo `splash` / Android 12 SplashScreen: fundo `#0E2A3B`, ícone `simbolo-negativo`).

## S02 · Mural de plantões (home)
`screens/png/S02-mural.png` — substitui a lista antiga (`S00-lista-v1-referencia.png`, apenas histórico).
- Top bar raiz: logo (símbolo 30 + wordmark 20) + `IconButton` sino com badge quando houver não lidas.
- Título "Plantões abertos" (H1 26) + sub "Publicados nos seus N grupos".
- `SearchField` placeholder "Buscar setor ou hospital".
- `FilterChip`s roláveis: "Esta semana" (padrão), "Noturno", "UTI", "Fim de semana" (filtros podem vir da configuração de avisos).
- Lista agrupada por dia com eyebrow Mono MAIÚSCULAS ("SÁBADO, 12 OUT").
- `ShiftCard` com status, grupo, título, data/hora, meta ("Publicado há 20 min · 2 candidaturas"). O primeiro card mostra o CTA "Ver plantão"; nos demais o card inteiro é tocável.
- `FAB` "Publicar plantão" → S05.
- `TabBar` com "Plantões" ativo.
- Estados: carregando (skeleton de 3 cards), vazio ("Nenhum plantão aberto nos seus grupos" + CTA "Publicar plantão"), erro de rede (InfoBanner warning + "Tentar de novo").

## S03 · Detalhe do plantão
`screens/png/S03-detalhe-plantao.png`
- Top bar com voltar + "Detalhe do plantão".
- `StatusChip` "Aberto para candidaturas"; título H1 24 "Setor · Hospital"; linha "Grupo X · candidaturas até {prazo}".
- Grid 2×2 de `InfoTile`: Data · Horário · Local · Duração (calculada).
- Cartão "Publicado por" com avatar de iniciais, nome e selo "CRM verificado".
- "Observações operacionais" (texto livre do publicador).
- `InfoBanner` info: "Você só assume o plantão depois que os dois confirmarem as condições e o acordo for registrado. Valores são combinados diretamente com quem publicou."
- Rodapé: `Button` primário "Candidatar-me".
- Estados: já candidatado (botão vira secundário "Cancelar candidatura" + chip "Candidatura enviada"), plantão encerrado (botão desabilitado + texto "Candidaturas encerradas"), plantão do próprio usuário (redireciona para S07/S08).

## S04 · Candidatura enviada
`screens/png/S04-candidatura-enviada.png`
- Sem top bar. Tile 96 Névoa com check Verde 48; H1 "Candidatura enviada"; texto "Dr. [NOME] vai escolher entre os candidatos. Você recebe um aviso assim que houver resposta."
- Cartão "Próximos passos" com `StepList`: Candidatura enviada (✓) → Escolha de quem publicou (atual, com prazo) → Confirmação das condições → Acordo registrado.
- Rodapé: primário "Ver outros plantões" + ghost "Cancelar candidatura" (pedir confirmação).

## S05 · Publicar plantão — etapa 1 de 2
`screens/png/S05-publicar-formulario.png`
- Top bar voltar + "Publicar plantão".
- Campos: Grupo (select, grupos do usuário) · Setor (texto) · Data / Início / Fim (grid 3 colunas) · Observações operacionais (textarea, placeholder "Ex.: passagem de plantão presencial às 18h45 com a equipe de enfermagem.").
- `InfoBanner` warning fixo sob observações: "Não inclua nomes, leitos ou qualquer dado de pacientes."
- `InfoBanner` neutral quando o grupo exige aprovação: "Este grupo exige **aprovação da coordenação** antes do acordo ser registrado."
- Rodapé: primário — na versão aprovada lê "Publicar no grupo"; no fluxo de 2 etapas use **"Continuar"** e leve a S06.
- Validação: fim pode ser no dia seguinte (plantão noturno); data não pode ser passada; setor obrigatório.

## S06 · Revisar e publicar — etapa 2 de 2
`screens/png/S06-revisar-publicar.png`
- `ProgressSteps` 2 segmentos (1 Verde, 2 Menta) + "Etapa 2 de 2 · é assim que os colegas vão ver".
- Pré-visualização do `ShiftCard` exatamente como aparecerá no mural.
- `KeyValueList`: Quem pode ver · Candidaturas até (editável) · Aprovação da coordenação ("Exigida pelo grupo" / "Não exigida") · "Avisar membros do grupo" (`Toggle`, padrão ligado).
- `InfoBanner` info com ícone share: "Depois de publicar, você pode compartilhar o link no grupo do WhatsApp. Quem tocar cai direto neste plantão."
- Rodapé: primário "Publicar plantão" → S07 com toast "Plantão publicado".

## S07 · Meus plantões publicados
`screens/png/S07-meus-publicados.png`
- Top bar raiz (logo + sino). Tab "Publicar" ativa.
- Título "Meus plantões publicados"; `SegmentedControl`: "Abertos N" · "Andamento N" · "Registrados".
- Cards: com candidaturas → chip `pending` "N candidaturas", meta "Escolha até {prazo}", CTA primário "Ver candidaturas" (→ S08). Sem candidaturas → chip `empty`, meta "Publicado há 3 h · 18 colegas avisados", CTA secundário com ícone "Compartilhar no grupo" (share nativo com deep link).
- Dica final 13 muted: "Sem candidaturas perto do prazo? Divulgue o link no grupo do WhatsApp ou estenda o prazo."

## S08 · Escolher substituto
`screens/png/S08-escolher-substituto.png`
- Cartão Tinta "Seu plantão" com título e data/hora.
- "N candidaturas" + "Todos com CRM verificado".
- Lista de `CandidateCard` (radio, um selecionado com ring Verde): iniciais, "Dra. [NOME]", "Especialidade · CRM-[UF] [Nº]", "Candidatou-se hoje, 14:32".
- Nota: "Os demais candidatos serão avisados quando você confirmar a escolha."
- Rodapé: "Selecionar e revisar condições" (desabilitado sem seleção) → S09.

## S09 · Confirmar condições
`screens/png/S09-confirmar-condicoes.png`
- `ProgressSteps` 5 segmentos (2 Verde, 1 Menta, 2 cinza) + "Etapa 3 de 5 · depois: aprovação da coordenação e registro".
- `KeyValueList`: Plantão · Período ("12/10, 19:00 → 13/10, 07:00") · Repassa · Assume · Responsabilidade ("Transferida integralmente à substituta a partir do início do plantão.").
- `InfoBanner` info de pagamento (frase fixa).
- Checkbox obrigatório com a frase fixa de concordância.
- Rodapé: "Assinar e enviar para aprovação" (se o grupo não exige aprovação: "Assinar e registrar acordo"). Desabilitado até marcar o checkbox. O mesmo layout serve para quem **assume** (vindo de S11), trocando o CTA para "Aceitar condições".

## S10 · Acordo registrado
`screens/png/S10-acordo-registrado.png`
- Cabeçalho Tinta com cantos inferiores 32: símbolo negativo 88, "Repasse confirmado", texto de sucesso.
- Cartão "Registro do acordo" + chip `registered` "Imutável"; bloco Mono: `ACORDO RPS-[ID]` / `registrado [DATA] [HORA]` / `sha256 [HASH]`.
- `AuditTrail`: Plantão publicado · Substituta selecionada · Condições aceitas pelos dois · Aprovado pela coordenação — com horários Mono.
- Rodapé: primário "Baixar acordo em PDF" + secundário "Voltar aos plantões".
- Sem nenhuma ação de edição.

## S11 · Notificações
`screens/png/S11-notificacoes.png`
- Top bar voltar + "Notificações".
- `NotificationItem`s: ação requerida (tile âmbar, ex.: "Você foi escolhido" + CTA "Confirmar condições" → S09) · novo plantão no grupo (Névoa) · novas candidaturas (Névoa) · acordo registrado (neutro).
- Cartão Tinta "Avisos de novos plantões" (resumo dos filtros) + link "Editar" (→ configuração de avisos, não desenhada: derivar com FilterChips e Toggles).

## Referência de componentes
`screens/png/REF-componentes.png` — botões, chip, cartão de plantão, selo de acordo e exemplos de tom de voz.

---

## Telas não desenhadas (derivar do sistema, sem inventar estilo novo)
Login/cadastro · Verificação de CRM · Onboarding · Lista de acordos (tab Acordos) · Perfil · Gestão de grupos e convites · Painel da coordenação (aprovar/recusar repasse) · Configuração de avisos · Estados de erro/vazio não listados.
Regra: usar apenas componentes da seção 6 do DESIGN.md e a estrutura de tela da seção 5. Listar essas telas no relatório final como "derivadas".
