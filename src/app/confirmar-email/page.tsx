import { EmailActionForm } from "@/components/email-action-form";
import { AuthScreen } from "@/components/screens/auth-screen";
import { ButtonLink } from "@/components/ui/button";

export default function ResendEmailPage() {
  return (
    <AuthScreen
      title="Confirme seu e-mail"
      intro="Solicite outro link se a mensagem anterior não chegou ou expirou."
    >
      <EmailActionForm mode="confirmation" />
      <ButtonLink href="/entrar" variant="ghost" size="sm" block>
        Voltar para entrar
      </ButtonLink>
    </AuthScreen>
  );
}
