// app/api/ai/complaint/stream/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateComplaintStream } from "@/src/lib/ai/aiService";
import { applyApiRateLimit } from "@/src/lib/infra/rateLimiter";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await applyApiRateLimit(req, 20, 1);
    if (rateLimit) return NextResponse.json(rateLimit, { status: rateLimit.status });

    const { caseId, title, category, department, gpsString, elapsedDays, analysisText } = await req.json();

    if (!caseId || !title) {
      return NextResponse.json({ error: "Missing required fields for complaint packet" }, { status: 400 });
    }

    const generator = generateComplaintStream(
      caseId,
      title,
      category || "pothole_road_damage",
      department || "BBMP Municipal Ward",
      gpsString || "Confirmed Location",
      elapsedDays || 0,
      analysisText || "Visual and structural civic defect."
    );

    const stream = new ReadableStream({
      async pull(controller) {
        const { value, done } = await generator.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("API Complaint stream post failed:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed to stream complaint packet" }), { status: 500 });
  }
}
