import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/**
 * Sem condição por VERCEL_ENV: a produção é uma build de Preview promovida, e
 * a Vercel já envia "X-Robots-Tag: noindex" nas URLs de Preview.
 * As telas autenticadas continuam rastreáveis para que o noindex delas seja lido.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/admin", "/dev/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
