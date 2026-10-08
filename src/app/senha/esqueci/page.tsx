import { EmailActionForm } from "@/components/email-action-form";
import { AuthScreen } from "@/components/screens/auth-screen";
import { ButtonLink } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <AuthScreen
      title="Esqueci minha senha"
      intro="Informe o e-mail da conta. Se puder receber a recuperação, enviaremos um link."
    >
      <EmailActionForm mode="recovery" />
      <ButtonLink href="/entrar" variant="ghost" size="sm" block>
        Voltar para entrar
      </ButtonLink>
    </AuthScreen>
  );
}
