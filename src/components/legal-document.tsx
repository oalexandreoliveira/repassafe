import Link from "next/link";
import { legalDocuments } from "@/features/registration/legal";

export function LegalDocument({
  document,
}: {
  document: keyof typeof legalDocuments;
}) {
  const content = legalDocuments[document];
  return (
    <main className="shell legal-document">
      <Link href="/" className="brand">
        <span aria-hidden="true">R</span> Repassafe
      </Link>
      <h1>{content.title}</h1>
      <p>Versão {content.version} · Responsável: Alexandre Oliveira</p>
      {content.sections.map(([title, text]) => (
        <section key={title}>
          <h2>{title}</h2>
          <p>{text}</p>
        </section>
      ))}
      <p>
        <Link href="/suporte">Abrir solicitação de suporte ou privacidade</Link>
      </p>
      <p>
        <Link href="/cadastro">Voltar ao cadastro</Link>
      </p>
    </main>
  );
}
