import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
vi.mock("@/config/env", () => ({
  getServerEnv: () => ({ RATE_LIMIT_PEPPER: "p".repeat(40) }),
}));
vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: vi.fn(),
  RateLimitExceededError: class extends Error {},
}));
vi.mock("@/lib/groups", () => ({
  groupIdentity: async () => ({
    userId: "98000000-0000-4000-8000-000000000001",
    supabase: { rpc: mocks.rpc },
  }),
}));

import {
  createInviteAction,
  groupCommandAction,
  joinGroupAction,
} from "@/app/grupos/actions";
import { inviteTokenPattern } from "@/features/groups/invite-path";
import { initialGroupActionState } from "@/features/groups/types";

const groupId = "7f6c3b1e-0000-4000-8000-000000000001";
const requestId = "7f6c3b1e-0000-4000-8000-000000000010";
const form = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};

afterEach(() => vi.clearAllMocks());

describe("group actions", () => {
  it("derives a stable, server-side invite token from the request", async () => {
    mocks.rpc.mockResolvedValue({
      data: { invite_id: "i", expires_at: "2026-10-15T12:00:00.000Z" },
      error: null,
    });
    const input = form({ requestId, groupId, validityDays: "7" });
    const first = await createInviteAction(initialGroupActionState, input);
    const second = await createInviteAction(initialGroupActionState, input);
    expect(first.status).toBe("success");
    expect(first.invitePath).toBe(second.invitePath);
    const token = first.invitePath?.split("/").pop() ?? "";
    expect(token).toMatch(inviteTokenPattern);
    expect(mocks.rpc).toHaveBeenCalledWith("group_command", {
      request_ref: requestId,
      operation: "invite",
      group_ref: groupId,
      input: { token, validity_days: "7" },
    });
  });

  it("ignores a token chosen by the client", async () => {
    mocks.rpc.mockResolvedValue({ data: { invite_id: "i" }, error: null });
    await createInviteAction(
      initialGroupActionState,
      form({ requestId, groupId, validityDays: "7", token: "a".repeat(43) }),
    );
    expect(mocks.rpc.mock.calls[0][1].input.token).not.toBe("a".repeat(43));
  });

  it("shows known database messages and hides the rest", async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "Somente o gestor do grupo pode fazer isso" },
    });
    const known = await groupCommandAction(
      initialGroupActionState,
      form({ requestId, groupId, operation: "archive" }),
    );
    expect(known).toEqual({
      status: "error",
      message: "Somente o gestor do grupo pode fazer isso.",
    });
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'relation "x" does not exist' },
    });
    const unknown = await groupCommandAction(
      initialGroupActionState,
      form({ requestId, groupId, operation: "archive" }),
    );
    expect(unknown.message).not.toContain("relation");
  });

  it("refuses malformed invites before reaching the database", async () => {
    const result = await joinGroupAction(
      initialGroupActionState,
      form({ requestId, token: "curto" }),
    );
    expect(result.message).toBe("Convite indisponível.");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns to the group list after leaving", async () => {
    mocks.rpc.mockResolvedValue({ data: { group_id: groupId }, error: null });
    await expect(
      groupCommandAction(
        initialGroupActionState,
        form({ requestId, groupId, operation: "leave" }),
      ),
    ).rejects.toThrow("REDIRECT:/grupos?saiu=1");
  });
});
