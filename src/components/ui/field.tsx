import { ChevronDown, Search } from "lucide-react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import styles from "./field.module.css";

type FieldBase = {
  label: ReactNode;
  name: string;
  id?: string;
  /** Orientação permanente sob o campo. */
  hint?: ReactNode;
  /** Mensagem de erro do próprio campo (nomeia o problema e a correção). */
  error?: string;
};

function describe({ name, id, hint, error }: Omit<FieldBase, "label">) {
  const fieldId = id ?? `field-${name}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return {
    fieldId,
    hintId,
    errorId,
    aria: {
      "aria-invalid": error ? (true as const) : undefined,
      "aria-describedby":
        [hintId, errorId].filter(Boolean).join(" ") || undefined,
    },
  };
}

function Field({
  fieldId,
  label,
  hint,
  hintId,
  error,
  errorId,
  children,
}: {
  fieldId: string;
  label: ReactNode;
  hint?: ReactNode;
  hintId?: string;
  error?: string;
  errorId?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fieldId}>
        {label}
      </label>
      {children}
      {hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  name,
  id,
  hint,
  error,
  ...props
}: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const { fieldId, hintId, errorId, aria } = describe({
    name,
    id,
    hint,
    error,
  });
  return (
    <Field {...{ fieldId, label, hint, hintId, error, errorId }}>
      <input id={fieldId} name={name} {...aria} {...props} />
    </Field>
  );
}

export function SelectField({
  label,
  name,
  id,
  hint,
  error,
  children,
  ...props
}: FieldBase & SelectHTMLAttributes<HTMLSelectElement>) {
  const { fieldId, hintId, errorId, aria } = describe({
    name,
    id,
    hint,
    error,
  });
  return (
    <Field {...{ fieldId, label, hint, hintId, error, errorId }}>
      <div className={styles.control}>
        <select
          id={fieldId}
          name={name}
          className={styles.select}
          {...aria}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className={styles.chevron} size={18} />
      </div>
    </Field>
  );
}

export function TextAreaField({
  label,
  name,
  id,
  hint,
  error,
  rows = 3,
  ...props
}: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { fieldId, hintId, errorId, aria } = describe({
    name,
    id,
    hint,
    error,
  });
  return (
    <Field {...{ fieldId, label, hint, hintId, error, errorId }}>
      <textarea
        id={fieldId}
        name={name}
        rows={rows}
        className={styles.textarea}
        {...aria}
        {...props}
      />
    </Field>
  );
}

/** Caixa de seleção com o texto como rótulo (ex.: concordância com condições). */
export function CheckboxField({
  label,
  name,
  id,
  error,
  ...props
}: Omit<FieldBase, "hint"> &
  Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const { fieldId, errorId, aria } = describe({ name, id, error });
  return (
    <div className={styles.field}>
      <label className={styles.checkbox} htmlFor={fieldId}>
        <input type="checkbox" id={fieldId} name={name} {...aria} {...props} />
        <span>{label}</span>
      </label>
      {error ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Busca com ícone; o rótulo fica acessível mesmo sem texto visível. */
export function SearchField({
  label,
  name,
  id,
  ...props
}: { label: string; name: string; id?: string } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
>) {
  const fieldId = id ?? `field-${name}`;
  return (
    <label className={styles.search} htmlFor={fieldId}>
      <Search size={18} />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        id={fieldId}
        name={name}
        className={styles.searchInput}
        {...props}
      />
    </label>
  );
}
