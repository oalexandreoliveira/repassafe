import { AuthForm } from "@/components/auth-form";
import { AuthScreen } from "@/components/screens/auth-screen";

import { safeReturnPath } from "@/features/groups/invite-path";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string }>;
}) {
  const next = safeReturnPath((await searchParams).proximo) ?? undefined;
  return (
    <AuthScreen
      title="Crie sua conta"
      intro="Primeiro, confirme seu e-mail. Depois, complete a identificação e envie seu cadastro para verificação. Criar a conta ainda não habilita repasses."
    >
      <AuthForm mode="signup" next={next} />
    </AuthScreen>
  );
}
