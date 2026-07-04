// src/lib/agent/civicAgent.ts
// Unified facade for CivicProof Agentic workflow orchestrations

import { runReportPipeline } from "./pipeline";
import { processCorroboration, processSilenceClockTrigger, processResolutionProof } from "./actions";
import { generateComplaintSmart, generateEscalationSmart } from "../ai/aiAdapters";
import { getSilenceClock } from "../civic/silenceClock";
import { buildEscalationPacketFromIssue } from "../civic/packetGeneration";
import { createTimelineEvent } from "../civic/timeline";
import { CivicIssue } from "../civic/types";

export const CivicProofAgent = {
  // 1. Submit citizen report pipeline
  submitReport: runReportPipeline,

  // 2. Corroborate an existing case
  corroborateCase: processCorroboration,

  // 3. Audit silence clock timers
  auditSilenceClock: processSilenceClockTrigger,

  // 4. Photo-inspected resolution
  verifyResolution: processResolutionProof,

  // 5. Generate Complaint Packet (lazy / on-demand)
  compileComplaintPacket: async (issue: CivicIssue): Promise<CivicIssue> => {
    const clock = getSilenceClock(issue);
    const result = await generateComplaintSmart(
      issue.id,
      issue.title,
      issue.category,
      issue.departmentRoute.departmentName,
      `${issue.latitude}, ${issue.longitude} (${issue.locationName})`,
      clock.daysSilent,
      issue.evidence.description
    );

    const updatedTimeline = [
      ...issue.timeline,
      createTimelineEvent("complaint_generated", {
        description: `Formal representation compiled via BTL (${result.meta.provider}). ready for submission.`,
      }),
    ];

    return {
      ...issue,
      complaintPacket: result.data,
      timeline: updatedTimeline,
      status: "complaint_ready",
    };
  },

  // 6. Generate Escalation Packet (on-demand due to inaction)
  compileEscalationPacket: async (issue: CivicIssue): Promise<CivicIssue> => {
    const clock = getSilenceClock(issue);
    
    const result = await generateEscalationSmart(
      issue.id,
      issue.title,
      issue.category,
      issue.departmentRoute.departmentName,
      `${issue.latitude}, ${issue.longitude}`,
      clock.daysSilent,
      issue.evidence.description,
      issue.corroborations.length
    );

    // Timeline event
    const updatedTimeline = [
      ...issue.timeline,
      createTimelineEvent("escalation_generated", {
        description: `Neglect escalation packet compiled with ${issue.corroborations.length + 1} signatures due to ${clock.daysSilent}-day delay.`,
      }),
    ];

    return {
      ...issue,
      escalationPacket: result.data,
      timeline: updatedTimeline,
      status: "escalated",
    };
  },
};
export default CivicProofAgent;
