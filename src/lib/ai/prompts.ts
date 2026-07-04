// src/lib/ai/prompts.ts
// Strict AI prompts for structured civic intelligence dockets

import { IssueCategory, Severity } from "../civic/types";

export function buildAnalysisPrompt(
  contextText: string,
  categories: string[]
): string {
  return `You are CivicProof AI, a structured civic evidence analysis agent. 
Analyze the provided civic issue report (incorporating citizen notes, visual data, and voice transcripts).
Citizen context: ${contextText}

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object matching the requested schema. No markdown formatting outside the JSON code block, no prose before or after.
2. Select the normalized category strictly from this list of exact strings: ${JSON.stringify(categories)}.
3. Rate severity as low, medium, high, or critical.
4. Provide standard, literal human labels for all fields. Avoid pseudo-intellectual or dramatic terms.
5. Identify real risk factors (e.g. school nearby, pedestrian walk blockages, slip and fall hazards, vector-borne breeding conditions).
6. Do NOT invent fake municipal complaint IDs or official state acknowledgements.
7. CRITICAL TO PREVENT TRUNCATION: Return AT MOST 4 items per array (for visibleEvidence, riskFactors, missingEvidence, harmSignals). Keep each string VERY CONCISE (under ~12 words per string).
8. Return a structured JSON response with the following keys exactly:
  - detectedIssue: A concise literal description of the core defect (max 15 words)
  - normalizedCategory: The selected category from the allowed list
  - severity: The selected severity ('low' | 'medium' | 'high' | 'critical')
  - confidence: Score between 0 and 1 indicating analysis accuracy
  - visibleEvidence: Array of specific visual indicators extracted (max 4)
  - riskFactors: Array of real public safety risk factors (max 4)
  - missingEvidence: Array of additional photographic details that would help (max 3)
  - recommendedDepartment: Name of the likely municipal agency to address this
  - civicSummary: Formatted objective technical description of the defect (max 40 words)
  - citizenImpact: Clear description of how local residents are impacted (max 25 words)
  - suggestedTitle: Descriptive, humble title for the public case file (max 6 words)
  - harmSignals: Key safety hazards detected on-site (max 3)`;
}

export function buildComplaintPrompt(
  caseId: string,
  title: string,
  category: string,
  department: string,
  gpsString: string,
  elapsedDays: number,
  analysisText: string
): string {
  return `You are CivicProof AI. Draft a formal public-facing Complaint Packet for Case ID: ${caseId}.
Details:
- Case Title: ${title}
- Category: ${category}
- Target Department: ${department}
- Geotagged Location: ${gpsString}
- Inaction Duration: ${elapsedDays} days
- Technical Analysis Evidence: ${analysisText}

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object matching the requested schema. No prose outside, no markdown fences.
2. Write a UNIQUE, situation-specific petition each time. Vary your sentence structure and wording per case.
3. Weave in the specific hazard, severity, exact location, and department into a natural formal-letter prose.
4. Keep the \`formalBody\` CONCISE — exactly 3 short paragraphs, under ~200 words total, direct and punchy, no filler.
5. Do NOT emit rigid headers like "EVIDENTIARY ANALYSIS", "LOCATION LOGS", or "CITIZEN INJUNCTION". Write it as a standard continuous formal letter.
6. The JSON must contain the following keys exactly:
  - recipientDepartment: Name of the official department
  - subject: Direct formal subject line (max 15 words)
  - formalBody: Complete multi-paragraph formal petition starting with "To, The Designated Officer..." and ending with "Respectfully submitted..."
  - evidenceSummary: Brief summary of visual proofs (max 30 words)
  - citizenImpact: Concise summary of public risk (max 20 words)
  - requestedAction: Concrete resolution request under municipal guidelines
  - tone: 'formal' | 'urgent' | 'escalation_ready'
  - generatedAt: Current timestamp`;
}

export function buildComplaintLetterPrompt(
  caseId: string,
  title: string,
  category: string,
  department: string,
  gpsString: string,
  elapsedDays: number,
  analysisText: string
): string {
  return `You are CivicProof AI. Write a complete, ready-to-send FORMAL COMPLAINT LETTER (plain text only) about a civic defect.
Case details:
- Case Title: ${title}
- Category: ${category}
- Target Department: ${department}
- Geotagged Location: ${gpsString}
- Inaction Duration: ${elapsedDays} days
- Technical Analysis Evidence: ${analysisText}

STRICT OUTPUT RULES:
1. Output ONLY the letter text. No JSON, no markdown, no code fences, no field labels.
2. NEVER output lines like "Evidence Summary:", "Citizen Impact:", "Requested Action:", "Tone:", "GeneratedAt:", "recipientDepartment:", or "subject:". These are strictly forbidden.
3. Structure the letter EXACTLY as:
   - "To, The Designated Officer,"
   - "${department},"
   - one "Subject: ..." line (concise, max 15 words)
   - then exactly 3 short body paragraphs (under ~200 words total), specific to this hazard, its severity, exact location, and the ${elapsedDays}-day delay. Continuous natural prose - no bullet points, no rigid headers like "EVIDENTIARY ANALYSIS" or "LOCATION LOGS".
   - end with "Respectfully submitted," on its own line, then "The Concerned Citizens (Verified via CivicProof)".
4. Write a UNIQUE letter each time; vary wording. Do not claim legal penalties unless documented.`;
}

export function buildEscalationPrompt(
  caseId: string,
  title: string,
  category: string,
  department: string,
  gpsString: string,
  elapsedDays: number,
  analysisText: string,
  corroborationCount: number
): string {
  return `You are CivicProof AI. Draft an official Escalation Packet for Case ID: ${caseId}.
This issue has been ignored by ${department} for ${elapsedDays} days, breaching standard citizen service timelines. It has been verified and signed by ${corroborationCount} additional neighbors.
Details:
- Case Title: ${title}
- Category: ${category}
- Ignored Duration: ${elapsedDays} days
- Technical Evidence Context: ${analysisText}
- Verified Neighbors Ledger: ${corroborationCount + 1} signatures
- Geotagged Location: ${gpsString}

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object matching the requested schema.
2. Write a highly serious, official administrative appeal addressed to the Joint Commissioner or Public Grievance Desk.
3. Write a UNIQUE, situation-specific petition each time. Weave in the exact days silent, severity, location, and the fact that ${corroborationCount} neighbors corroborated it.
4. Keep the \`formalBody\` CONCISE — exactly 3 short paragraphs, under ~200 words total, direct and punchy, no filler.
5. Do NOT emit rigid scaffolded headers. Write a natural, continuous formal letter of escalation.
6. The JSON must contain the following keys exactly:
  - escalationReason: Literal summary of the timeline breach
  - daysSilent: Number of days silent
  - slaBreached: Boolean (always true here)
  - unresolvedEvidence: Array of outstanding hazards (max 3)
  - communityCorroborationSummary: Description of neighborhood collective action (max 40 words)
  - formalBody: Full official multi-paragraph appeal petition text starting appropriately and ending formally.
  - generatedAt: Current timestamp`;
}

export function buildEscalationLetterPrompt(
  caseId: string,
  title: string,
  category: string,
  department: string,
  gpsString: string,
  elapsedDays: number,
  analysisText: string,
  corroborationCount: number
): string {
  return `You are CivicProof AI. Write a complete, ready-to-send OFFICIAL ESCALATION LETTER (plain text only) for a civic issue that ${department} has ignored for ${elapsedDays} days, corroborated by ${corroborationCount} neighbors.
Case details:
- Case Title: ${title}
- Category: ${category}
- Ignored Duration: ${elapsedDays} days
- Technical Evidence Context: ${analysisText}
- Verified Neighbors: ${corroborationCount + 1} signatures
- Geotagged Location: ${gpsString}

STRICT OUTPUT RULES:
1. Output ONLY the letter text. No JSON, no markdown, no code fences, no field labels.
2. NEVER output lines like "Escalation Reason:", "Days Silent:", "SLA Breached:", "Unresolved Evidence:", "Community Corroboration:", "Tone:", or "GeneratedAt:". Strictly forbidden.
3. Address it to the Joint Commissioner / Public Grievance Redressal Desk. Structure:
   - "To, The Joint Commissioner,"
   - "Public Grievance Redressal Cell,"
   - one "Subject: ..." line
   - exactly 3 short body paragraphs (under ~200 words total) weaving in the exact ${elapsedDays} days of silence, the severity, the location, and that ${corroborationCount} neighbors corroborated it. Serious, official tone, continuous prose, no rigid headers.
   - end with "Respectfully submitted," then "The Concerned Citizens (Verified via CivicProof)".
4. Write a UNIQUE letter each time.`;
}

export function buildResolutionPrompt(
  originalDesc: string,
  citizenVerificationNote: string
): string {
  return `You are CivicProof AI, a forensic civic auditor.
Evaluate the citizen photo proof and the verification comments: "${citizenVerificationNote}"
against the original reported issue description: "${originalDesc}".

Determine if the reported physical defect has been completely repaired/cleared, leaving the area safe for pedestrians and vehicles.

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object.
2. Be objective and factual. If the citizen comment says the repair is bad, incomplete, or still broken, report isResolved as false.
3. The JSON must contain the following keys exactly:
  - beforeImageObservations: Array of observations of the original defect (max 2)
  - afterImageObservations: Array of observations from the completed work (max 2)
  - repairLikely: Boolean (true if work appears completed, flat, and secure)
  - confidence: Score between 0 and 1 indicating audit confidence
  - remainingConcerns: Array of lingering hazards (empty if fully resolved)
  - recommendedStatus: 'keep_open' | 'resolution_review' | 'verified_resolved'
  - forensicReasoning: Bulleted forensic explanation of the verdict (max 50 words)`;
}
