import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ single: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(path);
  },
}));
vi.mock("@/lib/auth/session", () => ({ requireAdminIdentity: vi.fn() }));
vi.mock("@/lib/security/rate-limit", () => ({ enforceRateLimit: vi.fn() }));
vi.mock("@/lib/shifts/data", () => ({
  requireApprovedProfessional: async () => {
    const query = {
      select: () => query,
      eq: () => query,
      insert: () => query,
      maybeSingle: async () => ({ data: null }),
      single: mocks.single,
    };
    return { userId: "owner", supabase: { from: () => query } };
  },
}));
import { selectCandidateAction } from "@/app/plantoes/actions";

it.each([
  [
    "O candidato precisa revalidar o cadastro profissional",
    "professional_expired",
  ],
  ["private database details", "unavailable"],
])(
  "trata expiração entre revisão e envio sem expor erros internos",
  async (message, code) => {
    mocks.single.mockResolvedValue({ data: null, error: { message } });
    const form = new FormData();
    form.set("commandId", "10000000-0000-4000-8000-000000000001");
    form.set("targetId", "30000000-0000-4000-8000-000000000001");
    await expect(selectCandidateAction(form)).rejects.toThrow(
      `/plantoes?feedback=${code}`,
    );
  },
);
