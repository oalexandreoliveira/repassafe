import type { GroupKind, GroupRole } from "./types";

export const groupKindText: Record<GroupKind, string> = {
  peer: "Grupo de colegas",
  institutional: "Grupo institucional",
};

export const groupRoleText: Record<GroupRole, string> = {
  manager: "Gestor",
  doctor: "Membro",
  approver: "Aprovador institucional",
};

export const inviteValidityOptions = [
  { value: "1", label: "24 horas" },
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
] as const;

export function memberCountText(count: number) {
  return count === 1 ? "1 membro" : `${count} membros`;
}

export function inviteUsesText(used: number) {
  if (used === 0) return "Ainda não usado";
  return used === 1 ? "Usado 1 vez" : `Usado ${used} vezes`;
}
