// app/api/verify-resolution/route.ts
// API route to verify visual proof of repairs and transition case status

import { NextRequest, NextResponse } from "next/server";
import { getCaseRepository, getPersistenceMetadata } from "@/src/lib/repositories/repositoryFactory";
import { CivicProofAgent } from "@/src/lib/agent/civicAgent";
import { verifyResolutionSmart } from "@/src/lib/ai/aiAdapters";

import { applyApiRateLimit } from "@/src/lib/infra/rateLimiter";

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await applyApiRateLimit(req, 20, 1);
    if (rateLimit) return NextResponse.json(rateLimit, { status: rateLimit.status });

    const body = await req.json().catch(() => ({}));
    const { caseId, afterPhotoUrl, citizenNotes, beforeDescription = "Reported civic hazard" } = body;

    if (!afterPhotoUrl) {
      return NextResponse.json({ success: false, error: "afterPhotoUrl is required." }, { status: 400 });
    }

    const repository = getCaseRepository();

    if (caseId) {
      // Complete end-to-end audit and status transition
      const issue = await repository.getCaseById(caseId);
      if (!issue) {
        return NextResponse.json({ success: false, error: `Case file ${caseId} not found.` }, { status: 404 });
      }

      // Execute photo forensic audit and append timeline logs
      const updatedIssue = await CivicProofAgent.verifyResolution(
        issue,
        afterPhotoUrl,
        citizenNotes || "Visual resolution audit submitted by neighborhood inspector."
      );

      // Persist the updated state (e.g. verified_resolved or keep_open / routed)
      const savedIssue = await repository.updateCase(caseId, updatedIssue);

      return NextResponse.json({
        success: true,
        case: savedIssue,
        meta: getPersistenceMetadata(),
      });
    } else {
      // Preview only mode - run AI analysis without state mutation
      const auditResult = await verifyResolutionSmart(
        beforeDescription,
        afterPhotoUrl,
        citizenNotes || "Visual proof inspection."
      );

      return NextResponse.json({
        success: true,
        verification: auditResult.data,
        meta: getPersistenceMetadata(),
      });
    }
  } catch (err: any) {
    console.error("POST /api/verify-resolution failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to process resolution verification.",
        meta: getPersistenceMetadata(),
      },
      { status: 500 }
    );
  }
}
