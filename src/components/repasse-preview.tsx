"use client";

import { useRef, useState } from "react";
import { Check, FileCheck2 } from "lucide-react";
import { repasseSteps } from "@/features/marketing/repasse-steps";
import styles from "@/app/page.module.css";

export function RepassePreview() {
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const step = repasseSteps[selected];
  return (
    <div className={styles.processPreview}>
      <div className={styles.previewHeading}>
        <FileCheck2 size={20} aria-hidden="true" />
        <p>Do plantão ao acordo</p>
      </div>
      <div
        className={styles.previewSteps}
        role="tablist"
        aria-label="Explore as etapas de um repasse"
      >
        <span className={styles.previewTrack} aria-hidden="true">
          <span style={{ transform: `scaleX(${selected / 4})` }} />
        </span>
        {repasseSteps.map((item, index) => (
          <button
            key={item.label}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`repasse-step-${index}`}
            aria-controls="repasse-step-panel"
            aria-selected={selected === index}
            aria-label={`${index + 1}. ${item.label}`}
            tabIndex={selected === index ? 0 : -1}
            data-passed={index < selected}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => {
              let next = selected;
              if (event.key === "ArrowRight") next = (selected + 1) % 5;
              else if (event.key === "ArrowLeft") next = (selected + 4) % 5;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = 4;
              else return;
              event.preventDefault();
              setSelected(next);
              buttons.current[next]?.focus();
            }}
          >
            <span aria-hidden="true">{index + 1}</span>
          </button>
        ))}
      </div>
      <div
        id="repasse-step-panel"
        className={styles.previewPanel}
        role="tabpanel"
        aria-labelledby={`repasse-step-${selected}`}
        tabIndex={0}
      >
        <p className={styles.previewTitle}>
          {step.label}
          {selected === 4 ? (
            <Check
              className={styles.agreementCheck}
              size={20}
              aria-hidden="true"
            />
          ) : null}
        </p>
        <p>{step.preview}</p>
      </div>
      <p className={styles.previewHint}>
        Selecione uma etapa para conhecer o fluxo.
      </p>
    </div>
  );
}
