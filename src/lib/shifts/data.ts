import "server-only";

import { redirect } from "next/navigation";
import { getVerifiedIdentity } from "@/lib/auth/session";

export async function requireApprovedProfessional() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");

  const { data: profile } = await identity.supabase
    .from("profiles")
    .select("display_name,status")
    .eq("id", identity.userId)
    .single();
  if (!profile || profile.status !== "approved") redirect("/painel");

  return { ...identity, profile };
}

export async function listShiftWorkspace() {
  const identity = await requireApprovedProfessional();
  const [{ data: offers }, { data: applications }, { data: substitutions }] =
    await Promise.all([
      identity.supabase
        .from("shift_offers")
        .select(
          "id,owner_id,starts_at,ends_at,sector,value_cents,status,groups(name)",
        )
        .gt("starts_at", new Date().toISOString())
        .order("starts_at"),
      identity.supabase
        .from("shift_applications")
        .select("id,offer_id,status")
        .eq("candidate_id", identity.userId),
      identity.supabase
        .from("substitutions")
        .select(
          "id,offer_id,status,confirmation_deadline,owner_id,substitute_id",
        )
        .order("created_at", { ascending: false }),
    ]);

  return {
    identity,
    offers: offers ?? [],
    applications: applications ?? [],
    substitutions: substitutions ?? [],
  };
}

export async function getShiftDetails(offerId: string) {
  const identity = await requireApprovedProfessional();
  const { data: offer } = await identity.supabase
    .from("shift_offers")
    .select(
      "id,group_id,owner_id,starts_at,ends_at,sector,value_cents,payment_terms,notes,status,groups(name,requires_approval)",
    )
    .eq("id", offerId)
    .single();
  if (!offer) return null;

  const [
    { data: applications },
    { data: substitutions },
    { data: agreements },
  ] = await Promise.all([
    identity.supabase
      .from("shift_applications")
      .select("id,candidate_id,candidate_display_name,status,created_at")
      .eq("offer_id", offerId)
      .order("created_at"),
    identity.supabase
      .from("substitutions")
      .select(
        "id,status,owner_id,substitute_id,confirmation_deadline,substitute_confirmed_at,institutional_decided_at",
      )
      .eq("offer_id", offerId)
      .order("created_at", { ascending: false }),
    identity.supabase
      .from("shift_agreements")
      .select("id,snapshot,confirmed_at,owner_id,substitute_id")
      .eq("offer_id", offerId)
      .maybeSingle(),
  ]);

  const { data: approverMembership } = await identity.supabase
    .from("group_memberships")
    .select("id")
    .eq("group_id", offer.group_id)
    .eq("profile_id", identity.userId)
    .eq("role", "approver")
    .eq("active", true)
    .maybeSingle();

  return {
    identity,
    offer,
    applications: applications ?? [],
    substitutions: substitutions ?? [],
    agreement: agreements,
    isApprover: Boolean(approverMembership),
  };
}
