import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/auth/actions";
import {
  AppScreen,
  RootTopBar,
  ScreenHeading,
} from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { InfoBanner } from "@/components/ui/info-banner";
import { KeyValueList } from "@/components/ui/key-value-list";
import { StatusChip } from "@/components/ui/status-chip";
import { SubmitButton } from "@/components/ui/submit-button";
import { TabBar } from "@/components/ui/tab-bar";
import styles from "@/components/screens/screens.module.css";
import {
  groupRoleLabel,
  profileStatusPresentation,
} from "@/features/admin/labels";
import {
  getAdministrativeAccess,
  getVerifiedIdentity,
} from "@/lib/auth/session";
import { hasUnreadNotifications } from "@/lib/notifications";

export default async function ProfilePage() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");

  const [{ data: profile }, { data: memberships }, unread, administrative] =
    await Promise.all([
      identity.supabase
        .from("profiles")
        .select(
          "display_name,crm_number,crm_state,status,role,verification_notes,verification_valid_until,rqe_verified",
        )
        .eq("id", identity.userId)
        .maybeSingle(),
      identity.supabase
        .from("group_memberships")
        .select("role,groups(name)")
        .eq("profile_id", identity.userId)
        .eq("active", true),
      hasUnreadNotifications(identity.supabase),
      getAdministrativeAccess(identity),
    ]);

  if (!profile) redirect("/cadastro/completar");

  const status = profileStatusPresentation(profile.status);
  const validUntil = profile.verification_valid_until
    ? new Date(profile.verification_valid_until)
    : null;
  // eslint-disable-next-line react-hooks/purity -- Server component checks validity once per authenticated request.
  const expired = Boolean(validUntil && validUntil.getTime() <= Date.now());
  const approved = profile.status === "approved";

  return (
    <AppScreen
      header={<RootTopBar unread={unread} />}
      tabBar={
        approved ? <TabBar canPublish={profile.role === "doctor"} /> : undefined
      }
    >
      <ScreenHeading
        title="Meu perfil"
        subtitle="Seus dados profissionais, situação cadastral e vínculos."
      />
      <StatusChip tone={status.tone}>{status.label}</StatusChip>

      <InfoBanner variant={expired ? "warning" : "neutral"} role="status">
        Verificação profissional:{" "}
        {validUntil
          ? `${expired ? "venceu em" : "válida até"} ${validUntil.toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza" })}`
          : "sem habilitação vigente"}
        . RQE: {profile.rqe_verified ? "conferido" : "não conferido"}.
        {expired
          ? " Reenvie o cadastro para iniciar novos repasses. Seu histórico continua disponível."
          : null}
      </InfoBanner>

      {profile.verification_notes ? (
        <section className={styles.panel} aria-labelledby="guidance-heading">
          <h2 id="guidance-heading" className={styles.panelTitle}>
            Orientação da equipe
          </h2>
          <p className={styles.panelText}>{profile.verification_notes}</p>
        </section>
      ) : null}

      <section className={styles.stack} aria-labelledby="professional-heading">
        <h2 id="professional-heading" className={styles.sectionTitle}>
          Dados profissionais
        </h2>
        <KeyValueList
          items={[
            { label: "Nome profissional", value: profile.display_name },
            {
              label: "CRM",
              value: `${profile.crm_number ?? "Não informado"} / ${profile.crm_state ?? "—"}`,
            },
            {
              label: "Tipo de acesso",
              value:
                profile.role === "admin" ? "Administrador" : "Profissional",
            },
          ]}
        />
        <ButtonLink href="/cadastro/completar" variant="secondary" block>
          Gerenciar cadastro
        </ButtonLink>
      </section>

      <section className={styles.stack} aria-labelledby="groups-heading">
        <h2 id="groups-heading" className={styles.sectionTitle}>
          Grupos ativos
        </h2>
        {memberships?.length ? (
          <KeyValueList
            items={memberships.map((membership, index) => {
              const group = Array.isArray(membership.groups)
                ? membership.groups[0]
                : membership.groups;
              return {
                label: group?.name ?? `Grupo ${index + 1}`,
                value: groupRoleLabel[membership.role] ?? membership.role,
              };
            })}
          />
        ) : (
          <p className={styles.help}>
            Você não possui vínculos ativos com grupos.
          </p>
        )}
        <ButtonLink href="/grupos" variant="secondary" block>
          Meus grupos
        </ButtonLink>
      </section>

      <nav className={styles.actions} aria-label="Informações da conta">
        <ButtonLink href="/historico" variant="secondary" block>
          Meu histórico
        </ButtonLink>
        <ButtonLink href="/notificacoes" variant="secondary" block>
          Notificações
        </ButtonLink>
        {administrative ? (
          <ButtonLink
            href={identity.claims.aal === "aal2" ? "/admin" : "/mfa"}
            variant="secondary"
            block
          >
            {identity.claims.aal === "aal2"
              ? "Abrir administração"
              : "Configurar MFA administrativo"}
          </ButtonLink>
        ) : null}
      </nav>

      <form action={logoutAction}>
        <SubmitButton variant="ghost" block icon={<LogOut size={20} />}>
          Sair
        </SubmitButton>
      </form>
    </AppScreen>
  );
}
