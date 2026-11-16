import { randomUUID } from "node:crypto";
import { AgendaEntryForm } from "@/components/agenda-entry-form";
import { monthOf, parseMonth } from "@/features/agenda/model";
import { businessDate, dateSchema } from "@/features/agreements/schema";
import { defaultReminder } from "@/features/agenda/schema";
import { requireAgendaUser } from "@/lib/agenda";

export const metadata = { title: "Adicionar plantão" };

export default async function NewAgendaEntryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAgendaUser();
  const params = await searchParams;
  const today = businessDate();
  const date =
    typeof params.data === "string" && dateSchema.safeParse(params.data).success
      ? params.data
      : null;
  const month =
    (date && monthOf(date)) ?? parseMonth(params.mes) ?? monthOf(today);
  return (
    <AgendaEntryForm
      mode="create"
      requestId={randomUUID()}
      initialMonth={month}
      today={today}
      backHref={`/agenda?mes=${month}`}
      initial={{
        kind: "own",
        dates: date ? [date] : [],
        start: "",
        end: "",
        location: "",
        sector: "",
        value: "",
        dueMode: "none",
        dueDate: "",
        dueDays: "30",
        paymentMethod: "",
        counterparty: "",
        notes: "",
        reminder: defaultReminder,
      }}
    />
  );
}
