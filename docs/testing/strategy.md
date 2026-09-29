# Estratégia de testes

Vitest cobre unidades e integração leve. Playwright cobre navegação pública,
viewport móvel, ausência de overflow horizontal, campos rotulados e percurso
básico por teclado. pgTAP valida RLS com responsável, candidato, aprovador, não
membro e anônimo, além dos dois fluxos completos de repasse, cancelamento,
concorrência, acordo imutável e auditoria. O CI verifica tipos, lint, formato,
escopo, segredos, auditoria estática de segurança, build, dependências, E2E e a
suíte SQL em banco descartável.
