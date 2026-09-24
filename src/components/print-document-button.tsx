"use client";

export function PrintDocumentButton() {
  return (
    <button
      className="button button-primary no-print"
      onClick={() => window.print()}
      type="button"
    >
      Imprimir ou salvar como PDF
    </button>
  );
}
