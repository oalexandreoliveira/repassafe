# Acesso e administração do piloto

## Configuração

Defina `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no provedor
de deploy. A chave de serviço é exclusiva do servidor e não pode usar o prefixo
`NEXT_PUBLIC_`.

No Supabase Auth, habilite cadastro por e-mail, confirmação obrigatória e inclua
`NEXT_PUBLIC_APP_URL/auth/confirm` na lista de URLs de redirecionamento. Configure
SMTP próprio antes do piloto para garantir entrega e identidade das mensagens.

## Acesso administrativo independente

A migração `20260929201200_independent_administrative_access.sql` separa o
acesso gerencial em `administrative_access`, vinculado a `auth.users`. O acesso
não depende de CRM, de um registro em `profiles` ou da aprovação profissional.
Login, MFA, administração e consulta administrativa de acordos verificam essa
concessão. Contas de equipe podem existir sem perfil médico. O cadastro público
continua exclusivo do profissional e não concede acesso gerencial.

1. Crie a identidade da equipe pelos canais administrativos do Supabase Auth e
   confirme o e-mail. Não crie um CRM fictício para a equipe.
2. Em uma sessão confiável no SQL Editor, conceda acesso ao UUID de Auth:

```sql
insert into public.administrative_access (user_id, granted_by, reason)
values (
  '<uuid-da-identidade-auth>',
  '<uuid-do-responsavel-auth>',
  'Acesso autorizado à equipe de operação Repassafe'
);
```

3. Entre em `/entrar`. A conta com concessão ativa segue para `/mfa`.
4. Escaneie o QR code TOTP e confirme o código do autenticador.
5. Confirme a sessão `aal2` antes de acessar `/admin`.

O cliente só lê `user_id` e `active` da própria concessão, inclusive em `aal1`
para iniciar MFA. Não pode criar, atualizar ou excluir concessões nem consultar
suas justificativas. As alterações por caminhos confiáveis geram auditoria no
banco. Não use metadados editáveis do usuário para conceder acesso.

Na migração, administradores legados recebem uma concessão com `active` igual
à condição de seu perfil estar aprovado naquele momento. Os perfis antigos e a
trilha histórica são preservados. Depois da migração, alterar `profiles.role`
ou `profiles.status` não concede nem revoga acesso administrativo.

Auditoria, verificação de CRM, análise de ocorrências e notificações da equipe
passam a referenciar a identidade de Auth. Comandos de análise de ocorrências
revalidam concessão ativa e `aal2` também no PostgreSQL. A concessão não habilita
publicação, candidatura ou aprovação institucional: essas operações continuam
exigindo seu perfil e vínculo específico.

Publique a migração antes do código que consulta `administrative_access`.
O teste local transacional não aplica essa migração permanentemente.

## Fluxo do profissional

1. O profissional solicita cadastro e confirma o e-mail.
2. O perfil permanece `pending` e sem grupo.
3. Um administrador em `aal2` registra a decisão de verificação.
4. Apenas perfis `approved` podem receber vínculo ativo.
5. O profissional vê somente o próprio perfil e seus vínculos ativos.

## Evidência da consulta manual do CRM

Na fila administrativa, registre o nome encontrado, CRM e UF consultados,
resultado, fonte e observações da consulta. A evidência fica disponível somente
à operação administrativa. Aprovação exige resultado verificado; divergências
devem gerar solicitação de correção ou rejeição com justificativa. Se a fonte
estiver indisponível, registre essa condição e mantenha o cadastro pendente.
Não inclua dados de pacientes em observações.

## Revogação

Ao suspender um usuário, altere o perfil para `suspended`, desative seus vínculos
e revogue as sessões no painel do Supabase Auth. A exclusão do usuário não basta
para invalidar tokens já emitidos.

Para revogar uma autorização gerencial, atualize a concessão explicitamente:

```sql
update public.administrative_access
set active = false, reason = 'Revogação do acesso gerencial por desligamento'
where user_id = '<uuid-da-identidade-auth>';
```

Revogue também as sessões no Supabase Auth. As próximas ações gerenciais
consultam a concessão novamente, mesmo com um JWT `aal2` ainda válido. Suspensão
profissional e revogação gerencial são decisões distintas; se ambas forem
necessárias, execute e audite ambas. Preserve as identidades de Auth que
aparecem na auditoria; desative o acesso em vez de apagar a trilha.
