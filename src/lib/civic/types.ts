// src/lib/civic/types.ts
// Domain Types for CivicProof Product Engine

export type IssueCategory =
  | 'road_damage'
  | 'waste_management'
  | 'streetlight'
  | 'water_leakage';

export type IssueStatus =
  | 'reported'
  | 'analyzed'
  | 'duplicate_found'
  | 'corroborating'
  | 'routed'
  | 'complaint_ready'
  | 'overdue'
  | 'escalated'
  | 'resolution_review'
  | 'verified_resolved';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface GPSCoordinates {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ReportIntake {
  imageDataUrl?: string;
  imageUrl?: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  citizenNote?: string;
  selectedCategory?: IssueCategory;
  reportedAt: string;
  dataOrigin?: 'user_report' | 'judge_demo';
}

export interface AIAnalysisResult {
  detectedIssue: string;
  normalizedCategory: IssueCategory;
  severity: Severity;
  confidence: number; // 0 to 1
  visibleEvidence: string[];
  riskFactors: string[];
  missingEvidence: string[];
  recommendedDepartment: string;
  civicSummary: string;
  citizenImpact: string;
  suggestedTitle: string;
  harmSignals: string[];
}

export interface DuplicateCandidate {
  issueId: string;
  title: string;
  distanceMeters: number;
  similarityScore: number; // 0 to 1
  matchReasons: string[];
  recommendation: 'merge' | 'create_new' | 'review';
}

export interface HarmScoreResult {
  score: number; // 0 to 100
  band: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
}

export interface DepartmentRoute {
  departmentId: string;
  departmentName: string;
  slaDays: number;
  escalationLabel: string;
  routeReason: string;
  confidence: number; // 0 to 1
}

export interface SilenceClockResult {
  daysSilent: number;
  hoursSilent: number;
  isOverdue: boolean;
  slaDays: number;
  label: string;
  tone: 'neutral' | 'watch' | 'overdue' | 'critical';
  nextAction: string;
  explanation: string;
}

export interface ComplaintPacket {
  recipientDepartment: string;
  subject: string;
  formalBody: string;
  evidenceSummary: string;
  citizenImpact: string;
  requestedAction: string;
  tone: string;
  generatedAt: string;
}

export interface EscalationPacket {
  escalationReason: string;
  daysSilent: number;
  slaBreached: boolean;
  unresolvedEvidence: string[];
  communityCorroborationSummary: string;
  formalBody: string;
  generatedAt: string;
}

export interface ResolutionVerification {
  beforeImageObservations: string[];
  afterImageObservations: string[];
  repairLikely: boolean;
  confidence: number; // 0 to 1
  remainingConcerns: string[];
  recommendedStatus: 'keep_open' | 'resolution_review' | 'verified_resolved';
  forensicReasoning?: string;
}

export interface TimelineEvent {
  id: string;
  type: string;
  label: string;
  description: string;
  timestamp: string;
  actor: 'citizen' | 'civicproof_ai' | 'system' | 'department' | 'community';
  metadata?: Record<string, any>;
}

export interface CorroborationRecord {
  id: string;
  reportedAt: string;
  citizenNote?: string;
  imageDataUrl?: string;
  contributorName: string;
  contributorUid?: string;
}

export interface CivicIssue {
  id: string;
  dataOrigin?: 'user_report' | 'judge_demo';
  title: string;
  category: IssueCategory;
  status: IssueStatus;
  severity: Severity;
  harmScore: number;
  locationName: string;
  latitude: number;
  longitude: number;
  locationAccuracyMeters?: number;
  locationConfirmedByUser?: boolean;
  locationSource?: 'gps' | 'manual' | 'gps_plus_manual' | 'unknown';
  ward?: string;
  city?: string;
  locationShortLabel?: string;
  formattedAddress?: string;
  locality?: string;
  state?: string;
  country?: string;
  geolocationCapturedAt?: string;
  reportedAt: string;
  lastMeaningfulActionAt?: string;
  slaDays: number;
  departmentRoute: DepartmentRoute;
  riskFactors: string[];
  evidence: {
    photoUrl?: string;
    description: string;
    voiceTranscript?: string;
  };
  corroborations: CorroborationRecord[];
  timeline: TimelineEvent[];
  complaintPacket?: ComplaintPacket;
  escalationPacket?: EscalationPacket;
  resolutionVerification?: ResolutionVerification;
  // Infrastructure auditing and idempotency fields
  createdByUid?: string;
  clientSubmissionId?: string;
  idempotencyKey?: string;
  createdAt?: string;
  updatedAt?: string;
}
