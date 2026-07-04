// src/lib/civic/timeline.ts
// Standardized timeline event factory

import { TimelineEvent } from "./types";

export type TimelineAction =
  | "report_submitted"
  | "report_analyzed"
  | "duplicate_found"
  | "case_created"
  | "corroboration_added"
  | "department_routed"
  | "complaint_generated"
  | "silence_detected"
  | "escalation_generated"
  | "resolution_submitted"
  | "resolution_checked";

export function createTimelineEvent(
  action: TimelineAction,
  payload: {
    actorName?: string;
    description?: string;
    metadata?: Record<string, any>;
    timestamp?: string;
  }
): TimelineEvent {
  const timestamp = payload.timestamp || new Date().toISOString();
  const id = `EV-${action.toUpperCase()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  let label = "";
  let defaultDesc = "";
  let actor: TimelineEvent["actor"] = "system";

  switch (action) {
    case "report_submitted":
      label = "Evidence Submitted";
      defaultDesc = `Citizen ${payload.actorName || "Anonymous"} logged on-site geotagged visual proof.`;
      actor = "citizen";
      break;
    case "report_analyzed":
      label = "Evidence Analyzed";
      defaultDesc = "AI analyzed report and extracted structured civic evidence.";
      actor = "civicproof_ai";
      break;
    case "duplicate_found":
      label = "Duplicate Case Linked";
      defaultDesc = "Nearby matching case detected. Merging reports to build corroborative evidence.";
      actor = "system";
      break;
    case "case_created":
      label = "Case File Opened";
      defaultDesc = "Official civic case file created and registered on blockchain ledger.";
      actor = "system";
      break;
    case "corroboration_added":
      label = "Neighbor Corroborated";
      defaultDesc = `Citizen ${payload.actorName || "Neighbor"} verified the issue. Harm score updated.`;
      actor = "community";
      break;
    case "department_routed":
      label = "Routed to Department";
      defaultDesc = "Routed to designated department based on ward matrices.";
      actor = "system";
      break;
    case "complaint_generated":
      label = "Complaint Packet Compiled";
      defaultDesc = "Official formal grievance packet generated for municipal representation.";
      actor = "civicproof_ai";
      break;
    case "silence_detected":
      label = "SLA Breach Detected";
      defaultDesc = "Silence clock breached mandatory charter timeline without response.";
      actor = "system";
      break;
    case "escalation_generated":
      label = "Escalation Packet Compiled";
      defaultDesc = "Urgent neglect escalation packet compiled for commissioner audit.";
      actor = "civicproof_ai";
      break;
    case "resolution_submitted":
      label = "Resolution Claimed";
      defaultDesc = "Department reported that work has been completed.";
      actor = "department";
      break;
    case "resolution_checked":
      label = "Resolution Inspected";
      defaultDesc = "AI conducted photographic verification of resolution.";
      actor = "civicproof_ai";
      break;
  }

  return {
    id,
    type: action,
    label,
    description: payload.description || defaultDesc,
    timestamp,
    actor,
    metadata: payload.metadata,
  };
}
