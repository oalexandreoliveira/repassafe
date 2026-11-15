"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  agendaCommandInput,
  agendaEntrySchema,
  agendaFailure,
  agendaFormObject,
  settleSchema,
  type AgendaFormState,
} from "@/features/agenda/schema";
import { monthOf } from "@/features/agenda/model";
import { requireAgendaUser } from "@/lib/agenda";

const uuid = z.uuid();

function formValues(formData: FormData) {
  return Object.fromEntries(
    [...formData.entries()].filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[0] !== "dates",
    ),
  );
}

/** Cadastra uma ou várias datas, ou edita uma anotação (com entryId). */
export async function saveAgendaEntryAction(
  _previous: AgendaFormState,
  formData: FormData,
): Promise<AgendaFormState> {
  const raw = agendaFormObject(formData);
  const entryId = formData.get("entryId");
  const editing = typeof entryId === "string" && entryId !== "";
  const keep = { values: formValues(formData), dates: raw.dates };
  if (editing && (!uuid.safeParse(entryId).success || raw.dates.length !== 1))
    return { message: "Selecione uma data.", ...keep };
  const parsed = agendaEntrySchema().safeParse(raw);
  if (!parsed.success)
    return {
      message: "Revise os campos indicados.",
      errors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
      ...keep,
    };
  const identity = await requireAgendaUser();
  const { data, error } = await identity.supabase.rpc("agenda_command", {
    request_ref: parsed.data.requestId,
    operation: editing ? "update" : "create",
    entry_ref: editing ? entryId : null,
    input: agendaCommandInput(parsed.data),
  });
  if (error) return { message: agendaFailure(error.message), ...keep };
  revalidatePath("/agenda");
  if (editing) redirect(`/agenda/${entryId}?salvo=1`);
  const ids = ((data as { ids?: string[] } | null)?.ids ?? []).length;
  const month = monthOf([...parsed.data.dates].sort()[0]);
  redirect(`/agenda?mes=${month}&salvos=${ids}`);
}

/** Marca o pagamento da anotação como recebido (ou pago, quando o usuário paga). */
export async function settleAgendaEntryAction(
  _previous: AgendaFormState,
  formData: FormData,
): Promise<AgendaFormState> {
  const parsed = settleSchema().safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      message: "Revise os campos indicados.",
      errors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
      values: formValues(formData),
    };
  const identity = await requireAgendaUser();
  const { error } = await identity.supabase.rpc("agenda_command", {
    request_ref: null,
    operation: "settle",
    entry_ref: parsed.data.entryId,
    input: {
      settled_on: parsed.data.settledOn,
      settled_cents: parsed.data.amount,
    },
  });
  if (error)
    return {
      message: agendaFailure(error.message),
      values: formValues(formData),
    };
  revalidatePath("/agenda");
  redirect(`/agenda/${parsed.data.entryId}?marcado=1`);
}

export async function unsettleAgendaEntryAction(formData: FormData) {
  const entryId = uuid.parse(formData.get("entryId"));
  const identity = await requireAgendaUser();
  const { error } = await identity.supabase.rpc("agenda_command", {
    request_ref: null,
    operation: "unsettle",
    entry_ref: entryId,
    input: {},
  });
  if (error) throw new Error(agendaFailure(error.message));
  revalidatePath("/agenda");
  redirect(`/agenda/${entryId}`);
}

export async function deleteAgendaEntryAction(formData: FormData) {
  const entryId = uuid.parse(formData.get("entryId"));
  const month = formData.get("month");
  const identity = await requireAgendaUser();
  const { error } = await identity.supabase.rpc("agenda_command", {
    request_ref: null,
    operation: "delete",
    entry_ref: entryId,
    input: {},
  });
  if (error) throw new Error(agendaFailure(error.message));
  revalidatePath("/agenda");
  const target =
    typeof month === "string" && /^\d{4}-\d{2}$/.test(month)
      ? `/agenda?mes=${month}&excluido=1`
      : "/agenda?excluido=1";
  redirect(target);
}
