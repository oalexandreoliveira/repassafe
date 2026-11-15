import { notFound } from "next/navigation";
import { AgendaAppPaymentScreen } from "@/components/screens/agenda-app-payment";
import { reminderFrom } from "@/features/agenda/model";
import { businessDate } from "@/features/agreements/schema";
import {
  fortalezaHour,
  loadAppPayment,
  parseAppSource,
  requireAgendaUser,
} from "@/lib/agenda";

export const metadata = { title: "Pagamento na agenda | Repassafe" };

/** Pagamento de um repasse do mural ou acordo registrado, visto pela agenda. */
export default async function AgendaAppPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ origem: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await requireAgendaUser();
  const [{ origem, id }, query] = await Promise.all([params, searchParams]);
  const source = parseAppSource(origem);
  if (!source) notFound();
  const payment = await loadAppPayment(identity, source, id);
  if (!payment) notFound();
  const today = businessDate();
  return (
    <AgendaAppPaymentScreen
      shift={payment.shift}
      trackingHref={payment.trackingHref}
      reminder={payment.reminder}
      today={today}
      reminderFrom={reminderFrom(today, fortalezaHour())}
      saved={query.salvo === "1"}
    />
  );
}
