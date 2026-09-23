# Evidência de validação operacional — Passo 6

Data: 2026-09-23

Ambiente: staging

Commit implantado: `ad1c5b4e5e854957fd4f62d7218703d2b30717b7`

## Monitoramento

- `GET /api/health` respondeu `status: ok` pelo domínio estável após o teste de
  rollback.
- `GET /api/ready`, autenticado com token rotacionado, aprovou aplicação, banco e
  Storage após novo deployment.
- O token de monitoramento permaneceu somente no cofre da Vercel e no gerenciador
  de segredos do operador; o valor não foi registrado nesta evidência.

## Banco e segurança

- O histórico remoto foi reconciliado com as cinco migrations versionadas.
- As migrations de identidade/administração, fluxo de repasse e
  segurança/rate limiting foram aplicadas ao staging.
- `supabase db lint --linked --level warning --fail-on error`: aprovado, sem erros.
- Security Advisors: aprovado, sem issues.

## Backup e restauração

- Backup lógico pós-migração: `repassafe-staging-20260923T225510Z`.
- Snapshot criado em `2026-09-23T22:56:05.9077468Z`.
- Hashes SHA-256 de `schema.sql`, `data.sql` e `roles.sql`: conferidos com o
  manifesto, todos válidos.
- O dump contém 12 tabelas de aplicação nos schemas `public` e `private`; o dump
  de dados contém somente as 11 tabelas de `public`, sem tabelas gerenciadas de
  `auth` ou `storage`.
- A restauração foi executada em projeto Supabase isolado e concluída em uma
  transação, sem reaplicar papéis reservados.
- As contagens das 12 tabelas comparadas entre staging e restore coincidiram:
  uma instituição, um grupo e zero linhas nas demais tabelas.
- RPO observado no ensaio: zero divergências entre o snapshot e o destino.
- RTO observado na janela manual do ensaio: inferior a uma hora, dentro da meta
  inicial de quatro horas.

Durante o ensaio, uma limpeza foi executada no schema `public` do staging. O
incidente foi detectado antes do push de migrations, o staging foi recuperado
atomicamente a partir do backup anterior e as contagens foram confirmadas antes
da continuidade. Produção não foi afetada. Como ação preventiva, a preparação do
destino agora valida o project ref na conexão e usa
`scripts/prepare-isolated-restore.sql` somente no projeto temporário.

## Rollback de aplicação

- Um novo artefato do commit saudável foi gerado e validado.
- O artefato anterior foi promovido novamente para Production na Vercel.
- O domínio estável continuou respondendo ao health check.
- Após rotação do `MONITORING_TOKEN` e redeploy, o readiness autenticado aprovou
  aplicação, banco e Storage.
- Limitação registrada: os dois artefatos usavam o mesmo commit. O ensaio valida
  a mecânica de promoção/reversão da Vercel, mas a compatibilidade entre versões
  diferentes deverá ser repetida quando houver um segundo commit saudável.

## Resultado

Monitoramento, backup lógico, restauração isolada, reconciliação de migrations,
recuperação e rollback operacional foram exercitados com sucesso. O projeto
temporário deve ser removido após a aprovação desta evidência.
