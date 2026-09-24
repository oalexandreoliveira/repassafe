-- Keep FK checks and administrative group lookups efficient while excluding
-- free agreements, whose group_id is intentionally NULL.
create index shift_agreements_group_id_idx
  on public.shift_agreements (group_id)
  where group_id is not null;
