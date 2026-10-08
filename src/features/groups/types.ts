/** Formatos devolvidos por group_context e group_invite_preview (RPC). */
export type GroupKind = "institutional" | "peer";
export type GroupRole = "doctor" | "approver" | "manager";

export type GroupSummary = {
  id: string;
  name: string;
  kind: GroupKind;
  active: boolean;
  role: GroupRole;
  requires_approval: boolean;
  institution_name: string | null;
  /** Só em grupos de colegas. */
  member_count: number | null;
};

export type GroupOverview = {
  eligible: boolean;
  groups: GroupSummary[];
};

export type GroupMember = {
  profile_id: string;
  display_name: string;
  role: GroupRole;
  verified: boolean;
  is_self: boolean;
  joined_at: string;
};

export type GroupInvite = {
  id: string;
  created_at: string;
  expires_at: string;
  use_count: number;
  max_uses: number;
};

export type GroupDetail = {
  eligible: boolean;
  role: GroupRole;
  group: {
    id: string;
    name: string;
    kind: GroupKind;
    active: boolean;
    requires_approval: boolean;
    created_at: string;
    institution_name: string | null;
  };
  /** Só em grupos de colegas. */
  members?: GroupMember[];
  /** Só para o gestor. */
  invites?: GroupInvite[];
  open_offers?: number;
};

export type InvitePreview =
  | { status: "unavailable" }
  | { status: "member"; group_id: string; group_name: string }
  | {
      status: "open" | "ineligible";
      group_name: string;
      manager_name: string | null;
      member_count: number;
      expires_at: string;
    };

export type GroupActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
  /** Caminho do convite recém-gerado, exibido uma única vez. */
  invitePath?: string;
  inviteExpiresAt?: string;
};

export const initialGroupActionState: GroupActionState = {
  status: "idle",
  message: "",
};
