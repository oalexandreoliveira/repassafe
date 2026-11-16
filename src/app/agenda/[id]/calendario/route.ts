import { agendaIcs, icsFileName, icsResponse } from "@/features/agenda/ics";
import { entryTitle } from "@/features/agenda/rows";
import { counterpartyLabel } from "@/features/agenda/schema";
import {
  loadAgendaEntry,
  loadHandovers,
  requireAgendaUser,
} from "@/lib/agenda";

/** Arquivo .ics de uma anotação pessoal; só o autor consegue gerá-lo. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await requireAgendaUser();
  const { id } = await params;
  const entry = await loadAgendaEntry(identity, id);
  if (!entry) return new Response(null, { status: 404 });
  const { handovers } = await loadHandovers(identity, [entry]);
  const url = new URL(request.url);
  const details = url.searchParams.get("detalhes") === "1";
  return icsResponse(
    agendaIcs({
      uid: entry.id,
      kind: entry.kind,
      handedOver: handovers.get(entry.id)?.state === "confirmed",
      startsAt: entry.starts_at,
      endsAt: entry.ends_at,
      title: entryTitle(entry),
      location: entry.location,
      dueDate: entry.settled_on ? null : entry.due_date,
      leadDays: entry.reminder_enabled ? entry.reminder_lead_days : 0,
      url: new URL(`/agenda/${entry.id}`, url).toString(),
      details: details
        ? {
            valueCents: entry.value_cents,
            counterparty: entry.counterparty,
            counterpartyLabel: counterpartyLabel(entry.kind),
          }
        : null,
      now: new Date(),
    }),
    icsFileName(entry.starts_at),
  );
}
