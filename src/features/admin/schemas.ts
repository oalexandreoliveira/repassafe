import { z } from "zod";

export const reviewProfileSchema = z.object({
  profileId: z.uuid(),
  status: z.enum(["approved", "changes_requested", "rejected", "suspended"]),
  notes: z.string().trim().max(500).default(""),
});

export const institutionSchema = z.object({
  name: z.string().trim().min(3).max(160),
});

export const groupSchema = z.object({
  institutionId: z.uuid(),
  name: z.string().trim().min(3).max(160),
  requiresApproval: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
});

export const membershipSchema = z.object({
  profileId: z.uuid(),
  groupId: z.uuid(),
  role: z.enum(["doctor", "approver"]),
});
