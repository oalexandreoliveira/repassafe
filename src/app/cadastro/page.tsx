import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <main className="auth-shell">
      <Link href="/" className="brand">
        <span aria-hidden="true">R</span> Repassafe
      </Link>
      <section className="auth-card">
        <h1>Crie sua conta</h1>
        <p>
          Primeiro, confirme seu e-mail. Depois, complete a identificação e
          envie seu cadastro para verificação. Criar a conta ainda não habilita
          repasses.
        </p>
        <AuthForm mode="signup" />
      </section>
    </main>
  );
}
