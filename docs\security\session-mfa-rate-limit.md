# Sessão, MFA e rate limiting

- Administradores exigem fator adicional e nível `aal2`.
- Sessões administrativas devem expirar e ser revogadas após mudança de privilégio.
- O cliente nunca recebe `service_role`.
- Rate limiting será aplicado no edge/API por IP, usuário e ação, com limites menores para autenticação e recuperação de conta.
- Respostas não devem revelar se uma conta existe.
