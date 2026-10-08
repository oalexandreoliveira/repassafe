import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const kinds = readFileSync(
  "supabase/migrations/20261007150000_peer_group_kinds.sql",
  "utf8",
);
const migration = readFileSync(
  "supabase/migrations/20261007150100_peer_groups.sql",
  "utf8",
);

describe("contrato da migration de grupos de colegas", () => {
  it("cria o papel de gestor separado do aprovador", () => {
    expect(kinds).toContain("add value if not exists 'manager'");
    expect(kinds).toContain(
      "create type public.group_kind as enum ('institutional', 'peer')",
    );
  });

  it("impede que grupo de colegas vire institucional ou exija aprovação", () => {
    expect(migration).toContain(
      "check ((kind = 'institutional') = (institution_id is not null))",
    );
    expect(migration).toContain(
      "check (kind = 'institutional' or not requires_approval)",
    );
    expect(migration).toContain(
      "Grupos de colegas não têm aprovadores institucionais",
    );
    expect(migration).toContain("O tipo e a autoria do grupo são imutáveis");
  });

  it("guarda só o hash do convite e fecha a tabela aos clientes", () => {
    expect(migration).toMatch(/token_hash text not null unique/);
    expect(migration).not.toMatch(/\btoken text\b(?! *\))/);
    expect(migration).toContain(
      "revoke all on public.group_invites from public, anon, authenticated;",
    );
  });

  it("expõe só funções com search_path vazio e execução para autenticados", () => {
    const definers = migration.match(/security definer/g)?.length ?? 0;
    const emptyPaths = migration.match(/set search_path = ''/g)?.length ?? 0;
    expect(definers).toBeGreaterThan(0);
    expect(emptyPaths).toBeGreaterThanOrEqual(definers);
    expect(migration).toMatch(
      /grant execute on function[\s\S]*public\.group_command[\s\S]*to authenticated;/,
    );
    expect(migration).not.toMatch(/to anon/);
  });

  it("exige cadastro aprovado e vigente para criar e entrar", () => {
    expect(migration).toContain("p.verification_valid_until > now()");
    expect(migration).toContain(
      "Seu cadastro precisa estar aprovado e vigente para entrar no grupo",
    );
  });
});
