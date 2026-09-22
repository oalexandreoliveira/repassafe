# Backup e restauração

O provedor deve manter backup automático e retenção documentada. Antes da beta: restaurar o backup mais recente em ambiente isolado, comparar contagens e constraints, executar testes de RLS, registrar duração e destruir a cópia temporária. O teste não pode usar desenvolvimento nem sobrescrever produção.
