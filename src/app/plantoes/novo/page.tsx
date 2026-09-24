import { randomUUID } from "node:crypto";
import Link from "next/link";
import { publishOfferAction } from "@/app/plantoes/actions";
import { requireApprovedProfessional } from "@/lib/shifts/data";

export default async function NewShiftPage() {
  const identity = await requireApprovedProfessional();
  const { data: memberships } = await identity.supabase
    .from("group_memberships")
    .select("group_id,groups(name)")
    .eq("profile_id", identity.userId)
    .eq("active", true);

  return (
    <main className="shell dashboard">
      <header className="dashboard-header">
        <Link href="/plantoes" className="brand">
          <span aria-hidden="true">R</span> Repassafe
        </Link>
      </header>
      <section className="dashboard-title">
        <div>
          <p className="eyebrow">Novo repasse</p>
          <h1>Publicar plantão</h1>
        </div>
      </section>
      <section className="card form-card">
        <p className="form-help">Datas e horários no fuso de Fortaleza.</p>
        <form action={publishOfferAction} className="form-stack">
          <input type="hidden" name="commandId" value={randomUUID()} />
          <label>
            Grupo
            <select name="groupId" required>
              <option value="">Selecione</option>
              {memberships?.map((membership) => {
                const group = Array.isArray(membership.groups)
                  ? membership.groups[0]
                  : membership.groups;
                return (
                  <option value={membership.group_id} key={membership.group_id}>
                    {group?.name ?? "Grupo"}
                  </option>
                );
              })}
            </select>
          </label>
          <div className="form-row">
            <label>
              Início
              <input type="datetime-local" name="startsAt" required />
            </label>
            <label>
              Término
              <input type="datetime-local" name="endsAt" required />
            </label>
          </div>
          <div className="form-row">
            <label>
              Setor
              <input name="sector" minLength={2} maxLength={120} required />
            </label>
            <label>
              Valor (R$)
              <input
                name="value"
                inputMode="decimal"
                placeholder="1200,00"
                required
              />
            </label>
          </div>
          <label>
            Condições de pagamento
            <input name="paymentTerms" maxLength={300} required />
          </label>
          <label>
            Observações operacionais (sem dados de pacientes)
            <textarea name="notes" maxLength={1000} />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="ownerTermsAcknowledged"
              value="true"
              required
            />
            Confirmo que sou o responsável pela oferta e que os dados e as
            condições informados estão corretos. Se um substituto as aceitar,
            esta proposta será a base do registro do repasse.
          </label>
          <button className="button button-primary" type="submit">
            Publicar plantão
          </button>
        </form>
      </section>
    </main>
  );
}
