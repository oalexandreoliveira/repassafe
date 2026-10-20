-- A2: the helper migration revoked this table privilege, preventing the
-- session client on /acordos/[id] from reaching the existing SELECT policy.
-- Restore read access only. RLS still limits rows to parties and authorized
-- approvers; write privileges and immutability triggers remain unchanged.
grant select on public.agreement_evidence_events to authenticated;
