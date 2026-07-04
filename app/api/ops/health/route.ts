// app/api/ops/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      app: "CivicProof",
      status: "alive",
      timestamp: new Date().toISOString(),
    },
  });
}
