import { z } from "zod";

export const reviewProfileSchema = z
  .object({
    profileId: z.uuid(),
    status: z.enum(["approved", "changes_requested", "rejected", "suspended"]),
    notes: z.string().trim().max(500).default(""),
    crmNameFound: z.preprocess(
      (value) =>
        typeof value === "string" && !value.trim() ? undefined : value,
      z.string().trim().min(2).max(160).optional(),
    ),
    crmNumberChecked: z
      .string()
      .trim()
      .regex(/^\d{4,12}$/)
      .optional(),
    crmStateChecked: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/)
      .optional(),
    crmOutcome: z
      .enum([
        "verified",
        "verified_with_note",
        "name_divergence",
        "number_divergence",
        "status_incompatible",
        "rqe_not_found",
        "insufficient_information",
        "source_unavailable",
      ])
      .optional(),
    crmSource: z.string().trim().min(2).max(240).optional(),
    crmNotes: z.string().trim().max(1000).optional(),
  })
  .superRefine((data, context) => {
    if (
      ["changes_requested", "rejected", "suspended"].includes(data.status) &&
      data.notes.length < 5
    ) {
      context.addIssue({
        code: "custom",
        path: ["notes"],
        message: "Informe a justificativa da decisão.",
      });
    }
    if (data.status === "suspended") return;
    for (const field of [
      "crmNameFound",
      "crmNumberChecked",
      "crmStateChecked",
      "crmOutcome",
      "crmSource",
    ] as const) {
      if (
        field === "crmNameFound" &&
        ["source_unavailable", "insufficient_information"].includes(
          data.crmOutcome ?? "",
        )
      ) {
        continue;
      }
      if (!data[field])
        context.addIssue({
          code: "custom",
          path: [field],
          message: "Informe a evidência da consulta manual do CRM.",
        });
    }
    if (
      data.status === "approved" &&
      !["verified", "verified_with_note"].includes(data.crmOutcome ?? "")
    ) {
      context.addIssue({
        code: "custom",
        path: ["crmOutcome"],
        message: "Só é possível aprovar com resultado de CRM verificado.",
      });
    }
    if (
      data.status === "rejected" &&
      ["verified", "verified_with_note", "source_unavailable"].includes(
        data.crmOutcome ?? "",
      )
    ) {
      context.addIssue({
        code: "custom",
        path: ["crmOutcome"],
        message: "Registre divergência ou situação incompatível para rejeitar.",
      });
    }
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

export const updateGroupSchema = z.object({
  groupId: z.uuid(),
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

export const updateMembershipSchema = z.object({
  membershipId: z.uuid(),
  role: z.enum(["doctor", "approver"]),
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
});
