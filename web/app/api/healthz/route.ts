import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "namami-web",
    data_mode: process.env.NEXT_PUBLIC_DATA_MODE || "FIXTURE",
    timestamp: new Date().toISOString(),
  });
}
