import Link from "next/link";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getVerifiedIdentity } from "@/lib/auth/session";
import {
  agreementContext,
  verifyAgreementEvidence,
  type AgreementPerson,
} from "@/lib/agreements";
import {
  AgreementActionForm,
  ShareAgreement,
  PrintAgreement,
} from "@/components/agreement-forms";
import {
  agreementStatus,
  agreementStatusLabels,
  deadlineNotice,
  eventLabels,
  paymentStatus,
} from "@/features/agreements/schema";
import { formatCurrency, formatDateTime } from "@/features/shifts/schemas";
import { profileStatusLabel } from "@/features/admin/labels";
import { getPublicSupabaseEnv } from "@/config/env";

function Person({ person }: { person?: AgreementPerson | null }) {
  if (!person)
    return <>Aguardando o cadastro e a confirmação do destinatário</>;
  const expired =
    person.status === "approved" &&
    (!person.valid_until || new Date(person.valid_until) <= new Date());
  return (
    <>
      {person.name} · CRM {person.crm}/{person.uf}
      <br />
      Verificação profissional:{" "}
      {expired ? "Expirada" : (profileStatusLabel[person.status] ?? "Pendente")}
    </>
  );
}
export default async function RegisteredAgreementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const identity = await getVerifiedIdentity();
  if (!identity)
    return (
      <>
        <h1>Você recebeu um convite</h1>
        <p>
          Entre com o e-mail indicado no convite para conferir o plantão e as
          condições de pagamento.
        </p>
        <div className="actions">
          <Link className="button button-primary" href="/entrar">
            Entrar
          </Link>
          <Link className="button button-secondary" href="/cadastro">
            Criar conta
          </Link>
        </div>
        <p>
          Depois de entrar ou confirmar seu e-mail, abra “Acordos registrados”
          no painel ou retorne a este link. A análise cadastral pendente não
          impede o aceite.
        </p>
      </>
    );
  const [{ data: a, error }, { data: events, error: eventError }] =
    await Promise.all([
      identity.supabase
        .from("external_agreements")
        .select("*")
        .eq("id", id)
        .maybeSingle(),
      identity.supabase
        .from("external_agreement_events")
        .select("*")
        .eq("agreement_id", id)
        .order("sequence"),
    ]);
  if (error || eventError)
    throw new Error("Não foi possível carregar o acordo.");
  if (!a)
    return (
      <>
        <h1>Convite indisponível para esta conta</h1>
        <p>
          Confira se entrou com o mesmo e-mail informado no convite. Registros
          de grupo também exigem vínculo ativo.
        </p>
        <Link href="/painel" className="button button-secondary">
          Ir ao painel
        </Link>
      </>
    );
  const { context } = await agreementContext(id);
  const status = agreementStatus(a.status, a.starts_at);
  const isCreator = identity.userId === a.creator_id;
  const isOwner = identity.userId === a.owner_id;
  const isSubstitute = identity.userId === a.substitute_id;
  const { data: userData } = await identity.supabase.auth.getUser();
  const isRecipient =
    userData.user?.email?.toLowerCase() === a.recipient_email && !isCreator;
  const history = events ?? [];
  const reported = history.some((event) => event.kind === "payment_reported");
  const verified = verifyAgreementEvidence(
    a.document_text,
    a.document_hash,
    history,
    a.snapshot,
  );
  const recordedPerson = (role: "owner" | "substitute") =>
    a.snapshot?.[role]
      ? ({
          ...a.snapshot[role],
          status: context[role]?.status ?? "pending",
          valid_until: context[role]?.valid_until ?? null,
        } as AgreementPerson)
      : context[role];
  const action = (operation: string, label: string) => (
    <AgreementActionForm
      agreementId={id}
      requestId={randomUUID()}
      operation={operation}
      label={label}
      termsHash={a.terms_hash}
      total={a.value_cents}
    />
  );
  return (
    <>
      <h1>
        {a.status === "confirmed" ? "Registro do acordo" : "Confira o acordo"}
      </h1>
      <p>
        <strong>{agreementStatusLabels[status]}</strong>
      </p>
      {status === "expired" && (
        <p>
          O plantão já começou. Crie um novo registro apenas para um plantão
          futuro.
        </p>
      )}
      {!verified && (
        <p role="alert" className="form-error">
          Não foi possível verificar a integridade deste registro. Procure o
          suporte antes de continuar.
        </p>
      )}
      <section
        className="agreement-summary"
        aria-labelledby="agreement-summary-title"
      >
        <h2 id="agreement-summary-title">Plantão e pagamento</h2>
        <p className="agreement-commitment">
          {recordedPerson("owner")?.name ?? "Quem repassa"} pagará{" "}
          <strong>{formatCurrency(a.value_cents)}</strong> a{" "}
          {recordedPerson("substitute")?.name ?? "quem assume"} até{" "}
          <strong>{a.due_date.split("-").reverse().join("/")}</strong>.
        </p>
        <p>
          <strong>{deadlineNotice}</strong>
        </p>
        <p className="form-help">
          Pagamento via {a.payment_method}, até o fim do dia no fuso de
          Fortaleza.
        </p>
        <dl>
          <dt>Quem repassa e paga</dt>
          <dd>
            <Person person={recordedPerson("owner")} />
          </dd>
          <dt>Quem assume e recebe</dt>
          <dd>
            <Person person={recordedPerson("substitute")} />
          </dd>
          <dt>Destinatário</dt>
          <dd>{a.recipient_email}</dd>
          <dt>Local e setor</dt>
          <dd>
            {a.location}
            <br />
            {a.sector}
          </dd>
          <dt>Início</dt>
          <dd>{formatDateTime(a.starts_at)}</dd>
          <dt>Término</dt>
          <dd>{formatDateTime(a.ends_at)}</dd>
          <dt>Instituição</dt>
          <dd>
            {a.group_id
              ? a.requires_approval ||
                a.status === "pending_approval" ||
                a.approved_by
                ? "Vinculado a grupo com aprovação institucional"
                : "Vinculado a grupo sem aprovação obrigatória"
              : "Sem grupo institucional; o local informado não representa aval da instituição"}
          </dd>
          {a.notes && (
            <>
              <dt>Observações</dt>
              <dd>{a.notes}</dd>
            </>
          )}
        </dl>
        <p className="form-help">
          O aceite registra as condições entre as partes. A situação
          profissional e a autorização institucional permanecem independentes.
        </p>
      </section>
      {isCreator && status === "pending_acceptance" && (
        <section>
          <h2>Envie o convite</h2>
          <p>
            Compartilhe com o profissional do e-mail informado. O link
            encaminhado não permite que outra conta aceite em seu lugar.
          </p>
          <ShareAgreement
            url={`${getPublicSupabaseEnv().NEXT_PUBLIC_APP_URL}/acordos/registrados/${id}`}
          />
        </section>
      )}
      {isRecipient && status === "pending_acceptance" && (
        <section>
          <h2>Sua confirmação</h2>
          {context.eligible && verified ? (
            action("accept", "Aceitar acordo")
          ) : (
            <p>
              Complete o cadastro para aceitar. A análise pode estar pendente.{" "}
              <Link href="/cadastro/completar">
                Completar ou regularizar cadastro
              </Link>
            </p>
          )}
          {action("decline", "Recusar convite")}
        </section>
      )}
      {status === "pending_approval" && (
        <section>
          <h2>Aprovação institucional</h2>
          <p>
            As duas partes aceitaram. O acordo aguarda a decisão de um aprovador
            ativo do grupo.
          </p>
          {context.isApprover && verified && (
            <>
              {action("approve", "Aprovar acordo")}
              {action("reject", "Não aprovar")}
            </>
          )}
        </section>
      )}
      {isCreator &&
        ["pending_acceptance", "pending_approval"].includes(status) && (
          <details>
            <summary>Preciso corrigir ou cancelar este convite</summary>
            <p>
              As condições enviadas ficam preservadas. Cancele este convite e
              registre um novo com os dados corretos.
            </p>
            {action("cancel", "Cancelar convite")}
          </details>
        )}
      {a.status === "confirmed" && (
        <section className="registration-section">
          <h2>Pagamento</h2>
          <p>
            <strong>
              {paymentStatus(a.due_date, a.received_at, reported)}
            </strong>
          </p>
          {a.received_at && (
            <p>Recebimento confirmado em {formatDateTime(a.received_at)}.</p>
          )}
          {isOwner && !a.received_at && verified && (
            <details>
              <summary>Informar pagamento</summary>
              {action("payment", "Informei o pagamento")}
            </details>
          )}
          {isSubstitute &&
            !a.received_at &&
            verified &&
            action("receive", "Recebi")}
          {(isOwner || isSubstitute) && (
            <details>
              <summary>Informar divergência</summary>
              <p>
                Registre diferenças de valor, atraso ou outro problema. A
                informação será visível à outra parte e ficará no histórico.
              </p>
              {action("dispute", "Registrar divergência")}
            </details>
          )}
        </section>
      )}
      <section className="registration-section">
        <h2>Histórico do registro</h2>
        <ol className="agreement-events">
          {history.map((event) => (
            <li key={event.id}>
              <strong>
                {eventLabels[event.kind] ?? "Atualização registrada"}
              </strong>
              <p>
                {formatDateTime(event.created_at)} ·{" "}
                {event.actor_id === identity.userId
                  ? "Você"
                  : event.actor_id === a.owner_id
                    ? "Quem repassa"
                    : event.actor_id === a.substitute_id
                      ? "Quem assume"
                      : "Aprovador institucional"}
              </p>
              {event.kind === "payment_reported" && (
                <p>
                  {formatCurrency(event.payload.amount_cents)} · Data informada:{" "}
                  {String(event.payload.paid_on).split("-").reverse().join("/")}
                </p>
              )}
              {event.payload.description && <p>{event.payload.description}</p>}
              {event.payload.receipt_path && (isOwner || isSubstitute) && (
                <a
                  href={`/acordos/registrados/${id}/comprovante?evento=${event.id}`}
                  download
                >
                  Baixar comprovante
                </a>
              )}
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h2>Documento e integridade</h2>
        <p className="agreement-record-id">Registro {id}</p>
        {a.confirmed_at && (
          <p>Confirmado em {formatDateTime(a.confirmed_at)}.</p>
        )}
        <p>
          {verified
            ? "Integridade dos registros conferida."
            : "Integridade não confirmada."}{" "}
          As condições e os eventos são preservados. Essa conferência técnica
          não é uma assinatura digital qualificada.
        </p>
        {a.document_hash && (
          <details>
            <summary>Identificador de integridade do documento</summary>
            <p className="agreement-record-id">SHA-256: {a.document_hash}</p>
          </details>
        )}
        <PrintAgreement />
        <p>
          <Link href="/suporte">Falar com o suporte</Link>
        </p>
      </section>
    </>
  );
}
