import Link from "next/link";
import { randomUUID } from "node:crypto";
import { agreementContext } from "@/lib/agreements";
import { loadAgendaEntry } from "@/lib/agenda";
import { canHandOver, handoverPrefill } from "@/features/agenda/handover";
import { CreateAgreementForm } from "@/components/agreement-forms";
export default async function NewAgreementPage({
  searchParams,
}: {
  searchParams: Promise<{ agenda?: string }>;
}) {
  const [{ identity, context }, { agenda }] = await Promise.all([
    agreementContext(),
    searchParams,
  ]);
  // "Repassar este plantão" (agenda): só "Meu plantão" futuro do próprio autor.
  const entry =
    agenda && context.eligible ? await loadAgendaEntry(identity, agenda) : null;
  const source =
    // eslint-disable-next-line react-hooks/purity -- Server component compares the shift start once per request.
    entry && canHandOver(entry, undefined, Date.now()) ? entry : null;
  const prefill = source ? handoverPrefill(source) : null;
  return (
    <>
      <h1>Registrar acordo</h1>
      <p>
        Já combinaram o plantão? Registre as condições e convide o outro
        profissional para confirmar.
      </p>
      {context.eligible ? (
        <>
          {prefill ? (
            <p className="form-help">
              Local, setor e horário vieram do seu plantão na agenda. Informe o
              colega e as condições do pagamento a ele.
            </p>
          ) : null}
          <CreateAgreementForm
            requestId={randomUUID()}
            groups={context.groups}
            agendaEntryId={source?.id}
            initial={
              prefill
                ? {
                    creatorRole: "owner",
                    location: prefill.location,
                    sector: prefill.sector,
                    startsAt: prefill.startsAt,
                    endsAt: prefill.endsAt,
                  }
                : undefined
            }
          />
        </>
      ) : (
        <section className="registration-section">
          <h2>Complete seu cadastro para continuar</h2>
          <p>
            Preencha sua identificação e seus dados profissionais e confirme o
            e-mail. Você pode registrar o acordo enquanto a análise estiver
            pendente. Contas suspensas, rejeitadas ou com verificação expirada
            precisam regularizar o cadastro.
          </p>
          <Link className="button button-primary" href="/cadastro/completar">
            Completar cadastro
          </Link>
        </section>
      )}
    </>
  );
}
