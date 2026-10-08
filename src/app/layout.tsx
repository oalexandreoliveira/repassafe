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

export const metadata: Metadata = {
  title: "Repassafe | Repasse de plantões com clareza e segurança",
  description:
    "Uma rede privada para profissionais e instituições organizarem substituições de plantões com acesso controlado e etapas registradas.",
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
