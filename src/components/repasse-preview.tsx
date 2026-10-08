"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { PublishShiftFields } from "@/components/publish-shift-fields";
import { PublishShiftReview } from "@/components/publish-shift-review";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ShiftCard } from "@/components/ui/shift-card";
import { formatHourRangeShort, formatShiftDay } from "@/features/shifts/format";
import {
  composeRange,
  fortalezaIso,
  type ShiftFormValues,
} from "@/features/shifts/form-values";
import styles from "./repasse-preview.module.css";

const duration = 13000;
/** Dados fictícios de uma oferta livre. */
const example: ShiftFormValues = {
  groupId: "",
  sector: "Clínica médica",
  date: "2026-10-15",
  start: "07:00",
  end: "19:00",
  value: "1200,00",
  paymentTerms: "Pagamento em até 30 dias",
  notes: "",
};
const exampleRange = composeRange(example);
const exampleStart = fortalezaIso(exampleRange.startsAt);
const exampleEnd = fortalezaIso(exampleRange.endsAt);
const scenes = [
  {
    name: "Preencher",
    time: 0,
    description:
      "O profissional aprovado informa horários, setor e valor do plantão.",
  },
  {
    name: "Conferir",
    time: 8000,
    description:
      "Antes de publicar, o titular confirma os dados e as condições da oferta.",
  },
  {
    name: "Publicado",
    time: duration,
    description:
      "A oferta livre fica disponível para profissionais aprovados. O repasse ainda depende da candidatura e das confirmações.",
  },
];
function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

export function RepassePreview() {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
  const pageVisible = useSyncExternalStore(
    subscribeVisibility,
    () => !document.hidden,
    () => true,
  );
  const scene = time >= 11500 ? 2 : time >= 8000 ? 1 : 0;
  const running =
    playing && visible && pageVisible && !reduced && time < duration;
  const scrollTarget =
    scene === 2
      ? "top"
      : time >= 9000
        ? "ownerTermsAcknowledged"
        : scene === 1
          ? "top"
          : time >= 5400
            ? "paymentTerms"
            : time >= 3000
              ? "sector"
              : "top";

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.25 },
    );
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(
      () => setTime((value) => Math.min(duration, value + 50)),
      50,
    );
    return () => window.clearInterval(interval);
  }, [running]);
  useEffect(() => {
    const container = viewport.current;
    if (!container) return;
    const target = container
      .querySelector<HTMLElement>(`[name="${scrollTarget}"]`)
      ?.closest("[data-field], label");
    const top = target
      ? target.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        20
      : 0;
    container.scrollTo({
      top,
      behavior: running && !reduced ? "smooth" : "instant",
    });
  }, [scrollTarget, reduced, running]);

  const typed = (value: string, start: number, length: number) =>
    value.slice(
      0,
      Math.floor(
        value.length * Math.min(1, Math.max(0, (time - start) / length)),
      ),
    );
  const values: ShiftFormValues = reduced
    ? example
    : {
        ...example,
        date: time >= 900 ? example.date : "",
        start: time >= 900 ? example.start : "",
        end: time >= 2000 ? example.end : "",
        sector: typed(example.sector, 3000, 1200),
        value: typed(example.value, 4400, 800),
        paymentTerms: typed(example.paymentTerms, 5400, 1800),
      };
  const acknowledged = reduced || time >= 9500;
  function selectScene(index: number) {
    setPlaying(false);
    setTime(scenes[index].time);
  }
  return (
    <div
      ref={root}
      className={styles.demo}
      role="region"
      aria-label="Demonstração de publicação de plantão"
    >
      <div className={styles.window}>
        <div className={styles.header}>
          <span className="brand">
            <Logo />
          </span>
          <span>Demonstração</span>
        </div>
        <div
          ref={viewport}
          className={styles.viewport}
          aria-hidden="true"
          inert
          data-scene={scene}
          data-running={running}
        >
          <div className={styles.screen}>
            <h2>
              {scene === 2
                ? "Plantões abertos"
                : scene === 1
                  ? "Revisar e publicar"
                  : "Publicar plantão"}
            </h2>
            {scene === 2 ? (
              <ShiftCard
                status={{ tone: "open", label: "Aberto" }}
                group="Oferta livre"
                title={example.sector}
                date={formatShiftDay(exampleStart)}
                time={formatHourRangeShort(exampleStart, exampleEnd)}
                meta="Publicado agora · Seu plantão"
                headingLevel="h3"
              />
            ) : scene === 1 ? (
              <div className={styles.stack} data-confirming={time >= 10500}>
                <PublishShiftReview
                  values={example}
                  acknowledged={acknowledged}
                  readOnly
                />
                <Button type="button" block tabIndex={-1}>
                  Publicar plantão
                </Button>
              </div>
            ) : (
              <PublishShiftFields values={values} readOnly />
            )}
          </div>
        </div>
        <div className={styles.progress} aria-hidden="true">
          <span style={{ transform: `scaleX(${time / duration})` }} />
        </div>
      </div>
      <div className={styles.controls}>
        <div
          role="tablist"
          aria-label="Etapas da demonstração"
          className={styles.tabs}
        >
          {scenes.map((item, index) => (
            <button
              key={item.name}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`demo-tab-${index}`}
              aria-controls="demo-description"
              aria-selected={scene === index}
              tabIndex={scene === index ? 0 : -1}
              onFocus={() => setPlaying(false)}
              onClick={() => selectScene(index)}
              onKeyDown={(event) => {
                const next =
                  event.key === "ArrowRight"
                    ? (index + 1) % 3
                    : event.key === "ArrowLeft"
                      ? (index + 2) % 3
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? 2
                          : null;
                if (next === null) return;
                event.preventDefault();
                selectScene(next);
                tabs.current[next]?.focus();
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
        {!reduced ? (
          <button
            type="button"
            className={styles.playback}
            aria-label={
              playing && time < duration
                ? "Pausar demonstração"
                : "Reproduzir demonstração"
            }
            onClick={() => {
              if (time >= duration) {
                setTime(0);
                setPlaying(true);
              } else setPlaying(!playing);
            }}
          >
            {playing && time < duration ? (
              <Pause size={18} />
            ) : (
              <Play size={18} />
            )}
          </button>
        ) : null}
        <button
          type="button"
          className={styles.playback}
          aria-label="Repetir demonstração"
          onClick={() => {
            setTime(0);
            setPlaying(!reduced);
          }}
        >
          <RotateCcw size={18} />
        </button>
      </div>
      <div
        id="demo-description"
        role="tabpanel"
        aria-labelledby={`demo-tab-${scene}`}
        tabIndex={0}
        className={styles.description}
      >
        <p>{scenes[scene].description}</p>
      </div>
      <p className={styles.disclosure}>
        Recortes da interface do app · Dados fictícios
        {reduced ? " · Avance pelas etapas, sem animação." : ""}
      </p>
      <details className={styles.transcript}>
        <summary>Ler demonstração</summary>
        <p>
          Exemplo de oferta livre: Clínica médica, em 15/10/2026, das 07h às 19h
          (Fortaleza), por R$ 1.200,00, com pagamento em até 30 dias. O titular
          preenche os dados, confirma as condições e escolhe Publicar plantão. A
          oferta aparece como Aberto em Plantões disponíveis, com a ação
          Gerenciar. Isso ainda não confirma um repasse.
        </p>
      </details>
    </div>
  );
}
