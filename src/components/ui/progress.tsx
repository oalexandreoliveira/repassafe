import { Check } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./progress.module.css";

/** Barra segmentada com legenda "Etapa X de Y · …" (a legenda carrega o estado). */
export function ProgressSteps({
  total,
  current,
  caption,
}: {
  total: number;
  /** Etapa atual, a partir de 1. */
  current: number;
  caption: string;
}) {
  return (
    <div className={styles.progress}>
      <div className={styles.bar} aria-hidden="true">
        {Array.from({ length: total }, (_, index) => {
          const step = index + 1;
          const state =
            step < current
              ? styles.done
              : step === current
                ? styles.current
                : "";
          return <span key={step} className={`${styles.segment} ${state}`} />;
        })}
      </div>
      <p className={styles.caption}>{caption}</p>
    </div>
  );
}

export type StepState = "done" | "current" | "upcoming";

export type Step = {
  title: string;
  description?: ReactNode;
  state: StepState;
  /** Âncora ou rota da etapa (ex.: seções de um formulário longo). */
  href?: string;
};

const stateText: Record<StepState, string> = {
  done: "Concluída",
  current: "Etapa atual",
  upcoming: "Próxima",
};

/** Linha do tempo vertical de próximos passos. */
export function StepList({ title, steps }: { title?: string; steps: Step[] }) {
  return (
    <section className={styles.steps} aria-label={title}>
      {title ? <h2 className={styles.stepsTitle}>{title}</h2> : null}
      <ol className={styles.list}>
        {steps.map((step) => (
          <li
            key={step.title}
            className={styles.step}
            data-state={step.state}
            aria-current={step.state === "current" ? "step" : undefined}
          >
            <span className={styles.marker} aria-hidden="true">
              {step.state === "done" ? (
                <Check size={16} strokeWidth={2.6} />
              ) : null}
            </span>
            <p className={styles.stepText}>
              <span className={styles.stepTitle}>
                <span className="sr-only">{stateText[step.state]}: </span>
                {step.href ? (
                  <a href={step.href} className={styles.stepLink}>
                    {step.title}
                  </a>
                ) : (
                  step.title
                )}
              </span>
              {step.description ? (
                <span className={styles.stepDescription}>
                  {step.description}
                </span>
              ) : null}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
