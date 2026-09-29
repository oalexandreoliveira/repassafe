import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ignored = new Set(["node_modules", ".next", ".git"]);
const patterns = [
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*(?!server-only-replace-me)\S+/i,
  /RATE_LIMIT_PEPPER\s*=\s*(?!replace-with-at-least-32-random-characters)\S+/i,
  /MONITORING_TOKEN\s*=\s*(?!replace-with-at-least-32-random-characters)\S+/i,
  /SUPABASE_DB_URL\s*=\s*(?:postgres|postgresql):\/\/\S+/i,
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
  /gh[pousr]_[A-Za-z0-9_]{20,}/,
];
const files = [];
function walk(path) {
  for (const name of readdirSync(path)) {
    if (ignored.has(name)) continue;
    const item = join(path, name);
    if (statSync(item).isDirectory()) walk(item);
    else files.push(item);
  }
}
walk(".");
const violations = files.filter((file) => {
  if (file.toLowerCase().endsWith(".pdf")) return false;
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return false;
  }
  return patterns.some((pattern) => pattern.test(text));
});
if (violations.length) {
  console.error("Possíveis segredos: " + violations.join(", "));
  process.exit(1);
}
console.log("Nenhum segredo conhecido encontrado.");
