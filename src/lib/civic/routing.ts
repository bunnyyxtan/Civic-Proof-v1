// src/lib/civic/routing.ts
// Automated department routing and dispatch matrix

import { IssueCategory, DepartmentRoute } from "./types";
import { DEPARTMENTS, DEFAULT_SLAS } from "./constants";

export interface RoutingInput {
  category: IssueCategory;
  citizenNote?: string;
  riskFactors?: string[];
}

export function routeDepartment(input: RoutingInput): DepartmentRoute {
  const deptInfo = DEPARTMENTS[input.category];
  const slaDays = DEFAULT_SLAS[input.category];
  
  let routeReason = `Standard automated routing for ${input.category} based on Ward Grievance Charter.`;
  let confidence = 0.95;

  const text = `${input.citizenNote || ""} ${(input.riskFactors || []).join(" ")}`.toLowerCase();

  // Special routing triggers
  if (input.category === "water_leakage") {
    if (text.includes("open drain") || text.includes("stagnant water") || text.includes("mosquito") || text.includes("contamination")) {
      routeReason = "Critical routing match: Open drain / stagnant water detected. Dispatched directly to BWSSB Stormwater Drains & Public Health department to mitigate local epidemics.";
      confidence = 0.99;
    } else {
      routeReason = "Standard routing match: Public water supply main-line leak mapped directly to BWSSB engineering cell.";
    }
  } else if (input.category === "road_damage") {
    if (text.includes("school") || text.includes("children")) {
      routeReason = "High-urgency routing match: Severe structural pothole located in school safety zone. Dispatched to BBMP Road Infrastructure Department.";
      confidence = 0.98;
    } else {
      routeReason = "Standard routing match: Road infrastructure damage mapped to BBMP Road Infrastructure division.";
    }
  } else if (input.category === "waste_management") {
    if (text.includes("smell") || text.includes("odor") || text.includes("rot")) {
      routeReason = "Priority routing match: Decomposing organic solid waste reported. Routed to BBMP Solid Waste Management Division for immediate clearing.";
      confidence = 0.96;
    } else {
      routeReason = "Standard routing match: Solid waste dumping mapped to BBMP Sanitation division.";
    }
  } else if (input.category === "streetlight") {
    if (text.includes("dark") || text.includes("safety") || text.includes("crime")) {
      routeReason = "Priority routing match: Dark corridor reported, raising local safety and security liabilities. Dispatched to BBMP Electrical Division.";
      confidence = 0.97;
    } else {
      routeReason = "Standard routing match: Streetlight fault dispatched to BBMP Electrical Department.";
    }
  }

  return {
    departmentId: deptInfo.id,
    departmentName: deptInfo.name,
    slaDays,
    escalationLabel: deptInfo.escalationLabel,
    routeReason,
    confidence,
  };
}
