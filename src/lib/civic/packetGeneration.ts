// src/lib/civic/packetGeneration.ts
// Offline-first deterministic grievance and escalation packet builders

import { CivicIssue, ComplaintPacket, EscalationPacket } from "./types";
import { ISSUE_CATEGORIES } from "./constants";

export function buildComplaintPacketFromAnalysis(
  issueId: string,
  category: string,
  department: string,
  locationName: string,
  citizenNote: string,
  civicSummary: string,
  citizenImpact: string
): ComplaintPacket {
  const subject = `FORMAL REPRESENTATION: Persistent Unaddressed Public Hazard [Ref: ${issueId}]`;
  const generatedAt = new Date().toISOString();

  const formalBody = `CIVIC GRIEVANCE PETITION / EVIDENCE PACKET
Issued under Ward Administration Citizen's Charter Guidelines
Case Reference: ${issueId}
Generated: ${new Date(generatedAt).toLocaleDateString()}

TO,
The Designated Grievance Officer,
${department},
Municipal Administration.

SUBJECT: Formal Representation regarding neglected public hazard: "${category}" at ${locationName}.

Sir/Madam,

Under the Municipal Corporations Act and Citizen's Charter, we hereby submit formal evidentiary proof of a critical municipal failure that has remained unaddressed, despite posing active risks to public health and pedestrian safety.

The localized issue has been recorded, cataloged, and backed by independent community-level verification. Below is the technical inspection and evidence summary:

EVIDENTIARY ANALYSIS:
• Primary Defect: ${civicSummary}
• Citizen Witness Account: "${citizenNote}"
• Community Impact Footprint: ${citizenImpact}

LOCATION LOGS:
• Primary Location Address: ${locationName}
• Verified Proof File: Sealed under deterministic reference ID ${issueId}-PROOF-01

CITIZEN INJUNCTION & REQUESTED ACTION:
We urge your department to initiate an immediate physical inspection and deploy corrective crew assets within 48 hours. Should this defect remain unresolved, this docket will be escalated to the Public Grievance Redressal Commission and the Ward Commissioner's Desk for neglect of duty audits.

We expect a formal response indicating status updates and the assigned engineering supervisor's details.

Yours faithfully,
The Concerned Citizens
(Verified through CivicProof — Public Grievance Verification Ledger)`;

  return {
    recipientDepartment: department,
    subject,
    formalBody,
    evidenceSummary: civicSummary,
    citizenImpact,
    requestedAction: "Initiate physical inspection and deploy repair crews within 48 hours.",
    tone: "formal",
    generatedAt,
  };
}

export function buildEscalationPacketFromIssue(
  issue: CivicIssue,
  daysSilent: number,
  unresolvedEvidence: string[],
  communityCorroborationSummary: string
): EscalationPacket {
  const generatedAt = new Date().toISOString();
  const catLabel = ISSUE_CATEGORIES[issue.category] || issue.category;

  const formalBody = `FORMAL PETITION OF ADMINISTRATIVE NEGLIGENCE & PUBLIC RISK
Submitted to the Public Grievance Redressal Commission & Ward Joint Commissioner
Escalation Ticket ID: ESC-${issue.id}
Generated: ${new Date(generatedAt).toLocaleDateString()}

TO,
The Joint Commissioner (Grievance Desk),
Municipal Ward Head Office.

SUBJECT: Escalation regarding persistent department inaction over critical safety hazard: "${issue.title}" - Ignored for ${daysSilent} Days (SLA BREACH).

RESPECTED SIR/MADAM,

This petition is filed on behalf of ${issue.corroborations.length + 1} verified neighborhood residents. We formally lodge a grievance of administrative neglect against the ${issue.departmentRoute.departmentName}.

The public hazard, cataloged under case reference ${issue.id}, was initially filed with clear visual and location evidence. Despite the mandatory ${issue.slaDays}-day citizen SLA timeline expiring, the department has maintained absolute silence, failing to route corrective engineering or issue an official response.

COMMUNITY LEDGER OF CORROBORATION:
• Total Verified Citizen Signatures: ${issue.corroborations.length + 1}
• SLA Silence Duration: ${daysSilent} Days (Mandatory timeline was ${issue.slaDays} days)
• Public Harm Score: ${issue.harmScore}/100 Risk points
• Core Evidence Breakdown: ${issue.evidence.description}
• Unresolved Risks: ${unresolvedEvidence.join(", ") || "Active safety hazard to local pedestrians"}
• Community Summary: ${communityCorroborationSummary}

DEMANDS FOR RESOLUTION:
1. Direct the Assistant Executive Engineer (AEE) of ${issue.departmentRoute.departmentName} to conduct an immediate emergency site visit within 24 hours.
2. Initiate a departmental review of the negligence and delay regarding this specific complaint docket.
3. Update the public status of this case file immediately to prevent further community hazard liabilities.

Please find attached the complete evidentiary file, GPS coordinate ledger, and timestamped photo timeline.

We expect immediate disciplinary routing and public transparency on this critical issue.

Respectfully submitted,
Verified Neighbor Coalition`;

  return {
    escalationReason: `Neglect of duty by ${issue.departmentRoute.departmentName} for ${daysSilent} days, breaching standard SLA limit of ${issue.slaDays} days.`,
    daysSilent,
    slaBreached: true,
    unresolvedEvidence,
    communityCorroborationSummary,
    formalBody,
    generatedAt,
  };
}
