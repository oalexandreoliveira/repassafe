"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./toast.module.css";

/**
 * Aviso breve após uma ação concluída ("Plantão publicado"). Remove o
 * parâmetro da URL para não reaparecer ao recarregar.
 */
export function Toast({
  message,
  clearParam,
}: {
  message: string;
  /** Parâmetro de busca que originou o aviso. */
  clearParam?: string;
}) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (clearParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete(clearParam);
      window.history.replaceState(window.history.state, "", url);
    }
    const timer = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [clearParam]);
  return (
    <div className={styles.region} role="status" aria-live="polite">
      {visible ? (
        <p className={styles.toast}>
          <Check size={18} />
          {message}
        </p>
      ) : null}
    </div>
  );
}
