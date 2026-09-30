"use server";
import { ZodError } from "zod";
import { unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createGroupAction,
  createInstitutionAction,
  reviewProfileAction,
  updateGroupAction,
  updateMembershipAction,
  upsertMembershipAction,
} from "./actions";
import { answerSupportAction } from "@/app/suporte/actions";
import { reviewOccurrenceAction } from "@/app/plantoes/actions";
export type AdminFeedback = {
  status: "idle" | "success" | "error";
  message: string;
};
export async function adminFeedbackAction(
  actionName: string,
  _previous: AdminFeedback,
  formData: FormData,
): Promise<AdminFeedback> {
  const actions: Record<string, (data: FormData) => Promise<void>> = {
    createGroupAction,
    createInstitutionAction,
    reviewProfileAction,
    updateGroupAction,
    updateMembershipAction,
    upsertMembershipAction,
    answerSupportAction,
    reviewOccurrenceAction,
  };
  const action = Object.hasOwn(actions, actionName)
    ? actions[actionName]
    : undefined;
  if (!action)
    return {
      status: "error",
      message: "Ação indisponível. Atualize a página e tente novamente.",
    };
  try {
    await action(formData);
    revalidatePath("/admin", "layout");
    return { status: "success", message: "Alteração registrada." };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ZodError)
      return {
        status: "error",
        message:
          "Confira os campos obrigatórios e os limites indicados antes de enviar.",
      };
    return {
      status: "error",
      message:
        "Não foi possível registrar a alteração. Confira os dados e sua sessão. Cadastros versionados devem ser revisados na fila de cadastros.",
    };
  }
}
