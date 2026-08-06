import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="shell">
      <header className="brand">
        <span aria-hidden="true">R</span> Repassafe
      </header>
      <section className="hero">
        <p className="eyebrow">Beta privada · Fundação técnica</p>
        <h1>Passagem segura, desde a base.</h1>
        <p className="lede">
          A estrutura inicial do Repassafe está pronta para autenticação,
          permissões e evolução controlada. A publicação de plantões ainda não
          faz parte desta entrega.
        </p>
        <div className="actions">
          <Button>Entrar na plataforma</Button>
          <Button variant="secondary">Conhecer a beta</Button>
        </div>
      </section>
      <section className="grid" aria-label="Fundamentos da plataforma">
        {[
          [
            "Acesso protegido",
            "Rede fechada, autenticação e menor privilégio.",
          ],
          ["Rastreabilidade", "Auditoria-base para ações administrativas."],
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
