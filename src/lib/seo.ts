import type { Metadata } from "next";

/**
 * Origem canônica pública. É fixa porque a produção é uma build de Preview
 * promovida na Vercel: variáveis de ambiente da build não identificam o domínio
 * servido, e as URLs canônicas precisam apontar sempre para o mesmo host.
 */
export const siteUrl = "https://www.repassafe.com.br";
export const siteName = "Repassafe";

export const homeTitle = "Repasse de plantão médico com CRM verificado";
export const homeDescription =
  "Repasse plantões médicos a colegas com CRM verificado, confirme valor e horário e mantenha o acordo registrado. Sem dados de pacientes.";

export function absoluteUrl(path: string) {
  return new URL(path, siteUrl).toString();
}

/** Imagem gerada por app/opengraph-image.tsx. */
export const ogImage = {
  url: absoluteUrl("/opengraph-image"),
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "Repassafe: repasse de plantão médico com CRM verificado e acordo registrado",
};

/** Campos compartilhados de Open Graph; páginas que definem openGraph substituem o do layout. */
export const sharedOpenGraph = {
  type: "website",
  siteName,
  locale: "pt_BR",
} as const satisfies Metadata["openGraph"];

/** Rotas abertas a buscadores. Todo o restante herda noindex do layout raiz. */
export const indexablePaths = [
  "/",
  "/lista-de-espera",
  "/cadastro",
  "/entrar",
  "/suporte",
  "/termos",
  "/privacidade",
] as const;

export type IndexablePath = (typeof indexablePaths)[number];

export function publicPageMetadata({
  path,
  title,
  description,
}: {
  path: IndexablePath;
  title: Metadata["title"];
  description: string;
}): Metadata {
  // URLs absolutas: a página raiz não recebe o metadataBase do próprio layout.
  // A imagem é explícita porque um openGraph na página descarta a do arquivo.
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { ...sharedOpenGraph, url, images: [ogImage] },
    robots: { index: true, follow: true },
  };
}

/** Serializa JSON-LD sem permitir o fechamento da tag <script>. */
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function homeStructuredData() {
  const organizationId = `${siteUrl}/#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: siteName,
        url: absoluteUrl("/"),
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/icons/android-chrome-512.png"),
          width: 512,
          height: 512,
        },
        description:
          "Plataforma para médicos repassarem e assumirem plantões com colegas de CRM verificado e acordo registrado.",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: siteName,
        url: absoluteUrl("/"),
        inLanguage: "pt-BR",
        description: homeDescription,
        publisher: { "@id": organizationId },
      },
    ],
  };
}
