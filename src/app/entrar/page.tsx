import { AuthForm } from "@/components/auth-form";
import { AuthScreen } from "@/components/screens/auth-screen";
import { safeReturnPath } from "@/features/groups/invite-path";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string }>;
}) {
  const { proximo } = await searchParams;
  const next = safeReturnPath(proximo) ?? undefined;
  return (
    <AuthScreen
      title="Entrar na plataforma"
      intro={
        next
          ? "Entre para ver o convite do grupo. Depois do login, você volta para ele."
          : "Use o e-mail confirmado para acessar seu grupo."
      }
    >
      <AuthForm mode="login" next={next} />
    </AuthScreen>
  );
}
