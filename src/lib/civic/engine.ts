// CivicProof Deterministic Product Engine
// Built for Vibe2Ship Hackathon — Coding Ninjas x Google for Developers

export interface GPSCoordinates {
  latitude: number | null;
  longitude: number | null;
  address?: string;
  accuracyMeters?: number;
  confirmedByUser?: boolean;
}

export type CaseStatus = 'FILED' | 'ROUTED' | 'UNDER_REVIEW' | 'BREACHED' | 'RESOLVED';

export type CorroborationType = 'angle' | 'impact' | 'timestamp';

export interface Corroboration {
  id: string;
  filedAt: string;
  text?: string;
  type: CorroborationType;
  contributorName: string;
  contributorUid?: string;
  additionalPhotoUrl?: string;
}

export interface CivicEvidence {
  id: string;
  type: "photo";
  imageUrl?: string;
  storagePath?: string;
  caption?: string;
  uploadedAt: string;
  uploadedByUid?: string;
}

export interface ImpactSignal {
  id: string;
  note: string;
  chips: string[];
  createdAt: string;
  createdByUid?: string;
}

export interface ActiveConfirmation {
  id: string;
  confirmedAt: string;
  confirmedByUid?: string;
  note?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'file' | 'route' | 'corroborate' | 'review' | 'breach' | 'resolve' | 'escalate' | 'evidence_added' | 'impact_note_added' | 'active_confirmation_added';
  actorName?: string;
}

export interface HarmScoreBreakdown {
  safetyHazard: number;      // 0 to 25
  publicImpact: number;      // 0 to 25
  vulnerabilityFactor: number; // 0 to 25
  durationFactor: number;    // 0 to 25
}

export interface ComplaintPacket {
  subject: string;
  recipient: string;
  body: string;
  generatedAt: string;
}

export interface CivicCase {
  id: string; // E.g., CP-2026-A83B4
  dataOrigin?: 'user_report' | 'judge_demo';
  title: string;
  description: string;
  voiceTranscript?: string;
  voiceMode?: string;
  category: 'Water Overflow' | 'Pothole & Road Damage' | 'Garbage Dump' | 'Power Line Danger' | 'Traffic & Footpath Obstruction';
  department: string;
  gps: GPSCoordinates;
  locationAccuracyMeters?: number;
  locationConfirmedByUser?: boolean;
  locationSource?: 'gps' | 'manual' | 'gps_plus_manual' | 'unknown';
  locationShortLabel?: string;
  formattedAddress?: string;
  locality?: string;
  city?: string;
  state?: string;
  country?: string;
  geolocationCapturedAt?: string;
  photoUrl: string;
  filedAt: string; // ISO String
  status: CaseStatus;
  harmScore: number; // 1 to 100
  harmScoreBreakdown: HarmScoreBreakdown;
  corroborations: Corroboration[];
  evidence?: CivicEvidence[];
  impactSignals?: ImpactSignal[];
  activeConfirmations?: ActiveConfirmation[];
  timeline: TimelineEvent[];
  complaintPacket: ComplaintPacket | null;
  escalationPacket: ComplaintPacket | null;
  resolutionReasoning: string | null;
  resolutionPhotoUrl?: string | null;
  resolvedAt: string | null;
  authorityLastSeenAt: string | null;
  createdByUid?: string;
}

// 1. Calculate Haversine distance in meters
export function getGPSDistanceInMeters(coord1: GPSCoordinates, coord2: GPSCoordinates): number {
  if (coord1.latitude === null || coord1.longitude === null || coord2.latitude === null || coord2.longitude === null) {
    return Infinity; // Cannot calculate distance if coordinates are missing
  }
  const R = 6371e3; // Earth radius in meters
  const phi1 = (coord1.latitude * Math.PI) / 180;
  const phi2 = (coord2.latitude * Math.PI) / 180;
  const deltaPhi = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLambda = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// 2. Check for duplicate/corroboration match (same category, within 450 meters)
export function findMatchingNearbyCase(
  newGps: GPSCoordinates,
  newCategory: string,
  existingCases: CivicCase[]
): CivicCase | null {
  const thresholdMeters = 450; // Proximity zone for "neighborhood corroboration"
  
  // If accuracy is low (accuracyMeters > 100) and no user landmark is typed/confirmed
  // (e.g. address is empty, or placeholder like "Location detected nearby — add a landmark"),
  // then do not auto-merge aggressively (return null so we don't automatically prompt for merge).
  const isAccuracyLow = newGps.accuracyMeters !== undefined && newGps.accuracyMeters > 100;
  const isNoLandmark = !newGps.address || 
    newGps.address.trim() === "" || 
    newGps.address.toLowerCase().includes("location detected nearby") ||
    newGps.address.toLowerCase().includes("location not detected");

  if (isAccuracyLow && isNoLandmark) {
    return null; // Do not auto-merge aggressively
  }

  for (const item of existingCases) {
    if (item.status === 'RESOLVED') continue;
    if (item.category === newCategory) {
      if (newGps.latitude === null || newGps.longitude === null || item.gps.latitude === null || item.gps.longitude === null) {
        // If coordinates missing, use text similarity (basic match on address)
        if (newGps.address && item.gps.address && newGps.address.toLowerCase() === item.gps.address.toLowerCase()) {
          return item;
        }
      } else {
        const distance = getGPSDistanceInMeters(newGps, item.gps);
        if (distance <= thresholdMeters) {
          // Double check if item has low accuracy and no descriptive landmark
          const itemAccuracyLow = item.locationAccuracyMeters !== undefined && item.locationAccuracyMeters > 100;
          if (itemAccuracyLow && isNoLandmark) {
            continue; // Skip auto-merge if either has low accuracy and no descriptive landmark
          }
          return item;
        }
      }
    }
  }
  return null;
}

// 3. Department Routing Matrix
export function routeToDepartment(category: CivicCase['category']): string {
  switch (category) {
    case 'Water Overflow':
      return 'Municipal Water Supply and Sewerage Board';
    case 'Pothole & Road Damage':
      return 'Municipal Road Infrastructure Department';
    case 'Garbage Dump':
      return 'Municipal Solid Waste Management Division';
    case 'Power Line Danger':
      return 'Municipal Electricity Supply Company';
    case 'Traffic & Footpath Obstruction':
      return 'Traffic Police & Footpath Division';
    default:
      return 'Municipal Corporation Ward Administration';
  }
}

// 4. Deterministic Harm Score Engine
export function calculateHarmScore(
  category: CivicCase['category'],
  filedAtIso: string,
  corroborationCount: number,
  isVulnerableArea: boolean = false
): { score: number; breakdown: HarmScoreBreakdown } {
  // A. Safety Hazard Base (0-25)
  let safetyHazard = 10;
  if (category === 'Power Line Danger') safetyHazard = 25; // Fatal risk
  else if (category === 'Water Overflow') safetyHazard = 18; // Disease/slipping risk
  else if (category === 'Pothole & Road Damage') safetyHazard = 15; // Two-wheeler accident risk
  else if (category === 'Traffic & Footpath Obstruction') safetyHazard = 12;
  else if (category === 'Garbage Dump') safetyHazard = 10;

  // B. Public Impact (0-25) based on corroborations (more neighbors = broader impact)
  // 1 reporter = 8 points, 2 = 14 points, 3 = 19 points, 4+ = 25 points
  const publicImpact = Math.min(25, 8 + (corroborationCount - 1) * 6);

  // C. Vulnerability Factor (0-25) e.g., heavy rain, school zone, hospital near, or dense locality
  const vulnerabilityFactor = isVulnerableArea ? 25 : 12;

  // D. Duration Factor (0-25)
  // SLA threshold is 7 days. Escalation is possible.
  // 1 day = 3 points, 3 days = 10 points, 7 days = 20 points, 10+ days = 25 points
  const filedDate = new Date(filedAtIso);
  const currentDate = new Date('2026-06-29T09:32:32-07:00'); // Consistent reference date
  const msDiff = currentDate.getTime() - filedDate.getTime();
  const daysDiff = Math.max(0, msDiff / (1000 * 60 * 60 * 24));

  let durationFactor = 2;
  if (daysDiff >= 10) durationFactor = 25;
  else if (daysDiff >= 7) durationFactor = 20;
  else if (daysDiff >= 3) durationFactor = 12;
  else if (daysDiff >= 1) durationFactor = 6;

  const totalScore = Math.min(100, Math.max(5, safetyHazard + publicImpact + vulnerabilityFactor + durationFactor));

  return {
    score: Math.round(totalScore),
    breakdown: {
      safetyHazard,
      publicImpact,
      vulnerabilityFactor,
      durationFactor,
    },
  };
}

// 5. Silence Clock / SLA Breach Check
// Returns true if the case is FILED, ROUTED, or UNDER_REVIEW and has been silent for more than 7 days
export function checkSilenceClockBreach(caseItem: CivicCase): { isBreached: boolean; elapsedDays: number } {
  if (caseItem.status === 'RESOLVED') {
    return { isBreached: false, elapsedDays: 0 };
  }

  const filedDate = new Date(caseItem.filedAt);
  const currentDate = new Date('2026-06-29T09:32:32-07:00');
  const msDiff = currentDate.getTime() - filedDate.getTime();
  const elapsedDays = Math.max(0, Math.floor(msDiff / (1000 * 60 * 60 * 24)));

  const isBreached = elapsedDays >= 7;
  return { isBreached, elapsedDays };
}

// 6. Next Action Recommendation engine based on case status and elapsed days
export function getNextActionRecommendation(caseItem: CivicCase): {
  label: string;
  actionType: 'corroborate' | 'escalate' | 'view_packet' | 'file' | 'await_response';
  description: string;
} {
  const { isBreached, elapsedDays } = checkSilenceClockBreach(caseItem);

  if (caseItem.status === 'RESOLVED') {
    return {
      label: 'Verified Closed',
      actionType: 'await_response',
      description: 'This case is resolved and verified by local citizen audits.',
    };
  }

  if (isBreached) {
    return {
      label: 'Escalate to Commissioner',
      actionType: 'escalate',
      description: `SLA breached: Case ignored for ${elapsedDays} days. Escalate with complete evidence packet.`,
    };
  }

  if (caseItem.corroborations.length < 3) {
    return {
      label: 'Gather Neighbors',
      actionType: 'corroborate',
      description: 'Needs 2 more neighborhood validations to increase authority urgency.',
    };
  }

  return {
    label: 'Await Authority Response',
    actionType: 'await_response',
    description: `Routed to ${caseItem.department}. Under official 7-day SLA timeline (Day ${elapsedDays} of 7).`,
  };
}

// 7. Case Id Generator
export function generateCaseId(): string {
  const year = 2026;
  const randomHex = Math.floor(Math.random() * 65536)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `CP-${year}-${randomChar}${randomHex}`;
}
