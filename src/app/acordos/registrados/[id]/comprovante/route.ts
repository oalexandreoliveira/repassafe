import { NextResponse } from "next/server";
import { z } from "zod";
import { getVerifiedIdentity } from "@/lib/auth/session";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const eventId = new URL(request.url).searchParams.get("evento");
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(eventId).success)
    return new NextResponse(null, { status: 404 });
  const identity = await getVerifiedIdentity();
  if (!identity) return new NextResponse(null, { status: 401 });
  const { data: event } = await identity.supabase
    .from("external_agreement_events")
    .select("payload")
    .eq("id", eventId)
    .eq("agreement_id", id)
    .eq("kind", "payment_reported")
    .maybeSingle();
  const path = event?.payload?.receipt_path;
  if (typeof path !== "string") return new NextResponse(null, { status: 404 });
  const { data, error } = await identity.supabase.storage
    .from("agreement-receipts")
    .download(path);
  if (error || !data) return new NextResponse(null, { status: 404 });
  const extension = path.split(".").pop();
  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": data.type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="comprovante.${["pdf", "png", "jpg"].includes(extension ?? "") ? extension : "bin"}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
