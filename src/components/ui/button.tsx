import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";
export type ButtonSize = "md" | "sm";

type Appearance = {
  variant?: ButtonVariant;
  /** md = 52px (rodapé), sm = 44px (dentro de cartão). */
  size?: ButtonSize;
  /** Largura total. */
  block?: boolean;
  /** Ícone à esquerda (20px, aria-hidden). */
  icon?: ReactNode;
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  block = false,
  loading = false,
  className = "",
}: Appearance & { loading?: boolean; className?: string }) {
  return [
    "button",
    `button-${variant}`,
    size === "sm" && "button-sm",
    block && "button-block",
    loading && "button-loading",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function Content({
  icon,
  loading,
  children,
}: {
  icon?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      {loading ? (
        <LoaderCircle className="button-spinner" size={18} aria-hidden="true" />
      ) : (
        icon
      )}
      {children}
    </>
  );
}

export function Button({
  variant,
  size,
  block,
  icon,
  loading = false,
  className,
  disabled,
  children,
  ...props
}: Appearance &
  ComponentProps<"button"> & {
    /** Mantém as cores da variante, desabilita o botão e mostra o spinner. */
    loading?: boolean;
  }) {
  return (
    <button
      className={buttonClassName({ variant, size, block, loading, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      <Content icon={icon} loading={loading}>
        {children}
      </Content>
    </button>
  );
}

/** Navegação com aparência de botão (mantém o papel de link). */
export function ButtonLink({
  variant,
  size,
  block,
  icon,
  className,
  children,
  ...props
}: Appearance & ComponentProps<typeof Link>) {
  return (
    <Link
      className={buttonClassName({ variant, size, block, className })}
      {...props}
    >
      <Content icon={icon}>{children}</Content>
    </Link>
  );
}
