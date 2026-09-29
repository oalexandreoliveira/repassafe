import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260924202137_lock_professional_identity_edits.sql",
  "utf8",
).toLowerCase();
const actions = readFileSync("src/app/auth/actions.ts", "utf8");

describe("proteção dos dados de identidade profissional", () => {
  it("revoga alteração direta de nome e CRM pelo cliente", () => {
    expect(migration).toContain(
      "revoke update (display_name, crm_number, crm_state)",
    );
    expect(migration).toContain('drop policy "own profile update"');
    expect(actions).not.toContain("updateProfileAction");
  });
});
