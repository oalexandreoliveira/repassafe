"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApprovedProfessional } from "@/lib/shifts/data";
import { requireAdminIdentity } from "@/lib/auth/session";
import {
  confirmationSchema,
  decisionSchema,
  offerFormSchema,
  occurrenceDecisionSchema,
  reasonCommandSchema,
  selectionSchema,
  targetCommandSchema,
} from "@/features/shifts/schemas";
import { rateLimitPolicies } from "@/features/security/rate-limits";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import type { WorkflowFeedbackCode } from "@/features/shifts/feedback";

function returnWorkflowFeedback(code: WorkflowFeedbackCode): never {
  redirect(`/plantoes?feedback=${code}`);
}

function safeWorkflowFailure(message?: string): WorkflowFeedbackCode {
  if (message?.includes("42501") || message?.includes("P0001"))
    return "restricted";
  return "unavailable";
}

async function submitCommand(input: {
  id: string;
  command: string;
  targetId?: string;
  payload?: Record<string, unknown>;
}) {
  const identity = await requireApprovedProfessional();
  await enforceRateLimit({
    policy: rateLimitPolicies.workflow,
    identifier: identity.userId,
    dimension: "user",
    actorId: identity.userId,
  });
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
    returnWorkflowFeedback(safeWorkflowFailure(error?.message));
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
      owner_terms_acknowledged: parsed.ownerTermsAcknowledged === "true",
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
      owner_terms_acknowledged: parsed.ownerTermsAcknowledged === "true",
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
  });
  revalidatePath("/plantoes");
}

export async function confirmSubstitutionAction(formData: FormData) {
  const parsed = confirmationSchema.parse(Object.fromEntries(formData));
  await submitCommand({
    id: parsed.commandId,
    command: "confirm_substitution",
    targetId: parsed.targetId,
    payload: {
      accepted: parsed.accepted,
      terms_acknowledged: parsed.termsAcknowledged === "true",
    },
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

async function submitClosureCommand(
  command: string,
  formData: FormData,
  payload: Record<string, unknown> = {},
) {
  const parsed = reasonCommandSchema.safeParse(Object.fromEntries(formData));
  if (
    !parsed.success &&
    command !== "report_completion" &&
    command !== "confirm_completion"
  ) {
    returnWorkflowFeedback("invalid");
  }
  const basic = targetCommandSchema.parse(Object.fromEntries(formData));
  const identity = await requireApprovedProfessional();
  await enforceRateLimit({
    policy: rateLimitPolicies.workflow,
    identifier: identity.userId,
    dimension: "user",
    actorId: identity.userId,
  });
  const { data: existing } = await identity.supabase
    .from("closure_commands")
    .select("result_id")
    .eq("id", basic.commandId)
    .maybeSingle();
  if (existing?.result_id) return;
  const { error } = await identity.supabase.from("closure_commands").insert({
    id: basic.commandId,
    actor_id: identity.userId,
    command,
    target_id: basic.targetId,
    payload: {
      ...payload,
      ...(parsed.success ? { reason: parsed.data.reason } : {}),
    },
  });
  if (error) returnWorkflowFeedback(safeWorkflowFailure(error.message));
  revalidatePath("/plantoes");
  revalidatePath(`/plantoes/${basic.targetId}`);
  revalidatePath("/painel");
}

export async function reportCompletionAction(formData: FormData) {
  return submitClosureCommand("report_completion", formData);
}

export async function confirmCompletionAction(formData: FormData) {
  return submitClosureCommand("confirm_completion", formData);
}

export async function disputeCompletionAction(formData: FormData) {
  return submitClosureCommand("dispute_completion", formData);
}

export async function cancelConfirmedSubstitutionAction(formData: FormData) {
  return submitClosureCommand("cancel_confirmed_substitution", formData);
}

export async function substituteWithdrawalAction(formData: FormData) {
  return submitClosureCommand("substitute_withdrawal", formData);
}

export async function reviewOccurrenceAction(formData: FormData) {
  const parsed = occurrenceDecisionSchema.parse(Object.fromEntries(formData));
  const identity = await requireAdminIdentity();
  const { data: existing } = await identity.supabase
    .from("closure_commands")
    .select("result_id")
    .eq("id", parsed.commandId)
    .maybeSingle();
  if (existing?.result_id) return;
  const { error } = await identity.supabase.from("closure_commands").insert({
    id: parsed.commandId,
    actor_id: identity.userId,
    command: "review_occurrence",
    target_id: parsed.targetId,
    payload: { decision: parsed.decision },
  });
  if (error) returnWorkflowFeedback(safeWorkflowFailure(error.message));
  revalidatePath("/admin");
}
