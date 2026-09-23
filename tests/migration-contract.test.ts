import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260922234523_identity_access_admin.sql",
  "utf8",
).toLowerCase();

describe("contrato de segurança da migration de acesso", () => {
  it("mantém status administrativo fora do grant de atualização do cliente", () => {
    expect(migration).toContain(
      "grant update (display_name, crm_number, crm_state) on public.profiles",
    );
    expect(migration).not.toMatch(/grant update \([^)]*status/);
  });

  it("protege leitura e atualização do perfil pelo auth.uid", () => {
    expect(migration).toContain('create policy "own profile read"');
    expect(migration).toContain('create policy "own profile update"');
    expect(migration.match(/auth\.uid\(\)/g)?.length).toBeGreaterThanOrEqual(6);
  });

  it("revoga acesso anônimo às tabelas de identidade", () => {
    expect(migration).toContain("revoke all on public.profiles from anon");
    expect(migration).toContain(
      "revoke all on public.institutions, public.groups, public.group_memberships",
    );
  });
});
