import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function recordAuditEvent(input: {
  actorId?: string | null;
  eventType: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_events").insert({
    actor_id: input.actorId ?? null,
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? {},
  });
  if (error) throw new Error("Falha ao registrar auditoria");
}
