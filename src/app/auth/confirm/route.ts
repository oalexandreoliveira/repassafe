import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitPolicies } from "@/features/security/rate-limits";
import { recordAuditEvent } from "@/lib/security/audit";
import {
  enforceRateLimit,
  RateLimitExceededError,
} from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  try {
    await enforceRateLimit({
      policy: rateLimitPolicies.confirmationIp,
      identifier: ip,
      dimension: "ip",
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return NextResponse.redirect(
        new URL("/entrar?erro=confirmacao", request.url),
      );
    }
    throw error;
  }

  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await recordAuditEvent({
        actorId: data.user.id,
        eventType: "auth.email_confirmed",
        entityType: "authentication",
        entityId: data.user.id,
      });
      return NextResponse.redirect(new URL("/painel", request.url));
    }
  }
  return NextResponse.redirect(
    new URL("/entrar?erro=confirmacao", request.url),
  );
}
