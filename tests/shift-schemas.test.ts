import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  offerFormSchema,
  offerStatusLabels,
} from "@/features/shifts/schemas";

describe("contratos do fluxo de repasse", () => {
  it("converte o valor monetário para centavos", () => {
    const parsed = offerFormSchema.parse({
      commandId: "c671b85c-840f-4f28-a5bb-df8320359d3c",
      groupId: "8f077a4e-cc4f-4402-854a-e5a0fb9074f0",
      startsAt: "2030-01-01T08:00",
      endsAt: "2030-01-01T20:00",
      sector: "UTI adulto",
      value: "1.250,50".replace(".", ""),
      paymentTerms: "Pagamento em 30 dias",
      notes: "",
      ownerTermsAcknowledged: "true",
    });

    expect(parsed.value).toBe(125050);
  });

  it("aceita oferta livre sem grupo", () => {
    const parsed = offerFormSchema.parse({
      commandId: "c671b85c-840f-4f28-a5bb-df8320359d3c",
      groupId: "",
      startsAt: "2030-01-01T08:00",
      endsAt: "2030-01-01T20:00",
      sector: "UTI adulto",
      value: "1250,50",
      paymentTerms: "Pagamento em 30 dias",
      notes: "",
      ownerTermsAcknowledged: "true",
    });

    expect(parsed.groupId).toBeNull();
  });

  it("rejeita período invertido", () => {
    expect(() =>
      offerFormSchema.parse({
        commandId: "c671b85c-840f-4f28-a5bb-df8320359d3c",
        groupId: "8f077a4e-cc4f-4402-854a-e5a0fb9074f0",
        startsAt: "2030-01-02T08:00",
        endsAt: "2030-01-01T20:00",
        sector: "UTI adulto",
        value: "1250,50",
        paymentTerms: "Pagamento em 30 dias",
        notes: "",
        ownerTermsAcknowledged: "true",
      }),
    ).toThrow();
  });

  it("expõe rótulos operacionais e valor localizado", () => {
    expect(offerStatusLabels.open_emergency).toBe("Urgente");
    expect(formatCurrency(125050)).toContain("1.250,50");
  });
});
