// src/lib/agent/pipeline.ts
// Standardized Workflow Orchestrator Pipeline for Case Creation

import { ReportIntake, CivicIssue, TimelineEvent, CorroborationRecord, IssueCategory } from "../civic/types";
import { analyzeReportSmart } from "../ai/aiAdapters";
import { findDuplicateCandidates } from "../civic/duplicateDetection";
import { calculateHarmScore } from "../civic/scoring";
import { routeDepartment } from "../civic/routing";
import { createTimelineEvent } from "../civic/timeline";
import { buildComplaintPacketFromAnalysis } from "../civic/packetGeneration";
import { extractCivicRiskSignals } from "../civic/riskSignals";

export interface PipelineSuccessResult {
  status: "new_case_created";
  case: CivicIssue;
  aiProvider: string;
}

export interface PipelineMergedResult {
  status: "duplicate_linked";
  parentCaseId: string;
  corroborationRecord: CorroborationRecord;
}

export type PipelineResult = PipelineSuccessResult | PipelineMergedResult;

export async function runReportPipeline(
  report: ReportIntake,
  existingCases: CivicIssue[]
): Promise<PipelineResult> {
  // 1. Trigger Smart AI Analysis
  const analysisResult = await analyzeReportSmart(report);
  const analysis = analysisResult.data;
  const aiProvider = analysisResult.meta.provider;

  // Enrich analysis with deterministic risk factors
  const deterministicRiskFactors = extractCivicRiskSignals(report.citizenNote || "", report.locationName);
  analysis.riskFactors = Array.from(new Set([...(analysis.riskFactors || []), ...deterministicRiskFactors]));

  // 2. Perform Duplicate Checks
  const duplicates = findDuplicateCandidates(report, analysis, existingCases);
  const topMatch = duplicates[0];

  if (topMatch && topMatch.similarityScore >= 0.72) {
    // Merge into Parent Case as Corroboration
    const id = `CORR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const record: CorroborationRecord = {
      id,
      reportedAt: report.reportedAt,
      citizenNote: report.citizenNote,
      imageDataUrl: report.imageDataUrl || report.imageUrl,
      contributorName: (report as any).reporterName || "Anonymous Corroborating Citizen",
    };

    return {
      status: "duplicate_linked",
      parentCaseId: topMatch.issueId,
      corroborationRecord: record,
    };
  }

  // 3. Create a Brand New Case
  const issueId = `CP-${analysis.normalizedCategory.toUpperCase().substring(0, 4)}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  // Route Department
  const deptRoute = routeDepartment({
    category: analysis.normalizedCategory,
    citizenNote: report.citizenNote,
    riskFactors: analysis.riskFactors,
  });

  // Calculate Harm Score
  const harmResult = calculateHarmScore({
    category: analysis.normalizedCategory,
    severity: analysis.severity,
    riskFactors: analysis.riskFactors,
    citizenNote: report.citizenNote,
    corroborationCount: 0,
    daysSilent: 0,
    isOverdue: false,
  });

  // Create complaint packet dockets offline deterministically
  const initialComplaint = buildComplaintPacketFromAnalysis(
    issueId,
    analysis.normalizedCategory.toUpperCase(),
    deptRoute.departmentName,
    report.locationName,
    report.citizenNote || "On-site citizen visual evidence submitted.",
    analysis.civicSummary,
    analysis.citizenImpact
  );

  // Compile Timeline Events
  const timeline: TimelineEvent[] = [
    createTimelineEvent("report_submitted", {
      actorName: "Anonymous Citizen",
      timestamp: report.reportedAt,
      description: `Citizen submitted visual proof at ${report.locationName}.`,
    }),
    createTimelineEvent("report_analyzed", {
      timestamp: report.reportedAt,
      description: `CivicProof AI verified defect category as "${analysis.normalizedCategory}" with ${Math.round(analysis.confidence * 100)}% confidence.`,
    }),
    createTimelineEvent("case_created", {
      timestamp: report.reportedAt,
      description: `Civic case file ${issueId} opened on public registry.`,
    }),
    createTimelineEvent("department_routed", {
      timestamp: report.reportedAt,
      description: `Automated route: Dispatched to ${deptRoute.departmentName} with ${deptRoute.slaDays}-day SLA.`,
    }),
    createTimelineEvent("complaint_generated", {
      timestamp: report.reportedAt,
      description: "Initial formal grievance packet compiled and queued for department filing.",
    }),
  ];

  const newCase: CivicIssue = {
    id: issueId,
    title: analysis.suggestedTitle,
    category: analysis.normalizedCategory,
    status: "routed",
    severity: analysis.severity,
    harmScore: harmResult.score,
    harmScoreBreakdown: harmResult.breakdown,
    locationName: report.locationName,
    latitude: report.latitude || 12.9716, // Default Bangalore
    longitude: report.longitude || 77.5946,
    reportedAt: report.reportedAt,
    lastMeaningfulActionAt: report.reportedAt,
    slaDays: deptRoute.slaDays,
    departmentRoute: deptRoute,
    riskFactors: analysis.riskFactors,
    evidence: {
      photoUrl: report.imageDataUrl || report.imageUrl,
      description: report.citizenNote || analysis.civicSummary,
    },
    corroborations: [],
    timeline,
    complaintPacket: initialComplaint,
  };

  return {
    status: "new_case_created",
    case: newCase,
    aiProvider,
  };
}
