export const groupRoleLabel: Record<string, string> = {
  doctor: "Médico",
  approver: "Aprovador",
};

export const profileStatusLabel: Record<string, string> = {
  pending: "Aguardando verificação",
  approved: "Cadastro aprovado",
  changes_requested: "Correção solicitada",
  rejected: "Cadastro não aprovado",
  suspended: "Acesso suspenso",
};

export const auditEventLabels: Record<string, string> = {
  "administration.access_granted": "Acesso administrativo concedido",
  "administration.access_updated": "Acesso administrativo atualizado",
  "administration.access_revoked": "Acesso administrativo revogado",
  "profile.reviewed": "Cadastro profissional revisado",
  "profile.updated": "Dados profissionais atualizados",
  "crm.verification.recorded": "Consulta de CRM registrada",
  "institution.created": "Instituição criada",
  "group.created": "Grupo criado",
  "group.updated": "Grupo atualizado",
  "membership.upserted": "Vínculo institucional registrado",
  "membership.updated": "Vínculo institucional atualizado",
  "offer.published": "Plantão publicado",
  "offer.cancelled": "Oferta cancelada",
  "application.submitted": "Candidatura recebida",
  "application.selected": "Profissional selecionado",
  "substitution.confirmed": "Repasse confirmado",
  "substitution.approved": "Repasse aprovado pela instituição",
  "registration.submitted": "Cadastro enviado para análise",
  "registration.reviewed": "Decisão cadastral registrada",
  "support.created": "Solicitação de suporte recebida",
  "support.answered": "Solicitação de suporte respondida",
};
export const auditEntityLabels: Record<string, string> = {
  profile: "Cadastro profissional",
  institution: "Instituição",
  group: "Grupo",
  group_membership: "Vínculo",
  membership: "Vínculo",
  shift_offer: "Oferta de plantão",
  shift_application: "Candidatura",
  substitution: "Repasse",
  shift_substitution: "Repasse",
  administrative_access: "Acesso administrativo",
  registration: "Cadastro",
  support_request: "Suporte",
  authentication: "Conta",
};
