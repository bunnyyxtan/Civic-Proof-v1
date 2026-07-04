// src/lib/civic/duplicateDetection.ts
// Deterministic duplicate-to-corroboration checker

import { ReportIntake, AIAnalysisResult, DuplicateCandidate, CivicIssue } from "./types";

// 1. Calculate Haversine distance in meters
export function getGPSDistanceInMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function findDuplicateCandidates(
  report: ReportIntake,
  analysis: AIAnalysisResult,
  existingCases: CivicIssue[]
): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];

  for (const c of existingCases) {
    if (c.status === "verified_resolved") continue;

    let similarityScore = 0;
    const matchReasons: string[] = [];
    let distanceMeters = 999999;

    // Check GPS Distance
    const hasReportCoords = report.latitude !== undefined && report.longitude !== undefined;
    if (hasReportCoords) {
      distanceMeters = getGPSDistanceInMeters(
        report.latitude!, report.longitude!,
        c.latitude, c.longitude
      );
    } else {
      // If no coordinates, mock a distance based on location name similarity or baseline
      const loc1 = report.locationName.toLowerCase();
      const loc2 = c.locationName.toLowerCase();
      if (loc1 === loc2) {
        distanceMeters = 10;
      } else if (loc1.includes("indiranagar") && loc2.includes("indiranagar")) {
        distanceMeters = 300;
      } else {
        distanceMeters = 800;
      }
    }

    // Category Match
    const categoryMatches = analysis.normalizedCategory === c.category;
    if (categoryMatches) {
      similarityScore += 0.35;
      matchReasons.push("Identical issue category classification: " + c.category);
    } else {
      // Non-matching category cannot be a duplicate
      continue;
    }

    // Distance Scoring
    if (distanceMeters <= 150) {
      similarityScore += 0.45;
      matchReasons.push(`Extreme proximity: Issue is situated within immediate on-site radius (${Math.round(distanceMeters)}m)`);
    } else if (distanceMeters <= 450) {
      similarityScore += 0.25;
      matchReasons.push(`Moderate proximity: Located within neighborhood block radius (${Math.round(distanceMeters)}m)`);
    } else if (distanceMeters <= 800) {
      similarityScore += 0.10;
      matchReasons.push(`Borderline proximity: Located in same general sector (${Math.round(distanceMeters)}m)`);
    }

    // Text Keyword Overlap
    const reportText = `${report.citizenNote || ""} ${analysis.detectedIssue}`.toLowerCase();
    const caseText = `${c.title} ${c.evidence.description}`.toLowerCase();

    const sharedKeywords = ["drain", "pothole", "wire", "sewage", "garbage", "trash", "leak", "light", "school", "water", "cable"];
    let overlapCount = 0;
    for (const kw of sharedKeywords) {
      if (reportText.includes(kw) && caseText.includes(kw)) {
        overlapCount++;
      }
    }

    if (overlapCount >= 3) {
      similarityScore += 0.20;
      matchReasons.push(`High conceptual keyword overlap: Shared core terms ("${sharedKeywords.filter(kw => reportText.includes(kw) && caseText.includes(kw)).join(", ")}")`);
    } else if (overlapCount >= 1) {
      similarityScore += 0.10;
      matchReasons.push("Minor conceptual keyword overlap");
    }

    // Cap at 1.0
    similarityScore = Math.min(1.0, Math.max(0, similarityScore));

    let recommendation: 'merge' | 'create_new' | 'review' = "create_new";
    if (similarityScore >= 0.72) {
      recommendation = "merge";
    } else if (similarityScore >= 0.45) {
      recommendation = "review";
    }

    candidates.push({
      issueId: c.id,
      title: c.title,
      distanceMeters: Math.round(distanceMeters),
      similarityScore: parseFloat(similarityScore.toFixed(2)),
      matchReasons,
      recommendation,
    });
  }

  // Sort descending by similarity
  return candidates.sort((a, b) => b.similarityScore - a.similarityScore);
}
