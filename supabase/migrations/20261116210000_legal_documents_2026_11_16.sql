-- Termos de uso e Política de privacidade, versão 2026-11-16: as mensagens de
-- acesso à conta (confirmação, recuperação de senha, troca de e-mail e
-- convites) também saem pelo Resend, que é o SMTP do provedor de
-- autenticação; arquivo para a agenda do celular e repasse a partir da agenda.
--
-- Mesmo caminho da versão 2026-11-15: novo aceite no próximo envio do
-- cadastro; contas aprovadas seguem operando. A versão 2026-11-15 vale até
-- 18/11/2026 0h em Fortaleza, para cobrir a janela entre esta migration e a
-- publicação da aplicação. A janela da 2026-09-29 (até 17/11/2026 0h) não muda.
do $$
declare
  definition text;
  original text;
begin
  definition := replace(
    pg_get_functiondef('public.registration_submit(uuid,integer)'::regprocedure), chr(13), '');
  original := definition;
  definition := replace(definition,
    '(version=''2026-11-15'' or (version=''2026-09-29''',
    '(version=''2026-11-16'' or (version=''2026-11-15'' and now() < timestamptz ''2026-11-18 03:00:00+00'') or (version=''2026-09-29''');
  if definition = original then
    raise exception 'Envio de cadastro incompatível com a nova versão dos documentos';
  end if;
  execute definition;
end;
$$;

-- Aviso a todos os titulares, com o teor das alterações. Só na central: o
-- evento não gera e-mail.
insert into public.notifications(recipient_id, event_type, title, body, href)
select p.id,
  'legal.updated',
  'Termos de uso e Política de privacidade atualizados',
  'A versão de 16/11/2026 informa que as mensagens de acesso à conta, como confirmação de cadastro e recuperação de senha, também são enviadas pelo Resend, e inclui o arquivo para a agenda do celular e o repasse a partir da agenda. Confira o resumo no fim de cada documento.',
  '/privacidade'
from public.profiles p;
