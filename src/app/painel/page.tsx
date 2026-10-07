import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  getAdministrativeAccess,
  getVerifiedIdentity,
} from "@/lib/auth/session";
import { logoutAction, markNotificationsReadAction } from "@/app/auth/actions";
import {
  groupRoleLabel,
  profileStatusPresentation,
} from "@/features/admin/labels";
import { formatNotificationTime } from "@/features/shifts/format";
import { notificationPresentation } from "@/components/screens/notifications-list";
import styles from "@/components/screens/screens.module.css";
import {
  AppScreen,
  RootTopBar,
  ScreenHeading,
} from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { InfoBanner } from "@/components/ui/info-banner";
import { KeyValueList } from "@/components/ui/key-value-list";
import { NotificationItem } from "@/components/ui/notification-item";
import { StatusChip } from "@/components/ui/status-chip";
import { SubmitButton } from "@/components/ui/submit-button";
import { TabBar } from "@/components/ui/tab-bar";

/** Portão de status (derivado): cadastro pendente, aprovador ou verificação vencida. */
export default async function DashboardPage() {
  const identity = await getVerifiedIdentity();
  if (!identity) redirect("/entrar");
  const administrativeAccess = await getAdministrativeAccess(identity);

  const [{ data: profile }, { data: memberships }, { data: notifications }] =
    await Promise.all([
      identity.supabase
        .from("profiles")
        .select(
          "display_name,crm_number,crm_state,status,role,verification_notes,verification_valid_until",
        )
        .eq("id", identity.userId)
        .single(),
      identity.supabase
        .from("group_memberships")
        .select("role,groups(name,requires_approval)")
        .eq("profile_id", identity.userId)
        .eq("active", true),
      identity.supabase
        .from("notifications")
        .select("id,event_type,title,body,href,created_at,read_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
  if (!profile || profile.role === "admin") {
    if (administrativeAccess)
      redirect(identity.claims.aal === "aal2" ? "/admin" : "/mfa");
    redirect("/cadastro/completar");
  }
  const canPublish =
    profile.role === "doctor" &&
    profile.status === "approved" &&
    !!profile.verification_valid_until &&
    // eslint-disable-next-line react-hooks/purity -- Server component checks validity once per authenticated request.
    Date.parse(profile.verification_valid_until) > Date.now();
  // Médicos aprovados e com verificação vigente começam no mural (S02).
  if (canPublish) redirect("/plantoes");

  const status = profileStatusPresentation(profile.status);
  const approver = profile.status === "approved" && profile.role === "approver";
  const unread = notifications?.some((notification) => !notification.read_at);
  const now = new Date();

  return (
    <AppScreen
      header={<RootTopBar unread={unread} />}
      tabBar={
        profile.status === "approved" ? (
          <TabBar canPublish={false} />
        ) : undefined
      }
    >
      <ScreenHeading title={`Olá, ${profile.display_name}`} />
      <StatusChip tone={status.tone}>{status.label}</StatusChip>

      {approver ? (
        <section className={styles.panel} aria-labelledby="start-heading">
          <h2 id="start-heading" className={styles.panelTitle}>
            Acompanhe os repasses dos seus grupos
          </h2>
          <p className={styles.panelText}>
            As decisões institucionais dependem do seu vínculo ativo como
            aprovador em cada grupo.
          </p>
          <ButtonLink href="/plantoes" block>
            Abrir central de repasses
          </ButtonLink>
        </section>
      ) : (
        <section className={styles.panel} aria-labelledby="start-heading">
          <h2 id="start-heading" className={styles.panelTitle}>
            {profile.status === "approved"
              ? "Atualize sua verificação profissional"
              : "Continue seu cadastro"}
          </h2>
          <p className={styles.panelText}>
            Acompanhe a análise e confira as orientações da equipe antes de
            realizar repasses.
          </p>
          <ButtonLink href="/cadastro/completar" block>
            Acompanhar cadastro
          </ButtonLink>
        </section>
      )}

      {profile.verification_notes ? (
        <InfoBanner variant="neutral">
          <strong>Orientação da equipe.</strong> {profile.verification_notes}
        </InfoBanner>
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
          ]}
        />
        <ButtonLink href="/cadastro/completar" variant="secondary" block>
          Completar cadastro ou solicitar alteração
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
            Nenhum vínculo ativo. Você ainda pode publicar ofertas livres e
            candidatar-se a elas após a aprovação do cadastro.
          </p>
        )}
      </section>

      {notifications?.length ? (
        <section
          className={styles.stack}
          aria-labelledby="notifications-heading"
        >
          <div className={styles.sectionHeader}>
            <h2 id="notifications-heading" className={styles.sectionTitle}>
              Notificações
            </h2>
          </div>
          <ul className={styles.list}>
            {notifications.slice(0, 5).map((notification) => {
              const { tone, icon } = notificationPresentation(
                notification.event_type,
              );
              return (
                <li key={notification.id}>
                  <NotificationItem
                    tone={tone}
                    icon={icon}
                    title={notification.title}
                    body={notification.body}
                    time={formatNotificationTime(notification.created_at, now)}
                    dateTime={notification.created_at}
                    href={notification.href}
                    unread={!notification.read_at}
                  />
                </li>
              );
            })}
          </ul>
          <ButtonLink href="/notificacoes" variant="secondary" block>
            Ver central completa
          </ButtonLink>
          {unread ? (
            <form action={markNotificationsReadAction}>
              <SubmitButton variant="ghost" block>
                Marcar como lidas
              </SubmitButton>
            </form>
          ) : null}
        </section>
      ) : null}

      <nav className={styles.actions} aria-label="Área do profissional">
        <ButtonLink href="/perfil" variant="secondary" block>
          Meu perfil
        </ButtonLink>
        <ButtonLink href="/historico" variant="secondary" block>
          Meu histórico
        </ButtonLink>
        {administrativeAccess ? (
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
