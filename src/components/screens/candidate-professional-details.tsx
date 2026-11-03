import {
  verificationLabel,
  verificationValidity,
  type CandidateProfile,
} from "@/features/shifts/candidate-profile";
import styles from "./candidate-professional-details.module.css";

/** Native disclosure preserves the choice and works without client JavaScript. */
export function CandidateProfessionalDetails({
  name,
  profile,
  now,
}: {
  name: string;
  profile?: CandidateProfile;
  now: Date;
}) {
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>
        Ver perfil profissional<span className="sr-only"> de {name}</span>
      </summary>
      <div className={styles.content}>
        <h3 className={styles.title}>Perfil profissional de {name}</h3>
        {profile ? (
          <dl className={styles.facts}>
            <div>
              <dt>CRM/UF</dt>
              <dd>
                {profile.crm ?? "Não informado"}/{profile.uf ?? "—"}
              </dd>
            </div>
            <div>
              <dt>Situação da verificação</dt>
              <dd>{verificationLabel(profile, now)}</dd>
            </div>
            <div>
              <dt>Validade da verificação</dt>
              <dd>{verificationValidity(profile)}</dd>
            </div>
            <div>
              <dt>Especialidade declarada</dt>
              <dd>{profile.specialty ?? "Não informada"}</dd>
            </div>
            <div>
              <dt>RQE</dt>
              <dd>
                {profile.rqe
                  ? `${profile.rqe} — ${profile.rqe_verified ? "verificado" : "declarado, não verificado"}`
                  : "Não informado"}
              </dd>
            </div>
          </dl>
        ) : (
          <p>
            Não foi possível consultar os dados profissionais deste candidato.
            Atualize a página para tentar novamente.
          </p>
        )}
        <p className={styles.note}>
          A verificação do CRM não verifica automaticamente a especialidade ou o
          RQE e não concede autorização institucional. Vínculos e aprovações do
          grupo são tratados separadamente.
        </p>
      </div>
    </details>
  );
}
