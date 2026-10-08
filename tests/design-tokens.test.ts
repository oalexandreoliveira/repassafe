import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as handoffTheme from "../design/tokens/theme";
import * as appTheme from "@/styles/theme";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

/** Every `--rs-*` declaration in source order, so overrides (reduced motion) are compared too.
 * Hex case is normalized because Prettier lowercases colors in src/. */
function declarations(css: string) {
  return [
    ...css
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .matchAll(/(--rs-[\w-]+)\s*:\s*([^;]+);/g),
  ].map(([, name, value]) => [
    name,
    value
      .replace(/\s+/g, " ")
      .replace(/#[0-9a-f]+\b/gi, (hex) => hex.toLowerCase())
      .trim(),
  ]);
}

function filesUnder(dir: string): string[] {
  return readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(
    (entry) => {
      const relative = path.join(dir, entry.name);
      return entry.isDirectory() ? filesUnder(relative) : [relative];
    },
  );
}

describe("design tokens", () => {
  it("serves the handoff tokens.css values unchanged", () => {
    expect(declarations(read("src/styles/tokens.css"))).toEqual(
      declarations(read("design/tokens/tokens.css")),
    );
  });

  it("does not load fonts from a third-party origin", () => {
    expect(read("src/styles/tokens.css")).not.toMatch(/fonts\.googleapis/);
  });

  it("keeps the TypeScript theme identical to the handoff theme", () => {
    expect(appTheme).toEqual(handoffTheme);
  });

  it("keeps color and radius literals out of application styles", () => {
    const tokenSources = [
      path.join("src", "styles", "tokens.css"),
      path.join("src", "styles", "theme.ts"),
    ];
    const styles = filesUnder("src").filter(
      (file) => /\.(css|tsx)$/.test(file) && !tokenSources.includes(file),
    );
    const offenders = styles.flatMap((file) =>
      read(file)
        .split("\n")
        .map((line, index) => ({ file, line: index + 1, text: line }))
        .filter(({ text }) => {
          // Zero e tokens (var(--rs-radius-*)) são permitidos; números literais não.
          const bare = text.replace(/var\([^)]*\)/g, "");
          return (
            /#[0-9a-f]{3,8}\b|rgba?\(/i.test(bare) ||
            /border-radius:[^;]*\b(?!0\b)\d/.test(bare)
          );
        }),
    );
    expect(offenders).toEqual([]);
  });

  it("keeps text and control pairs used by the screens at WCAG AA contrast", () => {
    const tokens = Object.fromEntries(
      declarations(read("src/styles/tokens.css")),
    );
    const luminance = (hex: string) => {
      const [r, g, b] = [1, 3, 5]
        .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
        .map((value) =>
          value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
        );
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const contrast = (foreground: string, background: string) => {
      const [light, dark] = [
        luminance(tokens[`--rs-${foreground}`]),
        luminance(tokens[`--rs-${background}`]),
      ].sort((a, b) => b - a);
      return (light + 0.05) / (dark + 0.05);
    };
    const textPairs = [
      ["ink", "base"],
      ["text-body", "white"],
      ["text-secondary", "base"],
      ["text-muted", "white"],
      ["text-muted", "base"],
      ["text-muted", "track"],
      ["teal-dark", "white"],
      ["teal-dark", "base"],
      ["teal-dark", "mist"],
      ["white", "teal"],
      ["white", "ink"],
      ["text-on-dark-muted", "ink"],
      ...[
        "open",
        "pending",
        "institutional",
        "confirmed",
        "registered",
        "cancelled",
        "empty",
      ].map((status) => [`status-${status}-fg`, `status-${status}-bg`]),
    ];
    const failing = textPairs
      .map(([foreground, background]) => ({
        pair: `${foreground} on ${background}`,
        ratio: contrast(foreground, background),
      }))
      .filter(({ ratio }) => ratio < 4.5);
    expect(failing).toEqual([]);

    // Contorno de campos e controles (WCAG 1.4.11): 3:1 sobre cartão e fundo.
    const controlPairs = [
      ["field-border", "white"],
      ["field-border", "base"],
      ["teal", "white"],
      ["teal", "base"],
    ];
    expect(
      controlPairs
        .map(([foreground, background]) => ({
          pair: `${foreground} on ${background}`,
          ratio: contrast(foreground, background),
        }))
        .filter(({ ratio }) => ratio < 3),
    ).toEqual([]);
  });
});
