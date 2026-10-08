import { z } from "zod";
import { inviteTokenPattern } from "./invite-path";

const requestId = z.uuid();
const groupId = z.uuid();

/** Mesma normalização do banco: espaços aparados e colapsados, 3 a 80. */
export const groupNameSchema = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(3, "Use pelo menos 3 caracteres.")
      .max(80, "Use até 80 caracteres."),
  );

export const createGroupSchema = z.object({
  requestId,
  name: groupNameSchema,
});

export const renameGroupSchema = z.object({
  requestId,
  groupId,
  name: groupNameSchema,
});

export const inviteSchema = z.object({
  requestId,
  groupId,
  validityDays: z.enum(["1", "7", "30"], {
    error: "Escolha a validade do link.",
  }),
});

export const groupCommandSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("revoke_invite"),
    requestId,
    groupId,
    inviteId: z.uuid(),
  }),
  z.object({
    operation: z.enum(["remove_member", "transfer"]),
    requestId,
    groupId,
    profileId: z.uuid(),
  }),
  z.object({
    operation: z.enum(["leave", "archive"]),
    requestId,
    groupId,
  }),
]);

export const joinGroupSchema = z.object({
  requestId,
  token: z.string().regex(inviteTokenPattern),
});

export type GroupCommand = z.infer<typeof groupCommandSchema>;
