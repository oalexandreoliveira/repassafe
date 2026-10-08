"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import styles from "./share-button.module.css";

/**
 * Compartilha o link de um plantão pelo menu nativo (WhatsApp, por exemplo);
 * sem suporte, copia o link. O texto nunca leva dados de pacientes.
 */
export function ShareButton({
  path,
  title,
  text,
  children = "Compartilhar no grupo",
}: {
  /** Caminho interno, como /plantoes/{id}. */
  path: string;
  title: string;
  text: string;
  children?: string;
}) {
  const [status, setStatus] = useState("");
  async function share() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setStatus("Link copiado. Cole no grupo do WhatsApp.");
    } catch (error) {
      if ((error as Error)?.name !== "AbortError")
        setStatus(
          "Não foi possível compartilhar. Copie o endereço do plantão.",
        );
    }
  }
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        block
        icon={<Share2 size={18} />}
        onClick={share}
      >
        {children}
      </Button>
      <p className={styles.status} role="status">
        {status}
      </p>
    </>
  );
}
