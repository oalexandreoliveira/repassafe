"use client";

import { useState } from "react";
import type { ButtonVariant } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import styles from "./confirm-submit.module.css";

/** Envio que pede confirmação antes de uma ação difícil de desfazer. */
export function ConfirmSubmit({
  children,
  question,
  confirmLabel,
  keepLabel,
  variant = "ghost",
}: {
  /** Rótulo inicial ("Cancelar candidatura"). */
  children: string;
  /** Pergunta exibida antes de confirmar. */
  question: string;
  confirmLabel: string;
  keepLabel: string;
  variant?: ButtonVariant;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking)
    return (
      <Button
        type="button"
        variant={variant}
        block
        onClick={() => setAsking(true)}
      >
        {children}
      </Button>
    );
  return (
    <div className={styles.confirm} role="group" aria-label={question}>
      <p className={styles.question}>{question}</p>
      <SubmitButton variant="secondary" block autoFocus>
        {confirmLabel}
      </SubmitButton>
      <Button
        type="button"
        variant="ghost"
        block
        onClick={() => setAsking(false)}
      >
        {keepLabel}
      </Button>
    </div>
  );
}
