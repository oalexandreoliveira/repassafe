import { NextResponse, type NextRequest } from "next/server";
import { getServerEnv } from "@/config/env";
import { hasValidMonitoringToken } from "@/features/operations/readiness";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/observability/logger";

type CheckResult = { status: "ok" | "error"; durationMs: number };

async function withTimeout(
  operation: () => PromiseLike<unknown>,
  timeoutMs = 3000,
): Promise<CheckResult> {
  const startedAt = performance.now();
  try {
    await Promise.race([
      operation(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs),
      ),
    ]);
    return {
      status: "ok",
      durationMs: Math.round(performance.now() - startedAt),
    };
  } catch {
    return {
      status: "error",
      durationMs: Math.round(performance.now() - startedAt),
    };
  }
}

export async function GET(request: NextRequest) {
  const env = getServerEnv();
  if (
    !hasValidMonitoringToken(
      request.headers.get("authorization"),
      env.MONITORING_TOKEN,
    )
  ) {
    return NextResponse.json(
      { status: "unauthorized" },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  const admin = createAdminClient();
  const [database, storage] = await Promise.all([
    withTimeout(async () => {
      const { error } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
    }),
    withTimeout(async () => {
      const { error } = await admin.storage.getBucket("professional-documents");
      if (error) throw error;
    }),
  ]);
  const ready = database.status === "ok" && storage.status === "ok";
  const status = ready ? "ready" : "degraded";

  log(ready ? "info" : "error", "readiness.checked", {
    requestId: request.headers.get("x-request-id"),
    status,
    databaseStatus: database.status,
    storageStatus: storage.status,
    databaseDurationMs: database.durationMs,
    storageDurationMs: storage.durationMs,
  });

  return NextResponse.json(
    {
      status,
      checks: { database, storage },
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow",
      },
    },
  );
}
