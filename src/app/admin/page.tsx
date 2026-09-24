import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdminIdentity } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createGroupAction,
  createInstitutionAction,
  reviewProfileAction,
  upsertMembershipAction,
} from "@/app/admin/actions";
import { reviewOccurrenceAction } from "@/app/plantoes/actions";
import { randomUUID } from "node:crypto";
import { profileStatusLabel } from "@/features/admin/labels";

export default async function AdminPage() {
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
    { data: auditEvents },
    { data: openOccurrences },
    { data: crmVerifications },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id,display_name,contact_email,crm_number,crm_state,status")
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

  return (
    <main className="shell dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Administração protegida por MFA</p>
          <h1>Operação do piloto</h1>
        </div>
        <Link href="/painel" className="button button-secondary">
          Voltar ao painel
        </Link>
        <Link href="/admin/operacao" className="button button-primary">
          Consulta operacional
        </Link>
      </header>

      <section className="admin-section">
        <h2>Verificação profissional</h2>
        <div className="admin-list">
          {profiles
            ?.filter((profile) =>
              ["pending", "changes_requested"].includes(profile.status),
            )
            .map((profile) => (
              <article className="card" key={profile.id}>
                <h3>{profile.display_name}</h3>
                <p>
                  CRM {profile.crm_number}/{profile.crm_state} ·{" "}
                  {profile.contact_email}
                </p>
                <p className={`status status-${profile.status}`}>
                  {profileStatusLabel[profile.status] ?? profile.status}
                </p>
                {latestVerification.get(profile.id) ? (
                  <div className="form-help">
                    <strong>Consulta anterior:</strong>{" "}
                    {latestVerification.get(profile.id)?.crm_name_found} · CRM{" "}
                    {latestVerification.get(profile.id)?.crm_number_checked}/
                    {latestVerification.get(profile.id)?.crm_state_checked} ·{" "}
                    {latestVerification.get(profile.id)?.outcome} ·{" "}
                    {latestVerification.get(profile.id)?.source} ·{" "}
                    {new Date(
                      latestVerification.get(profile.id)!.checked_at,
                    ).toLocaleString("pt-BR")}
                  </div>
                ) : null}
                <form
                  action={reviewProfileAction}
                  className="form-stack compact-form"
                >
                  <input type="hidden" name="profileId" value={profile.id} />
                  <label>
                    Decisão
                    <select name="status" defaultValue="approved">
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
                        <input
                          name="crmStateChecked"
                          defaultValue={profile.crm_state ?? ""}
                          maxLength={2}
                        />
                      </label>
                    </div>
                    <label>
                      Resultado
                      <select name="crmOutcome" defaultValue="verified">
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
                      Para registrar fonte indisponível, informe esse resultado
                      e descreva a tentativa. Não inclua dados de pacientes.
                    </p>
                  </fieldset>
                  <label>
                    Justificativa ou orientação administrativa
                    <textarea name="notes" maxLength={500} />
                  </label>
                  <p className="form-help">
                    Obrigatória para solicitar correção, rejeitar ou suspender.
                    Não registre dados de pacientes.
                  </p>
                  <button className="button button-primary">
                    Registrar decisão
                  </button>
                </form>
              </article>
            ))}
        </div>
      </section>

      <section className="dashboard-grid admin-section">
        <div className="card">
          <h2>Nova instituição</h2>
          <form action={createInstitutionAction} className="form-stack">
            <label>
              Nome
              <input name="name" required />
            </label>
            <button className="button button-primary">Criar instituição</button>
          </form>
        </div>
        <div className="card">
          <h2>Novo grupo</h2>
          <form action={createGroupAction} className="form-stack">
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
          </form>
        </div>
      </section>

      <section className="card admin-section">
        <h2>Vincular profissional</h2>
        <form action={upsertMembershipAction} className="form-grid">
          <label>
            Profissional
            <select name="profileId" required>
              {profiles
                ?.filter((profile) => profile.status === "approved")
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
          <button className="button button-primary">Ativar vínculo</button>
        </form>
      </section>

      <section className="card admin-section">
        <h2>Ocorrências abertas</h2>
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
                <form
                  action={reviewOccurrenceAction}
                  className="form-stack compact-form"
                >
                  <input type="hidden" name="commandId" value={randomUUID()} />
                  <input type="hidden" name="targetId" value={occurrence.id} />
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
                </form>
              </article>
            ))}
          </div>
        ) : (
          <p>Nenhuma ocorrência aberta.</p>
        )}
      </section>

      <section className="card admin-section">
        <h2>Auditoria recente</h2>
        <p className="form-help">
          Eventos imutáveis. A consulta administrativa exige sessão MFA AAL2.
        </p>
        <div
          className="audit-table"
          role="region"
          aria-label="Auditoria recente"
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
                  <td>{new Date(event.occurred_at).toLocaleString("pt-BR")}</td>
                  <td>{event.event_type}</td>
                  <td>
                    {event.entity_type}
                    {event.entity_id ? ` · ${event.entity_id.slice(0, 8)}` : ""}
                  </td>
                  <td>{event.actor_id?.slice(0, 8) ?? "sistema"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
