import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { AgendaEntryForm } from "@/components/agenda-entry-form";
import { monthOf } from "@/features/agenda/model";
import { businessDate } from "@/features/agreements/schema";
import { dayKey, formatTime } from "@/features/shifts/format";
import { entryReminder } from "@/features/agenda/rows";
import { loadAgendaEntry, requireAgendaUser } from "@/lib/agenda";

export const metadata = { title: "Editar plantão" };

export default async function EditAgendaEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const identity = await requireAgendaUser();
  const { id } = await params;
  const entry = await loadAgendaEntry(identity, id);
  if (!entry) notFound();
  const date = dayKey(entry.starts_at);
  return (
    <AgendaEntryForm
      mode="edit"
      requestId={randomUUID()}
      entryId={entry.id}
      initialMonth={monthOf(date)}
      today={businessDate()}
      backHref={`/agenda/${entry.id}`}
      initial={{
        kind: entry.kind,
        dates: [date],
        start: formatTime(entry.starts_at),
        end: formatTime(entry.ends_at),
        location: entry.location,
        sector: entry.sector,
        value:
          entry.value_cents !== null
            ? (entry.value_cents / 100).toFixed(2).replace(".", ",")
            : "",
        dueMode: entry.due_date ? "date" : "none",
        dueDate: entry.due_date ?? "",
        dueDays: "30",
        paymentMethod: entry.payment_method,
        counterparty: entry.counterparty,
        notes: entry.notes,
        reminder: entryReminder(entry),
      }}
    />
  );
}
