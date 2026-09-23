import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { updateOfferAction } from "@/app/plantoes/actions";
import { getShiftDetails } from "@/lib/shifts/data";

function localInputValue(value: string) {
  const date = new Date(value);
  const local = new Date(date.valueOf() - 3 * 60 * 60 * 1000);
  return local.toISOString().slice(0, 16);
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
  const action = updateOfferAction.bind(null, id);
  return (
    <main className="shell dashboard">
      <header className="dashboard-header">
        <Link href={`/plantoes/${id}`} className="brand">
          <span aria-hidden="true">R</span> Repassafe
        </Link>
      </header>
      <section className="dashboard-title">
        <div>
          <p className="eyebrow">Oferta sem candidaturas</p>
          <h1>Editar plantão</h1>
        </div>
      </section>
      <section className="card form-card">
        <form action={action} className="form-stack">
          <input type="hidden" name="commandId" value={randomUUID()} />
          <input type="hidden" name="groupId" value={offer.group_id} />
          <div className="form-row">
            <label>
              Início
              <input
                type="datetime-local"
                name="startsAt"
                defaultValue={localInputValue(offer.starts_at)}
                required
              />
            </label>
            <label>
              Término
              <input
                type="datetime-local"
                name="endsAt"
                defaultValue={localInputValue(offer.ends_at)}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Setor
              <input name="sector" defaultValue={offer.sector} required />
            </label>
            <label>
              Valor (R$)
              <input
                name="value"
                inputMode="decimal"
                defaultValue={(offer.value_cents / 100)
                  .toFixed(2)
                  .replace(".", ",")}
                required
              />
            </label>
          </div>
          <label>
            Condições de pagamento
            <input
              name="paymentTerms"
              defaultValue={offer.payment_terms}
              required
            />
          </label>
          <label>
            Observações operacionais
            <textarea name="notes" defaultValue={offer.notes ?? ""} />
          </label>
          <button className="button button-primary" type="submit">
            Salvar alterações
          </button>
        </form>
      </section>
    </main>
  );
}
