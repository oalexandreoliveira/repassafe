import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Copiar somente as migrations versionadas. A configuração do projeto vinculado
// e os dados de desenvolvimento não fazem parte desta instância.
const workdir = mkdtempSync(path.join(tmpdir(), "repassafe-postgrest-"));
const project = `queue-test-${randomUUID().slice(0, 18)}`;
const dir = path.join(workdir, "supabase");
const apiPort = 55321;
const cli = (...args) =>
  execFileSync("supabase", ["--workdir", workdir, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });

let starting = false;
try {
  mkdirSync(dir);
  writeFileSync(
    path.join(dir, "config.toml"),
    `project_id = "${project}"
[api]
port = ${apiPort}
[db]
port = 55322
major_version = 17
`,
  );
  cpSync("supabase/migrations", path.join(dir, "migrations"), {
    recursive: true,
  });
  cpSync("tests/postgrest/seed.sql", path.join(dir, "seed.sql"));
  starting = true;
  cli(
    "start",
    "-x",
    "realtime,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor",
  );
  const status = JSON.parse(cli("status", "-o", "json"));
  if (
    status.API_URL !== `http://127.0.0.1:${apiPort}` ||
    !status.ANON_KEY ||
    !status.SERVICE_ROLE_KEY ||
    !status.JWT_SECRET
  )
    throw new Error(
      "A API local descartável não forneceu as credenciais esperadas.",
    );

  execFileSync(
    process.execPath,
    ["node_modules/vitest/vitest.mjs", "run", "--mode", "postgrest"],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        QUEUE_TEST_API_URL: status.API_URL,
        QUEUE_TEST_ANON_KEY: status.ANON_KEY,
        QUEUE_TEST_SERVICE_KEY: status.SERVICE_ROLE_KEY,
        QUEUE_TEST_JWT_SECRET: status.JWT_SECRET,
      },
    },
  );
} finally {
  try {
    if (starting) cli("stop", "--project-id", project, "--no-backup");
  } finally {
    rmSync(workdir, { recursive: true });
  }
}
