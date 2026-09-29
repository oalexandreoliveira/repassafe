# ADR-004: Row Level Security
Status: aceito. RLS é obrigatória e nega por padrão. Ofertas de grupo e seus dados permanecem limitados a vínculos ativos; ofertas sem grupo são públicas somente para perfis autenticados e aprovados. `service_role` nunca chega ao cliente.
