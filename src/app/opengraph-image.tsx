import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { colors, fonts, radius, space, type } from "@/styles/theme";

// O Next lê estas exportações como literais. Mantenha iguais a ogImage em
// src/lib/seo.ts, usado pelas páginas públicas.
export const alt =
  "Repassafe: repasse de plantão médico com CRM verificado e acordo registrado";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A prévia social é lida em miniatura; a escala amplia os tokens de tipo.
const scale = 1.6;
const highlights = [
  "CRM verificado",
  "Acordo registrado",
  "Sem dados de pacientes",
] as const;

function readFont(family: string, file: string) {
  // O renderizador aceita WOFF, não WOFF2.
  return readFile(
    join(process.cwd(), "node_modules", "@fontsource", family, "files", file),
  );
}

export default async function Image() {
  const [soraBold, figtreeMedium, figtreeSemibold, logo] = await Promise.all([
    readFont("sora", "sora-latin-700-normal.woff"),
    readFont("figtree", "figtree-latin-500-normal.woff"),
    readFont("figtree", "figtree-latin-600-normal.woff"),
    readFile(
      join(process.cwd(), "public", "brand", "logo-horizontal-negativo.svg"),
    ),
  ]);
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: space[8] * 2,
        background: colors.ink,
        fontFamily: fonts.body,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse não usa next/image */}
      <img src={logoSrc} alt="" width={302} height={56} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: type.display.fontSize * scale,
            lineHeight: `${type.display.lineHeight * scale}px`,
            letterSpacing: type.display.letterSpacing * scale,
            color: colors.textOnDark,
            maxWidth: 980,
          }}
        >
          Repasse de plantão médico com clareza e segurança.
        </div>
        <div
          style={{
            marginTop: space[6],
            fontSize: type.body.fontSize * 1.9,
            lineHeight: `${type.body.lineHeight * 1.9}px`,
            fontWeight: 500,
            color: colors.textOnDarkMuted,
          }}
        >
          Colegas com CRM verificado, condições confirmadas e acordo registrado.
        </div>
      </div>
      <div style={{ display: "flex", gap: space[3] }}>
        {highlights.map((label) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              padding: `${space[3]}px ${space[5]}px`,
              borderRadius: radius.pill,
              background: colors.ink2,
              color: colors.mint,
              fontSize: type.label.fontSize * 1.8,
              fontWeight: 600,
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: fonts.display, data: soraBold, weight: 700, style: "normal" },
        { name: fonts.body, data: figtreeMedium, weight: 500, style: "normal" },
        {
          name: fonts.body,
          data: figtreeSemibold,
          weight: 600,
          style: "normal",
        },
      ],
    },
  );
}
