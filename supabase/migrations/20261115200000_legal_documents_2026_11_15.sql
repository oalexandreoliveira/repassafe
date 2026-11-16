-- Termos de uso e Política de privacidade, versão 2026-11-15: agenda pessoal e
-- Resend como fornecedor de e-mails. Novo aceite no próximo envio do cadastro
-- (correção, reenvio ou revalidação); contas aprovadas seguem operando.
--
-- Transição: a versão 2026-09-29 ainda vale até 16/11/2026 0h em Fortaleza,
-- para cobrir a janela entre esta migration e a publicação da aplicação.
-- Depois disso, o envio exige os dois aceites da versão atual.
do $$
declare
  definition text;
  original text;
begin
  definition := replace(
    pg_get_functiondef('public.registration_submit(uuid,integer)'::regprocedure), chr(13), '');
  original := definition;
  definition := replace(definition,
    '(select count(*) from private.legal_acceptances where user_id=target_user and version=''2026-09-29'')<>2',
    '(select count(distinct document) from private.legal_acceptances where user_id=target_user and (version=''2026-11-15'' or (version=''2026-09-29'' and now() < timestamptz ''2026-11-16 03:00:00+00'')))<>2');
  if definition = original then
    raise exception 'Envio de cadastro incompatível com a nova versão dos documentos';
  end if;
  execute definition;
end;
$$;

-- Aviso a todos os titulares, com o teor das alterações (o texto vigente promete
-- comunicar mudanças relevantes). Só na central: o evento não gera e-mail.
insert into public.notifications(recipient_id, event_type, title, body, href)
select p.id,
  'legal.updated',
  'Termos de uso e Política de privacidade atualizados',
  'A versão de 15/11/2026 inclui a agenda pessoal (dados anotados, quem vê, lembretes e cobrança pelo WhatsApp) e o Resend como fornecedor dos e-mails do registro final e dos avisos críticos. Confira o resumo no fim de cada documento.',
  '/privacidade'
from public.profiles p;
