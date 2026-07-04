// src/lib/civic/constants.ts
// Constants for CivicProof Engine

import { IssueCategory, Severity } from "./types";

export const ISSUE_CATEGORIES: Record<IssueCategory, string> = {
  road_damage: "Pothole & Road Damage",
  waste_management: "Garbage & Waste Management",
  streetlight: "Streetlight Malfunction",
  water_leakage: "Water Leakage & Drainage Overflow",
};

export const SEVERITY_LEVELS: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const DEFAULT_SLAS: Record<IssueCategory, number> = {
  road_damage: 7,      // 7 days
  waste_management: 3, // 3 days
  streetlight: 5,      // 5 days
  water_leakage: 2,     // 2 days (flooding is urgent)
};

export const DEPARTMENTS: Record<IssueCategory, { id: string; name: string; escalationLabel: string }> = {
  road_damage: {
    id: "MUNICIPAL_ROAD_INFRA",
    name: "Municipal Road Infrastructure Department",
    escalationLabel: "Chief Engineer (Road Infrastructure)",
  },
  waste_management: {
    id: "MUNICIPAL_SWM",
    name: "Municipal Solid Waste Management Division",
    escalationLabel: "Joint Commissioner (Solid Waste Management)",
  },
  streetlight: {
    id: "MUNICIPAL_STREETLIGHTS",
    name: "Municipal Electrical Department (Street Lighting Cell)",
    escalationLabel: "Superintending Engineer (Electrical)",
  },
  water_leakage: {
    id: "MUNICIPAL_WATER_SUPPLY",
    name: "Municipal Water Supply and Sewerage Board",
    escalationLabel: "Chief Engineer (Maintenance & Sewerage)",
  },
};
