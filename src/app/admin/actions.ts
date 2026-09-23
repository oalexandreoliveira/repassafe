"use server";

import { revalidatePath } from "next/cache";
import { requireAdminIdentity } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  groupSchema,
  institutionSchema,
  membershipSchema,
  reviewProfileSchema,
} from "@/features/admin/schemas";
import { rateLimitPolicies } from "@/features/security/rate-limits";
import { recordAuditEvent } from "@/lib/security/audit";
import { enforceRateLimit } from "@/lib/security/rate-limit";

async function adminContext() {
  const identity = await requireAdminIdentity();
  await enforceRateLimit({
    policy: rateLimitPolicies.administration,
    identifier: identity.userId,
    dimension: "user",
    actorId: identity.userId,
  });
  return { identity, admin: createAdminClient() };
}

async function recordAudit(
  admin: ReturnType<typeof createAdminClient>,
  actorId: string,
  eventType: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  void admin;
  await recordAuditEvent({
    actorId,
    eventType,
    entityType,
    entityId,
    metadata,
  });
}

export async function reviewProfileAction(formData: FormData) {
  const parsed = reviewProfileSchema.parse(Object.fromEntries(formData));
  const { identity, admin } = await adminContext();
  const approved = parsed.status === "approved";
  const { error } = await admin
    .from("profiles")
    .update({
      status: parsed.status,
      verification_notes: parsed.notes || null,
      verified_at: approved ? new Date().toISOString() : null,
      verified_by: approved ? identity.userId : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.profileId);
  if (error) throw new Error("Falha ao revisar perfil");

  await recordAudit(
    admin,
    identity.userId,
    "profile.reviewed",
    "profile",
    parsed.profileId,
    { status: parsed.status },
  );
  revalidatePath("/admin");
}

export async function createInstitutionAction(formData: FormData) {
  const parsed = institutionSchema.parse(Object.fromEntries(formData));
  const { identity, admin } = await adminContext();
  const { data, error } = await admin
    .from("institutions")
    .insert({ name: parsed.name })
    .select("id")
    .single();
  if (error || !data) throw new Error("Falha ao criar instituição");
  await recordAudit(
    admin,
    identity.userId,
    "institution.created",
    "institution",
    data.id,
  );
  revalidatePath("/admin");
}

export async function createGroupAction(formData: FormData) {
  const parsed = groupSchema.parse(Object.fromEntries(formData));
  const { identity, admin } = await adminContext();
  const { data, error } = await admin
    .from("groups")
    .insert({
      institution_id: parsed.institutionId,
      name: parsed.name,
      requires_approval: parsed.requiresApproval,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Falha ao criar grupo");
  await recordAudit(admin, identity.userId, "group.created", "group", data.id);
  revalidatePath("/admin");
}

export async function upsertMembershipAction(formData: FormData) {
  const parsed = membershipSchema.parse(Object.fromEntries(formData));
  const { identity, admin } = await adminContext();
  const { data: targetProfile, error: profileError } = await admin
    .from("profiles")
    .select("status")
    .eq("id", parsed.profileId)
    .single();
  if (profileError || targetProfile?.status !== "approved")
    throw new Error("Somente profissionais aprovados podem receber vínculo");

  const { data, error } = await admin
    .from("group_memberships")
    .upsert(
      {
        profile_id: parsed.profileId,
        group_id: parsed.groupId,
        role: parsed.role,
        active: true,
      },
      { onConflict: "group_id,profile_id" },
    )
    .select("id")
    .single();
  if (error || !data) throw new Error("Falha ao vincular profissional");
  await recordAudit(
    admin,
    identity.userId,
    "membership.activated",
    "group_membership",
    data.id,
    { role: parsed.role },
  );
  revalidatePath("/admin");
}
