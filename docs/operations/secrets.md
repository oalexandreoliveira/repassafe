# Segredos e configuração

`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` são públicas por desenho. `SUPABASE_SERVICE_ROLE_KEY`, `RATE_LIMIT_PEPPER`, `MONITORING_TOKEN` e `SUPABASE_DB_URL` são exclusivos do servidor e nunca devem usar prefixo `NEXT_PUBLIC_`. Segredos devem ficar no provedor de deploy, ser diferentes por ambiente e nunca aparecer em logs ou argumentos registrados. Rotação é obrigatória após exposição, desligamento de integrante ou incidente.

`SUPABASE_DB_URL` só é injetada no runner administrativo durante backup ou operação
de banco. `MONITORING_TOKEN` é fornecido apenas ao monitor de readiness. Ambos devem
ter acesso limitado aos responsáveis designados.
