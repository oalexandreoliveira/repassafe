# Acesso e administração do piloto

## Configuração

Defina `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no provedor
de deploy. A chave de serviço é exclusiva do servidor e não pode usar o prefixo
`NEXT_PUBLIC_`.

No Supabase Auth, habilite cadastro por e-mail, confirmação obrigatória e inclua
`NEXT_PUBLIC_APP_URL/auth/confirm` na lista de URLs de redirecionamento. Configure
SMTP próprio antes do piloto para garantir entrega e identidade das mensagens.

## Primeiro administrador

1. Crie e confirme a conta pela interface normal.
2. Verifique o CRM pelos canais operacionais definidos.
3. Em uma sessão administrativa no SQL Editor, altere o perfil para `role =
   'admin'` e `status = 'approved'`.
4. Exija o cadastro de MFA no Supabase Auth.
5. Confirme que o token da sessão possui `aal2` antes de acessar `/admin`.

Não promova administradores por metadados editáveis do usuário. Mudanças de
papel exigem procedimento operacional separado e registro de auditoria.

## Fluxo do profissional

1. O profissional solicita cadastro e confirma o e-mail.
2. O perfil permanece `pending` e sem grupo.
3. Um administrador em `aal2` registra a decisão de verificação.
4. Apenas perfis `approved` podem receber vínculo ativo.
5. O profissional vê somente o próprio perfil e seus vínculos ativos.

## Revogação

Ao suspender um usuário, altere o perfil para `suspended`, desative seus vínculos
e revogue as sessões no painel do Supabase Auth. A exclusão do usuário não basta
para invalidar tokens já emitidos.
