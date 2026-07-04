// src/lib/civic/scoring.ts
// Deterministic Harm Score Engine

import { IssueCategory, Severity, HarmScoreResult } from "./types";
import { extractCivicRiskSignals } from "./riskSignals";

export interface HarmScoreInput {
  category: IssueCategory;
  severity: Severity;
  riskFactors?: string[];
  citizenNote?: string;
  corroborationCount: number;
  daysSilent: number;
  isOverdue: boolean;
}

export function calculateHarmScore(input: HarmScoreInput): HarmScoreResult {
  const reasons: string[] = [];

  // 1. safetyHazard: Category Base + Severity Multiplier
  let baseRisk = 10;
  if (input.category === "water_leakage") {
    baseRisk = 20;
    reasons.push("Category: Water leakage/drainage carries higher sanitation & flooding hazard base score (+20)");
  } else if (input.category === "road_damage") {
    baseRisk = 15;
    reasons.push("Category: Road damage carries structural transit crash risk base score (+15)");
  } else if (input.category === "waste_management") {
    baseRisk = 10;
    reasons.push("Category: Solid waste accumulation carries sanitation baseline score (+10)");
  } else if (input.category === "streetlight") {
    baseRisk = 8;
    reasons.push("Category: Dark streetlights carry pedestrian safety & crime baseline score (+8)");
  }

  let multiplier = 1.0;
  if (input.severity === "low") {
    multiplier = 1.0;
    reasons.push("Severity multiplier set to 1.0x (Low severity)");
  } else if (input.severity === "medium") {
    multiplier = 1.5;
    reasons.push("Severity multiplier set to 1.5x (Medium severity)");
  } else if (input.severity === "high") {
    multiplier = 2.0;
    reasons.push("Severity multiplier set to 2.0x (High severity)");
  } else if (input.severity === "critical") {
    multiplier = 2.5;
    reasons.push("Severity multiplier set to 2.5x (Critical severity)");
  }

  const rawSafetyHazard = baseRisk * multiplier;
  const safetyHazard = Math.min(25, Math.max(0, rawSafetyHazard));

  // 2. vulnerabilityFactor: Vulnerability Keywords Check
  const note = (input.citizenNote || "").toLowerCase();
  const derivedSignals = extractCivicRiskSignals(input.citizenNote || "");
  const riskList = Array.from(new Set([...(input.riskFactors || []), ...derivedSignals])).map(r => r.toLowerCase());
  
  const hasVulnerabilityKeywords = [
    "school", "hospital", "junction", "market", "bus stop", "pedestrian", "wheelchair", "children"
  ].some(kw => note.includes(kw) || riskList.some(r => r.includes(kw)));

  let rawVulnerabilityFactor = 0;
  if (hasVulnerabilityKeywords) {
    rawVulnerabilityFactor += 15;
    reasons.push("High Vulnerability Area detected: Proximity to schools, children, hospitals, or high-density pedestrian junctions (+15)");
  }
  const vulnerabilityFactor = Math.min(25, Math.max(0, rawVulnerabilityFactor));

  // 3. durationFactor: Hazard Keywords + Silence + Overdue
  let rawDurationFactor = 0;
  const hasHazardKeywords = [
    "stagnant water", "mosquito", "contamination", "two-wheeler", "open drain", "flooding", "leak"
  ].some(kw => note.includes(kw) || riskList.some(r => r.includes(kw)));

  if (hasHazardKeywords) {
    rawDurationFactor += 15;
    reasons.push("Active Environmental Hazard detected: Open drains, standing water, vector breeding, or waterlogging (+15)");
  }

  const silenceImpact = input.daysSilent * 2;
  if (silenceImpact > 0) {
    rawDurationFactor += silenceImpact;
    reasons.push(`Silence duration accumulation: ${input.daysSilent} days without meaningful action (+${silenceImpact})`);
  }
  if (input.isOverdue) {
    rawDurationFactor += 10;
    reasons.push("SLA Breach Event: Official citizen charter resolution timeline expired (+10)");
  }
  const durationFactor = Math.min(25, Math.max(0, rawDurationFactor));

  // 4. publicImpact: Corroboration Scale
  const rawPublicImpact = input.corroborationCount * 5;
  if (rawPublicImpact > 0) {
    reasons.push(`Neighborhood Corroboration Ledger: ${input.corroborationCount} citizen verifications amplify public demand (+${rawPublicImpact})`);
  }
  const publicImpact = Math.min(25, Math.max(0, rawPublicImpact));

  const finalScore = Math.min(100, safetyHazard + publicImpact + vulnerabilityFactor + durationFactor);
  const score = Math.round(finalScore);

  // Determine Band
  let band: 'low' | 'medium' | 'high' | 'critical' = "low";
  if (score >= 75) {
    band = "critical";
  } else if (score >= 50) {
    band = "high";
  } else if (score >= 25) {
    band = "medium";
  }

  return {
    score,
    band,
    reasons,
    breakdown: {
      safetyHazard,
      publicImpact,
      vulnerabilityFactor,
      durationFactor
    }
  };
}
