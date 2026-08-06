import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src", "supabase/migrations"];
const forbidden = [
  /shift[_-]?offer/i,
  /publish[_-]?shift/i,
  /application[_-]?status/i,
  /open[_-]?emergency/i,
];
const files = [];
function walk(path) {
  for (const name of readdirSync(path)) {
    const item = join(path, name);
    if (statSync(item).isDirectory()) walk(item);
    else files.push(item);
  }
}
roots.forEach(walk);
const violations = files.flatMap((file) =>
  forbidden
    .filter((rule) => rule.test(readFileSync(file, "utf8")))
    .map((rule) => `${file}: ${rule}`),
);
if (violations.length) {
  console.error(
    "Regras de plantão fora da Sprint 0:\n" + violations.join("\n"),
  );
  process.exit(1);
}
console.log("Escopo da Sprint 0 preservado.");
