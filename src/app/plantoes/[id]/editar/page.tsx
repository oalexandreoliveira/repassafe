import { randomUUID } from "node:crypto";
import { notFound, redirect } from "next/navigation";
import { updateOfferAction } from "@/app/plantoes/actions";
import { EditShiftForm } from "@/components/screens/publish-shift-form";
import { AppScreen, TopBar } from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { InfoBanner } from "@/components/ui/info-banner";
import { dayKey } from "@/features/shifts/format";
import { splitLocal } from "@/features/shifts/form-values";
import { getShiftDetails } from "@/lib/shifts/data";

function localInputValue(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export default async function EditShiftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getShiftDetails(id);
  if (!workspace) notFound();
  if (
    workspace.offer.owner_id !== workspace.identity.userId ||
    workspace.applications.length > 0 ||
    !["open_normal", "open_emergency"].includes(workspace.offer.status)
  ) {
    redirect(`/plantoes/${id}`);
  }

  const offer = workspace.offer;
  // O formulário (Data, Início, Fim) cobre plantões de até 24 h; ofertas mais
  // longas não são encurtadas por engano.
  if (Date.parse(offer.ends_at) - Date.parse(offer.starts_at) > 86_400_000)
    return (
      <AppScreen
        header={<TopBar title="Editar plantão" backHref={`/plantoes/${id}`} />}
        footer={
          <ButtonLink href={`/plantoes/${id}`} variant="secondary" block>
            Voltar ao plantão
          </ButtonLink>
        }
      >
        <InfoBanner variant="warning" role="status">
          Este plantão dura mais de 24 horas e não pode ser editado por aqui.
          Para mudar as condições, cancele a oferta e publique novamente.
        </InfoBanner>
      </AppScreen>
    );
  const start = splitLocal(localInputValue(offer.starts_at));
  const end = splitLocal(localInputValue(offer.ends_at));
  return (
    <EditShiftForm
      action={updateOfferAction.bind(null, id)}
      commandId={randomUUID()}
      offerId={id}
      minDate={dayKey(new Date())}
      initial={{
        groupId: offer.group_id ?? "",
        sector: offer.sector,
        date: start.date,
        start: start.time,
        end: end.time,
        value: (offer.value_cents / 100).toFixed(2).replace(".", ","),
        paymentTerms: offer.payment_terms,
        notes: offer.notes ?? "",
      }}
    />
  );
}
