import { redirect } from "next/navigation";
import { markNotificationsReadAction } from "@/app/auth/actions";
import { NotificationsList } from "@/components/screens/notifications-list";
import { getVerifiedIdentity } from "@/lib/auth/session";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");
  const { status } = await searchParams;
  let query = identity.supabase
    .from("notifications")
    .select("id,event_type,title,body,href,created_at,read_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status === "unread") query = query.is("read_at", null);
  const { data: notifications } = await query;
  const hasUnread = notifications?.some(
    (notification) => !notification.read_at,
  );

  return (
    <NotificationsList
      notifications={notifications ?? []}
      onlyUnread={status === "unread"}
      hasUnread={Boolean(hasUnread)}
      markAllRead={markNotificationsReadAction}
      now={new Date()}
    />
  );
}
