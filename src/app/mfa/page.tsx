import Link from "next/link";
import { redirect } from "next/navigation";
import { MfaForm } from "@/components/mfa-form";
import { getVerifiedIdentity } from "@/lib/auth/session";

export default async function MfaPage() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");

  const { data: profile } = await identity.supabase
    .from("profiles")
    .select("role,status")
    .eq("id", identity.userId)
    .single();
  if (profile?.role !== "admin" || profile.status !== "approved") {
    redirect("/painel");
  }
  if (identity.claims.aal === "aal2") redirect("/admin");

  const { data: factors } = await identity.supabase.auth.mfa.listFactors();
  const verifiedFactor = factors?.totp.find(
    (factor) => factor.status === "verified",
  );
  const staleFactorIds =
    factors?.all
      .filter((factor) => factor.status === "unverified")
      .map((factor) => factor.id) ?? [];

  return (
    <main className="auth-shell">
      <Link href="/painel" className="brand">
        <span aria-hidden="true">R</span> Repassafe
      </Link>
      <section className="auth-card">
        <p className="eyebrow">Administração protegida</p>
        <h1>Verificação em duas etapas</h1>
        <p>
          {verifiedFactor
            ? "Confirme sua identidade para abrir a administração."
            : "Configure um aplicativo autenticador para proteger a administração."}
        </p>
        <MfaForm
          factorId={verifiedFactor?.id}
          staleFactorIds={staleFactorIds}
        />
      </section>
    </main>
  );
}
