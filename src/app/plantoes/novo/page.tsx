import { randomUUID } from "node:crypto";
import Link from "next/link";
import { PublishShiftFields } from "@/components/publish-shift-fields";
import { publishOfferAction } from "@/app/plantoes/actions";
import { requireApprovedProfessional } from "@/lib/shifts/data";

export default async function NewShiftPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string }>;
}) {
  const { modo } = await searchParams;
  const mode = modo === "grupo" ? "group" : modo === "livre" ? "free" : "both";
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
          <h1>
            {mode === "group"
              ? "Publicar plantão em grupo"
              : mode === "free"
                ? "Publicar plantão livre"
                : "Publicar plantão"}
          </h1>
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
            mode={mode}
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
