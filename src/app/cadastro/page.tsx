import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <main className="auth-shell">
      <Link href="/" className="brand">
        <span aria-hidden="true">R</span> Repassafe
      </Link>
      <section className="auth-card">
        <p className="eyebrow">Beta privada</p>
        <h1>Solicitar cadastro</h1>
        <p>
          O acesso depende da confirmação do e-mail e da verificação do CRM.
        </p>
        <AuthForm mode="signup" />
      </section>
    </main>
  );
}
