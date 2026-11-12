# Estratégia de testes

Vitest cobre unidades e integração leve. Playwright cobre navegação pública,
viewport móvel, ausência de overflow horizontal, campos rotulados e percurso
básico por teclado. pgTAP valida RLS com responsável, candidato, aprovador, não
membro e anônimo, além dos dois fluxos completos de repasse, cancelamento,
concorrência, acordo imutável e auditoria. O CI verifica tipos, lint, formato,
escopo, segredos, auditoria estática de segurança, build, dependências, E2E e a
suíte SQL em banco descartável.

## Filas de e-mail pelo PostgREST

Na raiz do projeto, execute `pnpm test:postgrest` com Docker ativo, a CLI Supabase
2.117.0 no PATH e as portas locais 55321 e 55322 livres. O comando do CI cria
uma instância temporária, aplica as migrations do repositório e insere dados
sintéticos. Ao terminar, remove a instância e seus volumes.

O destinatário autenticado consegue ler a própria notificação interna. Tanto
ele quanto `anon` recebem uma negativa ao consultar ou atualizar as filas.
O job usa `service_role` pelo PostgREST real para adquirir e confirmar um aviso.
O teste também tenta criar, excluir e alterar os campos protegidos do aviso.
Cada fila tem um item pendente para verificar os efeitos das duas flags e as
chaves de idempotência. O handler recebe um POST em memória e o teste intercepta
o Resend antes de qualquer conexão externa.
