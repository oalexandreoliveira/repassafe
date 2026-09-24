import Link from "next/link";

export default function Home() {
  return (
    <main className="shell">
      <header className="brand">
        <span aria-hidden="true">R</span> Repassafe
      </header>
      <section className="hero">
        <p className="eyebrow">Beta privada · Repasse assistido</p>
        <h1>Passagem segura, do anúncio ao acordo.</h1>
        <p className="lede">
          Publique plantões, receba candidaturas e formalize a substituição com
          confirmação, aprovação institucional configurável e rastreabilidade.
        </p>
        <div className="actions">
          <Link className="button button-primary" href="/entrar">
            Entrar na plataforma
          </Link>
          <Link className="button button-secondary" href="/cadastro">
            Solicitar acesso
          </Link>
        </div>
      </section>
      <section className="grid" aria-label="Fundamentos da plataforma">
        {[
          [
            "Acesso protegido",
            "Rede fechada, autenticação e menor privilégio.",
          ],
          ["Rastreabilidade", "Auditoria das transições críticas do repasse."],
          ["Uso responsável", "Nenhum campo destinado a dados de pacientes."],
        ].map(([title, text]) => (
          <article className="card" key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
