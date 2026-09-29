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
for (const match of sql.matchAll(
  /create (?:or replace )?function public\.([a-z0-9_]+)\s*\([^)]*\)[\s\S]{0,300}security definer/g,
)) {
  const functionName = match[1];
  const laterSql = sql.slice(match.index + match[0].length);
  const removedLater = new RegExp(
    `drop function(?: if exists)? public\\.${functionName}\\s*\\(`,
  ).test(laterSql);
  const grantStatements = [
    ...laterSql.matchAll(/(revoke|grant)[^;]+;/g),
  ].filter(([statement]) => statement.includes(`public.${functionName}(`));
  const lastRevocation = grantStatements.findLastIndex(
    ([statement]) =>
      /^revoke all on function /.test(statement) &&
      /from public,\s*anon,\s*authenticated;/.test(statement),
  );
  const clientGrantAfterRevocation = grantStatements
    .slice(lastRevocation + 1)
    .some(
      ([statement]) =>
        /^grant /.test(statement) &&
        /to (?:public|anon|authenticated)\b/.test(statement),
    );
  const serviceOnly =
    lastRevocation >= 0 &&
    !clientGrantAfterRevocation &&
    grantStatements
      .slice(lastRevocation + 1)
      .some(
        ([statement]) =>
          /^grant execute on function /.test(statement) &&
          /to service_role;/.test(statement),
      );
  if (!removedLater && !serviceOnly) {
    failures.push(
      `função SECURITY DEFINER pública acessível ao cliente: ${functionName}`,
    );
    break;
  }
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
