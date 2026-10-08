import type { MetadataRoute } from "next";
import { colors } from "@/styles/theme";

/** Installed-app splash (S01) is drawn by the browser from name, icon and background_color. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Repassafe",
    short_name: "Repassafe",
    description: "Repasse de plantão com segurança jurídica",
    start_url: "/",
    display: "standalone",
    background_color: colors.ink,
    // Screens open on Base; a matching status bar avoids a dark strip above the top bar.
    theme_color: colors.base,
    lang: "pt-BR",
    icons: [
      {
        src: "/icons/android-chrome-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/android-chrome-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/android-chrome-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
