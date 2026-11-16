import type { MetadataRoute } from "next";
import { handoverGuide } from "@/features/marketing/handover-guide";
import { legalVersion } from "@/features/registration/schemas";
import { indexablePaths, siteUrl, type IndexablePath } from "@/lib/seo";

/** Só documentos versionados e o guia datado têm data de alteração confiável. */
const lastModifiedByPath: Partial<Record<IndexablePath, string>> = {
  [handoverGuide.path]: handoverGuide.dateModified,
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
