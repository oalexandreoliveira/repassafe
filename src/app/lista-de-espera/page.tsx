import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Lock, ShieldOff, Wallet } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { WaitlistForm } from "@/components/waitlist-form";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Lista de espera do piloto",
  description:
    "Entre na lista de espera do piloto privado do Repassafe para repassar e assumir plantões com colegas de CRM verificado.",
};

const points = [
  [
    BadgeCheck,
    "CRM verificado",
    "Só médicos aprovados participam das trocas, cada um com o CRM conferido.",
  ],
  [
    Lock,
    "Acordo registrado e imutável",
    "As condições confirmadas ficam em um registro que não pode ser editado.",
  ],
  [
    ShieldOff,
    "Sem dados de pacientes",
    "Os campos livres não devem receber informações de pacientes.",
  ],
  [
    Wallet,
    "Sem intermediação de pagamento",
    "O acerto financeiro é feito diretamente entre os médicos.",
  ],
] as const;

export default function WaitlistPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <Logo priority />
        </Link>
        <Link href="/entrar" className={styles.headerLink}>
          Entrar
        </Link>
      </header>

      <section className={styles.hero} aria-labelledby="waitlist-heading">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>PILOTO PRIVADO</p>
          <h1 id="waitlist-heading">
            Entre na fila para repassar plantões com colegas.
          </h1>
          <p className={styles.lede}>
            O Repassafe está em piloto fechado, com grupos de médicos
            convidados. Deixe seu contato e avisamos quando houver vaga para sua
            região e especialidade. O piloto é gratuito.
          </p>
        </div>

        <div className={styles.card}>
          <h2>Deixe seu contato</h2>
          <WaitlistForm />
        </div>
      </section>

      <section className={styles.points} aria-labelledby="points-heading">
        <h2 id="points-heading">Como o piloto funciona</h2>
        <ul>
          {points.map(([Icon, title, text]) => (
            <li key={title} className={styles.point}>
              <span className={styles.icon}>
                <Icon size={22} aria-hidden="true" />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className={styles.footer}>
        <span>© 2026 Repassafe</span>
        <div>
          <Link href="/privacidade">Política de Privacidade</Link>
          <Link href="/termos">Termos de Uso</Link>
          <Link href="/suporte">Suporte</Link>
        </div>
      </footer>
    </main>
  );
}
