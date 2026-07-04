// src/lib/ai/aiService.ts
// Direct Gemini API invocation handlers

import fs from "fs";
import path from "path";
import { getBTLClient } from "./btlClient";
import { getMultimodalModelName, getTextModelName } from "./modelConfig";
import { ReportIntake, AIAnalysisResult, ComplaintPacket, EscalationPacket, ResolutionVerification } from "../civic/types";
import { extractJson } from "./aiJson";
import {
  buildAnalysisPrompt,
  buildComplaintPrompt,
  buildComplaintLetterPrompt,
  buildEscalationPrompt,
  buildEscalationLetterPrompt,
  buildResolutionPrompt,
} from "./prompts";
import { ISSUE_CATEGORIES } from "../civic/constants";
import { AI_TIMEOUTS } from "./aiTimeouts";

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`AI Timeout: ${label} exceeded ${ms}ms`)), ms)
    )
  ]);
}

// Helper to load image inline data for Gemini supporting data URLs, remote URLs, and local files
async function getImagePart(url: string): Promise<{ mimeType: string; data: string } | null> {
  if (!url) return null;

  if (url.startsWith("data:image/")) {
    try {
      const parts = url.split(",");
      if (parts.length < 2) return null;
      const meta = parts[0];
      const base64 = parts[1];
      const mimeType = meta.split(";")[0].split(":")[1] || "image/jpeg";
      return { mimeType, data: base64 };
    } catch (err) {
      console.error("getImagePart failed for base64:", err);
      return null;
    }
  }

  if (url.startsWith("http")) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = res.headers.get("content-type") || "image/jpeg";
        return {
          mimeType,
          data: buffer.toString("base64"),
        };
      }
    } catch (err) {
      console.error("getImagePart failed to fetch remote url:", url, err);
      return null;
    }
  }

  if (url.startsWith("/")) {
    try {
      const filePath = path.join(process.cwd(), "public", url);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        let mimeType = "image/jpeg";
        if (ext === ".png") mimeType = "image/png";
        else if (ext === ".gif") mimeType = "image/gif";
        else if (ext === ".webp") mimeType = "image/webp";
        return {
          mimeType,
          data: buffer.toString("base64"),
        };
      }
    } catch (err) {
      console.error("getImagePart failed to read local file:", url, err);
    }
  }

  return null;
}

export async function analyzeReportWithGemini(report: ReportIntake): Promise<AIAnalysisResult> {
  const ai = getBTLClient();
  const contextText = `Citizen note: "${report.citizenNote || 'None'}". Reported location: "${report.locationName}". Category choice: "${report.selectedCategory || 'None'}".`;
  
  const categoriesList = Object.keys(ISSUE_CATEGORIES);
  const prompt = buildAnalysisPrompt(contextText, categoriesList);

  const imagePart = report.imageDataUrl ? await getImagePart(report.imageDataUrl) : null;
  const contentArray: any[] = [];
  contentArray.push({ type: "text", text: prompt });

  if (imagePart) {
    contentArray.push({
      type: "image_url",
      image_url: {
        url: `data:${imagePart.mimeType};base64,${imagePart.data}`,
      }
    });
  }

  const response = await withTimeout(
    ai.chat.completions.create({
      model: getMultimodalModelName(),
      messages: [
        { role: "system", content: "You are CivicProof AI, a structured civic evidence analysis agent." },
        { role: "user", content: contentArray }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    }),
    AI_TIMEOUTS.reportAnalysis,
    "Report Analysis"
  );

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("No response text returned from AI during report analysis.");
  }

  let rawJson;
  try {
    rawJson = extractJson(text);
  } catch (e) {
    console.error(`[AI RAW PARSE FAIL] analyze:`, (text || "").slice(0, 1000));
    throw e;
  }
  
  // Clean up and map to guarantee all properties exist
  return {
    detectedIssue: rawJson.detectedIssue || "Undetermined reported issue",
    normalizedCategory: rawJson.normalizedCategory || "road_damage",
    severity: rawJson.severity || "medium",
    confidence: typeof rawJson.confidence === "number" ? rawJson.confidence : 0.90,
    visibleEvidence: Array.isArray(rawJson.visibleEvidence) ? rawJson.visibleEvidence : ["Visual report"],
    riskFactors: Array.isArray(rawJson.riskFactors) ? rawJson.riskFactors : ["General municipal risk"],
    missingEvidence: Array.isArray(rawJson.missingEvidence) ? rawJson.missingEvidence : [],
    recommendedDepartment: rawJson.recommendedDepartment || "BBMP Municipal Ward",
    civicSummary: rawJson.civicSummary || "Civic defect registered near ward coordinates.",
    citizenImpact: rawJson.citizenImpact || "General pedestrian movement restricted.",
    suggestedTitle: rawJson.suggestedTitle || "Grievance Report",
    harmSignals: Array.isArray(rawJson.harmSignals) ? rawJson.harmSignals : ["Safety risk"],
  };
}

export async function generateComplaintWithGemini(
  caseId: string,
  title: string,
  category: string,
  department: string,
  gpsString: string,
  elapsedDays: number,
  analysisText: string
): Promise<ComplaintPacket> {
  const ai = getBTLClient();
  const prompt = buildComplaintPrompt(caseId, title, category, department, gpsString, elapsedDays, analysisText);

  let response;
  try {
    response = await withTimeout(
      ai.chat.completions.create({
        model: getTextModelName(),
        messages: [
          { role: "system", content: "You are CivicProof AI. Draft formal public-facing Complaint Packets." },
          { role: "user", content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.5,
      }),
      AI_TIMEOUTS.complaintPacket,
      "Complaint Packet Generation"
    );
  } catch (err: any) {
    console.error("BTL Gateway Error in generateComplaint:", err.status, err.message, err.response?.data || err.error || err);
    throw err;
  }

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("No complaint text returned from AI.");
  }

  let rawJson;
  try {
    rawJson = extractJson(text);
  } catch (e) {
    console.error(`[AI RAW PARSE FAIL] complaint:`, (text || "").slice(0, 1000));
    throw e;
  }

  const allowedTones = ["formal", "urgent", "escalation_ready"];
  const toneValue = allowedTones.includes(rawJson.tone) ? rawJson.tone : (elapsedDays >= 7 ? "urgent" : "formal");
  const generatedAtValue = (typeof rawJson.generatedAt === "string" && rawJson.generatedAt) ? rawJson.generatedAt : new Date().toISOString();

  return {
    recipientDepartment: String(rawJson.recipientDepartment || department),
    subject: String(rawJson.subject || `Formal Petition: Pavement Safety — ${caseId}`),
    formalBody: rawJson.formalBody !== undefined ? String(rawJson.formalBody) : (undefined as any),
    evidenceSummary: String(rawJson.evidenceSummary || "Evidentiary context compiled."),
    citizenImpact: String(rawJson.citizenImpact || "Local citizens and transit are actively endangered."),
    requestedAction: String(rawJson.requestedAction || "Conduct on-site repair dispatch within 48 hours."),
    tone: toneValue as "formal" | "urgent" | "escalation_ready",
    generatedAt: generatedAtValue,
  };
}

export async function generateEscalationWithGemini(
  caseId: string,
  title: string,
  category: string,
  department: string,
  gpsString: string,
  elapsedDays: number,
  analysisText: string,
  corroborationCount: number
): Promise<EscalationPacket> {
  const ai = getBTLClient();
  const prompt = buildEscalationPrompt(caseId, title, category, department, gpsString, elapsedDays, analysisText, corroborationCount);

  let response;
  try {
    response = await withTimeout(
      ai.chat.completions.create({
        model: getTextModelName(),
        messages: [
          { role: "system", content: "You are CivicProof AI. Draft official Escalation Packets for ignored civic issues." },
          { role: "user", content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.5,
      }),
      AI_TIMEOUTS.escalationPacket,
      "Escalation Packet Generation"
    );
  } catch (err: any) {
    console.error("BTL Gateway Error in generateEscalation:", err.status, err.message, err.response?.data || err.error || err);
    throw err;
  }

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("No escalation text returned from AI.");
  }

  let rawJson;
  try {
    rawJson = extractJson(text);
  } catch (e) {
    console.error(`[AI RAW PARSE FAIL] escalation:`, (text || "").slice(0, 1000));
    throw e;
  }

  const generatedAtValue = (typeof rawJson.generatedAt === "string" && rawJson.generatedAt) ? rawJson.generatedAt : new Date().toISOString();
  const parsedDays = Number(rawJson.daysSilent);
  
  return {
    escalationReason: String(rawJson.escalationReason || `Unaddressed municipal negligence over ${elapsedDays} days.`),
    daysSilent: !isNaN(parsedDays) ? parsedDays : elapsedDays,
    slaBreached: typeof rawJson.slaBreached === "boolean" ? rawJson.slaBreached : true,
    unresolvedEvidence: Array.isArray(rawJson.unresolvedEvidence) ? rawJson.unresolvedEvidence.map(String) : ["Outstanding hazard"],
    communityCorroborationSummary: String(rawJson.communityCorroborationSummary || `Signed by ${corroborationCount} neighborhood citizens.`),
    formalBody: rawJson.formalBody !== undefined ? String(rawJson.formalBody) : (undefined as any),
    generatedAt: generatedAtValue,
  };
}

export async function verifyResolutionWithGemini(
  originalDesc: string,
  resolutionPhotoUrl: string,
  citizenVerificationNote: string
): Promise<ResolutionVerification> {
  const ai = getBTLClient();
  const prompt = buildResolutionPrompt(originalDesc, citizenVerificationNote);

  const contentArray: any[] = [];
  contentArray.push({ type: "text", text: prompt });

  const imagePart = resolutionPhotoUrl ? await getImagePart(resolutionPhotoUrl) : null;
  if (imagePart) {
    contentArray.push({
      type: "image_url",
      image_url: {
        url: `data:${imagePart.mimeType};base64,${imagePart.data}`,
      }
    });
  }

  const response = await withTimeout(
    ai.chat.completions.create({
      model: getMultimodalModelName(),
      messages: [
        { role: "system", content: "You are CivicProof AI, a forensic civic auditor." },
        { role: "user", content: contentArray }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
    }),
    AI_TIMEOUTS.resolutionVerification,
    "Resolution Verification"
  );

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("No verification response from AI.");
  }

  const rawJson = extractJson(text);

  return {
    beforeImageObservations: Array.isArray(rawJson.beforeImageObservations) ? rawJson.beforeImageObservations : [],
    afterImageObservations: Array.isArray(rawJson.afterImageObservations) ? rawJson.afterImageObservations : [],
    repairLikely: typeof rawJson.repairLikely === "boolean" ? rawJson.repairLikely : true,
    confidence: typeof rawJson.confidence === "number" ? rawJson.confidence : 0.95,
    remainingConcerns: Array.isArray(rawJson.remainingConcerns) ? rawJson.remainingConcerns : [],
    recommendedStatus: rawJson.recommendedStatus || "verified_resolved",
    forensicReasoning: rawJson.forensicReasoning || "Forensic photo audit suggests repair is complete.",
  };
}
export async function* generateComplaintStream(
  caseId: string,
  title: string,
  category: string,
  department: string,
  gpsString: string,
  elapsedDays: number,
  analysisText: string
): AsyncGenerator<string, void, unknown> {
  const ai = getBTLClient();
  const streamPrompt = buildComplaintLetterPrompt(caseId, title, category, department, gpsString, elapsedDays, analysisText);

  const stream = await ai.chat.completions.create({
    model: getTextModelName(),
    messages: [
      { role: "system", content: "You are CivicProof AI. Write clean, ready-to-send formal complaint letters as plain text only." },
      { role: "user", content: streamPrompt }
    ],
    max_tokens: 600,
    temperature: 0.5,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

export async function* generateEscalationStream(
  caseId: string,
  title: string,
  category: string,
  department: string,
  gpsString: string,
  elapsedDays: number,
  analysisText: string,
  corroborationCount: number
): AsyncGenerator<string, void, unknown> {
  const ai = getBTLClient();
  const streamPrompt = buildEscalationLetterPrompt(caseId, title, category, department, gpsString, elapsedDays, analysisText, corroborationCount);

  const stream = await ai.chat.completions.create({
    model: getTextModelName(),
    messages: [
      { role: "system", content: "You are CivicProof AI. Write clean, ready-to-send official escalation letters as plain text only." },
      { role: "user", content: streamPrompt }
    ],
    max_tokens: 600,
    temperature: 0.5,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}
