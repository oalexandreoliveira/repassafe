import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getServerEnv } from "@/config/env";
import type { RateLimitPolicy } from "@/features/security/rate-limits";
import { normalizeRateLimitIdentifier } from "@/features/security/rate-limits";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditEvent } from "@/lib/security/audit";

export class RateLimitExceededError extends Error {
  constructor() {
    super("Limite de tentativas excedido");
    this.name = "RateLimitExceededError";
  }
}

export function securityFingerprint(dimension: string, rawIdentifier: string) {
  const { RATE_LIMIT_PEPPER } = getServerEnv();
  const normalized = normalizeRateLimitIdentifier(rawIdentifier);
  return createHash("sha256")
    .update(`${RATE_LIMIT_PEPPER}:${dimension}:${normalized}`)
    .digest("hex");
}

export async function getRequestIp() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function enforceRateLimit(input: {
  policy: RateLimitPolicy;
  identifier: string;
  dimension: string;
  actorId?: string | null;
}) {
  const identifierHash = securityFingerprint(input.dimension, input.identifier);
  const admin = createAdminClient();
  const { error } = await admin.from("rate_limit_checks").insert({
    namespace: input.policy.namespace,
    identifier_hash: identifierHash,
    max_requests: input.policy.maxRequests,
    window_seconds: input.policy.windowSeconds,
  });

  if (!error) return;
  if (error.message.includes("rate_limit_exceeded")) {
    try {
      await recordAuditEvent({
        actorId: input.actorId,
        eventType: "security.rate_limit_exceeded",
        entityType: "security_control",
        metadata: {
          namespace: input.policy.namespace,
          identifier: identifierHash.slice(0, 12),
        },
      });
    } catch {
      // Rate limiting remains effective even if audit storage is unavailable.
    }
    throw new RateLimitExceededError();
  }
  throw new Error("Não foi possível validar o limite de requisições");
}
