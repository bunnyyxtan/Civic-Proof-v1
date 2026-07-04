// app/api/ai/complaint/route.ts
// Direct API route for formal complaint packet compilation

import { NextRequest, NextResponse } from "next/server";
import { generateComplaintSmart } from "@/src/lib/ai/aiAdapters";

import { applyApiRateLimit } from "@/src/lib/infra/rateLimiter";

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await applyApiRateLimit(req, 20, 1);
    if (rateLimit) return NextResponse.json(rateLimit, { status: rateLimit.status });

    const { caseId, title, category, department, gpsString, elapsedDays, analysisText } = await req.json();

    if (!caseId || !title) {
      return NextResponse.json({ error: "Missing required fields for complaint packet" }, { status: 400 });
    }

    // Call smart adapter with Zod validation and safe mock fallbacks
    const result = await generateComplaintSmart(
      caseId,
      title,
      category || "pothole_road_damage",
      department || "BBMP Municipal Ward",
      gpsString || "Confirmed Location",
      elapsedDays || 0,
      analysisText || "Visual and structural civic defect."
    );

    return NextResponse.json({
      success: true,
      complaintText: result.data.formalBody,
      meta: result.meta,
    });
  } catch (err: any) {
    console.error("API Complaint post failed:", err);
    return NextResponse.json({ error: err.message || "Failed to generate complaint packet" }, { status: 500 });
  }
}
