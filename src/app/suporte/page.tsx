import Link from "next/link";
import { SupportForm } from "@/components/support-form";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/ui/logo";
type Request = {
  id: string;
  message: string;
  response: string | null;
  state: string;
  created_at: string;
};
export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ assunto?: string }>;
}) {
  const crmReview = (await searchParams).assunto === "crm";
  const identity = await getVerifiedIdentity();
  const account = identity ? await identity.supabase.auth.getUser() : null;
  const result = identity
    ? await createAdminClient().rpc("support_list", {
        target_user: identity.userId,
      })
    : null;
  if (result?.error)
    throw new Error("Não foi possível carregar suas solicitações.");
  return (
    <main className="shell legal-document">
      <Link href="/" className="brand">
        <Logo priority />
      </Link>
      <h1>Suporte e privacidade</h1>
      <p>
        Descreva sua dúvida ou pedido. O responsável pelo Repassafe é Alexandre
        Oliveira. Você receberá um protocolo ao registrar a solicitação.
      </p>
      {crmReview && (
        <p>
          Confira o número e a UF do CRM. A equipe verificará sua identidade
          antes de decidir. Este pedido não cancela nem transfere outro cadastro
          automaticamente. Não envie documentos por este campo; aguarde
          orientação pelo canal de suporte.
        </p>
      )}
      <SupportForm
        email={account?.data.user?.email}
        initialCategory={crmReview ? "crm_review" : "support"}
      />
      {identity ? (
        <section>
          <h2>Minhas solicitações</h2>
          {result?.data?.length ? (
            (result.data as Request[]).map((request) => (
              <article className="registration-section" key={request.id}>
                <h3>Protocolo {request.id}</h3>
                <p>{request.message}</p>
                <p>{request.response ?? "Aguardando resposta da equipe."}</p>
              </article>
            ))
          ) : (
            <p>Nenhuma solicitação registrada.</p>
          )}
        </section>
      ) : (
        <p>
          <Link href="/entrar">Entre na sua conta</Link> para acompanhar as
          respostas vinculadas ao seu cadastro.
        </p>
      )}
    </main>
  );
}
