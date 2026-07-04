// src/lib/civic/silenceClock.ts
// Silence Clock tracks administrative inaction and SLA breaches

import { CivicIssue, SilenceClockResult } from "./types";
import { DEFAULT_SLAS } from "./constants";

export function getSilenceClock(issue: CivicIssue, referenceDateStr?: string): SilenceClockResult {
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date("2026-06-29T10:23:58-07:00");
  const startTimestamp = issue.lastMeaningfulActionAt || issue.reportedAt;
  const startDate = new Date(startTimestamp);
  
  const msDiff = refDate.getTime() - startDate.getTime();
  const totalHours = Math.max(0, msDiff / (1000 * 60 * 60));
  const daysSilent = Math.floor(totalHours / 24);
  const hoursSilent = Math.floor(totalHours % 24);
  
  const slaDays = issue.slaDays || DEFAULT_SLAS[issue.category] || 7;
  
  let isOverdue = false;
  if (issue.status !== "verified_resolved" && issue.status !== "resolution_review") {
    isOverdue = daysSilent > slaDays;
  }
  
  let label = `${daysSilent}d ${hoursSilent}h without action`;
  if (daysSilent === 0) {
    label = `${hoursSilent}h without action`;
  } else {
    label = `${daysSilent} of waiting`;
  }
  
  let tone: 'neutral' | 'watch' | 'overdue' | 'critical' = "neutral";
  let nextAction = "Monitoring department feed for acknowledgment.";
  let explanation = `Currently within standard ${slaDays}-day service level agreement (SLA) window.`;
  
  if (issue.status === "verified_resolved") {
    isOverdue = false;
    tone = "neutral";
    label = "Resolved";
    nextAction = "Case file verified and sealed under public ledger.";
    explanation = "The issue has been completely fixed and verified by the community.";
  } else if (isOverdue) {
    tone = daysSilent >= slaDays * 2 ? "critical" : "overdue";
    label = `Overdue — Day ${daysSilent} of waiting`;
    nextAction = "Generate formal escalation packet to the Ward Joint Commissioner.";
    explanation = `Official citizen charter resolution timeline (${slaDays} days) has been breached by ${daysSilent - slaDays} days.`;
  } else if (daysSilent >= Math.floor(slaDays * 0.7)) {
    tone = "watch";
    label = `Warning — Day ${daysSilent} of waiting`;
    nextAction = "Compile formal complaint packet draft to escalate visibility.";
    explanation = `Approaching SLA limit (${daysSilent}/${slaDays} days elapsed). Urgency rising.`;
  }
  
  return {
    daysSilent,
    hoursSilent,
    isOverdue,
    slaDays,
    label,
    tone,
    nextAction,
    explanation,
  };
}
