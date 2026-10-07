import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { ProfilePhoto } from "@/components/profile-photo";
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
import { AuthScreen } from "@/components/screens/auth-screen";
import styles from "@/components/screens/screens.module.css";
import { ButtonLink } from "@/components/ui/button";
import { KeyValueList } from "@/components/ui/key-value-list";
import { StepList, type Step } from "@/components/ui/progress";

type Decision = {
  revision: number;
  outcome: string;
  fields: Record<string, string>;
  decided_at: string;
};

/** Leitura de registration_read (RPC). */
export type RegistrationData = {
  draft?: {
    data?: Record<string, string>;
    state?: string;
    revision?: number;
    photo_path?: string | null;
    phone?: string | null;
    cpf?: string | null;
    correction_fields?: Record<string, string>;
  } | null;
  acceptances?: { version: string }[];
  decisions?: Decision[];
} | null;

/** Cadastro completo (derivada): etapas, dados, foto, termos, envio e decisões. */
export function RegistrationOverview({
  registration,
  user,
  smsEnabled,
}: {
  registration: RegistrationData;
  user: Pick<
    User,
    "email" | "email_confirmed_at" | "phone" | "phone_confirmed_at"
  >;
  smsEnabled: boolean;
}) {
  const draft = registration?.draft;
  const data = draft?.data ?? {};
  const identityComplete =
    registrationSchema.safeParse(data).success && !!draft?.photo_path;
  const sent = ["submitted", "approved"].includes(draft?.state ?? "");
  const accepted =
    (registration?.acceptances ?? []).filter(
      (item: { version: string }) => item.version === legalVersion,
    ).length === 2;
  const phoneConfirmed =
    !!user.phone_confirmed_at && user.phone === draft?.phone;
  const steps: Step[] = [
    {
      title: "Conta e contatos",
      href: "#contatos",
      description: user.email_confirmed_at
        ? "E-mail confirmado"
        : "Confirme o e-mail",
      state: user.email_confirmed_at ? "done" : "current",
    },
    {
      title: "Identificação e atuação",
      href: "#identificacao",
      description: identityComplete
        ? "Dados completos"
        : "Complete os dados e a foto",
      state: identityComplete
        ? "done"
        : user.email_confirmed_at
          ? "current"
          : "upcoming",
    },
    {
      title: "Verificação profissional",
      href: "#envio",
      description:
        draft?.state === "approved"
          ? "Cadastro aprovado"
          : sent
            ? "Aguardando análise da equipe"
            : "Revise e envie para análise",
      state:
        draft?.state === "approved"
          ? "done"
          : identityComplete
            ? "current"
            : "upcoming",
    },
    {
      title: "Autorização institucional",
      href: "#instituicao",
      description: "Independente da verificação profissional",
      state: "upcoming",
    },
  ];
  const stateLabel = (
    {
      incomplete: "Em preenchimento",
      submitted: "Aguardando verificação",
      changes_requested: "Correções solicitadas",
      approved: "Aprovado",
      rejected: "Não aprovado",
    } as Record<string, string>
  )[draft?.state ?? "incomplete"];

  return (
    <AuthScreen
      title="Complete seu cadastro"
      intro="Salve por etapas e retome quando precisar. A conta, a verificação profissional e as autorizações institucionais são independentes."
      nav={
        <>
          <Link href="/painel">Painel</Link>
          <Link href="/suporte">Suporte</Link>
        </>
      }
    >
      <StepList title="Etapas do cadastro" steps={steps} />
      <section className={styles.panel} aria-label="Próximo passo">
        <h2 className={styles.panelTitle}>
          {!identityComplete
            ? "Complete sua identificação"
            : draft?.state === "changes_requested"
              ? "Corrija os campos indicados pela equipe"
              : sent
                ? "Acompanhe a análise do cadastro"
                : "Revise os dados e envie para análise"}
        </h2>
        <p className={styles.panelText}>
          {sent
            ? "O envio foi recebido. A aprovação profissional e os vínculos institucionais serão informados separadamente."
            : "Os dados salvos ficam disponíveis para você retomar. Salvar um rascunho não envia o cadastro para análise."}
        </p>
        <ButtonLink href={identityComplete ? "#envio" : "#identificacao"} block>
          {identityComplete
            ? "Ver revisão e situação"
            : "Ir para identificação"}
        </ButtonLink>
      </section>

      <section className={styles.stack} aria-labelledby="contatos">
        <h2 id="contatos" className={styles.sectionTitle}>
          Conta e contatos
        </h2>
        <KeyValueList
          items={[
            {
              label: "E-mail",
              value: `${user.email} — ${
                user.email_confirmed_at
                  ? `Confirmado em ${new Date(user.email_confirmed_at).toLocaleDateString("pt-BR")}`
                  : "Aguardando confirmação"
              }`,
              stacked: true,
            },
            {
              label: "Telefone",
              value: phoneConfirmed
                ? `Confirmado em ${new Date(user.phone_confirmed_at!).toLocaleDateString("pt-BR")}`
                : "Sem confirmação",
            },
            { label: "Situação do cadastro", value: stateLabel },
          ]}
        />
        <RegistrationPhone enabled={smsEnabled} />
        <RegistrationEmail />
      </section>

      <section className={styles.stack} aria-labelledby="identificacao">
        <h2 id="identificacao" className={styles.sectionTitle}>
          Identificação e atuação
        </h2>
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

      <section className={styles.stack} aria-labelledby="foto">
        <h2 id="foto" className={styles.sectionTitle}>
          Foto profissional
        </h2>
        {draft?.photo_path ? (
          <ProfilePhoto
            key={draft.revision}
            src={`/cadastro/foto?v=${draft.revision}`}
          />
        ) : (
          <p className={styles.help}>Nenhuma foto salva.</p>
        )}
        <RegistrationPhoto hasPhoto={!!draft?.photo_path} />
      </section>

      <section className={styles.stack} aria-labelledby="termos">
        <h2 id="termos" className={styles.sectionTitle}>
          Termos e privacidade
        </h2>
        <p className={styles.help}>
          Versão {legalVersion}. O aceite fica registrado com data e integridade
          do documento.
        </p>
        <RegistrationDocuments accepted={accepted} />
      </section>

      <section className={styles.stack} aria-labelledby="envio">
        <h2 id="envio" className={styles.sectionTitle}>
          Revisão e envio
        </h2>
        <KeyValueList
          items={[
            ...registrationReviewOrder.map((key) => ({
              label: registrationFieldLabels[key],
              value: registrationValueLabel(key, data[key] ?? ""),
            })),
            {
              label: "CPF",
              value: draft?.cpf
                ? `***.***.***-${draft.cpf.slice(-2)}`
                : "Não informado",
            },
          ]}
        />
        <RegistrationSubmit
          revision={draft?.revision ?? 0}
          submitted={draft?.state === "submitted"}
        />
        <ButtonLink href="/suporte" variant="ghost" size="sm" block>
          Precisa de ajuda ou deseja contestar uma decisão?
        </ButtonLink>
      </section>

      <section className={styles.stack} aria-labelledby="decisoes">
        <h2 id="decisoes" className={styles.sectionTitle}>
          Decisões e correções
        </h2>
        {registration?.decisions?.length ? (
          <ul className={styles.list}>
            {registration.decisions.map(
              (decision: {
                revision: number;
                outcome: string;
                fields: Record<string, string>;
                decided_at: string;
              }) => (
                <li
                  key={`${decision.revision}-${decision.decided_at}`}
                  className={styles.panel}
                >
                  <h3 className={styles.panelTitle}>
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
                  <p className={styles.help}>
                    {new Date(decision.decided_at).toLocaleDateString("pt-BR")}
                  </p>
                  {Object.entries(decision.fields).map(([field, reason]) => (
                    <p key={field} className={styles.panelText}>
                      {registrationFieldLabels[field] ?? "Campo cadastral"}:{" "}
                      {reason}{" "}
                      {decision.revision < (draft?.revision ?? 0)
                        ? "(Orientação da versão anterior.)"
                        : ""}
                    </p>
                  ))}
                </li>
              ),
            )}
          </ul>
        ) : (
          <p className={styles.help}>
            A equipe ainda não registrou uma decisão.
          </p>
        )}
      </section>

      <section className={styles.stack} aria-labelledby="instituicao">
        <h2 id="instituicao" className={styles.sectionTitle}>
          Autorização institucional
        </h2>
        <p className={styles.help}>
          A aprovação profissional permite participar das ofertas livres. Para
          acessar ofertas de um grupo institucional, a equipe precisa registrar
          um vínculo ativo nesse grupo. Informar uma instituição no cadastro não
          concede esse acesso.
        </p>
        <ButtonLink href="/painel" variant="secondary" block>
          Consultar meus grupos no painel
        </ButtonLink>
      </section>
    </AuthScreen>
  );
}
