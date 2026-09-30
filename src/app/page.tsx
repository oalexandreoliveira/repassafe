import Image from "next/image";
import { MobileNavigation } from "@/components/mobile-navigation";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarPlus,
  Check,
  ClipboardCheck,
  Info,
  Lock,
  ShieldCheck,
  ShieldOff,
  Users,
} from "lucide-react";
import styles from "./page.module.css";

const steps = [
  {
    icon: CalendarPlus,
    title: "Publicar plantão",
    text: "Publique para um grupo institucional ou de forma livre para todos os profissionais aprovados.",
  },
  {
    icon: Users,
    title: "Receber candidaturas",
    text: "Selecione o profissional que deverá confirmar o interesse em assumir o plantão.",
  },
  {
    icon: ClipboardCheck,
    title: "Confirmar condições",
    text: "Confira todas as condições antes de confirmar que deseja assumir este plantão.",
  },
  {
    icon: Building2,
    title: "Aprovação institucional, quando o grupo exigir",
    text: "O repasse será concluído quando o responsável pelo grupo registrar a decisão.",
  },
  {
    icon: ShieldCheck,
    title: "Acordo registrado",
    text: "A substituição foi concluída e as condições foram registradas.",
  },
];
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
          </div>
          <Link href="/entrar" className={styles.navCta}>
            Entrar <ArrowRight size={16} />
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <h1>Repasse seu plantão com clareza e segurança.</h1>
              <p className={styles.lede}>
                Encontre um profissional elegível, confirme as condições e
                registre cada etapa da substituição em um único lugar.
              </p>
              <div className={styles.actions}>
                <Link href="/entrar" className={styles.primaryButton}>
                  Entrar na plataforma <ArrowRight size={18} />
                </Link>
                <Link href="/cadastro" className={styles.secondaryButton}>
                  Criar conta
                </Link>
              </div>
              <p className={styles.support}>
                Uma rede privada para profissionais e instituições
                participantes.
              </p>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.heroGlow} />
              <Image
                src="/repassafe-hero.png"
                alt="Mockup do Repassafe com plantões disponíveis, etapas do repasse e selo de confirmação"
                width={1536}
                height={1024}
                priority
                sizes="(max-width: 800px) 100vw, 54vw"
              />
              <span className={styles.visualBadge}>
                <Lock size={15} /> Processo rastreável
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.flowSection} id="como-funciona">
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <h2>Cada etapa do repasse, registrada</h2>
          </div>
          <div className={styles.steps}>
            {steps.map(({ icon: Icon, title, text }, index) => (
              <article className={styles.stepCard} key={title}>
                <div className={styles.stepTop}>
                  <span className={styles.iconChip}>
                    <Icon size={22} />
                  </span>
                  <span className={styles.stepNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
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
            <Link href="/cadastro" className={styles.invertedButton}>
              Criar conta <ArrowRight size={18} />
            </Link>
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
