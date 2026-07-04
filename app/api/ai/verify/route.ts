// app/api/ai/verify/route.ts
// Direct API route for forensic photographic resolution verification

import { NextRequest, NextResponse } from "next/server";
import { verifyResolutionSmart } from "@/src/lib/ai/aiAdapters";
import { getCaseRepository } from "@/src/lib/repositories/repositoryFactory";
import { TimelineEvent } from "@/src/lib/civic/types";

import { applyApiRateLimit } from "@/src/lib/infra/rateLimiter";

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await applyApiRateLimit(req, 20, 1);
    if (rateLimit) return NextResponse.json(rateLimit, { status: rateLimit.status });

    const { originalDesc, resolutionPhotoUrl, citizenVerificationNote, caseId } = await req.json();

    if (!resolutionPhotoUrl) {
      return NextResponse.json({ error: "Resolution proof photo is required for verification" }, { status: 400 });
    }

    // Call smart adapter with Zod validation and safe mock fallbacks
    const result = await verifyResolutionSmart(
      originalDesc || "Original reported civic hazard",
      resolutionPhotoUrl,
      citizenVerificationNote || "No verification comments provided."
    );

    // If caseId is provided, perform database synchronization
    if (caseId) {
      try {
        const repository = getCaseRepository();
        const issue = await repository.getCaseById(caseId);
        if (issue) {
          const isResolved = result.data.repairLikely;
          const timelineEvent: TimelineEvent = {
            id: `EV-RESOLVE-${Date.now()}`,
            timestamp: new Date().toISOString(),
            label: "Resolution Audited & Sealed",
            description: isResolved
              ? `Citizen photo audit approved with ${Math.round(result.data.confidence * 100)}% forensic confidence. Sector closed.`
              : `Resolution audit failed. Physical hazards still visible. Case remains active.`,
            type: "resolve",
            actor: "citizen"
          };

          await repository.updateCase(caseId, {
            status: isResolved ? "verified_resolved" : "routed",
            resolutionVerification: result.data,
            timeline: [...issue.timeline, timelineEvent]
          });
        }
      } catch (saveErr) {
        console.warn("Background database update failed during verification:", saveErr);
      }
    }

    // Map to exact format expected by frontend (isResolved, confidence, verificationReasoning)
    return NextResponse.json({
      success: true,
      verification: {
        isResolved: result.data.repairLikely,
        confidence: Math.round(result.data.confidence * 100),
        verificationReasoning: result.data.forensicReasoning || "Forensic photo audit complete.",
      },
      meta: result.meta,
    });
  } catch (err: any) {
    console.error("API Verification post failed:", err);
    return NextResponse.json({ error: err.message || "Failed to verify resolution proof" }, { status: 500 });
  }
}
