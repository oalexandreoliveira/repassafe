import { File as NodeFile } from "node:buffer";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  remove: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/agreements", () => ({
  agreementIdentity: async () => ({
    userId: "99000000-0000-4000-8000-000000000001",
    supabase: {
      rpc: mocks.rpc,
      storage: { from: () => ({ upload: mocks.upload }) },
    },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    storage: { from: () => ({ remove: mocks.remove }) },
  }),
}));
import { agreementCommandAction } from "@/app/acordos/registrados/actions";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("preserves the receipt on an ambiguous RPC failure and retries the same command", async () => {
  vi.stubGlobal("File", NodeFile);
  const receipt = new NodeFile(
    [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
    "receipt.png",
    { type: "image/png" },
  );
  const values = new Map<string, string | NodeFile>([
    ["requestId", "99000000-0000-4000-8000-000000000002"],
    ["agreementId", "99000000-0000-4000-8000-000000000003"],
    ["operation", "payment"],
    ["paidOn", "2026-01-01"],
    ["amount", "1500,00"],
    ["receipt", receipt],
  ]);
  const form = {
    [Symbol.iterator]: () => values.entries(),
    get: (name: string) => values.get(name),
  } as unknown as FormData;
  mocks.upload
    .mockResolvedValueOnce({ error: null })
    .mockResolvedValueOnce({ error: { statusCode: "409" } });
  mocks.rpc
    .mockResolvedValueOnce({ error: { message: "Network response lost" } })
    .mockResolvedValueOnce({ error: null });

  expect((await agreementCommandAction({}, form)).success).not.toBe(true);
  expect(mocks.remove).not.toHaveBeenCalled();
  expect((await agreementCommandAction({}, form)).success).toBe(true);
  expect(mocks.upload.mock.calls[1][0]).toBe(mocks.upload.mock.calls[0][0]);
  expect(mocks.rpc.mock.calls[1]).toEqual(mocks.rpc.mock.calls[0]);
  expect(mocks.remove).not.toHaveBeenCalled();
});
