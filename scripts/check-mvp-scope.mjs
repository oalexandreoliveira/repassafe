import { readFileSync } from "node:fs";

const backlog = readFileSync("backlog-priorizado.md", "utf8");
const scope = readFileSync("docs/product/mvp-scope-v1.md", "utf8");

const referencedStories = [
  ...new Set(scope.match(/\bUS-\d{4}\b/g) ?? []),
].sort();
const missingStories = referencedStories.filter(
  (story) => !backlog.includes(`## ${story} —`),
);

const requiredSections = [
  "## 1. Objetivo do MVP",
  "## 4. Escopo bloqueador do lançamento",
  "## 5. Itens explicitamente adiados",
  "## 8. Critérios de aceite do MVP",
  "## 10. Controle de mudança",
];
const missingSections = requiredSections.filter(
  (section) => !scope.includes(section),
);

if (missingStories.length || missingSections.length) {
  if (missingStories.length)
    console.error(
      `Histórias ausentes do backlog: ${missingStories.join(", ")}`,
    );
  if (missingSections.length)
    console.error(
      `Seções obrigatórias ausentes: ${missingSections.join(", ")}`,
    );
  process.exit(1);
}

console.log(
  `Escopo executivo válido: ${referencedStories.length} histórias rastreadas.`,
);
