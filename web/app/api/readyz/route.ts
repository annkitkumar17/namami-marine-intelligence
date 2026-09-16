import { NextResponse } from "next/server";

export async function GET() {
  const edgeUrl = process.env.EDGE_INTERNAL_URL || process.env.NEXT_PUBLIC_EDGE_URL || "http://localhost:4000";
  let edge = "not_checked";
  try {
    const res = await fetch(`${edgeUrl}/healthz`, { cache: "no-store" });
    edge = res.ok ? "ok" : "degraded";
  } catch {
    edge = "unavailable";
  }

  const ready = edge !== "unavailable";
  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      service: "namami-web",
      checks: { edge },
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 }
  );
}
