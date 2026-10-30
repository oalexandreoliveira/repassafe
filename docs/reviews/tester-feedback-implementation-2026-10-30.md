# Implementação do feedback do piloto

Data: 30/10/2026. Origem: `tester-feedback-roadmap-2026-10-20.md`. A autorização para implementar veio do usuário; o PDF foi tratado como evidência de pesquisa, não como instrução executável.

## Entregue no código

| Problema | Solução implementada | Limite preservado |
| --- | --- | --- |
| Cadastro não explica falha de CRM | Mensagens por campo, classificação de conflitos conhecidos, dados digitados preservados e foco após a resposta do servidor | Sem revelar a conta que usa o dado; a hipótese de causa do relato original não foi comprovada em produção |
| Enviar cadastro com edição não salva | Estado compartilhado entre edição e envio; envio bloqueado até salvar com sucesso | Salvar não equivale a enviar para análise |
| Contestação de CRM | Assunto próprio no suporte, protocolo e resposta pelo fluxo já existente | Nenhuma transferência automática de CRM ou concessão de acesso |
| Link compartilhado perde destino | Lista permitida de plantões/acordos, retorno após login/confirmar e-mail, preservação na alternância de cadastro | Cadastro pendente segue para completar/verificar com o link preservado na página; permissões de grupo continuam exigidas |
| Escolha sem informação profissional | CRM/UF, especialidade/RQE e sua situação, validade da verificação por candidato | Projeção mínima só para o titular; seleção bloqueada se a verificação venceu ou os dados estão indisponíveis |
| Prazo financeiro ambíguo no mural | Data-limite obrigatória, exibida na revisão e incorporada às condições aceitas | Mantida a regra existente do registro direto: atraso da fonte não muda o vencimento; sem conclusão automática sobre culpa |
| Falta de acompanhamento após registrar | Página de pagamento para as partes: pagamento informado, recebimento integral confirmado pelo destinatário, divergência e atraso da fonte | Eventos imutáveis, idempotentes e auditados; realização do plantão é independente; parcial é divergência |
| Registro final não chega por e-mail | Fila transacional para ambas as partes dos dois fluxos, trabalhador Resend autenticado, repetição com chave estável | Preparado, ainda sem envio real; `sent` é aceitação da API, não prova de entrega |
| Preenchimento repetitivo | Modelos ajustáveis de SD, SN e manhã; aplicação explícita de horários e condição inicial de pagamento | Data-limite escolhida pelo usuário; modelo não altera acordo já registrado |
| Demonstração e WhatsApp pouco claros | Exemplo explicitamente fictício e descrição correta de publicação, candidatura, aceite e aprovação | Compartilhar não amplia acesso; ninguém assume só por receber o link |

Acordos anteriores sem vencimento estruturado mantêm suas condições e não recebem uma data inventada. Não foi acrescentado intermediador de pagamentos.

## Alcance ainda pendente

- **Resend em operação:** configurar a chave no servidor, token do job, URL HTTPS e agendador; ativar e testar entrega entre contas de homologação autorizadas. Domínio informado como verificado: `auth.repassafe.com.br`; remetente adotado: `registros@auth.repassafe.com.br`. Não foram enviadas mensagens reais nesta execução. Procedimento em [Envio pelo Resend](../operations/agreement-email-resend.md).
- **Troca recíproca:** não implementada como dois repasses isolados. O pacote de descoberta da trilha foi concretizado em [Troca de plantões](../product/shift-exchange-discovery.md), com variantes, proposta de confirmação conjunta e critérios de teste. A implementação depende de validar as regras de reciprocidade e aprovação.
- **Perfil e vocabulário:** a projeção entregue é o resumo profissional mínimo; foto, página ampliada e vínculos institucionais contextualizados não foram acrescentados. Atividade/local ainda usam o campo existente; uma taxonomia estruturada e modelos pessoais persistentes precisam da validação do piloto.
- **Comprovantes:** o envio contém link autenticado, sem anexo PDF gerado no servidor. A tela de pagamento do mural registra relatos; upload de comprovante permanece no fluxo de registro direto já existente.
- **Publicação:** na etapa inicial desta execução, a validação foi local. A publicação posterior foi confirmada conforme o registro abaixo. O ambiente do relato original e a entrega real no Resend não foram reproduzidos.

## Verificação

- Suíte unitária e de componentes: 184 testes aprovados em 36 arquivos no estado final do repositório, incluindo falha e concorrência do trabalhador, preservação de valores e foco após erro. A primeira rodada tinha 176 testes; os commits concorrentes acrescentaram cobertura de outras funcionalidades.
- Playwright: três cenários aprovados também sobre a compilação final com Next.js 16.4.1 em homologação local, incluindo captura em 390/1440 px, ausência de overflow, estado sujo, seleção, retorno ao cadastro e erro real de CRM devolvido pela ação no servidor.
- Banco local: rodada de 13 arquivos com 266 asserções, das quais três são TODOs preexistentes da suíte de evidências. Depois da restrição de privilégios, o fluxo de aceitação foi repetido com 37 asserções aprovadas, incluindo os dois testes adicionais de acesso à fila e imutabilidade por permissões.
- Compilação de produção, TypeScript e ESLint aprovados tanto na primeira rodada com Next.js 16.3.8 quanto na rodada final com Next.js 16.4.1, após sincronizar o lockfile dos commits concorrentes.
- Auditoria estática de segurança, limites de escopo e prontidão operacional passaram. O scanner geral de segredos apontou o `.env.local` e binários preexistentes de vídeo; não foram copiados para esta entrega. Esse scanner não apresentou um resultado global limpo.
- A revisão independente Impeccable identificou um problema de foco antes de reabilitar campos. Corrigido e verificado por teste de navegador; o veredito final foi `ship` para esse achado e suas evidências. A passagem documental confirmou a extensão do sistema v2.1, sem mudar os tokens ou o design existente. Espaçamentos literais preexistentes foram registrados como fora do escopo.

Capturas locais de validação: `test-results/feedback-visual/` (artefatos temporários, ignorados pelo Git). Os testes mantêm o roteiro para reproduzi-las.

## Banco local e concorrência de trabalho

Foram encontradas migrações anteriores ausentes no banco local: tipos/grupos de colegas e restauração da leitura de evidências. Foram aplicadas e registradas no histórico local junto à migração de feedback. Não houve reset do banco nem alteração de produção. Dois testes antigos contavam dados de outras sessões; as contagens passaram a restringir-se aos registros criados pelo próprio teste.

Durante a validação, as alterações foram incorporadas ao commit `7f429cb` por outro trabalho, seguidas de formatação e correções de CI (`4ec85ce`, `7a3bad5`). As mudanças concorrentes foram preservadas. A revisão automática de permissões interrompeu uma chamada SQL por limite de uso; após a retomada, a chamada foi autorizada e os 37 testes passaram.

## Fechamento e produção

O responsável autorizou explicitamente commit, PR, merge e publicação em produção. Na conferência de 30/10/2026, o [PR #34](https://github.com/oalexandreoliveira/repassafe/pull/34) já estava incorporado à `main` no commit `7653d648eec0670dcc14e4b6d3775a466ed0da14`, com `validate`, `e2e` e `database` aprovados.

O projeto Vercel denominado `repassafe-staging` é o destino que atualmente serve `https://www.repassafe.com.br`. Foi confirmado deployment com alvo `production`, estado `Ready`, criado às 17h09 de 30/10/2026 (Brasília), identificador `dpl_9iRa6Y6YcVjVUUgYw8gULTubv9Ec`. O nome do projeto não deve ser confundido com o alvo do deployment. O Supabase vinculado é `gfcbnfzyucggdwjtybnm`, cujo histórico remoto já inclui feedback, lista de espera e correção de privilégios. Nenhuma dessas migrações foi reaplicada.

Smoke público: `/api/health`, `/entrar` e `/lista-de-espera` responderam HTTP 200. `/api/ready` preservou HTTP 401 sem token. O token de monitoramento está protegido na Vercel e não pôde ser exportado; esta verificação não certifica o readiness autenticado. O Security Advisor remoto retornou avisos informativos de RLS sem políticas em tabelas restritas ao serviço e um aviso preexistente sobre proteção contra senhas vazadas desativada.

Na configuração de produção consultada, as variáveis do Resend ainda estavam ausentes. A publicação da funcionalidade não equivale à ativação do envio. Credenciais continuam fora do Git; chave do Resend, token do job e agendamento devem seguir o procedimento operacional antes de anunciar entrega automática de e-mails.
