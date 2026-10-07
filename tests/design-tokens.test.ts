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
        .filter(({ text }) =>
          /#[0-9a-f]{3,8}\b|rgba?\(|border-radius:\s*\d/i.test(text),
        ),
    );
    expect(offenders).toEqual([]);
  });
});
