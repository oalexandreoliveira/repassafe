import Link from "next/link";
import { Check, CircleAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { InfoBanner } from "@/components/ui/info-banner";
import { Logo } from "@/components/ui/logo";
import {
  handoverGuide,
  handoverGuideMistakes,
  handoverGuideSources,
  handoverGuideSteps,
} from "@/features/marketing/handover-guide";
import {
  handoverGuideStructuredData,
  publicPageMetadata,
  serializeJsonLd,
} from "@/lib/seo";
import styles from "./page.module.css";

export const metadata = publicPageMetadata({
  path: handoverGuide.path,
  title: handoverGuide.title,
  description: handoverGuide.description,
  article: {
    publishedTime: handoverGuide.datePublished,
    modifiedTime: handoverGuide.dateModified,
  },
});

// Datas do guia são dias do calendário; UTC evita voltar um dia no fuso local.
const dateLabel = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(handoverGuide.dateModified));

const helps = [
  "Só médicos com CRM verificado pela equipe se candidatam aos plantões.",
  "Titular e substituto confirmam as mesmas condições antes do registro.",
  "Quando o grupo exige, a decisão da coordenação fica registrada.",
  "O acordo registrado não pode ser editado e fica disponível para consulta das partes.",
] as const;

export default function HandoverGuidePage() {
  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(handoverGuideStructuredData()),
        }}
      />
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <Logo priority />
        </Link>
        <nav className={styles.headerLinks} aria-label="Acesso">
          <Link href="/entrar" className={styles.headerLink}>
            Entrar
          </Link>
          <ButtonLink href="/cadastro" size="sm" className={styles.headerCta}>
            Criar conta
          </ButtonLink>
        </nav>
      </header>

      <article className={styles.article} aria-labelledby="guide-heading">
        <nav className={styles.breadcrumb} aria-label="Trilha de navegação">
          <ol>
            <li>
              <Link href="/">Início</Link>
            </li>
            <li aria-current="page">Repasse de plantão</li>
          </ol>
        </nav>

        <p className={styles.eyebrow}>GUIA</p>
        <h1 id="guide-heading">{handoverGuide.title}</h1>
        <p className={styles.lede}>
          Quando você não pode cumprir um plantão, encontrar um substituto e
          avisar o serviço faz parte da sua responsabilidade. Veja o que dizem
          as normas, como escolher quem assume e como deixar o combinado
          registrado.
        </p>
        <p className={styles.meta}>
          Atualizado em{" "}
          <time dateTime={handoverGuide.dateModified}>{dateLabel}</time>
        </p>

        <section aria-labelledby="o-que-e">
          <h2 id="o-que-e">O que é o repasse de plantão</h2>
          <p>
            Repassar um plantão é transferir a outro médico um turno que estava
            sob sua responsabilidade na escala, com as condições combinadas
            entre vocês e o conhecimento do serviço.
          </p>
          <p>
            É diferente da passagem de plantão, que é a transmissão das
            informações dos pacientes entre a equipe que sai e a que entra.
          </p>
        </section>

        <section aria-labelledby="normas">
          <h2 id="normas">O que dizem as normas</h2>
          <p>
            O Código de Ética Médica (Resolução CFM nº 2.217/2018) proíbe o
            médico de deixar de comparecer a plantão em horário preestabelecido
            ou de abandoná-lo sem a presença de substituto, salvo por justo
            impedimento (art. 9º). Quando não há plantonista substituto, a
            direção técnica do estabelecimento deve providenciar a substituição
            (parágrafo único).
          </p>
          <p>
            Em parecer de 2022, o Conselho Regional de Medicina do Paraná
            entendeu que, se o plantonista não quer comparecer e não tem justo
            motivo, cabe a ele encontrar o substituto, e que faltas, abandonos e
            trocas que resultem em ausência têm implicações éticas e civis. O
            mesmo parecer registra que não há regra geral sobre a antecedência
            das trocas: cada instituição pode definir a sua.
          </p>
          <InfoBanner>
            Este guia é informativo e não substitui as regras do seu serviço nem
            a orientação da direção técnica ou do CRM do seu estado.
          </InfoBanner>
        </section>

        <section aria-labelledby="passo-a-passo">
          <h2 id="passo-a-passo">Passo a passo para um repasse seguro</h2>
          <ol className={styles.steps}>
            {handoverGuideSteps.map(({ title, text }, index) => (
              <li key={title}>
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
        </section>

        <section aria-labelledby="erros">
          <h2 id="erros">Erros comuns</h2>
          <ul className={styles.mistakes}>
            {handoverGuideMistakes.map((mistake) => (
              <li key={mistake}>
                <span className={styles.mistakeIcon}>
                  <CircleAlert size={18} aria-hidden="true" />
                </span>
                {mistake}
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.help} aria-labelledby="como-ajuda">
          <h2 id="como-ajuda">Como o Repassafe ajuda</h2>
          <p>
            O Repassafe organiza o repasse em etapas: você publica o plantão,
            recebe candidaturas, escolhe quem assume e as condições ficam
            registradas.
          </p>
          <ul>
            {helps.map((help) => (
              <li key={help}>
                <Check size={18} aria-hidden="true" />
                {help}
              </li>
            ))}
          </ul>
          <p className={styles.helpNote}>
            Valores e pagamento são combinados diretamente entre vocês. O
            Repassafe não intermedeia pagamentos.
          </p>
          <div className={styles.helpActions}>
            <ButtonLink href="/cadastro">Criar conta</ButtonLink>
            <Link href="/lista-de-espera" className={styles.helpLink}>
              Entrar na lista de espera
            </Link>
          </div>
        </section>

        <section aria-labelledby="fontes">
          <h2 id="fontes">Fontes</h2>
          <ul className={styles.sources}>
            {handoverGuideSources.map(({ label, href }) => (
              <li key={href}>
                <a href={href}>{label}</a>
              </li>
            ))}
          </ul>
          <p className={styles.meta}>
            Textos conferidos nos documentos oficiais em {dateLabel}.
          </p>
        </section>
      </article>

      <footer className={styles.footer}>
        <span>© 2026 Repassafe</span>
        <div>
          <Link href="/#perguntas">Perguntas frequentes</Link>
          <Link href="/privacidade">Política de Privacidade</Link>
          <Link href="/termos">Termos de Uso</Link>
          <Link href="/suporte">Suporte</Link>
        </div>
      </footer>
    </main>
  );
}
