# Promoção e deploy

1. Abrir PR e aguardar `validate` e `e2e`.
2. Revisar migrations, RLS e auditoria.
3. Implantar em homologação e executar smoke test.
4. Registrar aprovação de produto.
5. Promover o mesmo commit para produção.
6. Verificar `/api/health`, logs e rollback.

Produção não recebe alterações diretas.
