import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdminIdentity } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

import { AdminActionForm } from "@/components/admin-action-form";
import { brazilianStates } from "@/features/registration/schemas";
import { randomUUID } from "node:crypto";
import {
  profileStatusLabel,
  auditEventLabels,
  auditEntityLabels,
} from "@/features/admin/labels";

export async function AdminWorkspace({
  section,
  searchParams,
}: {
  section: "pessoas" | "instituicoes" | "ocorrencias" | "auditoria";
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const q = query.trim().toLocaleLowerCase("pt-BR");
  const status =
    typeof params.status === "string" &&
    Object.hasOwn(profileStatusLabel, params.status)
      ? params.status
      : "all";
  try {
    await requireAdminIdentity();
  } catch {
    redirect("/mfa");
  }

  const admin = createAdminClient();
  const [
    { data: profiles },
    { data: institutions },
    { data: groups },
    { data: memberships },
    { data: auditEvents },
    { data: openOccurrences },
    { data: crmVerifications },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id,display_name,contact_email,crm_number,crm_state,status,role")
      .order("created_at"),
    admin
      .from("institutions")
      .select("id,name")
      .eq("active", true)
      .order("name"),
    admin
      .from("groups")
      .select("id,name,institution_id,requires_approval")
      .eq("active", true)
      .order("name"),
    admin
      .from("group_memberships")
      .select("id,profile_id,group_id,role,active")
      .order("created_at", { ascending: false }),
    admin
      .from("audit_events")
      .select("id,actor_id,event_type,entity_type,entity_id,occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(50),
    admin
      .from("shift_occurrences")
      .select("id,substitution_id,category,description,created_at")
      .eq("status", "open")
      .order("created_at"),
    admin
      .from("crm_verifications")
      .select(
        "id,profile_id,verified_by,crm_name_found,crm_number_checked,crm_state_checked,outcome,source,checked_at,notes",
      )
      .order("checked_at", { ascending: false }),
  ]);
  const latestVerification = new Map<
    string,
    NonNullable<typeof crmVerifications>[number]
  >();
  for (const verification of crmVerifications ?? []) {
    if (!latestVerification.has(verification.profile_id)) {
      latestVerification.set(verification.profile_id, verification);
    }
  }
  const filteredPeople = (profiles ?? []).filter(
    (profile) =>
      profile.role !== "admin" &&
      (status === "all" || profile.status === status) &&
      `${profile.display_name} ${profile.crm_number ?? ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(q),
  );
  const hasMembershipOptions =
    !!groups?.length &&
    !!profiles?.some(
      (profile) => profile.status === "approved" && profile.role !== "admin",
    );
  const pages = Math.max(1, Math.ceil(filteredPeople.length / 15));
  const currentPage = Math.min(
    pages,
    Math.max(1, Number.parseInt(params.page ?? "1") || 1),
  );
  const pageHref = (value: number) =>
    `/admin/pessoas?${new URLSearchParams({ q: query, status, page: String(value) })}`;

  return (
    <main className="admin-content">
      <h1>
        {
          {
            pessoas: "Pessoas e verificações anteriores",
            instituicoes: "Instituições e grupos",
            ocorrencias: "Ocorrências abertas",
            auditoria: "Auditoria",
          }[section]
        }
      </h1>
      {section === "pessoas" || section === "instituicoes" ? (
        <form className="admin-filters">
          <label>
            Buscar por nome
            <input name="q" defaultValue={query} type="search" maxLength={80} />
          </label>
          {section === "pessoas" ? (
            <label>
              Situação
              <select name="status" defaultValue={status}>
                <option value="all">Todas</option>
                {Object.entries(profileStatusLabel).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button className="button button-secondary">Buscar</button>
        </form>
      ) : null}
      {section === "pessoas" ? (
        <>
          <section className="admin-section">
            <p>
              Cadastros com versões e correções devem ser analisados na{" "}
              <Link href="/admin/cadastros">fila de cadastros</Link>. Consulte
              abaixo os perfis e as verificações anteriores.
            </p>
            <p className="form-help">
              {filteredPeople.length} pessoa(s) · Página {currentPage} de{" "}
              {pages}
            </p>
            {!filteredPeople.length ? (
              <p className="empty-state">
                Nenhuma pessoa corresponde aos filtros.
              </p>
            ) : null}
            <div className="admin-list">
              {filteredPeople
                .slice((currentPage - 1) * 15, currentPage * 15)
                .map((profile) => (
                  <details className="admin-record" key={profile.id}>
                    <summary>
                      <h3>{profile.display_name}</h3>
                      <p>
                        CRM {profile.crm_number}/{profile.crm_state} ·{" "}
                        {profile.contact_email}
                      </p>
                      <p className={`status status-${profile.status}`}>
                        {profileStatusLabel[profile.status] ?? profile.status}
                      </p>
                    </summary>
                    <div className="record-detail">
                      {latestVerification.get(profile.id) ? (
                        <div className="form-help">
                          <strong>Consulta anterior:</strong>{" "}
                          {latestVerification.get(profile.id)?.crm_name_found} ·
                          CRM{" "}
                          {
                            latestVerification.get(profile.id)
                              ?.crm_number_checked
                          }
                          /
                          {
                            latestVerification.get(profile.id)
                              ?.crm_state_checked
                          }{" "}
                          · {latestVerification.get(profile.id)?.outcome} ·{" "}
                          {latestVerification.get(profile.id)?.source} ·{" "}
                          {new Date(
                            latestVerification.get(profile.id)!.checked_at,
                          ).toLocaleString("pt-BR")}
                        </div>
                      ) : null}
                      <AdminActionForm
                        actionName="reviewProfileAction"
                        className="form-stack compact-form"
                      >
                        <input
                          type="hidden"
                          name="profileId"
                          value={profile.id}
                        />
                        <label>
                          Decisão
                          <select name="status" defaultValue="" required>
                            <option value="" disabled>
                              Selecione uma decisão
                            </option>
                            <option value="approved">Aprovar</option>
                            <option value="changes_requested">
                              Solicitar correção
                            </option>
                            <option value="rejected">Rejeitar</option>
                            <option value="suspended">Suspender</option>
                          </select>
                        </label>
                        <fieldset className="form-stack">
                          <legend>Evidência da consulta manual do CRM</legend>
                          <label>
                            Nome localizado na fonte oficial
                            <input
                              name="crmNameFound"
                              minLength={2}
                              maxLength={160}
                            />
                          </label>
                          <div className="form-row">
                            <label>
                              CRM consultado
                              <input
                                name="crmNumberChecked"
                                defaultValue={profile.crm_number ?? ""}
                                inputMode="numeric"
                              />
                            </label>
                            <label>
                              UF consultada
                              <select
                                name="crmStateChecked"
                                defaultValue={profile.crm_state ?? ""}
                                required
                              >
                                <option value="" disabled>
                                  Selecione a UF
                                </option>
                                {brazilianStates.map((uf) => (
                                  <option key={uf} value={uf}>
                                    {uf}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <label>
                            Resultado
                            <select name="crmOutcome" defaultValue="" required>
                              <option value="" disabled>
                                Selecione o resultado
                              </option>
                              <option value="verified">
                                Verificado sem divergência
                              </option>
                              <option value="verified_with_note">
                                Verificado com observação
                              </option>
                              <option value="name_divergence">
                                Divergência de nome
                              </option>
                              <option value="number_divergence">
                                Divergência de número
                              </option>
                              <option value="status_incompatible">
                                Situação profissional incompatível
                              </option>
                              <option value="rqe_not_found">
                                RQE não localizado
                              </option>
                              <option value="insufficient_information">
                                Informação insuficiente
                              </option>
                              <option value="source_unavailable">
                                Fonte indisponível
                              </option>
                            </select>
                          </label>
                          <label>
                            Fonte consultada
                            <input
                              name="crmSource"
                              defaultValue="Portal oficial do CRM"
                              maxLength={240}
                            />
                          </label>
                          <label>
                            Observações da consulta
                            <textarea name="crmNotes" maxLength={1000} />
                          </label>
                          <p className="form-help">
                            Para registrar fonte indisponível, informe esse
                            resultado e descreva a tentativa. Não inclua dados
                            de pacientes.
                          </p>
                        </fieldset>
                        <label>
                          Justificativa ou orientação administrativa
                          <textarea name="notes" maxLength={500} />
                        </label>
                        <p className="form-help">
                          Obrigatória para solicitar correção, rejeitar ou
                          suspender. Não registre dados de pacientes.
                        </p>
                        <button className="button button-primary">
                          Registrar decisão
                        </button>
                      </AdminActionForm>
                    </div>
                  </details>
                ))}
            </div>
            {pages > 1 ? (
              <nav className="actions" aria-label="Páginas de pessoas">
                {currentPage > 1 ? (
                  <Link
                    href={pageHref(currentPage - 1)}
                    className="button button-secondary"
                  >
                    Anterior
                  </Link>
                ) : null}
                {currentPage < pages ? (
                  <Link
                    href={pageHref(currentPage + 1)}
                    className="button button-secondary"
                  >
                    Próxima
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </section>
        </>
      ) : null}
      {section === "instituicoes" ? (
        <>
          <section className="dashboard-grid admin-section">
            <div className="card">
              <h2>Nova instituição</h2>
              <AdminActionForm
                actionName="createInstitutionAction"
                className="form-stack"
              >
                <label>
                  Nome
                  <input name="name" required />
                </label>
                <button className="button button-primary">
                  Criar instituição
                </button>
              </AdminActionForm>
            </div>
            <div className="card">
              <h2>Novo grupo</h2>
              <AdminActionForm
                actionName="createGroupAction"
                className="form-stack"
              >
                <label>
                  Instituição
                  <select name="institutionId" required>
                    {institutions?.map((institution) => (
                      <option key={institution.id} value={institution.id}>
                        {institution.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Nome do grupo
                  <input name="name" required />
                </label>
                <label>
                  Aprovação institucional
                  <select name="requiresApproval" defaultValue="true">
                    <option value="true">Obrigatória</option>
                    <option value="false">Dispensada</option>
                  </select>
                </label>
                <button className="button button-primary">Criar grupo</button>
              </AdminActionForm>
            </div>
          </section>

          <section className="card admin-section">
            <h2>Vincular profissional</h2>
            {!hasMembershipOptions ? (
              <p className="form-help">
                Para ativar um vínculo, cadastre um grupo e conclua a aprovação
                profissional na fila de cadastros.
              </p>
            ) : null}
            <AdminActionForm
              actionName="upsertMembershipAction"
              className="form-grid"
            >
              <label>
                Profissional
                <select name="profileId" required>
                  {profiles
                    ?.filter((profile) => profile.status === "approved")
                    ?.filter((profile) => profile.role !== "admin")
                    .map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.display_name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Grupo
                <select name="groupId" required>
                  {groups?.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Papel
                <select name="role" defaultValue="doctor">
                  <option value="doctor">Médico</option>
                  <option value="approver">Aprovador</option>
                </select>
              </label>
              <button
                className="button button-primary"
                disabled={!hasMembershipOptions}
              >
                Ativar vínculo
              </button>
            </AdminActionForm>
          </section>

          <section className="admin-section">
            <h2>Grupos e vínculos ativos</h2>
            <div className="admin-list">
              {groups?.map((group) => (
                <details className="admin-record" key={group.id}>
                  <summary>
                    <h3>{group.name}</h3>
                    <p>
                      {
                        institutions?.find(
                          (item) => item.id === group.institution_id,
                        )?.name
                      }{" "}
                      ·{" "}
                      {group.requires_approval
                        ? "Aprovação institucional obrigatória"
                        : "Aprovação institucional dispensada"}
                    </p>
                  </summary>
                  <div className="record-detail">
                    <AdminActionForm
                      actionName="updateGroupAction"
                      className="form-stack compact-form"
                    >
                      <input type="hidden" name="groupId" value={group.id} />
                      <label>
                        Nome do grupo
                        <input name="name" defaultValue={group.name} required />
                      </label>
                      <label>
                        Exige aprovação institucional
                        <select
                          name="requiresApproval"
                          defaultValue={String(group.requires_approval)}
                        >
                          <option value="true">Sim</option>
                          <option value="false">Não</option>
                        </select>
                      </label>
                      <button className="button button-secondary">
                        Salvar grupo
                      </button>
                    </AdminActionForm>
                    <h4>Profissionais vinculados</h4>
                    {memberships?.filter((item) => item.group_id === group.id)
                      .length ? (
                      <div className="form-stack">
                        {memberships
                          ?.filter((item) => item.group_id === group.id)
                          .map((membership) => {
                            const person = profiles?.find(
                              (profile) => profile.id === membership.profile_id,
                            );
                            return (
                              <AdminActionForm
                                actionName="updateMembershipAction"
                                className="form-grid membership-form"
                                key={membership.id}
                              >
                                <input
                                  type="hidden"
                                  name="membershipId"
                                  value={membership.id}
                                />
                                <p>
                                  {person?.display_name ?? "Profissional"} ·{" "}
                                  {membership.active ? "Ativo" : "Inativo"}
                                </p>
                                <label>
                                  Papel
                                  <select
                                    name="role"
                                    defaultValue={membership.role}
                                  >
                                    <option value="doctor">Médico</option>
                                    <option value="approver">Aprovador</option>
                                  </select>
                                </label>
                                <label>
                                  Vínculo
                                  <select
                                    name="active"
                                    defaultValue={String(membership.active)}
                                  >
                                    <option value="true">Ativo</option>
                                    <option value="false">Inativo</option>
                                  </select>
                                </label>
                                <button className="button button-secondary">
                                  Atualizar vínculo
                                </button>
                              </AdminActionForm>
                            );
                          })}
                      </div>
                    ) : (
                      <p>Nenhum vínculo cadastrado para este grupo.</p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        </>
      ) : null}
      {section === "ocorrencias" ? (
        <section className="admin-section">
          <p>
            Registre uma decisão para encerrar cada ocorrência. Não inclua dados
            de pacientes.
          </p>
          {openOccurrences?.length ? (
            <div className="admin-list">
              {openOccurrences.map((occurrence) => (
                <article className="card" key={occurrence.id}>
                  <p>
                    <strong>{occurrence.category}</strong> ·{" "}
                    {new Date(occurrence.created_at).toLocaleString("pt-BR")}
                  </p>
                  <p>{occurrence.description}</p>
                  <p>Substituição {occurrence.substitution_id.slice(0, 8)}</p>
                  <AdminActionForm
                    actionName="reviewOccurrenceAction"
                    className="form-stack compact-form"
                  >
                    <input
                      type="hidden"
                      name="commandId"
                      value={randomUUID()}
                    />
                    <input
                      type="hidden"
                      name="targetId"
                      value={occurrence.id}
                    />
                    <label>
                      Decisão administrativa
                      <textarea
                        name="decision"
                        minLength={10}
                        maxLength={2000}
                        required
                      />
                    </label>
                    <button className="button button-primary">
                      Encerrar ocorrência
                    </button>
                  </AdminActionForm>
                </article>
              ))}
            </div>
          ) : (
            <p>Nenhuma ocorrência aberta.</p>
          )}
        </section>
      ) : null}
      {section === "auditoria" ? (
        <section className="admin-section">
          <p className="form-help">
            Eventos imutáveis. A consulta administrativa exige sessão MFA AAL2.
          </p>
          <div
            className="audit-table"
            role="region"
            aria-label="Auditoria recente"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Evento</th>
                  <th>Entidade</th>
                  <th>Ator</th>
                </tr>
              </thead>
              <tbody>
                {auditEvents?.map((event) => (
                  <tr key={event.id}>
                    <td>
                      {new Date(event.occurred_at).toLocaleString("pt-BR")}
                    </td>
                    <td>
                      {auditEventLabels[event.event_type] ??
                        "Evento registrado"}
                      <details>
                        <summary className="form-help">
                          Identificador técnico
                        </summary>
                        <code>{event.event_type}</code>
                      </details>
                    </td>
                    <td>
                      {auditEntityLabels[event.entity_type] ?? "Registro"}
                      {event.entity_id
                        ? ` · ${event.entity_id.slice(0, 8)}`
                        : ""}
                    </td>
                    <td>
                      {profiles?.find(
                        (profile) => profile.id === event.actor_id,
                      )?.display_name ??
                        (event.actor_id
                          ? `Equipe · ${event.actor_id.slice(0, 8)}`
                          : "Sistema")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}
