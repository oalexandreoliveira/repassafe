import { MobileNavigation } from "@/components/mobile-navigation";
import { LandingSignupLink } from "@/components/landing-signup-link";
import { RepassePreview } from "@/components/repasse-preview";
import { repasseSteps } from "@/features/marketing/repasse-steps";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Info,
  Lock,
  ShieldOff,
  Users,
} from "lucide-react";
import styles from "./page.module.css";

const safeguards = [
  [BadgeCheck, "Somente médicos previamente verificados"],
  [
    Users,
    "Ofertas de grupo restritas a membros; ofertas livres visíveis a perfis aprovados",
  ],
  [Lock, "Acordo imutável e auditável"],
  [ShieldOff, "Sem dados de pacientes na plataforma"],
] as const;
const recordFields = [
  ["Titular do plantão", "Dra. Marina A."],
  ["Profissional substituto", "Dr. Lucas R."],
  ["Instituição e grupo", "Hospital Central · Clínica médica"],
  ["Setor", "Unidade de internação"],
  ["Início e término", "18 set · 19h — 19 set · 07h"],
  ["Valor", "R$ 1.200,00"],
  ["Condições de pagamento", "Conforme condições informadas pelo grupo"],
  ["Data da confirmação", "16 set 2026 · 14h32"],
];

function Brand() {
  return (
    <span className={styles.brand} aria-label="Repassafe">
      <span className={styles.brandMark} aria-hidden="true">
        R
      </span>
      Repassafe
    </span>
  );
}

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.navWrap}>
        <nav className={styles.nav} aria-label="Navegação principal">
          <Link href="/" className={styles.brandLink}>
            <Brand />
          </Link>
          <MobileNavigation />
          <div className={styles.navLinks}>
            <a href="#como-funciona">Como funciona</a>
            <a href="#seguranca">Segurança</a>
            <a href="#acordo">Rastreabilidade</a>
            <Link href="/entrar">Entrar</Link>
          </div>
          <LandingSignupLink className={styles.navCta} />
        </nav>
      </header>

      <section className={styles.hero} aria-labelledby="hero-heading">
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <h1 id="hero-heading">
                Repasse seu plantão <span>com clareza e segurança.</span>
              </h1>
              <p className={styles.lede}>
                Encontre um profissional elegível, confirme as condições e
                registre cada etapa da substituição em um único lugar.
              </p>
              <div className={styles.actions}>
                <LandingSignupLink className={styles.primaryButton} />
                <a href="#como-funciona" className={styles.secondaryButton}>
                  Como funciona <ArrowRight size={18} aria-hidden="true" />
                </a>
              </div>
              <p className={styles.support}>
                Crie sua conta e envie seu cadastro para verificação. A
                habilitação profissional e o acesso institucional são analisados
                separadamente.
              </p>
            </div>
            <div className={styles.heroVisual}>
              <RepassePreview />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.flowSection} id="como-funciona">
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <h2>Cada etapa do repasse, registrada</h2>
          </div>
          <ol className={styles.steps}>
            {repasseSteps.map(({ title, text }, index) => (
              <li className={styles.stepCard} key={title}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.recordSection} id="acordo">
        <div className={styles.rings} aria-hidden="true" />
        <div className={styles.recordIntro}>
          <h2>Clareza de responsabilidades em cada etapa</h2>
          <p>
            As condições confirmadas ficam reunidas em um registro único,
            simples de consultar e pronto para auditoria.
          </p>
          <ul className={styles.checkList}>
            <li>
              <span>
                <Check size={15} />
              </span>{" "}
              Responsabilidades identificadas
            </li>
            <li>
              <span>
                <Check size={15} />
              </span>{" "}
              Condições registradas
            </li>
            <li>
              <span>
                <Check size={15} />
              </span>{" "}
              Histórico preservado
            </li>
          </ul>
        </div>
        <article className={styles.recordCard}>
          <div className={styles.recordHeader}>
            <span className={styles.lockChip}>
              <Lock size={22} />
            </span>
            <div>
              <span className={styles.recordLabel}>DADOS FICTÍCIOS</span>
              <h3>Exemplo de acordo</h3>
            </div>
            <span className={styles.confirmed}>
              <span /> CONFIRMADO
            </span>
          </div>
          <dl className={styles.recordGrid}>
            {recordFields.map(([label, value]) => (
              <div className={styles.recordField} key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className={styles.recordNotice}>
            <Info size={18} />
            <p>
              Este registro não pode ser editado. Se houver mudança nas
              condições, será necessário cancelar o acordo e iniciar um novo
              repasse.
            </p>
          </div>
          <Link className={styles.recordButton} href="/historico">
            Consultar meus acordos <ArrowRight size={17} />
          </Link>
        </article>
      </section>

      <section className={styles.safetySection} id="seguranca">
        <div className={styles.grain} aria-hidden="true" />
        <div className={styles.container}>
          <div className={styles.safetyGrid}>
            <div className={styles.safetyCopy}>
              <h2>Acesso controlado, registro rastreável</h2>
              <p>
                Cada pessoa vê apenas o que precisa para conduzir o repasse com
                responsabilidade.
              </p>
            </div>
            <div className={styles.safeguards}>
              {safeguards.map(([Icon, title]) => (
                <article className={styles.safeguardCard} key={title}>
                  <span className={styles.safetyIcon}>
                    <Icon size={22} />
                  </span>
                  <h3>{title}</h3>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.finalWrap}>
        <div className={styles.finalCta}>
          <span className={styles.finalGlow} aria-hidden="true" />
          <h2>Repasse seu plantão com clareza e segurança.</h2>
          <p>
            Uma rede privada para profissionais e instituições participantes.
          </p>
          <div className={styles.finalActions}>
            <LandingSignupLink className={styles.invertedButton} />
            <Link href="/entrar" className={styles.outlineButton}>
              Entrar na plataforma
            </Link>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <Brand />
            <p>
              Substituições de plantões com acesso controlado e etapas
              registradas.
            </p>
          </div>
          <div className={styles.footerColumn}>
            <span>PLATAFORMA</span>
            <a href="#como-funciona">Como funciona</a>
            <a href="#seguranca">Segurança</a>
            <Link href="/entrar">Entrar</Link>
          </div>
          <div className={styles.footerColumn}>
            <span>ACESSO</span>
            <Link href="/cadastro">Criar conta</Link>
            <a href="#acordo">Rastreabilidade</a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 Repassafe</span>
          <div>
            <Link href="/privacidade">Política de Privacidade</Link>
            <Link href="/termos">Termos de Uso</Link>
            <Link href="/suporte">Suporte</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
