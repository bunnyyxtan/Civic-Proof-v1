// CivicProof State Management & Storage Engine
// Implements client-side state, offline queue, and localStorage persistence

import { CivicCase, calculateHarmScore, routeToDepartment, generateCaseId, checkSilenceClockBreach } from "./civic/engine";
import { CivicIssue } from "./civic/types";
import { getCitizenIdToken } from "./auth/authClient";

const STORAGE_KEY = "civicproof_cases_v2";

const INITIAL_EMPTY_CASES: CivicCase[] = [];

function performLegacyLocalStorageCleanup() {
  // No-op
}

export function loadCases(): CivicCase[] {
  if (typeof window === "undefined") return INITIAL_EMPTY_CASES;
  
  // Clean up legacy mock data
  performLegacyLocalStorageCleanup();
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as CivicCase[];
      // Run automatic Silence Clock checks on load to mark older cases breached
      return parsed.map(c => {
        if (c.status !== 'RESOLVED' && c.status !== 'BREACHED') {
          const { isBreached } = checkSilenceClockBreach(c);
          if (isBreached) {
            c.status = 'BREACHED';
            // Add timeline event if not already present
            const hasBreachEvent = c.timeline.some(e => e.type === 'breach');
            if (!hasBreachEvent) {
              c.timeline.push({
                id: `EV-BREACH-${Date.now()}`,
                timestamp: new Date().toISOString(),
                title: "SLA Silence Breach Detected",
                description: "Silence Clock crossed 7-day milestone with zero official resolution. Status flagged as BREACHED.",
                type: "breach"
              });
            }
          }
        }
        return c;
      });
    }
  } catch (err) {
    console.error("Failed to load local storage cases:", err);
  }
  
  return INITIAL_EMPTY_CASES;
}

export function saveCases(cases: CivicCase[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));

    // Background asynchronous database synchronization
    if (Array.isArray(cases) && cases.length > 0) {
      // Fetch token asynchronously and then fire sync requests
      getCitizenIdToken()
        .then((token) => {
          // Synchronize the top 5 most recently active cases
          const syncTargets = cases.slice(0, 5);
          for (const c of syncTargets) {
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (token) {
              headers["Authorization"] = `Bearer ${token}`;
            }

            fetch("/api/cases", {
              method: "POST",
              headers,
              body: JSON.stringify({ case: c })
            }).catch(err => {
              console.warn(`Background database synchronization failed for case ${c.id}:`, err);
            });
          }
        })
        .catch((err) => {
          console.warn("Failed to get citizen auth token for background sync:", err);
        });
    }
  } catch (err) {
    console.error("Failed to save cases to local storage:", err);
  }
}

export function mapIssueToCase(issue: CivicIssue): CivicCase {
  let mappedCategory: CivicCase["category"] = "Pothole & Road Damage";
  if (issue.category === "water_leakage") {
    mappedCategory = "Water Overflow";
  } else if (issue.category === "road_damage") {
    mappedCategory = "Pothole & Road Damage";
  } else if (issue.category === "waste_management") {
    mappedCategory = "Garbage Dump";
  } else if (issue.category === "streetlight") {
    if (issue.title.toLowerCase().includes("power") || issue.title.toLowerCase().includes("bescom") || issue.title.toLowerCase().includes("cable")) {
      mappedCategory = "Power Line Danger";
    } else {
      mappedCategory = "Traffic & Footpath Obstruction";
    }
  }

  let mappedStatus: CivicCase["status"] = "FILED";
  const currentStatus = issue.status as string;
  if (currentStatus === "verified_resolved") {
    mappedStatus = "RESOLVED";
  } else if (currentStatus === "overdue" || currentStatus === "escalated") {
    mappedStatus = "BREACHED";
  } else if (currentStatus === "routed" || currentStatus === "complaint_ready") {
    mappedStatus = "ROUTED";
  }

  const corroborations = (issue.corroborations || []).map((corr, idx) => ({
    id: corr.id || `CORR-${idx}-${Date.now()}`,
    filedAt: corr.reportedAt,
    text: corr.citizenNote,
    type: "angle" as const,
    contributorName: corr.contributorName,
    contributorUid: corr.contributorUid,
    additionalPhotoUrl: corr.imageDataUrl || undefined,
  }));

  const timeline = (issue.timeline || []).map((ev) => ({
    id: ev.id,
    timestamp: ev.timestamp,
    title: ev.label || ev.type,
    description: ev.description,
    type: (ev.type === "report_submitted" ? "file" : 
           ev.type === "department_routed" ? "route" : 
           ev.type === "corroboration_added" ? "corroborate" : 
           ev.type === "silence_detected" ? "breach" : 
           ev.type === "resolution_checked" ? "resolve" : "file") as any,
    actorName: ev.actor === "citizen" ? "Citizen" : undefined,
  }));

  return {
    id: issue.id,
    dataOrigin: issue.dataOrigin,
    title: issue.title,
    description: issue.evidence.description,
    voiceTranscript: issue.evidence.voiceTranscript || undefined,
    category: mappedCategory,
    department: issue.departmentRoute.departmentName,
    gps: {
      latitude: issue.latitude,
      longitude: issue.longitude,
      address: issue.locationName,
      accuracyMeters: issue.locationAccuracyMeters,
      confirmedByUser: issue.locationConfirmedByUser,
    },
    locationAccuracyMeters: issue.locationAccuracyMeters,
    locationConfirmedByUser: issue.locationConfirmedByUser,
    locationSource: issue.locationSource,
    locationShortLabel: issue.locationShortLabel,
    formattedAddress: issue.formattedAddress,
    locality: issue.locality,
    city: issue.city,
    state: issue.state,
    country: issue.country,
    geolocationCapturedAt: issue.geolocationCapturedAt,
    photoUrl: issue.evidence.photoUrl || "",
    filedAt: issue.reportedAt,
    status: mappedStatus,
    harmScore: issue.harmScore,
    harmScoreBreakdown: {
      safetyHazard: issue.harmScore >= 80 ? 25 : 15,
      publicImpact: issue.corroborations.length >= 3 ? 25 : 15,
      vulnerabilityFactor: issue.riskFactors.length >= 2 ? 25 : 12,
      durationFactor: issue.status === "overdue" ? 25 : 10,
    },
    corroborations,
    timeline,
    complaintPacket: issue.complaintPacket ? {
      subject: issue.complaintPacket.subject,
      recipient: issue.complaintPacket.recipientDepartment,
      body: issue.complaintPacket.formalBody,
      generatedAt: issue.complaintPacket.generatedAt,
    } : null,
    escalationPacket: issue.escalationPacket ? {
      subject: `URGENT ESCALATION: SLA Breach - ${issue.title}`,
      recipient: issue.departmentRoute.escalationLabel,
      body: issue.escalationPacket.formalBody,
      generatedAt: issue.escalationPacket.generatedAt,
    } : null,
    resolutionReasoning: issue.resolutionVerification?.forensicReasoning || null,
    resolvedAt: issue.status === "verified_resolved" ? issue.reportedAt : null,
    authorityLastSeenAt: null,
    createdByUid: issue.createdByUid,
  };
}

export function mapCaseToIssue(c: CivicCase): CivicIssue {
  let mappedCategory: any = "road_damage";
  if (c.category === "Water Overflow") {
    mappedCategory = "water_leakage";
  } else if (c.category === "Pothole & Road Damage") {
    mappedCategory = "road_damage";
  } else if (c.category === "Garbage Dump") {
    mappedCategory = "waste_management";
  } else if (c.category === "Power Line Danger" || c.category === "Traffic & Footpath Obstruction") {
    mappedCategory = "streetlight";
  }

  let mappedStatus: any = "routed";
  if (c.status === "RESOLVED") {
    mappedStatus = "verified_resolved";
  } else if (c.status === "BREACHED") {
    mappedStatus = "overdue";
  } else if (c.status === "ROUTED") {
    mappedStatus = "routed";
  }

  const corroborations = (c.corroborations || []).map((corr) => ({
    id: corr.id,
    reportedAt: corr.filedAt,
    citizenNote: corr.text,
    contributorName: corr.contributorName,
    contributorUid: corr.contributorUid,
    imageDataUrl: corr.additionalPhotoUrl,
  }));

  const timeline = (c.timeline || []).map((ev) => ({
    id: ev.id,
    timestamp: ev.timestamp,
    label: ev.title,
    description: ev.description,
    type: (ev.type === "file" ? "report_submitted" :
           ev.type === "route" ? "department_routed" :
           ev.type === "corroborate" ? "corroborate_added" :
           ev.type === "breach" ? "silence_detected" :
           ev.type === "resolve" ? "resolution_checked" : "report_submitted") as any,
    actor: ev.actorName === "Citizen" ? "citizen" : "system" as any,
  }));

  return {
    id: c.id,
    dataOrigin: c.dataOrigin,
    title: c.title,
    category: mappedCategory,
    status: mappedStatus,
    severity: c.harmScore >= 80 ? "critical" : c.harmScore >= 50 ? "high" : "medium",
    harmScore: c.harmScore,
    locationName: c.gps?.address || "Reported Location",
    latitude: c.gps?.latitude ?? 0,
    longitude: c.gps?.longitude ?? 0,
    locationAccuracyMeters: c.locationAccuracyMeters ?? c.gps?.accuracyMeters,
    locationConfirmedByUser: c.locationConfirmedByUser ?? c.gps?.confirmedByUser,
    locationSource: c.locationSource,
    locationShortLabel: c.locationShortLabel,
    formattedAddress: c.formattedAddress,
    locality: c.locality,
    city: c.city,
    state: c.state,
    country: c.country,
    geolocationCapturedAt: c.geolocationCapturedAt,
    reportedAt: c.filedAt,
    lastMeaningfulActionAt: c.filedAt,
    slaDays: c.category === "Power Line Danger" ? 3 : 7,
    departmentRoute: {
      departmentId: "bbmp_routed",
      departmentName: c.department,
      slaDays: c.category === "Power Line Danger" ? 3 : 7,
      escalationLabel: "Chief Commissioner Desk",
      routeReason: "Mapped from category",
      confidence: 0.95,
    },
    riskFactors: [],
    evidence: {
      photoUrl: c.photoUrl,
      description: c.description,
      voiceTranscript: c.voiceTranscript,
    },
    corroborations,
    timeline,
    complaintPacket: c.complaintPacket ? {
      subject: c.complaintPacket.subject,
      recipientDepartment: c.complaintPacket.recipient,
      formalBody: c.complaintPacket.body,
      generatedAt: c.complaintPacket.generatedAt,
      evidenceSummary: c.description,
      citizenImpact: "Public safety hazard",
      requestedAction: "Immediate site repair",
      tone: "urgent",
    } as any : undefined,
    escalationPacket: c.escalationPacket ? {
      escalationReason: "Silence SLA Breach",
      daysSilent: 7,
      slaBreached: true,
      unresolvedEvidence: [],
      communityCorroborationSummary: "",
      formalBody: c.escalationPacket.body,
      generatedAt: c.escalationPacket.generatedAt,
    } as any : undefined,
    createdByUid: c.createdByUid,
  };
}
