import type { Metadata } from "next";
import Link from "next/link";
import { AppScreen, ScreenHeading } from "@/components/ui/app-shell";
import styles from "@/components/screens/screens.module.css";
import { requireDevPages } from "../enabled";

export const metadata: Metadata = {
  title: "Prévias de tela | Repassafe",
  robots: { index: false, follow: false },
};

const previews = [
  ["s02", "S02 · Mural de plantões"],
  ["s02-vazio", "S02 · Estado vazio"],
  ["s02-erro", "S02 · Erro de rede"],
  ["s03", "S03 · Detalhe do plantão"],
  ["s03-titular", "S03 · Titular com candidaturas"],
  ["s03-substituto", "S03 · Substituto confirmando condições"],
  ["s05", "S05 · Publicar plantão"],
  ["s06", "S06 · Revisar e publicar"],
  ["s10", "S10 · Acordo registrado"],
  ["s11", "S11 · Notificações"],
] as const;

export default async function ScreenPreviewIndex() {
  await requireDevPages();
  return (
    <AppScreen>
      <ScreenHeading
        title="Prévias de tela"
        subtitle="Views reais com dados fictícios, para comparar com design/screens/png."
      />
      <ul className={styles.list}>
        {previews.map(([slug, label]) => (
          <li key={slug}>
            <Link href={`/dev/telas/${slug}`}>{label}</Link>
          </li>
        ))}
      </ul>
      <Link href="/dev/componentes">Catálogo de componentes</Link>
    </AppScreen>
  );
}
