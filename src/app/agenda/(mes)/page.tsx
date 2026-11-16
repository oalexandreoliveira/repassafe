import { AgendaScreen } from "@/components/screens/agenda";
import {
  buildAgendaMonth,
  monthOf,
  parseFilter,
  parseMonth,
} from "@/features/agenda/model";
import { businessDate } from "@/features/agreements/schema";
import { loadAgendaShifts, requireAgendaUser } from "@/lib/agenda";
import { hasUnreadNotifications } from "@/lib/notifications";

export const metadata = { title: "Agenda" };

/** Agenda pessoal (derivada): plantões e pagamentos do mês. */
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await requireAgendaUser();
  const params = await searchParams;
  const today = businessDate();
  const currentMonth = monthOf(today);
  const month = parseMonth(params.mes) ?? currentMonth;
  const filter = parseFilter(params.ver);
  const [{ shifts, failed }, unread] = await Promise.all([
    loadAgendaShifts(identity, month),
    hasUnreadNotifications(identity.supabase),
  ]);
  const saved = Number(params.salvos);
  return (
    <AgendaScreen
      agenda={buildAgendaMonth(shifts, month, today, filter)}
      filter={filter}
      isCurrent={month === currentMonth}
      failed={failed}
      unread={unread}
      canPublish={identity.canPublish}
      saved={Number.isInteger(saved) && saved > 0 ? saved : undefined}
      deleted={params.excluido === "1"}
    />
  );
}
