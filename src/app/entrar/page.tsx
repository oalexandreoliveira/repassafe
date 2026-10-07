import { AuthForm } from "@/components/auth-form";
import { AuthScreen } from "@/components/screens/auth-screen";

export default function LoginPage() {
  return (
    <AuthScreen
      title="Entrar na plataforma"
      intro="Use o e-mail confirmado para acessar seu grupo."
    >
      <AuthForm mode="login" />
    </AuthScreen>
  );
}
