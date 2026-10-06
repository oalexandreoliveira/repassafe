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
        new URL("/senha/esqueci?erro=limite", request.url),
      );
    }
    throw error;
  }

  const supabase = await createClient();
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const tokenType = request.nextUrl.searchParams.get("type");
  let userId: string | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) userId = data.user?.id ?? null;
  } else if (tokenHash && tokenType === "recovery") {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    if (!error) userId = data.user?.id ?? null;
  }

  if (userId) {
    await recordAuditEvent({
      actorId: userId,
      eventType: "auth.password_recovery_started",
      entityType: "authentication",
      entityId: userId,
    });
    return NextResponse.redirect(new URL("/senha/nova", request.url));
  }
  return NextResponse.redirect(
    new URL("/senha/esqueci?erro=recuperacao", request.url),
  );
}
