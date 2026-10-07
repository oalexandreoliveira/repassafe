import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AppScreen } from "@/components/ui/app-shell";
import { IconLink } from "@/components/ui/icon-button";
import { Logo } from "@/components/ui/logo";
import "./style.css";

/** Acordos combinados fora do app (derivada): mesma estrutura de tela do app. */
export default function RegisteredAgreementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppScreen
      header={
        <header className="external-agreement-bar">
          <IconLink
            href="/acordos"
            label="Voltar aos acordos"
            icon={<ChevronLeft size={20} />}
          />
          <Logo priority />
          <nav aria-label="Navegação de acordos">
            <Link href="/acordos/registrados">Meus registros</Link>
          </nav>
        </header>
      }
    >
      <div className="external-agreement">{children}</div>
    </AppScreen>
  );
}
