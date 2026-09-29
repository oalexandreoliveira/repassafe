import Link from "next/link";
import { ProfilePhoto } from "@/components/profile-photo";
import { readRegistration } from "@/lib/registration";
import {
  RegistrationDocuments,
  RegistrationEmail,
  RegistrationForm,
  RegistrationPhone,
  RegistrationPhoto,
  RegistrationSubmit,
} from "@/components/registration-form";
import { legalVersion } from "@/features/registration/schemas";
import { registrationSchema } from "@/features/registration/schemas";
import {
  registrationFieldLabels,
  registrationReviewOrder,
  registrationValueLabel,
} from "@/features/registration/labels";

export default async function CompleteRegistrationPage() {
  const { registration, user } = await readRegistration();
  const draft = registration?.draft;
  const data = draft?.data ?? {};
  const identityComplete =
    registrationSchema.safeParse(data).success && !!draft?.photo_path;
  const sent = ["submitted", "approved"].includes(draft?.state);
  const accepted =
    (registration?.acceptances ?? []).filter(
      (item: { version: string }) => item.version === legalVersion,
    ).length === 2;
  const phoneConfirmed =
    !!user.phone_confirmed_at && user.phone === draft?.phone;
  return (
    <main className="shell registration-shell">
      <header className="dashboard-header">
        <Link href="/" className="brand">
          <span aria-hidden="true">R</span> Repassafe
        </Link>
        <nav aria-label="Navegação do cadastro">
          <Link href="/painel">Painel</Link> ·{" "}
          <Link href="/suporte">Suporte</Link>
        </nav>
      </header>
      <h1>Complete seu cadastro</h1>
      <p>
        Salve por etapas e retome quando precisar. A conta, a verificação
        profissional e as autorizações institucionais são independentes.
      </p>
      <ol className="registration-progress" aria-label="Etapas do cadastro">
        <li aria-current={!user.email_confirmed_at ? "step" : undefined}>
          <Link href="#contatos">Conta e contatos</Link> —{" "}
          {user.email_confirmed_at ? "E-mail confirmado" : "Confirme o e-mail"}
        </li>
        <li
          aria-current={
            user.email_confirmed_at && !identityComplete ? "step" : undefined
          }
        >
          <Link href="#identificacao">Identificação e atuação</Link> —{" "}
          {identityComplete ? "Dados completos" : "Complete os dados e a foto"}
        </li>
        <li aria-current={identityComplete ? "step" : undefined}>
          <Link href="#envio">Revisão e envio</Link> —{" "}
          {sent ? "Recebido pela equipe" : "Revise e envie"}
        </li>
      </ol>
      <section className="registration-section">
        <h2 id="contatos">Conta e contatos</h2>
        <dl>
          <dt>E-mail</dt>
          <dd>
            {user.email} —{" "}
            {user.email_confirmed_at
              ? `Confirmado em ${new Date(user.email_confirmed_at).toLocaleDateString("pt-BR")}`
              : "Aguardando confirmação"}
          </dd>
          <dt>Telefone</dt>
          <dd>
            {phoneConfirmed
              ? `Confirmado em ${new Date(user.phone_confirmed_at!).toLocaleDateString("pt-BR")}`
              : "Sem confirmação"}
          </dd>
          <dt>Situação do cadastro</dt>
          <dd>
            {
              (
                {
                  incomplete: "Em preenchimento",
                  submitted: "Aguardando verificação",
                  changes_requested: "Correções solicitadas",
                  approved: "Aprovado",
                  rejected: "Não aprovado",
                } as Record<string, string>
              )[draft?.state ?? "incomplete"]
            }
          </dd>
        </dl>
        <RegistrationPhone
          enabled={process.env.SMS_VERIFICATION_ENABLED === "true"}
        />
        <RegistrationEmail />
      </section>
      <section className="registration-section">
        <h2 id="identificacao">Identificação e atuação</h2>
        <RegistrationForm
          data={data}
          revision={draft?.revision ?? 0}
          correctionFields={
            draft?.state === "changes_requested" ||
            draft?.state === "incomplete"
              ? (draft?.correction_fields ?? {})
              : {}
          }
        />
      </section>
      <section className="registration-section">
        <h2>Foto profissional</h2>
        {draft?.photo_path ? (
          <ProfilePhoto
            key={draft.revision}
            src={`/cadastro/foto?v=${draft.revision}`}
          />
        ) : (
          <p>Nenhuma foto salva.</p>
        )}
        <RegistrationPhoto hasPhoto={!!draft?.photo_path} />
      </section>
      <section className="registration-section">
        <h2>Termos e privacidade</h2>
        <p>
          Versão {legalVersion}. O aceite fica registrado com data e integridade
          do documento.
        </p>
        <RegistrationDocuments accepted={accepted} />
      </section>
      <section className="registration-section">
        <h2 id="envio">Revisão e envio</h2>
        <dl>
          {registrationReviewOrder.map((key) => (
            <div key={key}>
              <dt>{registrationFieldLabels[key]}</dt>
              <dd>{registrationValueLabel(key, data[key] ?? "")}</dd>
            </div>
          ))}
        </dl>
        <p>
          CPF:{" "}
          {draft?.cpf ? `***.***.***-${draft.cpf.slice(-2)}` : "Não informado"}
        </p>
        <RegistrationSubmit
          revision={draft?.revision ?? 0}
          submitted={draft?.state === "submitted"}
        />
        <Link href="/suporte">
          Precisa de ajuda ou deseja contestar uma decisão?
        </Link>
      </section>
      <section className="registration-section">
        <h2>Decisões e correções</h2>
        {registration?.decisions?.length ? (
          registration.decisions.map(
            (decision: {
              revision: number;
              outcome: string;
              fields: Record<string, string>;
              decided_at: string;
            }) => (
              <article key={`${decision.revision}-${decision.decided_at}`}>
                <h3>
                  Versão {decision.revision} —{" "}
                  {
                    (
                      {
                        approved: "Aprovado",
                        changes_requested: "Correções solicitadas",
                        rejected: "Não aprovado",
                        suspended: "Suspenso",
                      } as Record<string, string>
                    )[decision.outcome]
                  }
                </h3>
                <p>
                  {new Date(decision.decided_at).toLocaleDateString("pt-BR")}
                </p>
                {Object.entries(decision.fields).map(([field, reason]) => (
                  <p key={field}>
                    {registrationFieldLabels[field] ?? "Campo cadastral"}:{" "}
                    {reason}{" "}
                    {decision.revision < (draft?.revision ?? 0)
                      ? "(Orientação da versão anterior.)"
                      : ""}
                  </p>
                ))}
              </article>
            ),
          )
        ) : (
          <p>A equipe ainda não registrou uma decisão.</p>
        )}
      </section>
    </main>
  );
}
