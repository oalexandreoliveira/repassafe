import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <Link href="/" className="brand">
        <Logo priority />
      </Link>
      <section className="auth-card">
        <p className="eyebrow">Acesso privado</p>
        <h1>Entrar na plataforma</h1>
        <p>Use o e-mail confirmado para acessar seu grupo.</p>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
