import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260923000759_core_shift_flow.sql",
  "utf8",
).toLowerCase();

describe("contrato transacional do fluxo de repasse", () => {
  it("protege todas as tabelas expostas com RLS e grants explícitos", () => {
    for (const table of [
      "shift_offers",
      "shift_applications",
      "substitutions",
      "shift_agreements",
      "workflow_commands",
    ]) {
      expect(migration).toContain(
        `alter table public.${table} enable row level security`,
      );
    }
    expect(migration).toContain("revoke all on public.shift_offers");
  });

  it("mantém a transição privilegiada em schema privado", () => {
    expect(migration).toContain("function private.process_workflow_command()");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain(
      "revoke execute on function private.process_workflow_command() from public, anon, authenticated",
    );
  });

  it("garante candidatura e substituição únicas", () => {
    expect(migration).toContain("unique (offer_id, candidate_id)");
    expect(migration).toContain(
      "create unique index substitutions_one_live_offer_idx",
    );
  });

  it("torna o acordo imutável e audita as transições", () => {
    expect(migration).toContain("trigger shift_agreements_immutable");
    expect(migration).toContain("insert into public.audit_events");
    expect(migration).toContain("for update");
  });
});
