import { afterEach, describe, expect, it, vi } from "vitest";

const entryId = "5a0e1c2d-0000-4000-8000-000000000009";
const offerId = "5a0e1c2d-0000-4000-8000-000000000101";
const agreementId = "5a0e1c2d-0000-4000-8000-000000000201";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/security/rate-limit", () => ({ enforceRateLimit: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requireAdminIdentity: vi.fn() }));
vi.mock("@/lib/agreements", () => ({
  agreementIdentity: async () => ({
    userId: "u",
    supabase: { rpc: mocks.rpc },
  }),
}));
vi.mock("@/lib/shifts/data", () => ({
  requireApprovedProfessional: async () => ({
    userId: "u",
    supabase: {
      rpc: mocks.rpc,
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: null }) }),
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({
              data: { result_id: offerId },
              error: null,
            }),
          }),
        }),
      }),
    },
  }),
}));

import { publishOfferAction } from "@/app/plantoes/actions";
import { createAgreementAction } from "@/app/acordos/registrados/actions";

afterEach(() => vi.clearAllMocks());

const future = (days: number, time: string) => {
  const date = new Date(Date.now() + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return `${date}T${time}`;
};

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const agreement = (overrides: Record<string, string> = {}) =>
  form({
    requestId: "5a0e1c2d-0000-4000-8000-000000000301",
    creatorRole: "owner",
    recipientEmail: "colega@test.invalid",
    groupId: "",
    location: "Hospital Exemplo",
    sector: "UTI",
    startsAt: future(10, "19:00"),
    endsAt: future(11, "07:00"),
    value: "1500,00",
    dueDate: future(40, "00:00").slice(0, 10),
    paymentMethod: "Pix",
    notes: "",
    accepted: "true",
    agendaEntryId: entryId,
    ...overrides,
  });

describe("repassar este plantão: vínculo com a anotação", () => {
  it("liga a anotação ao acordo quando quem registra repassa o plantão", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: agreementId, error: null })
      .mockResolvedValueOnce({ data: { id: entryId }, error: null });
    await expect(createAgreementAction({}, agreement())).rejects.toThrow(
      `redirect:/acordos/registrados/${agreementId}`,
    );
    expect(mocks.rpc).toHaveBeenLastCalledWith("agenda_link_handover", {
      entry_ref: entryId,
      offer_ref: null,
      agreement_ref: agreementId,
    });
  });

  it("não liga quando quem registra assume o plantão ou o campo é inválido", async () => {
    mocks.rpc.mockResolvedValue({ data: agreementId, error: null });
    await expect(
      createAgreementAction({}, agreement({ creatorRole: "substitute" })),
    ).rejects.toThrow("redirect:");
    await expect(
      createAgreementAction({}, agreement({ agendaEntryId: "x" })),
    ).rejects.toThrow("redirect:");
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    expect(mocks.rpc).not.toHaveBeenCalledWith(
      "agenda_link_handover",
      expect.anything(),
    );
  });

  it("falha no vínculo não impede o acordo", async () => {
    mocks.rpc
      .mockResolvedValueOnce({ data: agreementId, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: "P0001" } });
    await expect(createAgreementAction({}, agreement())).rejects.toThrow(
      `redirect:/acordos/registrados/${agreementId}`,
    );
  });

  it("liga a anotação à oferta publicada", async () => {
    mocks.rpc.mockResolvedValue({ data: { id: entryId }, error: null });
    await expect(
      publishOfferAction(
        form({
          commandId: "5a0e1c2d-0000-4000-8000-000000000401",
          groupId: "",
          startsAt: future(10, "19:00"),
          endsAt: future(11, "07:00"),
          sector: "UTI",
          value: "1500,00",
          paymentTerms: "Pix",
          dueDate: future(40, "00:00").slice(0, 10),
          notes: "",
          ownerTermsAcknowledged: "true",
          agendaEntryId: entryId,
        }),
      ),
    ).rejects.toThrow(`redirect:/plantoes/publicados?publicado=${offerId}`);
    expect(mocks.rpc).toHaveBeenCalledWith("agenda_link_handover", {
      entry_ref: entryId,
      offer_ref: offerId,
      agreement_ref: null,
    });
  });
});
