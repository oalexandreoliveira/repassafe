import Link from "next/link";
import { NewPasswordForm } from "@/components/email-action-form";
import { getVerifiedIdentity } from "@/lib/auth/session";
import { Logo } from "@/components/ui/logo";

export default async function NewPasswordPage() {
  const identity = await getVerifiedIdentity();
  return (
    <main className="auth-shell">
      <Link href="/" className="brand">
        <Logo priority />
      </Link>
      <section className="auth-card">
        <p className="eyebrow">Recuperação de acesso</p>
        <h1>Defina uma nova senha</h1>
        {identity ? (
          <NewPasswordForm />
        ) : (
          <>
            <p>
              O link expirou ou não é válido. Solicite uma nova recuperação.
            </p>
            <Link className="button button-primary" href="/senha/esqueci">
              Solicitar novo link
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
