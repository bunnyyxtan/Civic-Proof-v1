// src/lib/civic/caseState.ts
// Deterministic state-machine and lifecycle transition manager

import { IssueStatus, CivicIssue } from "./types";
import { getSilenceClock } from "./silenceClock";

export function canTransitionCase(current: IssueStatus, target: IssueStatus): boolean {
  if (current === "verified_resolved") {
    // Sealed cases can only be re-opened if a resolution verification fails
    return target === "resolution_review";
  }

  const validTransitions: Record<IssueStatus, IssueStatus[]> = {
    reported: ["analyzed", "duplicate_found"],
    analyzed: ["routed", "duplicate_found"],
    duplicate_found: ["corroborating"],
    corroborating: ["routed", "resolution_review"],
    routed: ["complaint_ready", "overdue", "resolution_review"],
    complaint_ready: ["overdue", "escalated", "resolution_review"],
    overdue: ["escalated", "resolution_review"],
    escalated: ["resolution_review"],
    resolution_review: ["verified_resolved", "overdue", "routed"],
    verified_resolved: ["resolution_review"],
  };

  return validTransitions[current]?.includes(target) ?? false;
}

export function isTerminalStatus(status: IssueStatus): boolean {
  return status === "verified_resolved";
}

export function isEscalationEligible(issue: CivicIssue, referenceDateStr?: string): boolean {
  if (issue.status === "verified_resolved" || issue.status === "escalated") {
    return false;
  }
  const clock = getSilenceClock(issue, referenceDateStr);
  return clock.isOverdue;
}

export function getNextRecommendedAction(issue: CivicIssue, referenceDateStr?: string): {
  actionId: string;
  label: string;
  description: string;
  type: "view_complaint" | "escalate" | "corroborate" | "audit" | "await";
} {
  const clock = getSilenceClock(issue, referenceDateStr);

  if (issue.status === "verified_resolved") {
    return {
      actionId: "CLOSED",
      label: "Case Sealed",
      description: "This civic complaint is verified resolved by neighborhood physical audit.",
      type: "await",
    };
  }

  if (issue.status === "resolution_review") {
    return {
      actionId: "AUDIT_RESOLUTION",
      label: "Verify Resolution",
      description: "The department claimed resolution. Conduct photographic audit to verify.",
      type: "audit",
    };
  }

  if (clock.isOverdue) {
    return {
      actionId: "GENERATE_ESCALATION",
      label: "Escalate Complaint",
      description: `SLA breached: Case ignored for ${clock.daysSilent} days. Compile escalation packet for Commissioner.`,
      type: "escalate",
    };
  }

  if (issue.corroborations.length < 3) {
    return {
      actionId: "CORROBORATE",
      label: "Rally Corroboration",
      description: "Gather 2 more neighborhood corroborations to elevate urgency and Harm Score.",
      type: "corroborate",
    };
  }

  return {
    actionId: "VIEW_COMPLAINT_PACKET",
    label: "Review Complaint Packet",
    description: "Official complaint packet is ready. Export and file with designated department desk.",
    type: "view_complaint",
  };
}
