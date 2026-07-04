// app/api/cases/route.ts
// API endpoint to fetch and persist civic cases in the active repository

import { NextRequest, NextResponse } from "next/server";
import { getCaseRepository, getPersistenceMetadata } from "@/src/lib/repositories/repositoryFactory";
import { mapCaseToIssue } from "@/src/lib/store";
import { saveImageLocally } from "@/src/lib/civic/imageStorage";
import { verifyCitizenAuth } from "@/src/lib/auth/verifyAuth";
import { checkRateLimit } from "@/src/lib/infra/rateLimiter";
import { logAuditEvent } from "@/src/lib/infra/auditLog";

function buildPersistenceMeta() {
  const meta = getPersistenceMetadata();
  return {
    source: meta.persistence,
    degraded: meta.persistence.includes("_fallback"),
    ...(meta.error ? { error: meta.error } : {}),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeDemo = searchParams.get("includeDemo") === "true";

    const repository = getCaseRepository();
    const allCases = await repository.listCases();

    // Filter out judge_demo records unless includeDemo is explicitly requested
    const filteredCases = includeDemo
      ? allCases
      : allCases.filter(c => c.dataOrigin !== "judge_demo");

    return NextResponse.json({
      ok: true,
      success: true,
      cases: filteredCases,
      meta: buildPersistenceMeta(),
    });
  } catch (err: any) {
    console.error("GET /api/cases failed:", err);
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: {
          code: "STORAGE_UNAVAILABLE",
          message: "Civic record storage is unavailable right now. Please try again."
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { case: civicCase } = body;

    if (!civicCase) {
      return NextResponse.json({ success: false, ok: false, error: "Missing 'case' field." }, { status: 400 });
    }

    // 1. Token Verification & Fallback Identity
    const verifiedCitizen = await verifyCitizenAuth(req);
    const citizenUid = verifiedCitizen?.uid || body.citizenUid || "anonymous_fallback";

    // 2. Protect with Rate Limiting (30 sync requests per hour per user)
    const limitCheck = await checkRateLimit(citizenUid, "case_sync", 30, 1);
    if (!limitCheck.allowed) {
      await logAuditEvent({
        eventType: "rate_limited",
        citizenUid,
        route: "/api/cases",
        severity: "warning",
        metadata: { bucket: "case_sync", limit: 30 }
      });
      return NextResponse.json({
        ok: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again shortly."
        }
      }, { status: 429 });
    }

    const repository = getCaseRepository();
    // Translate the client-side UI object structure into the strictly-typed domain issue model
    const issue = mapCaseToIssue(civicCase);

    // Attach tracking details
    issue.createdByUid = citizenUid;
    if (issue.clientSubmissionId) {
      issue.idempotencyKey = `${citizenUid}:${issue.clientSubmissionId}`;
    }
    if (!issue.createdAt) {
      issue.createdAt = new Date().toISOString();
    }
    issue.updatedAt = new Date().toISOString();

    // Defense-in-depth: Ensure any base64 media is written to durable storage rather than stored inline
    if (issue.evidence.photoUrl && issue.evidence.photoUrl.startsWith("data:")) {
      issue.evidence.photoUrl = await saveImageLocally(issue.evidence.photoUrl);
    }

    if (issue.corroborations && Array.isArray(issue.corroborations)) {
      for (const corr of issue.corroborations) {
        if (corr.imageDataUrl && corr.imageDataUrl.startsWith("data:")) {
          corr.imageDataUrl = await saveImageLocally(corr.imageDataUrl);
        }
      }
    }

    let savedIssue;
    const existing = await repository.getCaseById(issue.id);
    if (existing) {
      // Retain the existing createdByUid to prevent session hijack updates
      if (existing.createdByUid) {
        issue.createdByUid = existing.createdByUid;
      }
      savedIssue = await repository.updateCase(issue.id, issue);
    } else {
      savedIssue = await repository.createCase(issue);
    }

    await logAuditEvent({
      eventType: "case_synced",
      caseId: savedIssue.id,
      citizenUid,
      route: "/api/cases",
      severity: "info",
      metadata: { isNew: !existing }
    });

    return NextResponse.json({
      success: true,
      ok: true,
      case: savedIssue,
      meta: buildPersistenceMeta(),
    });
  } catch (err: any) {
    console.error("POST /api/cases sync failed:", err);
    return NextResponse.json(
      {
        success: false,
        ok: false,
        error: {
          code: "STORAGE_UNAVAILABLE",
          message: "Civic record storage is unavailable right now. Please try again."
        }
      },
      { status: 500 }
    );
  }
}
