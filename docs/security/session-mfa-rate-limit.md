# Sessão, MFA e rate limiting

- Administradores exigem fator adicional e nível `aal2`.
- Sessões administrativas devem expirar e ser revogadas após mudança de privilégio.
- O cliente nunca recebe `service_role`.
- Rate limiting é aplicado no servidor por IP resumido, e-mail resumido, usuário e ação.
- Contadores de janela fixa são atômicos e privados no PostgreSQL; a superfície de
  comando não persiste identificadores e aceita somente `service_role`.
- Login: 10 tentativas por IP e 5 por e-mail a cada 15 minutos.
- Cadastro: 5 tentativas por IP por hora e 3 por e-mail por dia.
- Confirmação de e-mail: 20 tentativas por IP a cada 15 minutos.
- Atualização de perfil: 20 por usuário por hora.
- Fluxo de repasse: 60 comandos por usuário por minuto.
- Administração: 30 comandos por administrador por minuto.
- O provedor de hospedagem deve manter proteção de borda adicional. Cabeçalhos de IP
  só são confiáveis após normalização pelo proxy da plataforma.
- Respostas não devem revelar se uma conta existe.
