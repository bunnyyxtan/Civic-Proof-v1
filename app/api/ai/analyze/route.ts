// app/api/ai/analyze/route.ts
// Direct high-fidelity API route for on-site report analysis

import { NextRequest, NextResponse } from "next/server";
import { analyzeReportSmart } from "@/src/lib/ai/aiAdapters";
import { calculateHarmScore, routeToDepartment, generateCaseId, CivicCase } from "@/src/lib/civic/engine";
import { ReportIntake } from "@/src/lib/civic/types";
import { saveImageLocally } from "@/src/lib/civic/imageStorage";
import { verifyCitizenAuth } from "@/src/lib/auth/verifyAuth";
import { checkRateLimit } from "@/src/lib/infra/rateLimiter";
import { logAuditEvent } from "@/src/lib/infra/auditLog";
import { logDeadLetter } from "@/src/lib/infra/deadLetter";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { 
    photoUrl, 
    voiceTranscript, 
    userNotes, 
    gps, 
    isVulnerable, 
    voiceMode, 
    manualCategory, 
    citizenUid: bodyCitizenUid,
    locationShortLabel,
    formattedAddress,
    locality,
    city,
    state,
    country,
    geolocationCapturedAt
  } = body;

  try {
    if (!photoUrl) {
      return NextResponse.json({ error: "photoUrl is required for evidence analysis" }, { status: 400 });
    }

    // 1. Token Verification & Fallback Identity
    const verifiedCitizen = await verifyCitizenAuth(req);
    const citizenUid = verifiedCitizen?.uid || bodyCitizenUid || "anonymous_fallback";

    // 2. Protect with Rate Limiting (30 AI requests per hour per user)
    const limitCheck = await checkRateLimit(citizenUid, "ai_generation", 30, 1);
    if (!limitCheck.allowed) {
      await logAuditEvent({
        eventType: "rate_limited",
        citizenUid,
        route: "/api/ai/analyze",
        severity: "warning",
        metadata: { bucket: "ai_generation", limit: 30, count: limitCheck.count }
      });
      return NextResponse.json({
        ok: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again shortly."
        }
      }, { status: 429 });
    }

    // Save image locally to get a lightweight static url
    const localPhotoUrl = await saveImageLocally(photoUrl);

    // Audit request initiation
    await logAuditEvent({
      eventType: "evidence_analysis_requested",
      citizenUid,
      route: "/api/ai/analyze",
      severity: "info",
      metadata: { hasNotes: !!userNotes, hasVoice: !!voiceTranscript }
    });

    // Adapt to domain schema input (pass original image to Gemini for full high-fidelity analysis)
    const intake: ReportIntake = {
      imageDataUrl: photoUrl,
      locationName: gps?.address || "Location detected nearby",
      latitude: gps?.latitude,
      longitude: gps?.longitude,
      citizenNote: userNotes || voiceTranscript,
      reportedAt: new Date().toISOString(),
    };

    // Run AI analysis with strict safety limits and validation
    const smartResult = await analyzeReportSmart(intake);
    const analysis = smartResult.data;
    
    // Override category if manually selected
    const effectiveCategory = manualCategory && manualCategory !== 'other' && manualCategory !== 'auto-detect' 
      ? manualCategory 
      : analysis.normalizedCategory;

    // Map domain category back to frontend-compatible categories
    let mappedCategory: CivicCase["category"] = "Pothole & Road Damage";
    if (effectiveCategory === "water_leakage") {
      mappedCategory = "Water Overflow";
    } else if (effectiveCategory === "road_damage") {
      mappedCategory = "Pothole & Road Damage";
    } else if (effectiveCategory === "waste_management") {
      mappedCategory = "Garbage Dump";
    } else if (effectiveCategory === "streetlight") {
      mappedCategory = "Traffic & Footpath Obstruction";
    }

    // Create a new unique case ID
    const caseId = generateCaseId();
    const routedDept = routeToDepartment(mappedCategory);

    // Calculate deterministic harm score
    const finalVulnerable = isVulnerable || (analysis.severity === "high" || analysis.severity === "critical");
    const { score, breakdown } = calculateHarmScore(mappedCategory, new Date().toISOString(), 1, finalVulnerable);

    // Map severity to standard 1-10 scale for legacy UI compatibility
    let mappedSeverityNum = 5;
    if (analysis.severity === "low") mappedSeverityNum = 3;
    else if (analysis.severity === "medium") mappedSeverityNum = 6;
    else if (analysis.severity === "high") mappedSeverityNum = 8;
    else if (analysis.severity === "critical") mappedSeverityNum = 10;

    // Build the complete CivicCase output matching frontend requirements exactly
    const newCase: CivicCase = {
      id: caseId,
      title: analysis.suggestedTitle || "Unspecified Civic Defect",
      description: userNotes || analysis.civicSummary || "No description provided by citizen.",
      voiceTranscript: voiceTranscript || undefined,
      voiceMode: voiceMode || undefined,
      category: mappedCategory,
      department: routedDept,
      gps: gps || { latitude: 0, longitude: 0, address: "Location not detected" },
      locationAccuracyMeters: body.locationAccuracyMeters ?? gps?.accuracyMeters,
      locationConfirmedByUser: body.locationConfirmedByUser ?? gps?.confirmedByUser ?? false,
      locationSource: body.locationSource || (gps ? "gps" : "unknown"),
      locationShortLabel: locationShortLabel || body.locationShortLabel || gps?.locationShortLabel || undefined,
      formattedAddress: formattedAddress || body.formattedAddress || gps?.formattedAddress || undefined,
      locality: locality || body.locality || gps?.locality || undefined,
      city: city || body.city || gps?.city || undefined,
      state: state || body.state || gps?.state || undefined,
      country: country || body.country || gps?.country || undefined,
      geolocationCapturedAt: geolocationCapturedAt || body.geolocationCapturedAt || gps?.geolocationCapturedAt || undefined,
      photoUrl: localPhotoUrl,
      filedAt: new Date().toISOString(),
      status: "FILED",
      harmScore: score,
      harmScoreBreakdown: breakdown,
      corroborations: [
        {
          id: `CORR-01-${Date.now()}`,
          filedAt: new Date().toISOString(),
          type: "angle",
          contributorName: "You (Original Reporter)",
        }
      ],
      timeline: [
        {
          id: `EV-01-${Date.now()}`,
          timestamp: new Date().toISOString(),
          title: "Case Evidence Filed",
          description: `Citizen evidence logged with on-site geotagged proof. AI identified ${mappedCategory} with severity level ${mappedSeverityNum}/10.`,
          type: "file",
          actorName: "You"
        },
        {
          id: `EV-02-${Date.now()}`,
          timestamp: new Date().toISOString(),
          title: "Routed to Department",
          description: `CivicProof engine routed this file to ${routedDept} under standard citizen charter SLA.`,
          type: "route"
        }
      ],
      complaintPacket: null,
      escalationPacket: null,
      resolutionReasoning: null,
      resolvedAt: null,
      authorityLastSeenAt: null
    };

    // Audit completion
    await logAuditEvent({
      eventType: "evidence_analyzed",
      caseId,
      citizenUid,
      route: "/api/ai/analyze",
      severity: "info",
      metadata: { category: mappedCategory, suggestedTitle: analysis.suggestedTitle }
    });

    // Return exact signature expected by the frontend
    return NextResponse.json({
      success: true,
      case: newCase,
      analysis: {
        headline: analysis.suggestedTitle,
        analysisText: analysis.civicSummary + "\n\n" + (analysis.riskFactors.length ? "Risk Factors:\n" + analysis.riskFactors.map(r => `• ${r}`).join("\n") : ""),
        estimatedSeverity: mappedSeverityNum,
        category: mappedCategory,
        isVulnerableArea: finalVulnerable,
        corroborationPhrase: analysis.harmSignals[0] || "Pedestrian hazard detected. Stand together to verify this block.",
      },
      meta: smartResult.meta
    });

  } catch (err: any) {
    console.error("API Analyze post failed:", err);

    await logDeadLetter({
      route: "/api/ai/analyze",
      operation: "evidence_analysis",
      errorMessage: err.message || "Unknown error occurred",
      payload: { voiceTranscript, userNotes, gps },
      retryable: true,
    });

    return NextResponse.json({ error: err.message || "Failed to analyze evidence" }, { status: 500 });
  }
}
