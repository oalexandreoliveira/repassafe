import { z } from "zod";

/** Allowlist shared by the server projection and the professional summary. */
export const candidateProfileSchema = z.object({
  id: z.string(),
  crm: z.string().nullable(),
  uf: z.string().nullable(),
  specialty: z.string().nullable(),
  rqe: z.string().nullable(),
  rqe_verified: z.boolean(),
  verified: z.boolean().nullable(),
  valid_until: z.string().nullable(),
});

export type CandidateProfile = z.infer<typeof candidateProfileSchema>;

export function hasCurrentVerification(
  profile: CandidateProfile | undefined,
  now: Date,
) {
  return Boolean(
    profile?.verified === true &&
    profile.crm &&
    profile.uf &&
    profile.valid_until &&
    Date.parse(profile.valid_until) > now.getTime(),
  );
}

export function verificationLabel(
  profile: CandidateProfile | undefined,
  now: Date,
) {
  if (!profile) return "Dados profissionais indisponíveis";
  if (hasCurrentVerification(profile, now)) return "CRM verificado";
  if (profile.valid_until && Date.parse(profile.valid_until) <= now.getTime())
    return "Verificação vencida";
  return "Verificação profissional não vigente";
}

export function verificationValidity(profile: CandidateProfile) {
  if (!profile.valid_until || !Number.isFinite(Date.parse(profile.valid_until)))
    return "Validade não disponível";
  return (
    new Date(profile.valid_until).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      dateStyle: "short",
      timeStyle: "short",
    }) + " (Brasília)"
  );
}
