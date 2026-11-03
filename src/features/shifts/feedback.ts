export const workflowFeedback = {
  professional_expired:
    "A verificação profissional do candidato não está vigente. Volte às candidaturas e confira os perfis atualizados antes de escolher.",
  unavailable:
    "Não foi possível concluir esta ação. Atualize a página e tente novamente.",
  invalid: "Confira os campos e a justificativa antes de continuar.",
  restricted:
    "Seu acesso ou a situação deste repasse não permite esta ação. Atualize a página para ver o estado atual.",
} as const;

export type WorkflowFeedbackCode = keyof typeof workflowFeedback;

export function isWorkflowFeedbackCode(
  value: string | undefined,
): value is WorkflowFeedbackCode {
  return value !== undefined && value in workflowFeedback;
}
