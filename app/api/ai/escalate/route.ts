// app/api/ai/escalate/route.ts
// Direct API route for formal escalation packet compilation

import { NextRequest, NextResponse } from "next/server";
import { generateEscalationSmart } from "@/src/lib/ai/aiAdapters";
import { getCaseRepository } from "@/src/lib/repositories/repositoryFactory";
import { TimelineEvent } from "@/src/lib/civic/types";

import { applyApiRateLimit } from "@/src/lib/infra/rateLimiter";

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await applyApiRateLimit(req, 20, 1);
    if (rateLimit) return NextResponse.json(rateLimit, { status: rateLimit.status });

    const { caseId, title, category, department, gpsString, elapsedDays, analysisText, corroborationCount } = await req.json();

    if (!caseId || !title) {
      return NextResponse.json({ error: "Missing required fields for escalation packet" }, { status: 400 });
    }

    // Call smart adapter with Zod validation and safe mock fallbacks
    const result = await generateEscalationSmart(
      caseId,
      title,
      category || "pothole_road_damage",
      department || "Municipal Ward",
      gpsString || "Confirmed Location",
      elapsedDays || 7,
      analysisText || "Severe unaddressed public safety hazard.",
      corroborationCount || 1
    );

    // Persist to the database if the case exists
    try {
      const repository = getCaseRepository();
      const issue = await repository.getCaseById(caseId);
      if (issue) {
        const escalationPacket = {
          escalationReason: "SLA Silence Breach",
          daysSilent: elapsedDays || 7,
          slaBreached: true,
          unresolvedEvidence: [analysisText || "Severe unaddressed public safety hazard."],
          communityCorroborationSummary: `${corroborationCount || 1} neighbor signatures compiled.`,
          formalBody: result.data.formalBody,
          generatedAt: new Date().toISOString()
        };
        const timelineEvent: TimelineEvent = {
          id: `EV-ESC-${Date.now()}`,
          timestamp: new Date().toISOString(),
          label: "Official Negligence Escalation",
          description: "Administrative grievance filed to Commissioner & Ombudsman under RTI Clause.",
          type: "escalate",
          actor: "community"
        };
        await repository.updateCase(caseId, {
          status: "escalated",
          escalationPacket,
          timeline: [...issue.timeline, timelineEvent]
        });
      }
    } catch (saveErr) {
      console.warn("Background database update failed during escalation compile:", saveErr);
    }

    return NextResponse.json({
      success: true,
      escalationText: result.data.formalBody,
      meta: result.meta,
    });
  } catch (err: any) {
    console.error("API Escalation post failed:", err);
    return NextResponse.json({ error: err.message || "Failed to generate escalation packet" }, { status: 500 });
  }
}
