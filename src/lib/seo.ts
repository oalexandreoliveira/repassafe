import type { Metadata } from "next";
import { faqItems } from "@/features/marketing/faq";
import { handoverGuide } from "@/features/marketing/handover-guide";

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
  handoverGuide.path,
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
  article,
}: {
  path: IndexablePath;
  title: Metadata["title"];
  description: string;
  /** Datas ISO para páginas de conteúdo (og:type article). */
  article?: { publishedTime: string; modifiedTime: string };
}): Metadata {
  // URLs absolutas: a página raiz não recebe o metadataBase do próprio layout.
  // A imagem é explícita porque um openGraph na página descarta a do arquivo.
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: article
      ? {
          ...sharedOpenGraph,
          type: "article",
          ...article,
          url,
          images: [ogImage],
        }
      : { ...sharedOpenGraph, url, images: [ogImage] },
    robots: { index: true, follow: true },
  };
}

/** Serializa JSON-LD sem permitir o fechamento da tag <script>. */
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const organizationId = `${siteUrl}/#organization`;

export function homeStructuredData() {
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
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#perguntas`,
        url: absoluteUrl("/"),
        inLanguage: "pt-BR",
        mainEntity: faqItems.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };
}

export function handoverGuideStructuredData() {
  const url = absoluteUrl(handoverGuide.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#artigo`,
        headline: handoverGuide.title,
        description: handoverGuide.description,
        inLanguage: "pt-BR",
        datePublished: handoverGuide.datePublished,
        dateModified: handoverGuide.dateModified,
        mainEntityOfPage: url,
        image: ogImage.url,
        author: { "@id": organizationId },
        publisher: {
          "@type": "Organization",
          "@id": organizationId,
          name: siteName,
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl("/icons/android-chrome-512.png"),
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Início",
            item: absoluteUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Repasse de plantão",
            item: url,
          },
        ],
      },
    ],
  };
}
