# Monitoramento e alertas

## Sinais

| Sinal                     | Origem                            | Alerta inicial                       |
| ------------------------- | --------------------------------- | ------------------------------------ |
| Liveness                  | `GET /api/health`                 | 3 falhas consecutivas em 5 min       |
| Readiness                 | `GET /api/ready` com Bearer token | qualquer 503; S1 após 5 min          |
| Erros HTTP/Server Actions | logs estruturados da aplicação    | >5% em 5 min                         |
| Latência readiness        | `checks.*.durationMs`             | >2 s por 5 min                       |
| Auth/PostgREST/Storage    | Supabase Logs/Health Advisors     | erro sustentado ou indisponibilidade |
| Banco                     | Supabase Database Health          | conexões, CPU ou disco >80%          |
| Backups                   | painel/relatório operacional      | ausência de backup no RPO            |

`/api/health` prova apenas que o processo responde. `/api/ready` verifica banco e
bucket privado com timeout de três segundos e não devolve contagens, nomes ou erros
internos. `MONITORING_TOKEN` deve ser diferente por ambiente e enviado apenas em
header. Rotacione-o após exposição.

Teste manual/externo:

```bash
# Com READINESS_URL e MONITORING_TOKEN previamente injetados pelo cofre:
pnpm check:readiness
```

## Logs

Cada requisição recebe `x-request-id`, também devolvido ao cliente para suporte. Os
logs usam JSON com nível, evento, ambiente, timestamp e correlação. O sanitizador
remove chaves sensíveis inclusive em objetos aninhados. Não registrar corpo de
formulário, e-mail, IP, tokens, cookies, dados de pacientes ou dumps de erro do
provedor.

Retenção inicial: 30 dias para logs operacionais e conforme política específica
para auditoria de negócio. A equipe deve acompanhar custos de ingestão e reduzir
ruído sem remover eventos de segurança.

## Responsabilidade

- responsável técnico: disponibilidade, erros e rollback;
- administrador da beta: impacto funcional e comunicação;
- encarregado definido pelo projeto: suspeita de privacidade;
- fornecedor: incidente comprovadamente localizado na plataforma.

Como produção ainda não está provisionada, a ativação do monitor externo e dos
destinos de alerta é um gate de lançamento, não uma configuração fictícia neste
repositório.
