import type { InputHTMLAttributes } from "react";
import styles from "./toggle.module.css";

/** Interruptor nativo (checkbox com role="switch"); a linha inteira é o rótulo. */
export function Toggle({
  label,
  name,
  id,
  ...props
}: { label: string; name: string; id?: string } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "role"
>) {
  const fieldId = id ?? `toggle-${name}`;
  return (
    <label className={styles.row} htmlFor={fieldId}>
      <span className={styles.label}>{label}</span>
      <input
        type="checkbox"
        role="switch"
        id={fieldId}
        name={name}
        className={styles.switch}
        {...props}
      />
    </label>
  );
}
