import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { waitlistSchema } from "@/features/marketing/waitlist";

const valid = {
  name: "Marina Alves",
  email: "  Marina@Exemplo.com ",
  interest: "ambos",
  specialty: "",
  state: "",
  consent: "on",
};

describe("lista de espera", () => {
  it("normaliza e-mail e trata campos opcionais vazios como nulos", () => {
    const parsed = waitlistSchema.parse(valid);
    expect(parsed.email).toBe("marina@exemplo.com");
    expect(parsed.specialty).toBeNull();
    expect(parsed.state).toBeNull();
  });

  it("aceita UF em minúsculas e especialidade informada", () => {
    const parsed = waitlistSchema.parse({
      ...valid,
      specialty: "Clínica médica",
      state: "ma",
    });
    expect(parsed.state).toBe("MA");
    expect(parsed.specialty).toBe("Clínica médica");
  });

  it.each([
    ["name", "Al"],
    ["email", "sem-arroba"],
    ["interest", "outro"],
    ["state", "XX"],
    ["consent", undefined],
  ])("recusa %s inválido com mensagem no próprio campo", (field, value) => {
    const result = waitlistSchema.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path[0])).toContain(
        field,
      );
  });

  it("mantém a tabela inacessível ao cliente", () => {
    const sql = readFileSync(
      "supabase/migrations/20261030160000_waitlist.sql",
      "utf8",
    ).toLowerCase();
    expect(sql).toContain("enable row level security");
    expect(sql).toContain(
      "revoke all on public.waitlist_entries from public, anon, authenticated",
    );
    expect(sql).not.toMatch(/grant [^;]*to (anon|authenticated)/);
  });
});
