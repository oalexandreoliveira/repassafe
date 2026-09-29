import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "docs/operations/monitoring.md",
  "docs/operations/backup-restore.md",
  "docs/operations/support.md",
  "docs/operations/incidents.md",
  "docs/operations/rollback.md",
  "src/app/api/health/route.ts",
  "src/app/api/ready/route.ts",
  "scripts/check-readiness.mjs",
  "scripts/create-logical-backup.ps1",
];
const missing = requiredFiles.filter((file) => !existsSync(file));
const envExample = readFileSync(".env.example", "utf8");
for (const variable of ["MONITORING_TOKEN", "RATE_LIMIT_PEPPER"]) {
  if (!envExample.includes(`${variable}=`)) missing.push(`env:${variable}`);
}

if (missing.length) {
  console.error(`Prontidão operacional incompleta: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(
  "Prontidão operacional validada: monitoramento, backup, suporte e rollback.",
);
