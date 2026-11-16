import { agendaIcs, icsFileName, icsResponse } from "@/features/agenda/ics";
import {
  appPaymentPath,
  loadAppPayment,
  parseAppSource,
  requireAgendaUser,
} from "@/lib/agenda";

/** Arquivo .ics de um repasse do app em que o usuário é parte. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ origem: string; id: string }> },
) {
  const identity = await requireAgendaUser();
  const { origem, id } = await params;
  const source = parseAppSource(origem);
  const payment = source ? await loadAppPayment(identity, source, id) : null;
  if (!source || !payment || payment.shift.cancelled)
    return new Response(null, { status: 404 });
  const { shift, reminder } = payment;
  // Quem paga e já informou o pagamento não precisa mais do aviso.
  const open = !shift.settled && !(shift.kind === "passed" && shift.reported);
  const url = new URL(request.url);
  const details = url.searchParams.get("detalhes") === "1";
  return icsResponse(
    agendaIcs({
      uid: `${source}-${id}`,
      kind: shift.kind,
      startsAt: shift.startsAt,
      endsAt: shift.endsAt,
      title: shift.title,
      location: shift.location ?? shift.title,
      dueDate: open ? shift.dueDate : null,
      leadDays: reminder.enabled ? reminder.leadDays : 0,
      url: new URL(appPaymentPath(source, id), url).toString(),
      details: details
        ? {
            valueCents: shift.valueCents,
            counterparty: "",
            counterpartyLabel: "",
          }
        : null,
      now: new Date(),
    }),
    icsFileName(shift.startsAt),
  );
}
