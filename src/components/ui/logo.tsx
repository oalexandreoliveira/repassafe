import Image from "next/image";

/** Official artwork from design/assets/logo; never redraw the symbol or set the wordmark in type. */
const artwork = {
  horizontal: { src: "/brand/logo-horizontal-cor.svg", ratio: 540.78 / 100 },
  "horizontal-negative": {
    src: "/brand/logo-horizontal-negativo.svg",
    ratio: 540.78 / 100,
  },
  "vertical-negative": {
    src: "/brand/logo-vertical-negativo.svg",
    ratio: 289.42 / 186.28,
  },
  symbol: { src: "/brand/simbolo-cor.svg", ratio: 1 },
  "symbol-negative": { src: "/brand/simbolo-negativo.svg", ratio: 1 },
  /** Below 32px the check is dropped. */
  "symbol-small": { src: "/brand/simbolo-cor-reduzido.svg", ratio: 1 },
} as const;

export type LogoVariant = keyof typeof artwork;

export function Logo({
  variant = "horizontal",
  height = 30,
  alt = "Repassafe",
  priority = false,
  className,
}: {
  variant?: LogoVariant;
  /** Rendered height in px; width follows the artwork ratio. */
  height?: number;
  /** Pass "" when adjacent text already names the brand. */
  alt?: string;
  priority?: boolean;
  className?: string;
}) {
  const { src, ratio } = artwork[variant];
  return (
    <Image
      src={src}
      alt={alt}
      width={Math.round(height * ratio)}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
