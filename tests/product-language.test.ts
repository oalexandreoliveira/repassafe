import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Seção 13 da especificação de confiabilidade documental: o produto não pode
// prometer o que a plataforma não entrega. Frases com negação ("não é ...")
// são permitidas porque servem de aviso ao usuário.
const forbidden: [RegExp, string][] = [
  [/pagamento\s+garantido/i, "pagamento garantido"],
  [/prova\s+irrefut[aá]vel/i, "prova irrefutável"],
  [/contrato\s+blindado/i, "contrato blindado"],
  [/blindad[oa]/i, "blindado"],
  [/t[ií]tulo\s+executivo\s+garantido/i, "título executivo garantido"],
  [
    /execu[cç][aã]o\s+judicial\s+autom[aá]tica/i,
    "execução judicial automática",
  ],
  [/(judicialmente|juridicamente)\s+certificad/i, "certificado judicialmente"],
  [/certificad[oa]\s+(judicialmente|pelo\s+judici[aá]rio)/i, "certificado"],
  [/presta[cç][aã]o\s+comprovada/i, "prestação comprovada"],
  [/assinad[oa]\s+digitalmente/i, "assinado digitalmente"],
];
const negation = /\b(n[ãa]o|nem|sem|nenhum[a]?)\b/i;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("linguagem do produto (P0-09)", () => {
  it("não usa promessas probatórias ou jurídicas proibidas no código da aplicação", () => {
    const offenders: string[] = [];
    expect(sourceFiles("src").length).toBeGreaterThan(50);
    for (const file of sourceFiles("src")) {
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, index) => {
          if (negation.test(line)) return;
          for (const [pattern, label] of forbidden) {
            if (pattern.test(line)) {
              offenders.push(`${file}:${index + 1} (${label})`);
            }
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  it("não atribui parte contratual a pessoa jurídica (ADR-011)", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles("src/app/acordos")) {
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, index) => {
          if (/\bcnpj\b|raz[aã]o\s+social|representante\s+legal/i.test(line)) {
            offenders.push(`${file}:${index + 1}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });
});
