import { redirect } from "next/navigation";
import { MfaForm } from "@/components/mfa-form";
import {
  getAdministrativeAccess,
  getVerifiedIdentity,
} from "@/lib/auth/session";
import { AuthScreen } from "@/components/screens/auth-screen";

export default async function MfaPage() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");

  if (!(await getAdministrativeAccess(identity))) {
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
    <AuthScreen
      title="Verificação em duas etapas"
      intro={
        verifiedFactor
          ? "Confirme sua identidade para abrir a administração."
          : "Configure um aplicativo autenticador para proteger a administração."
      }
    >
      <MfaForm factorId={verifiedFactor?.id} staleFactorIds={staleFactorIds} />
    </AuthScreen>
  );
}
