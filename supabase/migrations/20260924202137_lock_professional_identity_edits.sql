-- Identity fields require an administrative review; clients cannot mutate them directly.
revoke update (display_name, crm_number, crm_state)
on public.profiles
from authenticated;

drop policy "own profile update" on public.profiles;
