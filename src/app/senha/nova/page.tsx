import { NewPasswordForm } from "@/components/email-action-form";
import { AuthScreen } from "@/components/screens/auth-screen";
import { ButtonLink } from "@/components/ui/button";
import { InfoBanner } from "@/components/ui/info-banner";
import { getVerifiedIdentity } from "@/lib/auth/session";

export default async function NewPasswordPage() {
  const identity = await getVerifiedIdentity();
  return (
    <AuthScreen title="Defina uma nova senha">
      {identity ? (
        <NewPasswordForm />
      ) : (
        <>
          <InfoBanner variant="warning" role="status">
            O link expirou ou não é válido. Solicite uma nova recuperação.
          </InfoBanner>
          <ButtonLink href="/senha/esqueci" block>
            Solicitar novo link
          </ButtonLink>
        </>
      )}
    </AuthScreen>
  );
}
