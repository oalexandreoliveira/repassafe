import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  identity: vi.fn(),
  rpc: vi.fn(),
  admin: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getVerifiedIdentity: mocks.identity }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(path);
  },
}));
import { getShiftDetails } from "@/lib/shifts/data";
import { applications } from "@/app/dev/telas/fixtures";

function query(data: unknown) {
  const result = { data, error: null };
  const chain: Record<string, unknown> = {
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  for (const method of [
    "select",
    "eq",
    "order",
    "limit",
    "single",
    "maybeSingle",
  ])
    chain[method] = () => chain;
  return chain;
}
function setIdentity(
  userId: string,
  offer: unknown = { owner_id: "owner", group_id: "group" },
) {
  mocks.identity.mockResolvedValue({
    userId,
    supabase: {
      from: (table: string) =>
        query(
          {
            profiles: {
              display_name: "Viewer",
              role: "doctor",
              status: "approved",
              verification_valid_until: "2099-01-01",
            },
            shift_offers: offer,
            shift_applications: applications,
            substitutions: [],
            shift_agreements: null,
            group_memberships: null,
          }[table],
        ),
    },
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.rpc.mockResolvedValue({
    data: applications.map((a) => a.professional),
    error: null,
  });
  mocks.admin.mockReturnValue({ rpc: mocks.rpc, from: () => query([]) });
});
it("consulta projeção somente após conferir oferta acessível e titular autenticado", async () => {
  setIdentity("owner");
  const result = await getShiftDetails("offer");
  expect(mocks.rpc).toHaveBeenCalledWith("offer_candidate_profiles", {
    target_offer: "offer",
    target_user: "owner",
  });
  expect(result?.applications[0].professional).toEqual(
    applications[0].professional,
  );
});
it("não consulta projeção privilegiada para concorrente ou aprovador", async () => {
  setIdentity("other");
  const result = await getShiftDetails("offer");
  expect(mocks.admin).not.toHaveBeenCalled();
  expect(result?.applications.every((a) => !a.professional)).toBe(true);
});
it("não consulta projeção quando RLS oculta a oferta", async () => {
  setIdentity("owner", null);
  expect(await getShiftDetails("offer")).toBeNull();
  expect(mocks.admin).not.toHaveBeenCalled();
});
it("não consulta dados de candidatos sem sessão verificada", async () => {
  mocks.identity.mockResolvedValue(null);
  await expect(getShiftDetails("offer")).rejects.toThrow("/entrar");
  expect(mocks.admin).not.toHaveBeenCalled();
});
it("remove dados não autorizados mesmo se a RPC passar a retorná-los", async () => {
  setIdentity("owner");
  mocks.rpc.mockResolvedValue({
    data: [
      {
        ...applications[0].professional,
        cpf: "private",
        photo_path: "private",
        internal_notes: "private",
      },
    ],
    error: null,
  });
  const result = await getShiftDetails("offer");
  expect(result?.applications[0].professional).toEqual(
    applications[0].professional,
  );
  expect(JSON.stringify(result)).not.toContain("private");
});
it.each([
  { data: null, error: { message: "unavailable" } },
  { data: [{ id: "invalid" }], error: null },
])(
  "falha de consulta ou contrato bloqueia o uso da projeção",
  async (response) => {
    setIdentity("owner");
    mocks.rpc.mockResolvedValue(response);
    const result = await getShiftDetails("offer");
    expect(result?.candidateProfilesFailed).toBe(true);
    expect(result?.applications.every((a) => !a.professional)).toBe(true);
  },
);
