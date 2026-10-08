import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/grupos",
  redirect: vi.fn(),
}));
vi.mock("@/app/grupos/actions", () => {
  const idle = async (previous: unknown) => previous;
  return {
    createGroupAction: idle,
    renameGroupAction: idle,
    createInviteAction: idle,
    groupCommandAction: idle,
    joinGroupAction: idle,
  };
});

import {
  GroupDetailScreen,
  GroupInviteScreen,
  GroupsScreen,
} from "@/components/screens/groups";
import { notificationPresentation } from "@/components/screens/notifications-list";
import { activeTab } from "@/components/ui/tab-bar";
import { invitePath, safeReturnPath } from "@/features/groups/invite-path";
import { memberCountText } from "@/features/groups/labels";
import { groupCommandSchema, groupNameSchema } from "@/features/groups/schemas";
import type { GroupDetail } from "@/features/groups/types";

afterEach(cleanup);

const token = "Q2xpcXVlLWFxdWktcGFyYS1lbnRyYXItbm8tZ3J1cG8";

const peer: GroupDetail = {
  eligible: true,
  role: "manager",
  group: {
    id: "7f6c3b1e-0000-4000-8000-000000000001",
    name: "Plantonistas UTI Adulto",
    kind: "peer",
    active: true,
    requires_approval: false,
    created_at: "2026-10-01T12:00:00.000Z",
    institution_name: null,
  },
  members: [
    {
      profile_id: "7f6c3b1e-0000-4000-8000-0000000000a1",
      display_name: "Ana Moreira",
      role: "manager",
      verified: true,
      is_self: true,
      joined_at: "2026-10-01T12:00:00.000Z",
    },
    {
      profile_id: "7f6c3b1e-0000-4000-8000-0000000000a2",
      display_name: "Bruno Lima",
      role: "doctor",
      verified: true,
      is_self: false,
      joined_at: "2026-10-03T12:00:00.000Z",
    },
    {
      profile_id: "7f6c3b1e-0000-4000-8000-0000000000a3",
      display_name: "Carla Souza",
      role: "doctor",
      verified: false,
      is_self: false,
      joined_at: "2026-10-05T12:00:00.000Z",
    },
  ],
  invites: [],
  open_offers: 0,
};

describe("group helpers", () => {
  it("accepts only group invites as the post-login destination", () => {
    expect(safeReturnPath(invitePath(token))).toBe(`/grupos/convite/${token}`);
    expect(safeReturnPath("https://evil.example/grupos/convite/" + token)).toBe(
      null,
    );
    expect(safeReturnPath("//evil.example")).toBe(null);
    expect(safeReturnPath("/painel")).toBe(null);
    expect(safeReturnPath(`/grupos/convite/${token}?x=1`)).toBe(null);
    expect(safeReturnPath("/grupos/convite/curto")).toBe(null);
    expect(safeReturnPath(`/grupos/convite/${token}/../../admin`)).toBe(null);
    expect(safeReturnPath(undefined)).toBe(null);
  });

  it("normalizes group names like the database", () => {
    expect(groupNameSchema.parse("  Plantonistas   UTI  ")).toBe(
      "Plantonistas UTI",
    );
    expect(groupNameSchema.safeParse(" a ").success).toBe(false);
    expect(groupNameSchema.safeParse("x".repeat(81)).success).toBe(false);
  });

  it("only accepts known group commands", () => {
    const base = {
      requestId: "7f6c3b1e-0000-4000-8000-000000000010",
      groupId: peer.group.id,
    };
    expect(
      groupCommandSchema.safeParse({ ...base, operation: "archive" }).success,
    ).toBe(true);
    expect(
      groupCommandSchema.safeParse({ ...base, operation: "remove_member" })
        .success,
    ).toBe(false);
    expect(
      groupCommandSchema.safeParse({ ...base, operation: "promote_approver" })
        .success,
    ).toBe(false);
  });

  it("keeps groups under the Perfil tab and labels group notifications", () => {
    expect(activeTab("/grupos")).toBe("perfil");
    expect(activeTab(`/grupos/${peer.group.id}`)).toBe("perfil");
    expect(memberCountText(1)).toBe("1 membro");
    expect(notificationPresentation("group.member_joined").tone).toBe("info");
    expect(notificationPresentation("group.manager_transferred").cta).toBe(
      "Abrir grupo",
    );
  });
});

describe("groups screens", () => {
  it("lists peer and institutional groups and offers creation when eligible", () => {
    render(
      <GroupsScreen
        approved
        canPublish
        overview={{
          eligible: true,
          groups: [
            {
              id: peer.group.id,
              name: "Plantonistas UTI Adulto",
              kind: "peer",
              active: false,
              role: "manager",
              requires_approval: false,
              institution_name: null,
              member_count: 3,
            },
            {
              id: "7f6c3b1e-0000-4000-8000-000000000003",
              name: "Plantonistas UTI",
              kind: "institutional",
              active: true,
              role: "approver",
              requires_approval: true,
              institution_name: "Hospital Exemplo",
              member_count: null,
            },
          ],
        }}
      />,
    );
    expect(
      screen.getByRole("link", { name: /Criar grupo de colegas/ }),
    ).toHaveAttribute("href", "/grupos/novo");
    const peerSection = screen.getByRole("region", {
      name: "Grupos de colegas",
    });
    expect(within(peerSection).getByText("Arquivado")).toBeInTheDocument();
    expect(within(peerSection).getByText("Gestor · 3 membros")).toBeVisible();
    expect(
      screen.getByText(
        "Hospital Exemplo · Aprovador institucional · Com aprovação da coordenação",
      ),
    ).toBeInTheDocument();
  });

  it("explains why an ineligible profile cannot create groups", () => {
    render(
      <GroupsScreen
        approved={false}
        canPublish={false}
        overview={{ eligible: false, groups: [] }}
      />,
    );
    expect(screen.queryByRole("link", { name: /Criar grupo/ })).toBeNull();
    expect(
      screen.getByText(/precisa estar aprovado e vigente/),
    ).toBeInTheDocument();
  });

  it("gives the manager invites and management, but not leaving with members", () => {
    render(<GroupDetailScreen detail={peer} approved canPublish preview />);
    expect(
      screen.getByRole("heading", { name: "Convidar colegas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Gerar link de convite" }),
    ).toBeInTheDocument();
    // Só o membro com verificação vigente pode assumir a gestão.
    expect(
      screen.getAllByRole("button", { name: "Tornar gestor" }),
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: "Remover do grupo" }),
    ).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Sair do grupo" })).toBeNull();
    expect(screen.getByText(/transfira antes a gestão/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Publicar plantão no grupo" }),
    ).toHaveAttribute(
      "href",
      `/plantoes/novo?modo=grupo&grupo=${peer.group.id}`,
    );
  });

  it("blocks archiving while the group has open shifts", () => {
    render(
      <GroupDetailScreen
        detail={{ ...peer, open_offers: 2 }}
        approved
        canPublish
        preview
      />,
    );
    expect(
      screen.getByText(/Há 2 plantões em aberto no grupo/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Arquivar grupo" })).toBeNull();
  });

  it("shows members only the list and the way out", () => {
    render(
      <GroupDetailScreen
        detail={{ ...peer, role: "doctor", invites: undefined }}
        approved
        canPublish
        preview
      />,
    );
    expect(
      screen.queryByRole("heading", { name: "Convidar colegas" }),
    ).toBeNull();
    expect(screen.queryByText("Gerenciar membros")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Sair do grupo" }),
    ).toBeInTheDocument();
  });

  it("keeps institutional groups read-only", () => {
    render(
      <GroupDetailScreen
        detail={{
          eligible: true,
          role: "doctor",
          group: {
            ...peer.group,
            kind: "institutional",
            requires_approval: true,
            institution_name: "Hospital Exemplo",
          },
        }}
        approved
        canPublish
        preview
      />,
    );
    expect(screen.getByText("Hospital Exemplo")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sair do grupo" })).toBeNull();
    expect(screen.queryByText("Membros")).toBeNull();
  });
});

describe("invite screen", () => {
  const open = {
    status: "open" as const,
    group_name: "Plantonistas UTI Adulto",
    manager_name: "Ana Moreira",
    member_count: 3,
    expires_at: "2026-10-13T12:00:00.000Z",
  };

  it("sends visitors to log in and back to the invite", () => {
    render(
      <GroupInviteScreen
        token={token}
        preview={null}
        requestId="7f6c3b1e-0000-4000-8000-000000000011"
        previewMode
      />,
    );
    expect(
      screen.getByRole("link", { name: "Entrar para ver o convite" }),
    ).toHaveAttribute(
      "href",
      `/entrar?proximo=${encodeURIComponent(`/grupos/convite/${token}`)}`,
    );
    expect(screen.queryByText("Plantonistas UTI Adulto")).toBeNull();
  });

  it("lets eligible doctors join and explains the other cases", () => {
    const { rerender } = render(
      <GroupInviteScreen
        token={token}
        preview={open}
        requestId="7f6c3b1e-0000-4000-8000-000000000011"
        previewMode
      />,
    );
    expect(
      screen.getByRole("button", { name: "Entrar no grupo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Gestor do grupo")).toBeInTheDocument();

    rerender(
      <GroupInviteScreen
        token={token}
        preview={{ ...open, status: "ineligible" }}
        requestId="7f6c3b1e-0000-4000-8000-000000000011"
        previewMode
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Entrar no grupo" }),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: "Ver meu cadastro" }),
    ).toHaveAttribute("href", "/cadastro/completar");

    rerender(
      <GroupInviteScreen
        token={token}
        preview={{ status: "unavailable" }}
        requestId="7f6c3b1e-0000-4000-8000-000000000011"
        previewMode
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Convite indisponível" }),
    ).toBeInTheDocument();
  });
});
