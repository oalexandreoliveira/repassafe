# Rollback e recuperação de deploy

## Princípio

Aplicação é revertida para artefato conhecido; banco é corrigido à frente. Não
editar migration já aplicada e não usar `git reset --hard`, SQL improvisado ou
restauração destrutiva como primeira resposta.

## Aplicação

1. congelar deploys e declarar incidente;
2. identificar último commit saudável e confirmar compatibilidade com o schema;
3. promover novamente o artefato anterior na Vercel;
4. validar `/api/health`, `/api/ready`, login e fluxo central;
5. manter o banco no schema mais novo se ele for retrocompatível;
6. monitorar por 30 minutos e registrar commit revertido/recuperado.

## Banco

Migrations devem usar expansão/contração: primeiro adicionar estruturas compatíveis,
depois migrar dados e somente em entrega posterior remover o legado. Se uma
migration falhar:

- interromper promoção antes da aplicação;
- se parcialmente aplicada, criar migration corretiva idempotente;
- comparar `supabase migration list` com o histórico remoto;
- usar `migration repair` apenas para corrigir histórico já comprovado, nunca para
  fingir que SQL foi executado;
- restaurar backup/PITR somente para corrupção ou perda de dados confirmada, com
  aprovação do comandante e janela de indisponibilidade.

## Go/no-go

Rollback é aceito quando aplicação, banco e Storage estão prontos, smoke test passa,
auditoria permanece íntegra e nenhuma escrita válida foi perdida. Caso contrário, o
incidente continua aberto.
