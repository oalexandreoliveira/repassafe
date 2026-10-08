import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Link2Off,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  CreateGroupForm,
  GroupCommandForm,
  InviteForm,
  JoinGroupForm,
  RenameGroupForm,
} from "@/components/group-forms";
import {
  AppScreen,
  BrandTopBar,
  ScreenHeading,
  TopBar,
} from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoBanner } from "@/components/ui/info-banner";
import { KeyValueList } from "@/components/ui/key-value-list";
import { PersonRow } from "@/components/ui/person";
import { StatusChip } from "@/components/ui/status-chip";
import { TabBar } from "@/components/ui/tab-bar";
import { Toast } from "@/components/ui/toast";
import { invitePath } from "@/features/groups/invite-path";
import {
  groupKindText,
  groupRoleText,
  inviteUsesText,
  memberCountText,
} from "@/features/groups/labels";
import type {
  GroupDetail,
  GroupOverview,
  GroupSummary,
  InvitePreview,
} from "@/features/groups/types";
import { formatAuditTime, formatShortDate } from "@/features/shifts/format";
import css from "./groups.module.css";
import styles from "./screens.module.css";

const newRequestId = () => globalThis.crypto.randomUUID();

function groupMeta(group: GroupSummary) {
  if (group.kind === "peer")
    return `${groupRoleText[group.role]} · ${memberCountText(group.member_count ?? 0)}`;
  return [
    group.institution_name,
    group.role === "approver" ? groupRoleText.approver : null,
    group.requires_approval
      ? "Com aprovação da coordenação"
      : "Sem aprovação da coordenação",
  ]
    .filter(Boolean)
    .join(" · ");
}

function GroupRow({ group }: { group: GroupSummary }) {
  const Icon = group.kind === "peer" ? Users : Building2;
  return (
    <Link href={`/grupos/${group.id}`} className={css.row}>
      <span className={css.rowIcon} data-kind={group.kind} aria-hidden="true">
        <Icon size={20} />
      </span>
      <span className={css.rowText}>
        <span className={css.rowName}>{group.name}</span>
        <span className={css.rowMeta}>{groupMeta(group)}</span>
      </span>
      {group.active ? null : <StatusChip tone="empty">Arquivado</StatusChip>}
      <ChevronRight size={20} className={css.chevron} aria-hidden="true" />
    </Link>
  );
}

function GroupSection({
  id,
  title,
  groups,
}: {
  id: string;
  title: string;
  groups: GroupSummary[];
}) {
  return (
    <section className={styles.stack} aria-labelledby={id}>
      <h2 id={id} className={styles.sectionTitle}>
        {title}
      </h2>
      <ul className={styles.list}>
        {groups.map((group) => (
          <li key={group.id}>
            <GroupRow group={group} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Meus grupos (derivada): grupos de colegas e institucionais da pessoa. */
export function GroupsScreen({
  overview,
  approved,
  canPublish,
  left = false,
}: {
  overview: GroupOverview;
  approved: boolean;
  canPublish: boolean;
  /** Voltou de "Sair do grupo". */
  left?: boolean;
}) {
  const peer = overview.groups.filter((group) => group.kind === "peer");
  const institutional = overview.groups.filter(
    (group) => group.kind === "institutional",
  );
  return (
    <AppScreen
      header={<TopBar title="Meus grupos" backHref="/perfil" />}
      tabBar={approved ? <TabBar canPublish={canPublish} /> : undefined}
    >
      {left ? <Toast message="Você saiu do grupo." clearParam="saiu" /> : null}
      <p className={styles.intro}>
        Grupos de colegas reúnem médicos com CRM verificado para repassar
        plantões entre vocês, com comprovante do repasse confirmado. Grupos
        institucionais são definidos pela administração.
      </p>
      {overview.eligible ? (
        <ButtonLink href="/grupos/novo" block icon={<Plus size={20} />}>
          Criar grupo de colegas
        </ButtonLink>
      ) : (
        <InfoBanner variant="neutral" icon={ShieldCheck}>
          Para criar ou entrar em grupos de colegas, seu cadastro profissional
          precisa estar aprovado e vigente.
        </InfoBanner>
      )}
      {overview.groups.length === 0 ? (
        <EmptyState icon={Users} title="Você ainda não participa de grupos">
          Crie um grupo de colegas ou peça o link de convite a quem gerencia o
          grupo.
        </EmptyState>
      ) : null}
      {peer.length ? (
        <GroupSection
          id="peer-groups"
          title="Grupos de colegas"
          groups={peer}
        />
      ) : null}
      {institutional.length ? (
        <GroupSection
          id="institutional-groups"
          title="Grupos institucionais"
          groups={institutional}
        />
      ) : null}
    </AppScreen>
  );
}

/** Criar grupo de colegas (derivada de S05: campo único e rodapé com ação). */
export function GroupCreateScreen({
  eligible,
  requestId,
  preview = false,
}: {
  eligible: boolean;
  requestId: string;
  preview?: boolean;
}) {
  return (
    <AppScreen header={<TopBar title="Criar grupo" backHref="/grupos" />}>
      <p className={styles.intro}>
        Você será o gestor: gera os links de convite e cuida de quem participa.
      </p>
      <InfoBanner variant="neutral" icon={Users}>
        Só entram médicos com CRM verificado, pelo link de convite. O grupo não
        exige aprovação da coordenação e não cria vínculo institucional.
      </InfoBanner>
      {eligible ? (
        <CreateGroupForm requestId={requestId} preview={preview} />
      ) : (
        <>
          <InfoBanner variant="warning">
            Seu cadastro profissional precisa estar aprovado e vigente para
            criar grupos.
          </InfoBanner>
          <ButtonLink href="/cadastro/completar" variant="secondary" block>
            Ver meu cadastro
          </ButtonLink>
        </>
      )}
    </AppScreen>
  );
}

function InstitutionalDetail({
  detail,
  canPublish,
}: {
  detail: GroupDetail;
  canPublish: boolean;
}) {
  const { group } = detail;
  return (
    <>
      <KeyValueList
        items={[
          { label: "Instituição", value: group.institution_name ?? "—" },
          {
            label: "Aprovação da coordenação",
            value: group.requires_approval
              ? "Obrigatória antes do registro do acordo"
              : "Dispensada",
          },
          { label: "Seu papel", value: groupRoleText[detail.role] },
        ]}
      />
      <p className={styles.help}>
        Vínculos e aprovadores deste grupo são definidos pela administração do
        Repassafe. Para mudanças, fale com o suporte.
      </p>
      {group.active && canPublish && detail.role === "doctor" ? (
        <ButtonLink
          href={`/plantoes/novo?modo=grupo&grupo=${group.id}`}
          variant="secondary"
          block
        >
          Publicar plantão no grupo
        </ButtonLink>
      ) : null}
    </>
  );
}

function PeerDetail({
  detail,
  canPublish,
  preview,
  previewInvitePath,
}: {
  detail: GroupDetail;
  canPublish: boolean;
  preview: boolean;
  previewInvitePath?: string;
}) {
  const { group } = detail;
  const members = detail.members ?? [];
  const invites = detail.invites ?? [];
  const manager = detail.role === "manager";
  const others = members.filter((member) => !member.is_self);
  const openOffers = detail.open_offers ?? 0;
  return (
    <>
      {group.active && canPublish ? (
        <ButtonLink
          href={`/plantoes/novo?modo=grupo&grupo=${group.id}`}
          variant="secondary"
          block
        >
          Publicar plantão no grupo
        </ButtonLink>
      ) : null}

      {manager && group.active ? (
        <section className={styles.panel} aria-labelledby="invite-heading">
          <h2 id="invite-heading" className={styles.panelTitle}>
            Convidar colegas
          </h2>
          <p className={styles.panelText}>
            Gere um link e compartilhe no grupo do WhatsApp. Quem tem CRM
            verificado entra direto; você recebe um aviso e pode remover quem
            não for do grupo.
          </p>
          <InviteForm
            requestId={newRequestId()}
            groupId={group.id}
            groupName={group.name}
            preview={preview}
            previewInvitePath={previewInvitePath}
            previewExpiresAt={invites[0]?.expires_at}
          />
          {invites.length ? (
            <div className={styles.stack}>
              <h3 className={css.subTitle}>Links ativos</h3>
              <ul className={css.inviteList}>
                {invites.map((invite) => (
                  <li key={invite.id}>
                    <p className={css.inviteText}>
                      Válido até {formatAuditTime(invite.expires_at)}
                      <span className={css.inviteMeta}>
                        Criado em {formatShortDate(invite.created_at)} ·{" "}
                        {inviteUsesText(invite.use_count)}
                      </span>
                    </p>
                    <GroupCommandForm
                      requestId={newRequestId()}
                      groupId={group.id}
                      operation="revoke_invite"
                      fields={{ inviteId: invite.id }}
                      label="Revogar link"
                      question="Revogar este link? Quem ainda não entrou não poderá usá-lo."
                      confirmLabel="Sim, revogar"
                      keepLabel="Manter link"
                      preview={preview}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className={styles.stack} aria-labelledby="members-heading">
        <h2 id="members-heading" className={styles.sectionTitle}>
          Membros
        </h2>
        <ul className={styles.list}>
          {members.map((member) => (
            <li key={member.profile_id}>
              <PersonRow
                label={
                  member.is_self
                    ? `${groupRoleText[member.role]} · você`
                    : groupRoleText[member.role]
                }
                name={member.display_name}
                verified={member.verified}
              />
            </li>
          ))}
        </ul>
      </section>

      {manager && group.active && others.length ? (
        <details className={styles.disclosure}>
          <summary>Gerenciar membros</summary>
          <div className={styles.disclosureBody}>
            {others.map((member) => (
              <div key={member.profile_id} className={css.manage}>
                <p className={css.manageName}>{member.display_name}</p>
                {/* Só quem está com a verificação vigente pode assumir a gestão. */}
                {member.verified ? (
                  <GroupCommandForm
                    requestId={newRequestId()}
                    groupId={group.id}
                    operation="transfer"
                    fields={{ profileId: member.profile_id }}
                    label="Tornar gestor"
                    question={`Passar a gestão para ${member.display_name}? Você continua no grupo como membro.`}
                    confirmLabel="Sim, transferir"
                    variant="secondary"
                    preview={preview}
                  />
                ) : null}
                <GroupCommandForm
                  requestId={newRequestId()}
                  groupId={group.id}
                  operation="remove_member"
                  fields={{ profileId: member.profile_id }}
                  label="Remover do grupo"
                  question={`Remover ${member.display_name}? Os links de convite atuais não servem para voltar.`}
                  confirmLabel="Sim, remover"
                  preview={preview}
                />
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {manager && group.active ? (
        <details className={styles.disclosure}>
          <summary>Renomear grupo</summary>
          <div className={styles.disclosureBody}>
            <RenameGroupForm
              requestId={newRequestId()}
              groupId={group.id}
              name={group.name}
              preview={preview}
            />
          </div>
        </details>
      ) : null}

      {manager && group.active ? (
        <section className={styles.panel} aria-labelledby="archive-heading">
          <h2 id="archive-heading" className={styles.panelTitle}>
            Arquivar grupo
          </h2>
          <p className={styles.panelText}>
            Ninguém mais publica nem entra no grupo, e os links deixam de
            funcionar. Plantões e acordos já registrados continuam disponíveis.
          </p>
          {openOffers ? (
            <InfoBanner variant="warning">
              {openOffers === 1
                ? "Há 1 plantão em aberto no grupo."
                : `Há ${openOffers} plantões em aberto no grupo.`}{" "}
              Conclua ou cancele antes de arquivar.
            </InfoBanner>
          ) : (
            <GroupCommandForm
              requestId={newRequestId()}
              groupId={group.id}
              operation="archive"
              label="Arquivar grupo"
              question={`Arquivar ${group.name}?`}
              confirmLabel="Sim, arquivar"
              keepLabel="Manter grupo"
              variant="secondary"
              preview={preview}
            />
          )}
        </section>
      ) : null}

      {manager && others.length ? (
        <p className={styles.help}>
          Para sair do grupo, transfira antes a gestão a outro membro.
        </p>
      ) : (
        <GroupCommandForm
          requestId={newRequestId()}
          groupId={group.id}
          operation="leave"
          label="Sair do grupo"
          question={
            manager && group.active
              ? "Você é o único membro: sair arquiva o grupo. Continuar?"
              : "Sair do grupo? Você deixa de ver os plantões dele e só volta com um novo convite."
          }
          confirmLabel="Sim, sair"
          keepLabel="Ficar no grupo"
          preview={preview}
        />
      )}
    </>
  );
}

/** Detalhe do grupo (derivada): membros, convites e gestão. */
export function GroupDetailScreen({
  detail,
  approved,
  canPublish,
  notice,
  preview = false,
  previewInvitePath,
}: {
  detail: GroupDetail;
  approved: boolean;
  canPublish: boolean;
  notice?: "created" | "joined";
  preview?: boolean;
  previewInvitePath?: string;
}) {
  const { group } = detail;
  const memberCount = detail.members?.length ?? 0;
  return (
    <AppScreen
      header={<TopBar title={group.name} backHref="/grupos" />}
      tabBar={approved ? <TabBar canPublish={canPublish} /> : undefined}
    >
      {notice === "created" ? (
        <Toast message="Grupo criado." clearParam="criado" />
      ) : notice === "joined" ? (
        <Toast message="Você entrou no grupo." clearParam="entrou" />
      ) : null}
      <p className={css.meta}>
        <span>
          {[
            groupKindText[group.kind],
            group.kind === "peer"
              ? memberCountText(memberCount)
              : group.institution_name,
            detail.role === "manager" ? "Você é o gestor" : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {group.active ? null : <StatusChip tone="empty">Arquivado</StatusChip>}
      </p>
      {notice === "created" && group.active ? (
        <InfoBanner role="status">
          Agora gere um link de convite e compartilhe com os colegas.
        </InfoBanner>
      ) : null}
      {group.active ? null : (
        <InfoBanner variant="neutral">
          Grupo arquivado. Ninguém publica nem entra mais nele; o histórico
          continua disponível.
        </InfoBanner>
      )}
      {group.kind === "peer" ? (
        <PeerDetail
          detail={detail}
          canPublish={canPublish}
          preview={preview}
          previewInvitePath={previewInvitePath}
        />
      ) : (
        <InstitutionalDetail detail={detail} canPublish={canPublish} />
      )}
    </AppScreen>
  );
}

/** Convite por link (derivada): prévia do grupo e entrada direta. */
export function GroupInviteScreen({
  token,
  preview,
  requestId,
  previewMode = false,
}: {
  token: string;
  /** null quando a pessoa não está logada. */
  preview: InvitePreview | null;
  requestId: string;
  previewMode?: boolean;
}) {
  const path = invitePath(token);
  return (
    <AppScreen header={<BrandTopBar />}>
      <ScreenHeading title="Convite para grupo" />
      {preview === null ? (
        <>
          <p className={styles.intro}>
            Você recebeu um convite para um grupo de colegas no Repassafe. Entre
            na sua conta para ver o grupo; depois do login, você volta para este
            convite.
          </p>
          <ButtonLink
            href={`/entrar?proximo=${encodeURIComponent(path)}`}
            block
          >
            Entrar para ver o convite
          </ButtonLink>
          <ButtonLink href="/cadastro" variant="secondary" block>
            Criar conta
          </ButtonLink>
          <p className={styles.help}>
            Sem conta? Depois do cadastro e da verificação do CRM, abra este
            link de novo.
          </p>
        </>
      ) : preview.status === "unavailable" ? (
        <EmptyState
          icon={Link2Off}
          title="Convite indisponível"
          headingLevel="h2"
          action={
            <ButtonLink href="/plantoes" variant="secondary" block>
              Ir para os plantões
            </ButtonLink>
          }
        >
          O link expirou, foi revogado ou atingiu o limite de usos. Peça um novo
          link a quem gerencia o grupo.
        </EmptyState>
      ) : preview.status === "member" ? (
        <>
          <InfoBanner role="status">
            Você já participa de {preview.group_name}.
          </InfoBanner>
          <ButtonLink href={`/grupos/${preview.group_id}`} block>
            Abrir grupo
          </ButtonLink>
        </>
      ) : (
        <>
          <section className={styles.stack} aria-labelledby="invite-group">
            <h2 id="invite-group" className={css.groupName}>
              {preview.group_name}
            </h2>
            <p className={css.meta}>
              {groupKindText.peer} · {memberCountText(preview.member_count)}
            </p>
            {preview.manager_name ? (
              <PersonRow label="Gestor do grupo" name={preview.manager_name} />
            ) : null}
          </section>
          <InfoBanner variant="neutral" icon={ShieldCheck}>
            No grupo, os plantões ficam visíveis só para os membros. Ele não
            exige aprovação da coordenação nem cria vínculo institucional.
          </InfoBanner>
          {preview.status === "open" ? (
            <>
              <p className={styles.help}>
                Convite válido até {formatAuditTime(preview.expires_at)}.
              </p>
              <JoinGroupForm
                requestId={requestId}
                token={token}
                preview={previewMode}
              />
            </>
          ) : (
            <>
              <InfoBanner variant="warning">
                Seu cadastro profissional precisa estar aprovado e vigente para
                entrar. Depois da aprovação, abra este link de novo.
              </InfoBanner>
              <ButtonLink href="/cadastro/completar" variant="secondary" block>
                Ver meu cadastro
              </ButtonLink>
            </>
          )}
        </>
      )}
    </AppScreen>
  );
}
