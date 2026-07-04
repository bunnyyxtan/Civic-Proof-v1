// app/api/run-report-pipeline/route.ts
// API route to dry-run report ingestion pipeline without persisting updates

import { NextRequest, NextResponse } from "next/server";
import { ReportIntakeSchema } from "@/src/lib/ai/schemas";
import { getCaseRepository, getPersistenceMetadata } from "@/src/lib/repositories/repositoryFactory";
import { CivicProofAgent } from "@/src/lib/agent/civicAgent";

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ success: false, error: "Unauthorized. Server configuration error." }, { status: 500 });
    }
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.substring(7) !== cronSecret) {
      return NextResponse.json({ success: false, error: "Unauthorized. Valid CRON_SECRET is required." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { report } = body;

    if (!report) {
      return NextResponse.json({ success: false, error: "Missing 'report' field." }, { status: 400 });
    }

    if (!report.reportedAt) {
      report.reportedAt = new Date().toISOString();
    }

    const validation = ReportIntakeSchema.safeParse(report);
    if (!validation.success) {
       return NextResponse.json({
         success: false,
         error: "Invalid report schema.",
         details: validation.error.issues,
       }, { status: 400 });
    }

    const intake = validation.data;
    const repository = getCaseRepository();
    const existingCases = await repository.listCases();

    // Execute pipeline only, no database save
    const pipelineResult = await CivicProofAgent.submitReport(intake, existingCases);

    return NextResponse.json({
      success: true,
      pipeline: pipelineResult,
      meta: getPersistenceMetadata(),
    });
  } catch (err: any) {
    console.error("POST /api/run-report-pipeline failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to dry-run report pipeline.",
        meta: getPersistenceMetadata(),
      },
      { status: 500 }
    );
  }
}
