import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { metadata as rootMetadata } from "@/app/layout";
import {
  homeDescription,
  homeStructuredData,
  indexablePaths,
  publicPageMetadata,
  serializeJsonLd,
  siteUrl,
} from "@/lib/seo";

describe("SEO", () => {
  it("mantém as telas fora dos buscadores por padrão", () => {
    expect(rootMetadata.robots).toEqual({ index: false, follow: false });
    expect(rootMetadata.alternates).toBeUndefined();
    expect(rootMetadata.metadataBase?.toString()).toBe(`${siteUrl}/`);
  });

  it("libera a indexação e define a URL canônica das páginas públicas", () => {
    const metadata = publicPageMetadata({
      path: "/entrar",
      title: "Entrar",
      description: "Descrição",
    });
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe(`${siteUrl}/entrar`);
    expect(metadata.openGraph).toMatchObject({
      url: `${siteUrl}/entrar`,
      siteName: "Repassafe",
      locale: "pt_BR",
      images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630 }],
    });
  });

  it("lista no sitemap só as páginas públicas, com URL absoluta", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toEqual(
      indexablePaths.map((path) => new URL(path, siteUrl).href),
    );
    expect(urls[0]).toBe(`${siteUrl}/`);
    expect(urls.some((url) => /painel|plantoes|admin|agenda/.test(url))).toBe(
      false,
    );
  });

  it("aponta o sitemap e bloqueia rotas técnicas no robots.txt", () => {
    const result = robots();
    expect(result.sitemap).toBe(`${siteUrl}/sitemap.xml`);
    expect(result.rules).toMatchObject({
      userAgent: "*",
      allow: "/",
      disallow: expect.arrayContaining(["/api/", "/auth/", "/admin", "/dev/"]),
    });
  });

  it("mantém a descrição principal dentro do limite exibido nas buscas", () => {
    expect(homeDescription.length).toBeLessThanOrEqual(160);
  });

  it("serializa os dados estruturados sem fechar a tag script", () => {
    const serialized = serializeJsonLd({ text: "</script><script>" });
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual({ text: "</script><script>" });
    expect(serializeJsonLd(homeStructuredData())).toContain(
      '"@type":"Organization"',
    );
  });
});
