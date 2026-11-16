import { notFound } from "next/navigation";
import { AgendaEntryScreen } from "@/components/screens/agenda-entry";
import { reminderFrom } from "@/features/agenda/model";
import { businessDate } from "@/features/agreements/schema";
import {
  fortalezaHour,
  loadAgendaEntry,
  loadHandovers,
  requireAgendaUser,
} from "@/lib/agenda";

export const metadata = { title: "Plantão na agenda | Repassafe" };

export default async function AgendaEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await requireAgendaUser();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const entry = await loadAgendaEntry(identity, id);
  if (!entry) notFound();
  const { handovers } = await loadHandovers(identity, [entry]);
  const today = businessDate();
  return (
    <AgendaEntryScreen
      entry={entry}
      today={today}
      reminderFrom={reminderFrom(today, fortalezaHour())}
      // eslint-disable-next-line react-hooks/purity -- Server component compares the shift start once per request.
      startsInFuture={Date.parse(entry.starts_at) > Date.now()}
      handover={handovers.get(entry.id)}
      canPublish={identity.canPublish}
      saved={query.salvo === "1"}
      settled={query.marcado === "1"}
    />
  );
}
