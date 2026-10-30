import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { businessDate } from "@/features/agreements/schema";
import {
  PaymentTracking,
  type PaymentEvent,
} from "@/components/screens/payment-tracking";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const identity = await getVerifiedIdentity();
  if (!identity)
    redirect(`/entrar?proximo=${encodeURIComponent(`/acordos/${id}`)}`);
  const { data: agreement, error } = await identity.supabase
    .from("shift_agreements")
    .select("id,owner_id,substitute_id,snapshot,payment_due_date")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o acompanhamento.");
  if (
    !agreement ||
    ![agreement.owner_id, agreement.substitute_id].includes(identity.userId)
  )
    notFound();
  const { data, error: eventsError } = await identity.supabase
    .from("agreement_payment_events")
    .select("id,actor_id,kind,created_at,paid_on,amount_cents,description")
    .eq("agreement_id", id)
    .order("created_at");
  if (eventsError)
    throw new Error("Não foi possível carregar o histórico de pagamento.");
  const events = (data ?? []) as PaymentEvent[];
  return (
    <PaymentTracking
      id={id}
      userId={identity.userId}
      owner={identity.userId === agreement.owner_id}
      amount={agreement.snapshot.value_cents}
      terms={agreement.snapshot.payment_terms}
      dueDate={agreement.payment_due_date}
      events={events}
      today={businessDate()}
      requestIds={{
        payment: randomUUID(),
        receive: randomUUID(),
        dispute: randomUUID(),
        source_delay: randomUUID(),
      }}
    />
  );
}
