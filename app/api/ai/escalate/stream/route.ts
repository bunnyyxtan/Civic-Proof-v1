// app/api/ai/escalate/stream/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateEscalationStream } from "@/src/lib/ai/aiService";
import { applyApiRateLimit } from "@/src/lib/infra/rateLimiter";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await applyApiRateLimit(req, 20, 1);
    if (rateLimit) return NextResponse.json(rateLimit, { status: rateLimit.status });

    const { caseId, title, category, department, gpsString, elapsedDays, analysisText, corroborationCount } = await req.json();

    if (!caseId || !title) {
      return NextResponse.json({ error: "Missing required fields for escalation packet" }, { status: 400 });
    }

    const generator = generateEscalationStream(
      caseId,
      title,
      category || "pothole_road_damage",
      department || "Municipal Ward",
      gpsString || "Confirmed Location",
      elapsedDays || 7,
      analysisText || "Severe unaddressed public safety hazard.",
      corroborationCount || 1
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
    console.error("API Escalation stream post failed:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed to stream escalation packet" }), { status: 500 });
  }
}
