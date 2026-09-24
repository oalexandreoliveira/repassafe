create index agreement_evidence_events_agreement_recorded_idx
  on public.agreement_evidence_events (agreement_id, recorded_at, id);

create index agreement_evidence_events_actor_id_idx
  on public.agreement_evidence_events (actor_id);
