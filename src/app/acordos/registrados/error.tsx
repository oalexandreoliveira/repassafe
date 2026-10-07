"use client";
export default function AgreementError({ reset }: { reset: () => void }) {
  return (
    <section>
      <h1>Não foi possível carregar os acordos</h1>
      <p role="alert">
        Tente novamente em instantes. Seus registros enviados permanecem
        preservados.
      </p>
      <button className="button button-primary" onClick={reset}>
        Tentar novamente
      </button>
    </section>
  );
}
