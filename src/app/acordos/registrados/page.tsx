import Link from "next/link";
import { agreementIdentity } from "@/lib/agreements";
import {
  agreementStatus,
  agreementStatusLabels,
  paymentStatus,
} from "@/features/agreements/schema";
import { formatCurrency, formatDateTime } from "@/features/shifts/schemas";
export default async function AgreementsPage() {
  const identity = await agreementIdentity();
  const { data, error } = await identity.supabase
    .from("external_agreements")
    .select(
      "id,location,sector,starts_at,status,value_cents,due_date,received_at,external_agreement_events(kind)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <>
      <h1>Acordos registrados</h1>
      <p>
        Convites, confirmações e pagamentos dos plantões combinados fora do app.
      </p>
      <Link className="button button-primary" href="/acordos/registrados/novo">
        Registrar acordo
      </Link>
      {error ? (
        <p role="alert" className="form-error">
          Não foi possível carregar seus registros. Tente novamente.
        </p>
      ) : !data?.length ? (
        <section className="registration-section">
          <h2>Seus acordos aparecerão aqui</h2>
          <p>
            Registre um combinado ou acesse o convite enviado pelo outro
            profissional. Use a conta com o mesmo e-mail do convite.
          </p>
        </section>
      ) : (
        <ul className="agreement-list">
          {data.map((a) => (
            <li key={a.id}>
              <h2>
                <Link href={`/acordos/registrados/${a.id}`}>
                  {a.location} · {a.sector}
                </Link>
              </h2>
              <p>
                {formatDateTime(a.starts_at)} · {formatCurrency(a.value_cents)}
              </p>
              <p>
                <strong>
                  {
                    agreementStatusLabels[
                      agreementStatus(a.status, a.starts_at)
                    ]
                  }
                </strong>
              </p>
              {a.status === "confirmed" && (
                <p>
                  {paymentStatus(
                    a.due_date,
                    a.received_at,
                    a.external_agreement_events.some(
                      (event) => event.kind === "payment_reported",
                    ),
                  )}{" "}
                  · Até {a.due_date.split("-").reverse().join("/")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
