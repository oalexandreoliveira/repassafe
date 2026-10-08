import type { LucideIcon } from "lucide-react";
import { Building2, CircleAlert, Info, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./info-banner.module.css";

export type InfoBannerVariant = "info" | "warning" | "neutral" | "dark";

const defaultIcons: Record<InfoBannerVariant, LucideIcon> = {
  info: Info,
  warning: CircleAlert,
  neutral: Building2,
  dark: ShieldCheck,
};

/** Aviso contextual. Use as frases fixas de design/DESIGN.md §8 quando houver. */
export function InfoBanner({
  variant = "info",
  icon,
  role,
  children,
}: {
  variant?: InfoBannerVariant;
  /** Substitui o ícone padrão da variante. */
  icon?: LucideIcon;
  /** "status" ou "alert" quando o aviso aparece em resposta a uma ação. */
  role?: "status" | "alert";
  children: ReactNode;
}) {
  const Icon = icon ?? defaultIcons[variant];
  return (
    <div className={`${styles.banner} ${styles[variant]}`} role={role}>
      {variant === "neutral" ? (
        <span className={styles.tile}>
          <Icon size={20} />
        </span>
      ) : (
        <Icon size={18} />
      )}
      <div className={styles.text}>{children}</div>
    </div>
  );
}
