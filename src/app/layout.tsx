import type { Metadata, Viewport } from "next";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "./globals.css";
import { PwaRegistration } from "@/components/pwa-registration";
import { colors } from "@/styles/theme";
import {
  homeDescription,
  homeTitle,
  sharedOpenGraph,
  siteName,
  siteUrl,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: `${homeTitle} | ${siteName}`,
    template: `%s | ${siteName}`,
  },
  description: homeDescription,
  openGraph: sharedOpenGraph,
  twitter: { card: "summary_large_image" },
  // Áreas autenticadas ficam fora dos buscadores por padrão; páginas públicas
  // liberam a indexação com publicPageMetadata().
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  themeColor: colors.base,
  // Libera env(safe-area-inset-*) para tab bar, rodapé e top bar.
  viewportFit: "cover",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <PwaRegistration />
      </body>
    </html>
  );
}
