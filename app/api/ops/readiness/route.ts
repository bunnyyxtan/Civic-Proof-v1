// app/api/ops/readiness/route.ts
import { NextResponse } from "next/server";
import { getPersistenceMetadata } from "@/src/lib/repositories/repositoryFactory";
import fs from "fs";
import path from "path";

export async function GET() {
  const diagnostics: Record<string, string> = {
    persistence: getPersistenceMetadata().persistence,
    ai: "not_configured",
    auth: "local",
    rateLimiter: "memory",
    events: "console",
    storage: "unavailable",
  };

  let overallOk = true;

  if (diagnostics.persistence !== "supabase") {
    overallOk = false;
  }

  const gatewayKey = process.env.GATEWAY_API_KEY;
  if (gatewayKey) {
    diagnostics.ai = "configured";
  } else {
    diagnostics.ai = "not_configured";
    overallOk = false;
  }

  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    diagnostics.storage = "local_uploads_ready";
  } catch (err) {
    diagnostics.storage = "read_only_fallback";
  }

  return NextResponse.json({
    ok: overallOk,
    data: {
      ...diagnostics,
      timestamp: new Date().toISOString(),
    },
  });
}
