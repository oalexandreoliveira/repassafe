import type { ShiftStatus } from "@/styles/theme";
import styles from "./status-chip.module.css";

/** Status pill: cor + ponto + rótulo textual (nunca só cor). */
export function StatusChip({
  tone,
  children,
  className = "",
}: {
  tone: ShiftStatus;
  children: string;
  className?: string;
}) {
  return (
    <span
      className={`${styles.chip} ${styles[tone]} ${className}`.trim()}
      data-tone={tone}
    >
      {children}
    </span>
  );
}
