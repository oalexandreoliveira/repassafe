import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Whether the signed-in user has unread notifications (badge do sino). RLS limits rows to the recipient. */
export async function hasUnreadNotifications(supabase: SupabaseClient) {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return Boolean(count);
}
