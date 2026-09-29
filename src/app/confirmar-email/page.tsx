import Link from "next/link";
import { EmailActionForm } from "@/components/email-action-form";
export default function ResendEmailPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Confirme seu e-mail</h1>
        <p>Solicite outro link se a mensagem anterior não chegou ou expirou.</p>
        <EmailActionForm mode="confirmation" />
        <Link href="/entrar">Voltar para entrar</Link>
      </section>
    </main>
  );
}
