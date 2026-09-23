"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApprovedProfessional } from "@/lib/shifts/data";
import {
  confirmationSchema,
  decisionSchema,
  offerFormSchema,
  selectionSchema,
  targetCommandSchema,
} from "@/features/shifts/schemas";

async function submitCommand(input: {
  id: string;
  command: string;
  targetId?: string;
  payload?: Record<string, unknown>;
}) {
  const identity = await requireApprovedProfessional();
  const { data: existing } = await identity.supabase
    .from("workflow_commands")
    .select("result_id")
    .eq("id", input.id)
    .maybeSingle();
  if (existing?.result_id) return existing.result_id;

  const { data, error } = await identity.supabase
    .from("workflow_commands")
    .insert({
      id: input.id,
      actor_id: identity.userId,
      command: input.command,
      target_id: input.targetId ?? null,
      payload: input.payload ?? {},
    })
    .select("result_id")
    .single();
  if (error || !data?.result_id) {
    throw new Error(error?.message ?? "Não foi possível concluir a operação");
  }
  return data.result_id as string;
}

export async function publishOfferAction(formData: FormData) {
  const parsed = offerFormSchema.parse(Object.fromEntries(formData));
  const offerId = await submitCommand({
    id: parsed.commandId,
    command: "publish_offer",
    payload: {
      group_id: parsed.groupId,
      starts_at: parsed.startsAt,
      ends_at: parsed.endsAt,
      sector: parsed.sector,
      value_cents: parsed.value,
      payment_terms: parsed.paymentTerms,
      notes: parsed.notes,
    },
  });
  revalidatePath("/plantoes");
  redirect(`/plantoes/${offerId}`);
}

export async function updateOfferAction(offerId: string, formData: FormData) {
  const parsed = offerFormSchema.parse(Object.fromEntries(formData));
  await submitCommand({
    id: parsed.commandId,
    command: "update_offer",
    targetId: offerId,
    payload: {
      starts_at: parsed.startsAt,
      ends_at: parsed.endsAt,
      sector: parsed.sector,
      value_cents: parsed.value,
      payment_terms: parsed.paymentTerms,
      notes: parsed.notes,
    },
  });
  revalidatePath(`/plantoes/${offerId}`);
  redirect(`/plantoes/${offerId}`);
}

async function simpleTargetCommand(command: string, formData: FormData) {
  const parsed = targetCommandSchema.parse(Object.fromEntries(formData));
  await submitCommand({
    id: parsed.commandId,
    command,
    targetId: parsed.targetId,
  });
  revalidatePath("/plantoes");
}

export async function applyToOfferAction(formData: FormData) {
  return simpleTargetCommand("apply_to_offer", formData);
}

export async function withdrawApplicationAction(formData: FormData) {
  return simpleTargetCommand("withdraw_application", formData);
}

export async function cancelOfferAction(formData: FormData) {
  return simpleTargetCommand("cancel_offer", formData);
}

export async function selectCandidateAction(formData: FormData) {
  const parsed = selectionSchema.parse(Object.fromEntries(formData));
  await submitCommand({
    id: parsed.commandId,
    command: "select_candidate",
    targetId: parsed.targetId,
    payload: { confirmation_minutes: parsed.confirmationMinutes },
  });
  revalidatePath("/plantoes");
}

export async function confirmSubstitutionAction(formData: FormData) {
  const parsed = confirmationSchema.parse(Object.fromEntries(formData));
  await submitCommand({
    id: parsed.commandId,
    command: "confirm_substitution",
    targetId: parsed.targetId,
    payload: { accepted: parsed.accepted },
  });
  revalidatePath("/plantoes");
}

export async function decideSubstitutionAction(formData: FormData) {
  const parsed = decisionSchema.parse(Object.fromEntries(formData));
  await submitCommand({
    id: parsed.commandId,
    command: "decide_substitution",
    targetId: parsed.targetId,
    payload: { approved: parsed.approved },
  });
  revalidatePath("/plantoes");
}
