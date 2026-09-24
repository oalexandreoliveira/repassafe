"use server";

import { revalidatePath } from "next/cache";
import { requireAdminIdentity } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  groupSchema,
  institutionSchema,
  membershipSchema,
  reviewProfileSchema,
  updateGroupSchema,
  updateMembershipSchema,
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
  if (parsed.status !== "suspended") {
    const { data: target } = await admin
      .from("profiles")
      .select("crm_number,crm_state")
      .eq("id", parsed.profileId)
      .single();
    if (
      !target ||
      target.crm_number !== parsed.crmNumberChecked ||
      target.crm_state?.toUpperCase() !== parsed.crmStateChecked
    ) {
      throw new Error(
        "A evidência deve corresponder ao CRM e à UF cadastrados.",
      );
    }
    const { error: evidenceError } = await admin
      .from("crm_verifications")
      .insert({
        profile_id: parsed.profileId,
        verified_by: identity.userId,
        crm_name_found: parsed.crmNameFound || null,
        crm_number_checked: parsed.crmNumberChecked,
        crm_state_checked: parsed.crmStateChecked,
        outcome: parsed.crmOutcome,
        source: parsed.crmSource,
        notes: parsed.crmNotes || null,
        checked_at: new Date().toISOString(),
      });
    if (evidenceError)
      throw new Error("Não foi possível salvar a evidência do CRM.");
    await recordAuditEvent({
      actorId: identity.userId,
      eventType: "crm.verification.recorded",
      entityType: "profile",
      entityId: parsed.profileId,
      metadata: { outcome: parsed.crmOutcome },
    });
  }
  const { error } = await admin
    .from("profiles")
    .update({
      status: parsed.status,
      verification_notes: parsed.notes || parsed.crmNotes || null,
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

export async function updateGroupAction(formData: FormData) {
  const parsed = updateGroupSchema.parse(Object.fromEntries(formData));
  const { identity, admin } = await adminContext();
  const { error } = await admin
    .from("groups")
    .update({
      name: parsed.name,
      requires_approval: parsed.requiresApproval,
    })
    .eq("id", parsed.groupId);
  if (error) throw new Error("Falha ao atualizar o grupo");
  await recordAudit(
    admin,
    identity.userId,
    "group.updated",
    "group",
    parsed.groupId,
    { fields: ["name", "requires_approval"] },
  );
  revalidatePath("/admin");
}

export async function upsertMembershipAction(formData: FormData) {
  const parsed = membershipSchema.parse(Object.fromEntries(formData));
  const { identity, admin } = await adminContext();
  const { data: targetProfile, error: profileError } = await admin
    .from("profiles")
    .select("status,role")
    .eq("id", parsed.profileId)
    .single();
  if (
    profileError ||
    targetProfile?.status !== "approved" ||
    targetProfile.role === "admin"
  )
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

export async function updateMembershipAction(formData: FormData) {
  const parsed = updateMembershipSchema.parse(Object.fromEntries(formData));
  const { identity, admin } = await adminContext();
  const { data: membership, error: membershipError } = await admin
    .from("group_memberships")
    .select("profile_id,group_id,active,role")
    .eq("id", parsed.membershipId)
    .single();
  if (membershipError || !membership) throw new Error("Vínculo não encontrado");

  if (parsed.active) {
    const { data: profile } = await admin
      .from("profiles")
      .select("status,role")
      .eq("id", membership.profile_id)
      .single();
    if (profile?.status !== "approved" || profile.role === "admin")
      throw new Error(
        "Somente profissionais aprovados podem ter vínculo ativo",
      );
  }

  const { error } = await admin
    .from("group_memberships")
    .update({ role: parsed.role, active: parsed.active })
    .eq("id", parsed.membershipId);
  if (error) throw new Error("Falha ao atualizar o vínculo");
  await recordAudit(
    admin,
    identity.userId,
    parsed.active ? "membership.updated" : "membership.deactivated",
    "group_membership",
    parsed.membershipId,
    { role: parsed.role, active: parsed.active },
  );
  revalidatePath("/admin");
}
