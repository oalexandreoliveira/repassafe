import { randomUUID } from "node:crypto";
import Link from "next/link";
import { PublishShiftFields } from "@/components/publish-shift-fields";
import { publishOfferAction } from "@/app/plantoes/actions";
import { requireApprovedProfessional } from "@/lib/shifts/data";
import { Logo } from "@/components/ui/logo";

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
          <Logo priority />
        </Link>
      </header>
      <section className="dashboard-title">
        <div>
          <p className="eyebrow">Novo repasse</p>
          <h1>Publicar plantão</h1>
        </div>
      </section>
      <section className="card form-card">
        <p className="form-help">
          Você pode publicar para um dos seus grupos ou de forma livre para
          todos os profissionais aprovados. Datas e horários no fuso de
          Fortaleza.
        </p>
        <form action={publishOfferAction} className="form-stack">
          <input type="hidden" name="commandId" value={randomUUID()} />
          <PublishShiftFields
            groups={(memberships ?? []).map((membership) => {
              const group = Array.isArray(membership.groups)
                ? membership.groups[0]
                : membership.groups;
              return { id: membership.group_id, name: group?.name ?? "Grupo" };
            })}
          />
        </form>
      </section>
    </main>
  );
}
