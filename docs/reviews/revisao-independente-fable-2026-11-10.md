# Repassafe | Revisão independente (Fable 5.2)

**Data: 10/11/2026.** Versão revisada: `main` em `5764a72`. Não há commits posteriores; a árvore local tem apenas o trabalho em andamento de testes PostgREST (`package.json`, `vitest.config.ts`, `.github/workflows/ci.yml`, `tests/postgrest/`), que não foi avaliado.

## Como foi feito e o que não foi coberto

- Leitura das 30 migrations até a última definição de cada função, das ações de servidor, das rotas de acordo e pagamento e das filas de e-mail.
- Quatro comportamentos reproduzidos no banco local (`supabase_db_repassafe`) em transações encerradas com `ROLLBACK`. Estão marcados **Reproduzido**. Esse banco está em `20261030160000` e não tem `20261001120000`, `20261008120000`, `20261030170000` nem `20261103120000`; as funções exercitadas não dependem delas.
- Suíte unitária e de componentes: 236 testes em 42 arquivos, todos aprovados nesta rodada.
- **Não executado:** `supabase test db`, Playwright, navegação real das telas (contraste, teclado, zoom, celular), entrega de e-mail, ambiente publicado. O PR #38 não foi aberto. As conclusões de UI vêm só da leitura do código.

## Achados que pedem correção antes de dados reais

### 1. Conta suspensa ou rejeitada volta a "pendente" reenviando o cadastro — **Reproduzido**

- **Jornada e papel:** cadastro; registro direto (fluxo B). Profissional suspenso ou rejeitado.
- **Onde:** `supabase/migrations/20260929204920_full_registration.sql:107-119` (`registration_save` zera o estado para `incomplete` sem condição), `:128-150` (`registration_submit` grava `status='pending'` no perfil, linha 145), `src/app/cadastro/actions.ts:22-31` e `:96-157` (as ações só exigem sessão), `supabase/migrations/20261007034010_external_agreement_registration.sql:79` (`external_eligible` aceita `pending` sem validade).
- **Reprodução:** aprovar um cadastro, registrar decisão `suspended`, chamar `registration_save` e `registration_submit` com a revisão seguinte. Resultado observado: `suspended, eligible=false` → `pending, eligible=true`.
- **Efeito:** a suspensão é desfeita pelo próprio suspenso. Ele volta a criar e aceitar acordos diretos, e a contraparte vê "análise pendente" em vez da situação real. O mesmo vale para um cadastro rejeitado (por exemplo, CRM incompatível), indefinidamente.
- **Correção mínima:** em `registration_save` e `registration_submit`, recusar quando `profiles.status = 'suspended'`; decidir com produto se `rejected` pode reenviar. Em `external_eligible`, aceitar `pending` apenas quando a última decisão em `private.registration_decisions` não for `rejected` nem `suspended`.
- **Teste de regressão:** em `supabase/tests/registration.sql`, suspender e afirmar que `registration_submit` falha e que `private.external_eligible` continua falso; repetir para rejeição conforme a decisão.
- **Confiança:** alta.

### 2. Aprovação institucional sem segregação, sem revalidação das partes e sem limite de tempo — **Reproduzido**

- **Jornada e papel:** grupo com aprovação (fluxos A e B). Aprovador, titular, substituto.
- **Onde:** ramo `decide_substitution` em `supabase/migrations/20260923000759_core_shift_flow.sql:547-605`; `supabase/migrations/20261030144738_tester_feedback.sql:32-37` (a guarda só confere o candidato, e só em `select_candidate` e `confirm_substitution`); fluxo direto em `20261007034010_external_agreement_registration.sql:203`.
- **Reprodução:** titular com vínculo `approver` no próprio grupo publica, o substituto aceita, o substituto é suspenso, o horário de início passa, o titular envia `decide_substitution` com `approved: true`. Resultado observado: acordo criado.
- **Efeito:** três falhas independentes. (a) Uma parte aprova o próprio repasse. `upsertMembershipAction` (`src/app/admin/actions.ts:187-225`) permite dar `approver` a um médico. (b) Ninguém é reconferido na decisão: um substituto suspenso entre o aceite e a aprovação vira parte de um acordo confirmado; o titular nunca é reconferido, nem no aceite. (c) A aprovação pode ocorrer depois do início do plantão e gera acordo retroativo. O fluxo direto bloqueia (b) e (c), mas não (a).
- **Correção mínima:** em `decide_substitution`, recusar quando o ator é `owner_id` ou `substitute_id`; para aprovar, exigir as duas partes com `status='approved'`, papel `doctor` e validade vigente, e `starts_at > now()`. Em `confirm_substitution`, conferir também o titular. No fluxo direto, recusar `approve` quando `actor in (owner_id, substitute_id)`.
- **Teste de regressão:** em `supabase/tests/mvp_acceptance_flow.sql` e `external_agreements.sql`, três casos negativos (parte aprovadora, parte suspensa, plantão iniciado) e o caso positivo com aprovador distinto.
- **Confiança:** alta para o comportamento. A regra de segregação (a) é decisão de produto: pode haver coordenador que também faz plantão.

### 3. "Aguardando aprovação" não tem saída nem prazo — **Reproduzido (parcial)**

- **Jornada e papel:** grupo com aprovação (fluxo A). Titular e substituto.
- **Onde:** `supabase/migrations/20260924153340_align_core_workflow_rules.sql:138-142` (a expiração só trata `pending_substitute_confirmation`); `20260923000759_core_shift_flow.sql:386` (`cancel_offer` exige oferta aberta); `20260928120000_completion_both_sides_and_evaluations.sql:219-228` (cancelamento e desistência exigem `confirmed`).
- **Reprodução:** com a substituição em `pending_institutional_approval`, `cancel_offer` falha com "A oferta não pode mais ser cancelada" (observado). Desistência e cancelamento exigem `confirmed` (leitura do código).
- **Efeito:** se a coordenação não decidir, o titular não consegue liberar a oferta para outra pessoa e o substituto não consegue desistir. O plantão passa com a oferta em `selection_in_progress` e nenhuma das partes recebe aviso. É o caso em que o médico sai da escala achando que há cobertura.
- **Correção mínima:** em `private.expire_stale_shift_workflows`, encerrar a pendência quando `starts_at <= now()` (ou com antecedência definida pelo produto), com auditoria e notificação às partes e aos aprovadores; permitir que titular ou substituto retirem o pedido com justificativa enquanto aguardam.
- **Teste de regressão:** substituição pendente com início no passado é encerrada pelo job e gera duas notificações; retirada pelas partes devolve a oferta ao estado aberto.
- **Confiança:** alta.

### 4. `service_role` pode escrever, apagar e truncar quase toda a evidência — **Confirmado no catálogo local**

- **Jornada e papel:** todas. Papel de servidor.
- **Onde:** privilégios padrão do Supabase não revogados. `supabase/tests/evidence_integrity.sql:103-109` e `:176-185` cobrem `agreement_documents`, `agreement_evidence_events` e `external_agreements`.
- **Constatação:** no banco local, `service_role` tem `INSERT, UPDATE, DELETE, TRUNCATE` também em `audit_events`, `shift_agreements`, `external_agreement_events`, `workflow_commands`, `substitutions`, `shift_completions` e `notifications`. Só `agreement_payment_events` está restrita a `SELECT`. O alcance é maior que os três TODOs.
- **Efeito:** os gatilhos de imutabilidade são por linha e não disparam em `TRUNCATE`. `INSERT` direto em `agreement_evidence_events` permite fabricar um elo válido da cadeia. A chave privilegiada é usada em cerca de vinte pontos do servidor, inclusive em páginas de leitura (`src/lib/shifts/data.ts:158`, `src/app/acordos/[id]/page.tsx:104`), então um defeito de aplicação alcança esses privilégios.
- **Correção mínima:** migration que faz `revoke all ... from service_role` nas tabelas de evidência, auditoria e comandos, concede só o `SELECT` (e as colunas de fila) necessário, adiciona gatilho `BEFORE TRUNCATE` por instrução e ajusta `alter default privileges` para tabelas futuras. Antes, mapear o que o servidor grava com a chave: `recordAuditEvent` insere em `audit_events` e precisa virar função `security definer`.
- **Teste de regressão:** converter os três TODOs em asserções obrigatórias e acrescentar um laço sobre todas as tabelas imutáveis conferindo ausência de `INSERT/UPDATE/DELETE/TRUNCATE`; manter os testes de leitura pelas partes e de criação e aprovação de acordo.
- **Confiança:** alta para os privilégios; média para a lista de escritas legítimas, que precisa do mapeamento.

### 5. No mural, o aceite não fica vinculado ao documento que o registra

- **Jornada e papel:** oferta no mural (fluxo A). Substituto e aprovador.
- **Onde:** `20260923000759_core_shift_flow.sql:482-545` (o aceite não carrega hash); `20260924153340_align_core_workflow_rules.sql:35-38` (só um booleano `terms_acknowledged`); `20260924153352_agreement_evidence_dossier.sql:138-231` (o documento nasce na inserção do acordo e o evento `substitute_accepted` é gravado com o hash desse documento e `occurred_at` retroativo, linhas 215-227).
- **Efeito:** a cadeia afirma que o substituto aceitou, no instante T, um hash que só passou a existir depois, na aprovação. Não há prova técnica da versão exibida. O instantâneo do acordo tem `starts_at, ends_at, sector, value_cents, payment_terms` e identificadores; as observações da oferta, que o substituto leu ao aceitar, não entram no documento (observado nas chaves do instantâneo).
- **Correção mínima:** gerar os termos canônicos e o hash em `select_candidate`, gravá-los na substituição, exigir `terms_hash` igual no `confirm_substitution` e no `decide_substitution`, e fazer o documento final referenciar esse hash. Incluir as observações nos termos. Documentos v1 seguem válidos com `schema_version` próprio.
- **Teste de regressão:** os do briefing (hash da versão A contra a B deve falhar; reprodução do conteúdo exibido; documento v1 preservado; duas confirmações concorrentes).
- **Confiança:** alta para a lacuna (leitura do código). Não testei concorrência.

### 6. A reconferência de validade no aceite é contornável por tipo — **Reproduzido**

- **Jornada e papel:** oferta no mural. Substituto com verificação vencida durante a janela de 30 minutos.
- **Onde:** `20261030144738_tester_feedback.sql:34` compara `payload->>'accepted' = 'true'`; o fluxo central converte com `::boolean` (`core_shift_flow.sql:492`). `workflow_commands` aceita `INSERT` direto do cliente autenticado (`core_shift_flow.sql:146`).
- **Reprodução:** com a validade vencida, `{"accepted": true}` é bloqueado e `{"accepted": "yes"}` é aceito (observado).
- **Efeito:** exige chamada direta à API REST e só contorna a validade, não a suspensão. Baixo impacto isolado, mas é a única barreira dessa regra.
- **Correção mínima:** usar `coalesce((new.payload->>'accepted')::boolean, false)` na guarda, ou recusar quando `jsonb_typeof(new.payload->'accepted') <> 'boolean'`.
- **Teste de regressão:** os dois payloads acima em `supabase/tests/core_shift_flow.sql`.
- **Confiança:** alta.

### 7. Versão dos documentos legais: trocar texto ou constante quebra algo

- **Jornada e papel:** cadastro. Conta nova, em correção, em revalidação.
- **Onde:** `20260929204920_full_registration.sql:137` (exige dois aceites de `'2026-09-29'`); `src/app/auth/actions.ts:159-166` e `src/app/cadastro/actions.ts:159-177` (gravam o aceite com a constante `legalVersion`); `:23-30` da migration (a tabela guarda só o hash, não o texto).
- **Efeito:** confirmo a leitura do briefing. Mudar só a constante impede todo envio de cadastro novo. Mudar só o texto grava hashes diferentes sob a mesma versão. Além disso, o texto aceito só é recuperável pelo histórico do git.
- **Correção mínima:** tabela de versões por documento com conteúdo, hash e vigência; `registration_submit` confere a versão vigente de cada documento a partir dela. Publicar a migration aceitando as duas versões antes do código.
- **Teste de regressão:** os quatro estados de conta do briefing durante a coexistência; hash antigo continua resolvendo para o texto antigo.
- **Confiança:** alta para o mecanismo. Quem precisa reaceitar é decisão jurídica.

## Achados de menor urgência

| # | Achado | Onde | Efeito e correção | Confiança |
| --- | --- | --- | --- | --- |
| 8 | Validade vencida bloqueia o encerramento de um plantão já acordado | `src/lib/shifts/data.ts:12-35`, usado em `src/app/plantoes/actions.ts:187` e em `getShiftDetails` | O médico cuja verificação de 90 dias venceu depois do plantão não abre `/plantoes/[id]` nem registra ou confirma a realização, até revalidar. Reenviar o cadastro (estado `pending`) bloqueia também no banco. Contraria o comentário "Expiration blocks new commitments". Separar a guarda de compromissos novos da de encerramento por parte do acordo. | Média (leitura; não navegado) |
| 9 | Vínculo removido durante a seleção não é reconferido | `core_shift_flow.sql:446-545` | Candidato removido do grupo depois de se candidatar ainda pode ser escolhido e aceitar. No grupo institucional o aprovador é a barreira; no grupo de colegas não há nenhuma. Reconferir o vínculo ativo em `select_candidate` e `confirm_substitution`. | Alta |
| 10 | No registro direto, o aprovador lê pagamentos e divergências | `20261007034010_external_agreement_registration.sql:97-109` | O aprovador do grupo lê todos os eventos, inclusive valor pago e texto de divergência. No mural, esses eventos são restritos às partes (`tester_feedback.sql:76-78`). O arquivo do comprovante está corretamente restrito. Filtrar eventos financeiros para as partes. | Alta |
| 11 | Limite de requisições só existe na ação de servidor | `core_shift_flow.sql:146`, `free_shift_offers.sql:83-95` | Um médico aprovado pode inserir `publish_offer` direto pela API REST; cada oferta livre notifica todos os perfis aprovados. Mover o limite para o gatilho ou trocar o `INSERT` por RPC. | Média |
| 12 | Acordos antigos recebem o papel "Quem repassa e paga" | `src/components/screens/payment-tracking.tsx:74-77`, `tester_feedback.sql:94` | Para acordos sem data-limite estruturada, a tela e a função assumem que o titular paga, mesmo que as condições originais digam outra coisa. Confirmar com produto; se não valer, rótulo neutro e relato de pagamento por qualquer parte. | Média (depende de produto) |
| 13 | Verificação da cadeia não cobre `occurred_at` | `src/app/acordos/[id]/page.tsx:71-82` | A tela exibe a coluna, mas só compara `recorded_at` com o conteúdo com hash. Exige acesso privilegiado; resolve junto com o item 4. | Alta |
| 14 | UI: aviso de pacientes e status | `src/components/agreement-forms.tsx:254` e `:411`, `src/components/registration-form.tsx:167`, `src/app/acordos/registrados/[id]/page.tsx:146-148` | O fluxo direto usa "(sem dados de pacientes)" no rótulo em vez da frase fixa; "Resposta às correções" não tem aviso; o status do acordo direto é texto em negrito, sem a cor da tabela de status. Não há hex fora dos tokens. | Alta (leitura) |
| 15 | Ação de perfil sem efeito | `src/app/auth/actions.ts:192-236` | `updateProfileAction` atualiza colunas cujo privilégio foi revogado em `full_registration.sql:68`; sempre falha. Remover ou redirecionar ao cadastro versionado. | Alta |

## Correções aplicadas na árvore local (10/11, não commitadas)

Itens 1, 2, 3 e 6 em `supabase/migrations/20261110120000_review_blockers.sql`, com 37 asserções em `supabase/tests/review_blockers.sql`. Migration e testes rodaram no banco local dentro de uma transação desfeita; as oito suítes SQL existentes exercitadas deram o mesmo resultado antes e depois. A migration não foi aplicada a nenhum banco.

Decisões tomadas onde o produto ainda não decidiu, todas reversíveis:

- **Suspensão:** o suspenso pode reenviar o cadastro, que entra na fila, mas o perfil continua suspenso até decisão da equipe. Bloquear o reenvio deixaria a suspensão sem saída, porque `registration_review` não aceita rascunho em estado `rejected`.
- **Rejeição:** pode reenviar e volta a `pending`, mas a exceção do registro direto só vale para quem nunca teve decisão negativa.
- **Segregação:** quem é parte não aprova nem rejeita o próprio repasse, no mural e no registro direto.
- **Prazo:** a aprovação pendente expira no início do plantão, sem antecedência.
- **Retirada:** desistência do substituto devolve a oferta ao mural; retirada pelo titular cancela a oferta; nenhuma abre ocorrência.

A tela do plantão ganhou "Retirar pedido antes da decisão" (`src/components/screens/shift-detail.tsx`) e o e-mail de cancelamento deixou de dizer "confirmado" (`src/lib/critical-email.ts`). A tela não foi conferida no navegador.

### 16. Depois de uma recusa ou expiração, o titular não consegue escolher outro candidato

- **Jornada e papel:** oferta no mural. Titular.
- **Onde:** `supabase/migrations/20260924153352_agreement_evidence_dossier.sql:299-307` exige que a última confirmação de condições do titular não seja anterior a `shift_offers.updated_at`; a recusa, a expiração do aceite e a rejeição institucional gravam `updated_at = now()` (`20260923000759_core_shift_flow.sql:502-504`, `:599-601`; `20260924153340_align_core_workflow_rules.sql:169-171`).
- **Reprodução:** encontrado ao testar o item 3. Com `updated_at` um segundo depois da publicação, como ocorre quando a recusa é gravada em outra transação, `select_candidate` falha com "Titular precisa revisar as condições antes da seleção". Os testes existentes não pegam porque rodam em uma única transação, onde `now()` é constante.
- **Efeito:** a oferta volta ao mural, mas o titular não seleciona mais ninguém, e não pode editar para reconfirmar porque já há candidaturas. O e-mail de prazo encerrado orienta justamente a escolher outra candidatura.
- **Correção mínima:** comparar a confirmação com um carimbo próprio de alteração das condições (gravado só em `publish_offer` e `update_offer`), não com `updated_at`.
- **Teste de regressão:** recusa seguida de nova seleção, com `updated_at` avançado.
- **Confiança:** alta para o mecanismo; reproduzido por emulação do intervalo, não com duas sessões reais.
- **Situação:** corrigido na árvore local em `supabase/migrations/20261110130000_offer_terms_changed_at.sql`. A coluna `shift_offers.terms_changed_at` só muda quando uma condição muda (gatilho na tabela), e a seleção compara a confirmação do titular com ela. Ofertas existentes recebem a data da última confirmação do titular. Quatro asserções novas em `supabase/tests/review_blockers.sql` (41 no total), rodadas em transação desfeita. Não aplicado a nenhum banco.

## O que percorri e não encontrei problema

- **Terceiro sem vínculo:** políticas de leitura de ofertas, candidaturas, substituições, acordos, documentos, eventos, pagamentos e comprovantes restringem a partes e aprovadores ativos. O convite direto só é legível pelo e-mail confirmado do destinatário.
- **Grupo de colegas:** não cria aprovador nem exige aprovação (restrições de tabela e gatilho de papel); convite guarda só o hash do token; remoção pelo gestor invalida convites anteriores.
- **Indisponibilidade da evidência:** `/acordos/[id]` mostra aviso quando o documento não é lido e oculta o acompanhamento de pagamento quando a cadeia não é verificável.
- **Administração:** todas as ações e páginas administrativas passam por `requireAdminIdentity` (concessão ativa e `aal2`); `review_occurrence` reconfere no banco.
- **Filas de e-mail:** aquisição por comparação de estado e tentativas, chave de idempotência estável, avisos de seleção expiram no prazo de confirmação. Corpo sem dados do plantão.

## Depende de homologação, operação ou decisão

- **Homologação:** migrations aplicadas no ambiente real (o banco local desta máquina está quatro migrations atrás, o que mostra que o desvio acontece); agendador de um minuto; recebimento observado dos e-mails; restauração com Auth e Storage; testes de navegador em 360, 390 e 1440 px, teclado e zoom.
- **Operação do piloto:** quem são os aprovadores do primeiro grupo e se algum também faz plantão (item 2a); tempo real de decisão da coordenação (item 3).
- **Jurídico e produto:** reaceite dos documentos e menção ao Resend (item 7); se cadastro rejeitado pode reenviar (item 1); antecedência para expirar aprovação pendente (item 3); pagador em acordos antigos (item 12).

## Três decisões para o responsável

1. **Corrigir antes de usar dados reais: itens 1 a 7.**
   Critério de aceite: `supabase test db` sem nenhum TODO em `evidence_integrity.sql`; testes novos para suspensão que não volta a pendente, aprovação recusada para parte, parte suspensa e plantão iniciado, pendência de aprovação que expira e pode ser retirada, aceite com hash divergente recusado, `accepted: "yes"` recusado; cadastro novo enviado com a versão legal vigente em homologação.

2. **Validar no primeiro grupo: itens 8 a 10 e a entrega dos avisos.**
   Critério de aceite: duas pessoas acompanhadas da publicação ao encerramento em grupo com aprovação; registro separado de criação, aceitação pelo provedor e recebimento do e-mail de seleção dentro dos 30 minutos; ao menos uma aprovação decidida e uma deixada sem decisão até o início, com as duas partes avisadas; um encerramento feito por conta com validade vencida.

3. **Pode aguardar dados do piloto: itens 11 a 15 e o desenvolvimento mapeado** (dossiê em PDF, aditivos, troca recíproca, modelos pessoais).
   Critério de aceite: cada item só entra quando houver ocorrência registrada no piloto (abuso de publicação, dúvida sobre pagador em acordo antigo, pedido de exportação) ou decisão de produto anotada.
