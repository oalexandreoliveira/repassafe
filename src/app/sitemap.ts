import type { MetadataRoute } from "next";
import { legalVersion } from "@/features/registration/schemas";
import { indexablePaths, siteUrl, type IndexablePath } from "@/lib/seo";

/** Só os documentos versionados têm data de alteração confiável. */
const lastModifiedByPath: Partial<Record<IndexablePath, string>> = {
  "/termos": legalVersion,
  "/privacidade": legalVersion,
};

export default function sitemap(): MetadataRoute.Sitemap {
  return indexablePaths.map((path) => {
    const lastModified = lastModifiedByPath[path];
    return {
      url: new URL(path, siteUrl).toString(),
      ...(lastModified ? { lastModified } : {}),
    };
  });
}
