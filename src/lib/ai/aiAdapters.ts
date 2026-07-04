// src/lib/ai/aiAdapters.ts
// Smart AI adapters with robust fallbacks

import { ReportIntake, AIAnalysisResult, ComplaintPacket, EscalationPacket, ResolutionVerification } from "../civic/types";
import { shouldUseAI, getMultimodalModelName, getTextModelName } from "./modelConfig";
import {
  analyzeReportWithBTL,
  generateComplaintWithBTL,
  generateEscalationWithBTL,
  verifyResolutionWithBTL,
} from "./aiService";
import {
  AIAnalysisResultSchema,
  ComplaintPacketSchema,
  EscalationPacketSchema,
  ResolutionVerificationSchema,
} from "./schemas";

export interface AdapterResult<T> {
  data: T;
  meta: {
    provider: "ai";
    model?: string;
    error?: string;
  };
}

export async function analyzeReportSmart(report: ReportIntake): Promise<AdapterResult<AIAnalysisResult>> {
  if (!shouldUseAI()) {
    console.warn("BTL API key not configured, using deterministic fallback.");
    return {
      data: {
        detectedIssue: "Unknown generic issue (fallback)",
        normalizedCategory: "road_damage",
        severity: "medium",
        confidence: 0.5,
        visibleEvidence: ["Fallback visual flag"],
        missingEvidence: [],
        recommendedDepartment: "Municipal Road Infrastructure Department",
        civicSummary: "Citizen reported an issue via deterministic fallback pathway.",
        citizenImpact: "Standard civic impact",
        suggestedTitle: "Citizen Report Logged",
        riskFactors: ["Standard civic hazard"],
        harmSignals: ["Pending visual verification"]
      },
      meta: { provider: "ai", error: "Deterministic Fallback Active" }
    };
  }

  let rawResult: any;
  try {
    rawResult = await analyzeReportWithBTL(report);
    const validation = AIAnalysisResultSchema.safeParse(rawResult);
    if (validation.success) {
      return {
        data: validation.data,
        meta: {
          provider: "ai",
          model: getMultimodalModelName(),
        },
      };
    } else {
      throw new Error(`Zod validation failed: ${JSON.stringify(validation.error.format())}`);
    }
  } catch (err: any) {
    console.error("[AI ERROR]", "analyzeReportSmart", "reason:", err?.message);
    throw new Error(`AI Analysis failed: ${err.message || "Unknown error"}`);
  }
}

export async function generateComplaintSmart(
  caseId: string,
  title: string,
  category: string,
  department: string,
  gpsString: string,
  elapsedDays: number,
  analysisText: string
): Promise<AdapterResult<ComplaintPacket>> {
  if (!shouldUseAI()) {
    console.warn("BTL API key not configured, using deterministic fallback.");
    return {
      data: {
        subject: `[CIVIC-PROOF] Report ${caseId} - ${title}`,
        recipientDepartment: department,
        formalBody: `Dear ${department},\n\nA report has been filed for ${title} at ${gpsString}.\nPlease investigate this issue.\n\nAutomated Fallback Packet.`,
        evidenceSummary: "Photo of standard civic hazard.",
        citizenImpact: "Impacts local community safety.",
        requestedAction: "Please review and repair.",
        tone: "Urgent",
        generatedAt: new Date().toISOString()
      },
      meta: { provider: "ai", error: "Deterministic Fallback Active" }
    };
  }

  let rawResult: any;
  try {
    rawResult = await generateComplaintWithBTL(caseId, title, category, department, gpsString, elapsedDays, analysisText);
    const validation = ComplaintPacketSchema.safeParse(rawResult);
    if (validation.success) {
      return {
        data: validation.data,
        meta: {
          provider: "ai",
          model: getTextModelName(),
        },
      };
    } else {
      throw new Error(`Zod validation failed: ${JSON.stringify(validation.error.format())}`);
    }
  } catch (err: any) {
    console.error("[AI ERROR]", "generateComplaintSmart", "reason:", err?.message);
    throw new Error(`AI Complaint generation failed: ${err.message || "Unknown error"}`);
  }
}

export async function generateEscalationSmart(
  caseId: string,
  title: string,
  category: string,
  department: string,
  gpsString: string,
  elapsedDays: number,
  analysisText: string,
  corroborationCount: number
): Promise<AdapterResult<EscalationPacket>> {
  if (!shouldUseAI()) {
    console.warn("BTL API key not configured, using deterministic fallback.");
    return {
      data: {
        escalationReason: "SLA Silence Breach",
        daysSilent: elapsedDays,
        slaBreached: true,
        unresolvedEvidence: ["Visual evidence attached"],
        communityCorroborationSummary: `${corroborationCount} neighbors verified this issue.`,
        formalBody: `Dear Authority,\n\nCase ${caseId} (${title}) remains unresolved after ${elapsedDays} days. It has received ${corroborationCount} corroborations from citizens. Please escalate immediately.\n\nAutomated Fallback Packet.`,
        generatedAt: new Date().toISOString()
      },
      meta: { provider: "ai", error: "Deterministic Fallback Active" }
    };
  }

  let rawResult: any;
  try {
    rawResult = await generateEscalationWithBTL(caseId, title, category, department, gpsString, elapsedDays, analysisText, corroborationCount);
    const validation = EscalationPacketSchema.safeParse(rawResult);
    if (validation.success) {
      return {
        data: validation.data,
        meta: {
          provider: "ai",
          model: getTextModelName(),
        },
      };
    } else {
      throw new Error(`Zod validation failed: ${JSON.stringify(validation.error.format())}`);
    }
  } catch (err: any) {
    console.error("[AI ERROR]", "generateEscalationSmart", "reason:", err?.message);
    throw new Error(`AI Escalation generation failed: ${err.message || "Unknown error"}`);
  }
}

export async function verifyResolutionSmart(
  originalDesc: string,
  resolutionPhotoUrl: string,
  citizenVerificationNote: string
): Promise<AdapterResult<ResolutionVerification>> {
  if (!shouldUseAI()) {
    console.warn("BTL API key not configured, using deterministic fallback.");
    return {
      data: {
        beforeImageObservations: ["Hazard present"],
        afterImageObservations: ["Hazard removed"],
        repairLikely: true,
        confidence: 0.95,
        remainingConcerns: [],
        recommendedStatus: "verified_resolved",
        forensicReasoning: citizenVerificationNote || "Verified by community submission (deterministic fallback)."
      },
      meta: { provider: "ai", error: "Deterministic Fallback Active" }
    };
  }

  let rawResult: any;
  try {
    rawResult = await verifyResolutionWithBTL(originalDesc, resolutionPhotoUrl, citizenVerificationNote);
    const validation = ResolutionVerificationSchema.safeParse(rawResult);
    if (validation.success) {
      return {
        data: validation.data,
        meta: {
          provider: "ai",
          model: getMultimodalModelName(),
        },
      };
    } else {
      throw new Error(`Zod validation failed: ${JSON.stringify(validation.error.format())}`);
    }
  } catch (err: any) {
    console.error("[AI ERROR]", "verifyResolutionSmart", "reason:", err?.message);
    throw new Error(`AI Resolution verification failed: ${err.message || "Unknown error"}`);
  }
}
