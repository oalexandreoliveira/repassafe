import Link from "next/link";
import { EmailActionForm } from "@/components/email-action-form";

export default function ResendConfirmationPage() {
  return (
    <main className="auth-shell">
      <Link href="/" className="brand">
        <span aria-hidden="true">R</span> Repassafe
      </Link>
      <section className="auth-card">
        <p className="eyebrow">Confirmação de e-mail</p>
        <h1>Reenviar confirmação</h1>
        <p>
          Informe o e-mail usado no cadastro para solicitar uma nova mensagem de
          confirmação.
        </p>
        <EmailActionForm mode="confirmation" />
        <p className="form-help">
          <Link href="/entrar">Voltar para entrar</Link>
        </p>
      </section>
    </main>
  );
}
