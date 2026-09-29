import { describe, expect, it } from "vitest";
import { groupSchema, reviewProfileSchema } from "@/features/admin/schemas";

describe("validação administrativa", () => {
  it("converte a configuração de aprovação", () => {
    const result = groupSchema.parse({
      institutionId: "10000000-0000-4000-8000-000000000001",
      name: "Urgência",
      requiresApproval: "true",
    });
    expect(result.requiresApproval).toBe(true);
  });

  it("não permite retornar perfil ao estado pendente", () => {
    const result = reviewProfileSchema.safeParse({
      profileId: "10000000-0000-4000-8000-000000000001",
      status: "pending",
      notes: "",
    });
    expect(result.success).toBe(false);
  });
});
