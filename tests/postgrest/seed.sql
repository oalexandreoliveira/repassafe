-- Apenas para a instância descartável criada por test:postgrest.
begin;
-- As negativas HTTP por falta de grant também ocorreriam com a RLS desligada.
set local role authenticated;
do $$ begin
  if not (row_security_active('public.notification_email_deliveries') and
          row_security_active('public.agreement_email_deliveries')) then
    raise exception 'RLS deve estar ativa nas duas filas para authenticated';
  end if;
end $$;
reset role;
insert into auth.users (id, aud, role, email, email_confirmed_at)
values ('ab000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'medica@example.test', now());
insert into public.profiles (id, display_name)
values ('ab000000-0000-4000-8000-000000000001', 'Pessoa sintética');
insert into public.notifications (recipient_id, event_type, title, body, href)
values ('ab000000-0000-4000-8000-000000000001', 'registration.reviewed', 'Cadastro analisado', 'Confira.', '/cadastro/completar');
insert into public.agreement_email_deliveries (source, agreement_id, recipient_id, recipient_email, href)
values ('shift', 'ab000000-0000-4000-8000-000000000002', 'ab000000-0000-4000-8000-000000000001',
  'medica@example.test', '/acordos/ab000000-0000-4000-8000-000000000002');
commit;
