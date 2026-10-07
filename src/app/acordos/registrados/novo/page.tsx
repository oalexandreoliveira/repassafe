import Link from "next/link";
import { randomUUID } from "node:crypto";
import { agreementContext } from "@/lib/agreements";
import { CreateAgreementForm } from "@/components/agreement-forms";
export default async function NewAgreementPage() {
  const { context } = await agreementContext();
  return (
    <>
      <h1>Registrar acordo</h1>
      <p>
        Já combinaram o plantão? Registre as condições e convide o outro
        profissional para confirmar.
      </p>
      {context.eligible ? (
        <CreateAgreementForm requestId={randomUUID()} groups={context.groups} />
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
