create table public.pilot_funnel_events (
  id uuid primary key default gen_random_uuid(),
  source_audit_event_id uuid not null unique references public.audit_events(id),
  event_type text not null check (event_type in (
    'signup_started', 'signup_completed', 'user_approved',
    'offer_published', 'offer_expired', 'offer_cancelled',
    'application_created', 'candidate_selected', 'substitute_confirmed',
    'institutional_approved', 'institutional_rejected',
    'substitution_confirmed', 'substitution_cancelled',
    'completion_reported', 'completion_confirmed', 'occurrence_opened'
  )),
  group_id uuid references public.groups(id),
  occurred_at timestamptz not null default now()
);

create index pilot_funnel_events_time_idx
  on public.pilot_funnel_events (occurred_at desc);
create index pilot_funnel_events_group_type_idx
  on public.pilot_funnel_events (group_id, event_type, occurred_at desc);

alter table public.pilot_funnel_events enable row level security;
revoke all on public.pilot_funnel_events from public, anon, authenticated;
grant select on public.pilot_funnel_events to service_role;

create or replace function private.record_pilot_funnel_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  funnel_type text;
  selected_group_id uuid;
  selected_offer_id uuid;
begin
  case new.event_type
    when 'profile.signup_started' then funnel_type := 'signup_started';
    when 'profile.registered' then funnel_type := 'signup_completed';
    when 'profile.reviewed' then
      if new.metadata->>'status' = 'approved' then funnel_type := 'user_approved'; end if;
    when 'shift_offer.published' then funnel_type := 'offer_published';
    when 'shift_offer.expired' then funnel_type := 'offer_expired';
    when 'shift_offer.cancelled' then funnel_type := 'offer_cancelled';
    when 'shift_application.created' then funnel_type := 'application_created';
    when 'substitution.selected' then funnel_type := 'candidate_selected';
    when 'substitution.confirmed_by_substitute' then funnel_type := 'substitute_confirmed';
    when 'substitution.approved' then funnel_type := 'institutional_approved';
    when 'substitution.rejected' then funnel_type := 'institutional_rejected';
    when 'substitution.confirmed' then funnel_type := 'substitution_confirmed';
    when 'substitution.cancelled', 'substitution.withdrawn_by_substitute' then
      funnel_type := 'substitution_cancelled';
    when 'completion.reported' then funnel_type := 'completion_reported';
    when 'completion.confirmed' then funnel_type := 'completion_confirmed';
    when 'occurrence.opened' then funnel_type := 'occurrence_opened';
    else return new;
  end case;

  if new.entity_type = 'shift_offer' then
    select group_id into selected_group_id from public.shift_offers where id = new.entity_id;
  elsif new.entity_type = 'shift_application' then
    select o.group_id into selected_group_id
      from public.shift_applications a join public.shift_offers o on o.id = a.offer_id
      where a.id = new.entity_id;
  elsif new.entity_type = 'substitution' then
    select group_id into selected_group_id from public.substitutions where id = new.entity_id;
  elsif new.entity_type = 'completion' then
    select s.group_id into selected_group_id
      from public.shift_completions c join public.substitutions s on s.id = c.substitution_id
      where c.id = new.entity_id;
  elsif new.entity_type = 'occurrence' then
    select s.group_id into selected_group_id
      from public.shift_occurrences o join public.substitutions s on s.id = o.substitution_id
      where o.id = new.entity_id;
  end if;

  insert into public.pilot_funnel_events (source_audit_event_id, event_type, group_id, occurred_at)
  values (new.id, funnel_type, selected_group_id, new.occurred_at)
  on conflict (source_audit_event_id) do nothing;
  return new;
end;
$$;

create trigger record_pilot_funnel_event
after insert on public.audit_events
for each row execute function private.record_pilot_funnel_event();
revoke execute on function private.record_pilot_funnel_event() from public, anon, authenticated;

create or replace function private.audit_offer_expiration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status <> 'expired' and new.status = 'expired' then
    insert into public.audit_events (actor_id, event_type, entity_type, entity_id, metadata)
    values (null, 'shift_offer.expired', 'shift_offer', new.id,
      jsonb_build_object('group_id', new.group_id));
  end if;
  return new;
end;
$$;

create trigger audit_offer_expiration
after update of status on public.shift_offers
for each row execute function private.audit_offer_expiration();
revoke execute on function private.audit_offer_expiration() from public, anon, authenticated;

comment on table public.pilot_funnel_events is
  'Minimal aggregate pilot events. Excludes actor identifiers, CRM, free text, and clinical data.';
