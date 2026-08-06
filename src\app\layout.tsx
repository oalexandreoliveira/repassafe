import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegistration } from "@/components/pwa-registration";

export const metadata: Metadata = {
  title: "Repassafe",
  description: "Plataforma privada para substituições de plantões médicos.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#0f5c56" };
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
