-- O histórico de pagamento só é gravado por record_agreement_payment (security definer).
-- Os privilégios padrão do Supabase dão ao service_role UPDATE, DELETE e TRUNCATE em tabelas novas.
revoke all on public.agreement_payment_events from service_role;
grant select on public.agreement_payment_events to service_role;
