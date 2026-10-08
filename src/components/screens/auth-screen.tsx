import type { ReactNode } from "react";
import {
  AppScreen,
  BrandTopBar,
  ScreenHeading,
} from "@/components/ui/app-shell";
import { InfoBanner } from "@/components/ui/info-banner";
import type { ActionState } from "@/features/auth/schemas";
import styles from "./screens.module.css";

/** Acesso, recuperação, MFA e cadastro (derivadas): logo, título e formulário. */
export function AuthScreen({
  title,
  intro,
  nav,
  children,
}: {
  title: string;
  intro?: ReactNode;
  /** Links à direita do logo (ex.: Painel · Suporte). */
  nav?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AppScreen header={<BrandTopBar>{nav}</BrandTopBar>}>
      <ScreenHeading title={title} />
      {intro ? <p className={styles.intro}>{intro}</p> : null}
      {children}
    </AppScreen>
  );
}

/** Mensagem de retorno de uma action: erro anunciado como alerta, sucesso como status. */
export function ActionFeedback({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return state.status === "error" ? (
    <InfoBanner variant="warning" role="alert">
      {state.message}
    </InfoBanner>
  ) : (
    <InfoBanner role="status">{state.message}</InfoBanner>
  );
}
