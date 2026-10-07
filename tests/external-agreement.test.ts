import { describe, expect, it, vi, afterEach } from "vitest";
import {
  agreementStatus,
  paymentStatus,
  createAgreementSchema,
  agreementCommandSchema,
} from "@/features/agreements/schema";
afterEach(() => vi.useRealTimers());
const input = {
  requestId: "99000000-0000-4000-8000-000000000001",
  creatorRole: "substitute",
  recipientEmail: "medico@example.test",
  groupId: "",
  location: "Hospital de teste, São Luís",
  sector: "UTI",
  startsAt: "2026-11-01T07:00",
  endsAt: "2026-11-01T19:00",
  value: "1500,00",
  dueDate: "2026-11-15",
  paymentMethod: "Pix",
  notes: "",
  accepted: "true",
};
describe("registro de acordo", () => {
  it("preserva papéis e converte centavos e fuso", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-07T12:00Z"));
    expect(createAgreementSchema.parse(input)).toMatchObject({
      creatorRole: "substitute",
      value: 150000,
      startsAt: "2026-11-01T10:00:00.000Z",
    });
  });
  it.each([
    { dueDate: "" },
    { dueDate: "2026-02-30" },
    { startsAt: "2026-01-01T07:00" },
    { endsAt: "2026-11-01T06:00" },
    { accepted: "false" },
    { value: "0" },
  ])("rejeita condições inválidas %j", (change) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-07T12:00Z"));
    expect(
      createAgreementSchema.safeParse({ ...input, ...change }).success,
    ).toBe(false);
  });
  it("vence somente após encerrar o dia de Fortaleza", () => {
    expect(
      paymentStatus(
        "2026-11-15",
        null,
        true,
        new Date("2026-11-16T02:59:59.999Z"),
      ),
    ).toContain("Pagamento informado");
    expect(
      paymentStatus("2026-11-15", null, true, new Date("2026-11-16T03:00:00Z")),
    ).toBe("Prazo vencido — recebimento não confirmado");
    expect(
      paymentStatus(
        "2026-11-15",
        "2026-11-16T04:00Z",
        true,
        new Date("2026-11-17T03:00Z"),
      ),
    ).toBe("Recebimento confirmado");
  });
  it("expira convites e aprovações sem expirar acordos confirmados", () => {
    const now = new Date("2026-11-01T10:00:00Z");
    expect(agreementStatus("pending_acceptance", now.toISOString(), now)).toBe(
      "expired",
    );
    expect(agreementStatus("pending_approval", now.toISOString(), now)).toBe(
      "expired",
    );
    expect(agreementStatus("confirmed", now.toISOString(), now)).toBe(
      "confirmed",
    );
  });
  it("exige aceite explícito para declarar recebimento", () => {
    expect(
      agreementCommandSchema.safeParse({
        requestId: input.requestId,
        agreementId: input.requestId,
        operation: "receive",
      }).success,
    ).toBe(false);
  });
});
