# Runbook de incidentes

| Severidade | Exemplo                                                   | Resposta inicial | Atualização      |
| ---------- | --------------------------------------------------------- | ---------------- | ---------------- |
| S1         | vazamento, acesso indevido, corrupção, fluxo indisponível | imediata         | 30 min           |
| S2         | função crítica degradada, backup/RLS reprovado            | até 1 h          | 2 h              |
| S3         | erro com contorno                                         | até 1 dia útil   | diária           |
| S4         | dúvida ou defeito cosmético                               | fila normal      | conforme suporte |

## Processo

1. declarar incidente, comandante e canal restrito;
2. registrar horário, commit, ambiente e sintomas, sem dados sensíveis;
3. conter: pausar deploy, desabilitar função ou restringir acesso;
4. preservar logs, auditoria e identificadores de correlação;
5. decidir entre correção à frente, rollback de aplicação ou restauração;
6. comunicar impacto conhecido, contorno e próxima atualização;
7. validar banco, duplicidade, comandos pendentes e fluxo completo;
8. encerrar e produzir análise sem culpabilização em até cinco dias úteis.

Em S1 de privacidade, revogar sessões e segredos afetados, preservar evidência mínima
e acionar o responsável de privacidade. Nunca copiar dados de pacientes para logs,
chats ou tickets.

## Critério de recuperação

Health e readiness verdes não bastam: executar smoke test, consultar auditoria,
confirmar que não há duas substituições vivas por oferta e verificar a migration
aplicada. Monitorar intensivamente por ao menos 30 minutos após normalização.
