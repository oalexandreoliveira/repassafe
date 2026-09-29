export const registrationFieldLabels: Record<string, string> = {
  civilName: "Nome civil",
  displayName: "Nome de apresentação",
  cpf: "CPF",
  birthDate: "Nascimento",
  phone: "Celular",
  practicesMedicine: "Atuação médica",
  crmNumber: "CRM",
  crmState: "UF do CRM",
  specialty: "Especialidade",
  rqe: "RQE",
  institution: "Instituição declarada",
  sector: "Setor declarado",
  response: "Resposta às correções",
  photo: "Foto profissional",
};
export const registrationStateLabels: Record<string, string> = {
  incomplete: "Em preenchimento",
  submitted: "Aguardando verificação",
  changes_requested: "Correções solicitadas",
  approved: "Aprovado",
  rejected: "Não aprovado",
  suspended: "Suspenso",
};
export const registrationReviewOrder = [
  "civilName",
  "displayName",
  "birthDate",
  "phone",
  "practicesMedicine",
  "crmNumber",
  "crmState",
  "specialty",
  "rqe",
  "institution",
  "sector",
];
export function registrationValueLabel(key: string, value: string) {
  return key === "practicesMedicine"
    ? value === "yes"
      ? "Sim"
      : "Não"
    : key === "birthDate" && value
      ? new Date(`${value}T12:00:00Z`).toLocaleDateString("pt-BR")
      : value || "Não informado";
}
