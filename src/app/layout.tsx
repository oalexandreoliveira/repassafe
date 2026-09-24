import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegistration } from "@/components/pwa-registration";

export const metadata: Metadata = {
  title: "Repassafe | Repasse de plantões com clareza e segurança",
  description:
    "Uma rede privada para profissionais e instituições organizarem substituições de plantões com acesso controlado e etapas registradas.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg" },
};
export const viewport: Viewport = { themeColor: "#14403F" };
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
