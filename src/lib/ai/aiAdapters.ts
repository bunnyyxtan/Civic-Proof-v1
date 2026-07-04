// src/lib/ai/aiAdapters.ts
// Smart AI adapters with robust fallbacks

import { ReportIntake, AIAnalysisResult, ComplaintPacket, EscalationPacket, ResolutionVerification } from "../civic/types";
import { shouldUseAI, getMultimodalModelName, getTextModelName } from "./modelConfig";
import {
  analyzeReportWithGemini,
  generateComplaintWithGemini,
  generateEscalationWithGemini,
  verifyResolutionWithGemini,
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
    throw new Error("BTL API key is not configured.");
  }

  let rawResult: any;
  try {
    rawResult = await analyzeReportWithGemini(report);
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
    throw new Error("BTL API key is not configured.");
  }

  let rawResult: any;
  try {
    rawResult = await generateComplaintWithGemini(caseId, title, category, department, gpsString, elapsedDays, analysisText);
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
    throw new Error("BTL API key is not configured.");
  }

  let rawResult: any;
  try {
    rawResult = await generateEscalationWithGemini(caseId, title, category, department, gpsString, elapsedDays, analysisText, corroborationCount);
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
    throw new Error("BTL API key is not configured.");
  }

  let rawResult: any;
  try {
    rawResult = await verifyResolutionWithGemini(originalDesc, resolutionPhotoUrl, citizenVerificationNote);
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
