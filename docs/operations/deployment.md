# Promoção e deploy

1. Abrir PR e aguardar `validate` e `e2e`.
2. Revisar migrations, RLS e auditoria.
3. Implantar em homologação e executar smoke test.
4. Registrar aprovação de produto.
5. Promover o mesmo commit para produção.
6. Verificar `/api/health`, `/api/ready`, logs e um smoke test do fluxo central.
7. Confirmar backup dentro do RPO e artefato anterior disponível para rollback.
8. Monitorar intensivamente por 30 minutos após a promoção.

Produção não recebe alterações diretas.

O deploy é interrompido se CI, pgTAP, Security Advisors, readiness ou backup estiverem
reprovados. Migrations destrutivas exigem fase de expansão/contração e aprovação
específica.
