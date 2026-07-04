// app/api/report/route.ts
// API route to submit citizen report, run duplicate pipeline, and save to repository

import { NextRequest, NextResponse } from "next/server";
import { ReportIntakeSchema } from "@/src/lib/ai/schemas";
import { getCaseRepository, getPersistenceMetadata } from "@/src/lib/repositories/repositoryFactory";
import { CivicProofAgent } from "@/src/lib/agent/civicAgent";
import { processCorroboration } from "@/src/lib/agent/actions";
import { verifyCitizenAuth } from "@/src/lib/auth/verifyAuth";
import { checkRateLimit } from "@/src/lib/infra/rateLimiter";
import { logAuditEvent } from "@/src/lib/infra/auditLog";
import { logDeadLetter } from "@/src/lib/infra/deadLetter";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { report } = body;

  try {
    if (!report) {
      return NextResponse.json({ success: false, error: "Missing 'report' field in request body." }, { status: 400 });
    }

    // 1. Verify citizen identity
    const verifiedCitizen = await verifyCitizenAuth(req);
    const citizenUid = verifiedCitizen?.uid || body.citizenUid || "anonymous_fallback";

    // 2. Apply Rate Limiting (10 reports per hour per user)
    const limitCheck = await checkRateLimit(citizenUid, "report_creation", 10, 1);
    if (!limitCheck.allowed) {
      await logAuditEvent({
        eventType: "rate_limited",
        citizenUid,
        route: "/api/report",
        severity: "warning",
        metadata: { bucket: "report_creation", limit: 10, count: limitCheck.count }
      });
      return NextResponse.json({
        ok: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again shortly."
        }
      }, { status: 429 });
    }

    // Set default reportedAt if missing
    if (!report.reportedAt) {
      report.reportedAt = new Date().toISOString();
    }

    // Validate intake schema
    const validation = ReportIntakeSchema.safeParse(report);
    if (!validation.success) {
      await logDeadLetter({
        route: "/api/report",
        operation: "schema_validation",
        errorMessage: "Invalid report intake schema: " + JSON.stringify(validation.error.issues),
        payload: { report },
        retryable: false,
      });

      return NextResponse.json({
        success: false,
        error: "Invalid report intake schema.",
        details: validation.error.issues,
      }, { status: 400 });
    }

    const intake = validation.data;
    const repository = getCaseRepository();

    // Fetch existing cases for duplicate checks and idempotency
    const existingCases = await repository.listCases();

    // 3. Prevent duplicate creation from identical submission keys (Idempotency)
    const clientSubmissionId = body.clientSubmissionId || report.clientSubmissionId;
    if (clientSubmissionId) {
      const existingIdempotentCase = existingCases.find(
        (c) => c.clientSubmissionId === clientSubmissionId && c.createdByUid === citizenUid
      );

      if (existingIdempotentCase) {
        await logAuditEvent({
          eventType: "report_submitted_idempotency_hit",
          caseId: existingIdempotentCase.id,
          citizenUid,
          route: "/api/report",
          severity: "info",
          metadata: { clientSubmissionId }
        });

        return NextResponse.json({
          success: true,
          case: existingIdempotentCase,
          pipeline: { 
            status: "idempotency_hit", 
            parentCaseId: existingIdempotentCase.id,
            corroborationRecord: null,
            case: existingIdempotentCase
          },
          meta: getPersistenceMetadata(),
        });
      }
    }

    // Log the initiation audit log
    await logAuditEvent({
      eventType: "report_submitted",
      citizenUid,
      route: "/api/report",
      severity: "info",
      metadata: { clientSubmissionId, hasImage: !!intake.imageDataUrl }
    });

    // Run report pipeline
    const pipelineResult = await CivicProofAgent.submitReport(intake, existingCases);

    let finalCase;

    if (pipelineResult.status === "duplicate_linked") {
      const parentId = pipelineResult.parentCaseId;
      const parentCase = await repository.getCaseById(parentId);
      
      if (!parentCase) {
        throw new Error(`Pipeline recommended merge with parent ID ${parentId}, but parent case was not found in database.`);
      }

      // Merge corroboration into parent case using deterministic engine rules
      const updatedCase = processCorroboration(parentCase, pipelineResult.corroborationRecord);
      
      // Update auditing timestamp
      const updatedCaseWithAuditing = {
        ...updatedCase,
        updatedAt: new Date().toISOString(),
      };

      // Update the parent document in the repository
      finalCase = await repository.updateCase(parentId, updatedCaseWithAuditing);
    } else {
      // Create new case file with security identifiers
      const newCaseWithOrigin = { 
        ...pipelineResult.case, 
        dataOrigin: "user_report" as const,
        createdByUid: citizenUid,
        clientSubmissionId: clientSubmissionId || undefined,
        idempotencyKey: clientSubmissionId ? `${citizenUid}:${clientSubmissionId}` : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      finalCase = await repository.createCase(newCaseWithOrigin);
    }

    // 4. Trace the completed action
    await logAuditEvent({
      eventType: pipelineResult.status === "duplicate_linked" ? "corroboration_added" : "case_created",
      caseId: finalCase.id,
      citizenUid,
      route: "/api/report",
      severity: "info",
      metadata: { status: pipelineResult.status }
    });

    return NextResponse.json({
      success: true,
      case: finalCase,
      pipeline: pipelineResult,
      meta: getPersistenceMetadata(),
    });
  } catch (err: any) {
    console.error("POST /api/report failed:", err);

    await logDeadLetter({
      route: "/api/report",
      operation: "process_submission",
      errorMessage: err.message || "Unknown error occurred",
      payload: { body },
      retryable: true,
    });

    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to submit report.",
        meta: getPersistenceMetadata(),
      },
      { status: 500 }
    );
  }
}
