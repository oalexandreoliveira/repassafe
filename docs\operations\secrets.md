# Segredos e configuração

`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` são públicas por desenho. `SUPABASE_SERVICE_ROLE_KEY` é exclusiva do servidor e nunca deve usar prefixo `NEXT_PUBLIC_`. Segredos devem ficar no provedor de deploy; rotação é obrigatória após exposição, desligamento de integrante ou incidente.
