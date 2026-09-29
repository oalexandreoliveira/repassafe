import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import {
  getAdministrativeAccess,
  getVerifiedIdentity,
  requireAdminIdentity,
} from "@/lib/auth/session";

const userId = "99000000-0000-0000-0000-000000000001";
const entitlement = vi.fn();
const from = vi.fn((table: string) => ({
  table,
  select: () => ({ eq: () => ({ maybeSingle: entitlement }) }),
}));
const getClaims = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  getClaims.mockResolvedValue({
    data: { claims: { sub: userId, aal: "aal2" } },
    error: null,
  });
  entitlement.mockResolvedValue({
    data: { user_id: userId, active: true },
    error: null,
  });
  vi.mocked(createClient).mockResolvedValue({
    auth: { getClaims },
    from,
  } as unknown as Awaited<ReturnType<typeof createClient>>);
});

describe("identidade administrativa independente", () => {
  it("autoriza uma identidade de equipe sem consultar perfil profissional", async () => {
    const identity = await requireAdminIdentity();
    expect(identity.userId).toBe(userId);
    expect(identity.administrativeAccess?.active).toBe(true);
    expect(from.mock.calls.map(([table]) => table)).toEqual([
      "administrative_access",
    ]);
  });

  it("permite descobrir a concessão em aal1 para iniciar MFA, mas nega a administração", async () => {
    getClaims.mockResolvedValue({
      data: { claims: { sub: userId, aal: "aal1" } },
      error: null,
    });
    const identity = await getVerifiedIdentity();
    expect(await getAdministrativeAccess(identity!)).toMatchObject({
      active: true,
    });
    await expect(requireAdminIdentity()).rejects.toThrow(/MFA/);
  });

  it("revalida uma revogação apesar de o JWT continuar em aal2", async () => {
    await expect(requireAdminIdentity()).resolves.toMatchObject({ userId });
    entitlement.mockResolvedValue({
      data: { user_id: userId, active: false },
      error: null,
    });
    await expect(requireAdminIdentity()).rejects.toThrow(/MFA/);
  });

  it("nega identidade sem concessão e falha de leitura, sem recorrer ao perfil", async () => {
    entitlement.mockResolvedValue({ data: null, error: null });
    await expect(requireAdminIdentity()).rejects.toThrow(/MFA/);
    entitlement.mockResolvedValue({
      data: null,
      error: { message: "database unavailable" },
    });
    await expect(requireAdminIdentity()).rejects.toThrow(/verificar o acesso/);
  });

  it("nega sessão inválida antes de consultar permissões", async () => {
    getClaims.mockResolvedValue({
      data: null,
      error: { message: "invalid JWT" },
    });
    await expect(requireAdminIdentity()).rejects.toThrow(/Sessão inválida/);
    expect(from).not.toHaveBeenCalled();
  });
});
