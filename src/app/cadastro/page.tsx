import { AuthForm } from "@/components/auth-form";
import { AuthScreen } from "@/components/screens/auth-screen";

export default function SignupPage() {
  return (
    <AuthScreen
      title="Crie sua conta"
      intro="Primeiro, confirme seu e-mail. Depois, complete a identificação e envie seu cadastro para verificação. Criar a conta ainda não habilita repasses."
    >
      <AuthForm mode="signup" />
    </AuthScreen>
  );
}
