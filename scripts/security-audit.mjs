import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const migrationDirectory = "supabase/migrations";
const sql = readdirSync(migrationDirectory)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => readFileSync(join(migrationDirectory, name), "utf8"))
  .join("\n")
  .toLowerCase();

const publicTables = [
  ...sql.matchAll(/create table public\.([a-z0-9_]+)/g),
].map((match) => match[1]);
const failures = [];

for (const table of new Set(publicTables)) {
  if (!sql.includes(`alter table public.${table} enable row level security`)) {
    failures.push(`${table}: RLS não habilitada`);
  }
  const revoked =
    sql.includes(`revoke all on public.${table}`) ||
    new RegExp(
      `revoke all on[\\s\\S]{0,300}public\\.${table}[\\s\\S]{0,300}from anon, authenticated`,
    ).test(sql);
  if (!revoked) failures.push(`${table}: grants de cliente não revogados`);
}

if (/security definer[\s\S]{0,200}set search_path(?!\s*=\s*'')/.test(sql)) {
  failures.push("função SECURITY DEFINER com search_path mutável");
}
if (
  /create (or replace )?function public\.[\s\S]{0,300}security definer/.test(
    sql,
  )
) {
  failures.push("função SECURITY DEFINER criada no schema público");
}
if (/auth\.role\(\)/.test(sql))
  failures.push("uso do auth.role() descontinuado");
if (/auth\.jwt\(\)[\s\S]{0,100}user_metadata/.test(sql)) {
  failures.push("autorização baseada em user_metadata editável");
}

if (failures.length) {
  console.error(`Auditoria estática reprovada:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(
  `Auditoria estática aprovada: ${new Set(publicTables).size} tabelas públicas protegidas.`,
);
