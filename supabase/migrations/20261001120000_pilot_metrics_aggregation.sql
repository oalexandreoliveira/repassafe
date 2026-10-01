create or replace function public.pilot_metrics_aggregate(
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_group_id uuid default null
)
returns table (
  event_type text,
  group_id uuid,
  group_name text,
  event_count bigint
)
language sql
stable
set search_path = ''
as $$
  select
    events.event_type,
    events.group_id,
    case
      when events.group_id is not null then groups.name
      when events.event_type in (
        'offer_published', 'application_created', 'candidate_selected',
        'substitute_confirmed', 'institutional_approved',
        'institutional_rejected', 'substitution_confirmed',
        'substitution_cancelled', 'completion_reported',
        'completion_confirmed', 'occurrence_opened'
      ) then 'Ofertas livres'
      else 'Não aplicável'
    end as group_name,
    count(*) as event_count
  from public.pilot_funnel_events as events
  left join public.groups as groups on groups.id = events.group_id
  where events.occurred_at >= p_start_at
    and events.occurred_at < p_end_at
    and (p_group_id is null or events.group_id = p_group_id)
  group by events.event_type, events.group_id, groups.name
  order by events.event_type, group_name;
$$;

revoke all on function public.pilot_metrics_aggregate(timestamptz, timestamptz, uuid)
  from public, anon, authenticated;
grant execute on function public.pilot_metrics_aggregate(timestamptz, timestamptz, uuid)
  to service_role;

comment on function public.pilot_metrics_aggregate(timestamptz, timestamptz, uuid) is
  'Returns pilot funnel counts grouped by event and group. Callable only by trusted server code; never returns actor identifiers or event-level records.';

create function private.record_full_registration_funnel_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  funnel_type text;
begin
  if new.event_type = 'registration.submitted' then
    funnel_type := 'signup_completed';
  elsif new.event_type = 'registration.reviewed'
    and new.metadata->>'outcome' = 'approved' then
    funnel_type := 'user_approved';
  else
    return new;
  end if;

  insert into public.pilot_funnel_events (
    source_audit_event_id, event_type, occurred_at
  ) values (
    new.id, funnel_type, new.occurred_at
  ) on conflict (source_audit_event_id) do nothing;

  return new;
end;
$$;

create trigger record_full_registration_funnel_event
after insert on public.audit_events
for each row
when (new.event_type in ('registration.submitted', 'registration.reviewed'))
execute function private.record_full_registration_funnel_event();

revoke execute on function private.record_full_registration_funnel_event()
  from public, anon, authenticated;
