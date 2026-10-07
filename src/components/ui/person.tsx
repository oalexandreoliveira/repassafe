import { ShieldCheck } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./person.module.css";

const honorific = /^(dra?\.?)\s+/i;

/** Iniciais para o avatar: primeira letra do primeiro e do último nome, sem "Dr."/"Dra.". */
export function initialsOf(name: string) {
  const words = name.trim().replace(honorific, "").split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return `${first}${last}`.toLocaleUpperCase("pt-BR");
}

export function Avatar({
  name,
  size = "md",
  tone = "neutral",
}: {
  name: string;
  /** md = 44px, lg = 46px */
  size?: "md" | "lg";
  tone?: "neutral" | "mist";
}) {
  return (
    <span
      className={[
        styles.avatar,
        size === "lg" && styles.avatarLarge,
        tone === "mist" && styles.avatarMist,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}

export function CrmVerifiedSeal() {
  return (
    <span className={styles.seal}>
      <ShieldCheck size={16} />
      CRM verificado
    </span>
  );
}

/** Pessoa em destaque (ex.: "Publicado por"). */
export function PersonRow({
  label,
  name,
  verified = false,
}: {
  label: string;
  name: string;
  verified?: boolean;
}) {
  return (
    <div className={styles.row}>
      <Avatar name={name} />
      <p className={styles.rowText}>
        <span className={styles.rowLabel}>{label}</span>
        <span className={styles.rowName}>{name}</span>
      </p>
      {verified ? <CrmVerifiedSeal /> : null}
    </div>
  );
}

/** Candidato selecionável: o cartão inteiro é o rótulo do radio. */
export function CandidateCard({
  name,
  details,
  meta,
  verified = false,
  value,
  inputName,
  ...radio
}: {
  name: string;
  /** "Especialidade · CRM-UF Nº" quando disponível. */
  details?: ReactNode;
  /** "Candidatou-se hoje, 14:32" */
  meta?: ReactNode;
  verified?: boolean;
  value: string;
  /** Nome do grupo de radios no formulário. */
  inputName: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "name" | "value">) {
  const id = `candidate-${value}`;
  return (
    <label className={styles.candidate} htmlFor={id}>
      <Avatar name={name} size="lg" />
      <span className={styles.candidateText}>
        <span className={styles.candidateName} id={`${id}-name`}>
          {name}
        </span>
        <span id={`${id}-details`} className={styles.candidateDetails}>
          {details}
          {verified ? <CrmVerifiedSeal /> : null}
        </span>
        {meta ? <span className={styles.candidateMeta}>{meta}</span> : null}
      </span>
      <input
        type="radio"
        id={id}
        name={inputName}
        value={value}
        className={styles.radio}
        aria-labelledby={`${id}-name`}
        aria-describedby={`${id}-details`}
        {...radio}
      />
    </label>
  );
}
