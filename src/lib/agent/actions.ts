// src/lib/agent/actions.ts
// Domain action routines for managing state mutations & timeline events

import { CivicIssue, CorroborationRecord, TimelineEvent } from "../civic/types";
import { calculateHarmScore } from "../civic/scoring";
import { createTimelineEvent } from "../civic/timeline";
import { getSilenceClock } from "../civic/silenceClock";
import { verifyResolutionSmart } from "../ai/aiAdapters";
import { extractCivicRiskSignals } from "../civic/riskSignals";

export function processCorroboration(
  issue: CivicIssue,
  corr: CorroborationRecord
): CivicIssue {
  const updatedCorroborations = [...issue.corroborations, corr];
  
  // Extract and merge risk factors from the new corroborating report
  const existingRiskFactors = issue.riskFactors || [];
  const incomingRiskFactors = corr.citizenNote ? extractCivicRiskSignals(corr.citizenNote) : [];
  const mergedRiskFactors = Array.from(new Set([...existingRiskFactors, ...incomingRiskFactors]));

  // Recalculate Harm Score based on new corroboration
  const clock = getSilenceClock(issue);
  const newHarm = calculateHarmScore({
    category: issue.category,
    severity: issue.severity,
    riskFactors: mergedRiskFactors,
    citizenNote: issue.evidence.description,
    corroborationCount: updatedCorroborations.length,
    daysSilent: clock.daysSilent,
    isOverdue: clock.isOverdue,
  });

  const timelineEvent = createTimelineEvent("corroboration_added", {
    actorName: corr.contributorName,
    description: `Neighbor verified this defect on-site: "${corr.citizenNote || 'Verified active hazard'}". Harm score boosted to ${newHarm.score}.`,
    timestamp: corr.reportedAt,
  });

  return {
    ...issue,
    corroborations: updatedCorroborations,
    riskFactors: mergedRiskFactors,
    harmScore: newHarm.score,
    timeline: [...issue.timeline, timelineEvent],
    status: "corroborating",
  };
}

export function processSilenceClockTrigger(
  issue: CivicIssue,
  referenceDateStr?: string
): CivicIssue {
  const clock = getSilenceClock(issue, referenceDateStr);
  
  if (!clock.isOverdue || issue.status === "overdue" || issue.status === "escalated") {
    return issue;
  }

  const timelineEvent = createTimelineEvent("silence_detected", {
    description: `Official SLA breached: No response from ${issue.departmentRoute.departmentName} in ${clock.daysSilent} days. Silence clock flagged warning.`,
    timestamp: referenceDateStr || new Date().toISOString(),
  });

  return {
    ...issue,
    status: "overdue",
    timeline: [...issue.timeline, timelineEvent],
  };
}

export async function processResolutionProof(
  issue: CivicIssue,
  photoUrl: string,
  citizenNote: string
): Promise<CivicIssue> {
  // Call AI photo inspector
  const auditResult = await verifyResolutionSmart(issue.evidence.description, photoUrl, citizenNote);
  const audit = auditResult.data;

  const timestamp = new Date().toISOString();
  
  const timelineEvent = createTimelineEvent("resolution_checked", {
    description: audit.recommendedStatus === "verified_resolved"
      ? `Audit PASSED: Photographic evidence confirms repairs are complete. Forensic confidence ${Math.round(audit.confidence * 100)}%.`
      : `Audit FAILED: Forensic analysis detects unresolved hazards. Case kept open.`,
    timestamp,
    metadata: {
      observations: audit.afterImageObservations,
    },
  });

  return {
    ...issue,
    status: audit.recommendedStatus === "verified_resolved" ? "verified_resolved" : "routed",
    resolutionVerification: audit,
    timeline: [...issue.timeline, timelineEvent],
  };
}
