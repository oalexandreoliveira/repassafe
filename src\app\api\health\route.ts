import { NextResponse } from "next/server";
export function GET() { return NextResponse.json({ status: "ok", environment: process.env.APP_ENV ?? "development", timestamp: new Date().toISOString() }, { headers: { "cache-control": "no-store" } }); }
