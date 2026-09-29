import Link from "next/link";
import { EmailActionForm } from "@/components/email-action-form";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-shell">
      <Link href="/" className="brand">
        <span aria-hidden="true">R</span> Repassafe
      </Link>
      <section className="auth-card">
        <p className="eyebrow">Recuperação de acesso</p>
        <h1>Esqueci minha senha</h1>
        <p>
          Informe o e-mail da conta. Se puder receber a recuperação, enviaremos
          um link.
        </p>
        <EmailActionForm mode="recovery" />
        <p className="form-help">
          <Link href="/entrar">Voltar para entrar</Link>
        </p>
      </section>
    </main>
  );
}
