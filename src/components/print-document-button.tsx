"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Abre a impressão do navegador, onde o acordo pode ser salvo em PDF. */
export function PrintDocumentButton() {
  return (
    <Button
      type="button"
      block
      className="no-print"
      icon={<Download size={20} />}
      onClick={() => window.print()}
    >
      Baixar acordo em PDF
    </Button>
  );
}
