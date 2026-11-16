import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { faqItems } from "@/features/marketing/faq";
import { handoverGuide } from "@/features/marketing/handover-guide";
import styles from "./landing-faq.module.css";

// A última palavra fica presa à seta para ela nunca quebrar sozinha de linha.
const guideWords = handoverGuide.title.toLowerCase().split(" ");
const guideLastWord = guideWords.pop();

/** Perguntas frequentes da página inicial; o texto também alimenta o JSON-LD FAQPage. */
export function LandingFaq() {
  return (
    <section
      className={styles.section}
      id="perguntas"
      aria-labelledby="faq-heading"
    >
      <div className={styles.grid}>
        <div className={styles.intro}>
          <h2 id="faq-heading">Perguntas frequentes</h2>
          <p>
            O que médicos costumam perguntar antes de repassar o primeiro
            plantão.
          </p>
          <Link href={handoverGuide.path} className={styles.guideLink}>
            Leia o guia: {guideWords.join(" ")}{" "}
            <span className={styles.noWrap}>
              {guideLastWord}
              <ArrowRight size={18} aria-hidden="true" />
            </span>
          </Link>
        </div>
        <div className={styles.list}>
          {faqItems.map(({ question, answer }) => (
            <details className={styles.item} key={question}>
              <summary>
                <h3>{question}</h3>
                <ChevronDown
                  className={styles.chevron}
                  size={20}
                  aria-hidden="true"
                />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
