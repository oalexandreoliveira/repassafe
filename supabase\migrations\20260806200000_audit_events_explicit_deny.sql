create policy "audit events deny client access"
on public.audit_events
for all
to anon, authenticated
using (false)
with check (false);

