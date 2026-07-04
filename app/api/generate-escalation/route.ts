// app/api/generate-escalation/route.ts
// API route to compile and persist escalation packets for SLA-breached cases

import { NextRequest, NextResponse } from "next/server";
import { getCaseRepository, getPersistenceMetadata } from "@/src/lib/repositories/repositoryFactory";
import { CivicProofAgent } from "@/src/lib/agent/civicAgent";
import { getSilenceClock } from "@/src/lib/civic/silenceClock";

import { applyApiRateLimit } from "@/src/lib/infra/rateLimiter";

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await applyApiRateLimit(req, 20, 1);
    if (rateLimit) return NextResponse.json(rateLimit, { status: rateLimit.status });

    const body = await req.json().catch(() => ({}));
    const { caseId, force = false } = body;

    if (!caseId) {
      return NextResponse.json({ success: false, error: "caseId is required." }, { status: 400 });
    }

    const repository = getCaseRepository();
    const issue = await repository.getCaseById(caseId);

    if (!issue) {
      return NextResponse.json({ success: false, error: `Case file ${caseId} not found.` }, { status: 404 });
    }

    // Check Silence Clock SLA Breach eligibility
    const clock = getSilenceClock(issue);
    if (!clock.isOverdue && !force) {
      return NextResponse.json({
        success: false,
        error: `Case is not eligible for escalation. Silence Clock shows only ${clock.daysSilent} days elapsed of the ${clock.slaDays}-day SLA.`,
        clock,
      }, { status: 400 });
    }

    // Call orchestration agent to compile packet with AI and add timeline entry
    const updatedIssue = await CivicProofAgent.compileEscalationPacket(issue);

    // Persist case state
    const savedIssue = await repository.updateCase(caseId, updatedIssue);

    return NextResponse.json({
      success: true,
      case: savedIssue,
      meta: getPersistenceMetadata(),
    });
  } catch (err: any) {
    console.error("POST /api/generate-escalation failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to generate escalation packet.",
        meta: getPersistenceMetadata(),
      },
      { status: 500 }
    );
  }
}
