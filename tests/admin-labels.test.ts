import { describe, expect, it } from "vitest";
import { groupRoleLabel, profileStatusLabel } from "@/features/admin/labels";

describe("rótulos administrativos", () => {
  it("traduz os papéis de vínculo", () => {
    expect(groupRoleLabel.doctor).toBe("Médico");
    expect(groupRoleLabel.approver).toBe("Aprovador");
  });

  it("traduz os estados de verificação", () => {
    expect(profileStatusLabel.pending).toBe("Aguardando verificação");
    expect(profileStatusLabel.approved).toBe("Cadastro aprovado");
    expect(profileStatusLabel.suspended).toBe("Acesso suspenso");
  });
});
