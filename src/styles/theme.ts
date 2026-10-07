/**
 * Repassafe — tema em TypeScript (v2.1).
 * Para stacks sem CSS (React Native / Expo, Flutter via conversão) ou para tipar um ThemeProvider.
 * Valores idênticos a tokens.css. Tamanhos em px (= dp no mobile).
 */
export const colors = {
  ink: "#0E2A3B",
  ink2: "#173B50",
  teal: "#0F7C78",
  tealDark: "#0B5E5B",
  mint: "#8EE0CC",
  mist: "#D9F1EC",
  base: "#F6F8F7",
  white: "#FFFFFF",
  light: "#E9F5F2",
  amber: "#F2B544",
  text: "#0E2A3B",
  textBody: "#1E3A47",
  textSecondary: "#33454F",
  textMuted: "#4A5B66",
  textOnDark: "#FFFFFF",
  textOnDarkMuted: "#B9C7CF",
  border: "#DCE3E1",
  divider: "#EDF1F0",
  track: "#E3EAE8",
  neutral100: "#F1F4F3",
  neutral200: "#E3E9EE",
  disabled: "#C9D4D1",
} as const;

export type ShiftStatus =
  | "open"
  | "pending"
  | "institutional"
  | "confirmed"
  | "registered"
  | "cancelled"
  | "empty";

export const status: Record<
  ShiftStatus,
  { bg: string; fg: string; dot: string }
> = {
  open: { bg: "#D9F1EC", fg: "#0B5E5B", dot: "#0F7C78" },
  pending: { bg: "#FCEBC7", fg: "#6E4300", dot: "#D99A1E" },
  institutional: { bg: "#E3E9EE", fg: "#33454F", dot: "#5E7383" },
  confirmed: { bg: "#D9F1EC", fg: "#0B5E5B", dot: "#0F7C78" },
  registered: { bg: "#0E2A3B", fg: "#FFFFFF", dot: "#8EE0CC" },
  cancelled: { bg: "#FBE3E1", fg: "#8E2A22", dot: "#C2453A" },
  empty: { bg: "#F1F4F3", fg: "#4A5B66", dot: "#9AAAB3" },
};

export const fonts = {
  display: "Sora",
  body: "Figtree",
  mono: "JetBrains Mono",
} as const;

export const type = {
  display: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: -1.32,
  },
  h1: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.52,
  },
  h1Sm: {
    fontFamily: fonts.display,
    fontWeight: "700",
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.44,
  },
  h2: {
    fontFamily: fonts.display,
    fontWeight: "600",
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.18,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontWeight: "600",
    fontSize: 17,
    lineHeight: 22,
  },
  body: {
    fontFamily: fonts.body,
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 24,
  },
  bodySm: {
    fontFamily: fonts.body,
    fontWeight: "400",
    fontSize: 15,
    lineHeight: 21,
  },
  label: {
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fonts.body,
    fontWeight: "500",
    fontSize: 13,
    lineHeight: 18,
  },
  micro: {
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: fonts.body,
    fontWeight: "600",
    fontSize: 16,
    lineHeight: 20,
  },
  mono: {
    fontFamily: fonts.mono,
    fontWeight: "400",
    fontSize: 12,
    lineHeight: 20,
  },
} as const;

export const radius = {
  xs: 7,
  sm: 11,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
  icon: 12,
} as const;
export const space = {
  1: 4,
  2: 8,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  gutter: 20,
  card: 16,
  stack: 14,
} as const;
export const size = {
  touchMin: 44,
  button: 52,
  buttonSm: 44,
  input: 50,
  tabBar: 80,
  iconButton: 44,
} as const;
export const shadow = {
  fab: {
    shadowColor: "#0E2A3B",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;
export const motion = { fast: 120, base: 180, easing: [0.2, 0, 0, 1] as const };

export const theme = {
  colors,
  status,
  fonts,
  type,
  radius,
  space,
  size,
  shadow,
  motion,
};
export default theme;
