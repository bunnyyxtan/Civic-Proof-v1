// src/lib/ai/schemas.ts
// Zod Schemas for API and AI Contracts

import { z } from "zod";

export const IssueCategorySchema = z.enum([
  "road_damage",
  "waste_management",
  "streetlight",
  "water_leakage",
]);

export const IssueStatusSchema = z.enum([
  "reported",
  "analyzed",
  "duplicate_found",
  "corroborating",
  "routed",
  "complaint_ready",
  "overdue",
  "escalated",
  "resolution_review",
  "verified_resolved",
]);

export const SeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const ReportIntakeSchema = z.object({
  imageDataUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  locationName: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  citizenNote: z.string().optional(),
  selectedCategory: IssueCategorySchema.optional(),
  reportedAt: z.string(),
  dataOrigin: z.enum(["user_report", "judge_demo"]).optional(),
});

export const AIAnalysisResultSchema = z.object({
  detectedIssue: z.string(),
  normalizedCategory: IssueCategorySchema,
  severity: SeveritySchema,
  confidence: z.number().min(0).max(1),
  visibleEvidence: z.array(z.string()),
  riskFactors: z.array(z.string()),
  missingEvidence: z.array(z.string()),
  recommendedDepartment: z.string(),
  civicSummary: z.string(),
  citizenImpact: z.string(),
  suggestedTitle: z.string(),
  harmSignals: z.array(z.string()),
});

export const DuplicateCandidateSchema = z.object({
  issueId: z.string(),
  title: z.string(),
  distanceMeters: z.number(),
  similarityScore: z.number().min(0).max(1),
  matchReasons: z.array(z.string()),
  recommendation: z.enum(["merge", "create_new", "review"]),
});

export const HarmScoreResultSchema = z.object({
  score: z.number().min(0).max(100),
  band: z.enum(["low", "medium", "high", "critical"]),
  reasons: z.array(z.string()),
});

export const DepartmentRouteSchema = z.object({
  departmentId: z.string(),
  departmentName: z.string(),
  slaDays: z.number(),
  escalationLabel: z.string(),
  routeReason: z.string(),
  confidence: z.number().min(0).max(1),
});

export const SilenceClockResultSchema = z.object({
  daysSilent: z.number(),
  hoursSilent: z.number(),
  isOverdue: z.boolean(),
  slaDays: z.number(),
  label: z.string(),
  tone: z.enum(["neutral", "watch", "overdue", "critical"]),
  nextAction: z.string(),
  explanation: z.string(),
});

export const ComplaintPacketSchema = z.object({
  recipientDepartment: z.string(),
  subject: z.string(),
  formalBody: z.string().min(1),
  evidenceSummary: z.string(),
  citizenImpact: z.string(),
  requestedAction: z.string(),
  tone: z.string(),
  generatedAt: z.string(),
});

export const EscalationPacketSchema = z.object({
  escalationReason: z.string(),
  daysSilent: z.number(),
  slaBreached: z.boolean(),
  unresolvedEvidence: z.array(z.string()),
  communityCorroborationSummary: z.string(),
  formalBody: z.string(),
  generatedAt: z.string(),
});

export const ResolutionVerificationSchema = z.object({
  beforeImageObservations: z.array(z.string()),
  afterImageObservations: z.array(z.string()),
  repairLikely: z.boolean(),
  confidence: z.number().min(0).max(1),
  remainingConcerns: z.array(z.string()),
  recommendedStatus: z.enum(["keep_open", "resolution_review", "verified_resolved"]),
  forensicReasoning: z.string().optional(),
});

export const TimelineEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  description: z.string(),
  timestamp: z.string(),
  actor: z.enum(["citizen", "civicproof_ai", "system", "department", "community"]),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const CivicIssueSchema = z.object({
  id: z.string(),
  dataOrigin: z.enum(["user_report", "judge_demo"]).optional(),
  title: z.string(),
  category: IssueCategorySchema,
  status: IssueStatusSchema,
  severity: SeveritySchema,
  harmScore: z.number().min(0).max(100),
  locationName: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  locationAccuracyMeters: z.number().optional(),
  locationConfirmedByUser: z.boolean().optional(),
  locationSource: z.enum(["gps", "manual", "gps_plus_manual", "unknown"]).optional(),
  ward: z.string().optional(),
  city: z.string().optional(),
  locationShortLabel: z.string().optional(),
  formattedAddress: z.string().optional(),
  locality: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  geolocationCapturedAt: z.string().optional(),
  reportedAt: z.string(),
  lastMeaningfulActionAt: z.string().optional(),
  slaDays: z.number(),
  departmentRoute: DepartmentRouteSchema,
  riskFactors: z.array(z.string()),
  evidence: z.object({
    photoUrl: z.string().optional(),
    description: z.string(),
    voiceTranscript: z.string().optional(),
  }),
  corroborations: z.array(
    z.object({
      id: z.string(),
      reportedAt: z.string(),
      citizenNote: z.string().optional(),
      imageDataUrl: z.string().optional(),
      contributorName: z.string(),
    })
  ),
  timeline: z.array(TimelineEventSchema),
  complaintPacket: ComplaintPacketSchema.optional(),
  escalationPacket: EscalationPacketSchema.optional(),
  resolutionVerification: ResolutionVerificationSchema.optional(),
  // Infrastructure auditing and idempotency fields
  createdByUid: z.string().optional(),
  clientSubmissionId: z.string().optional(),
  idempotencyKey: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
