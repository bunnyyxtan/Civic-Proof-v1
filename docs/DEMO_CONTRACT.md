# CivicProof Hackathon Demo Contract

This document provides verified assertions and code targets demonstrating the technological depth, agentic loop integrity, and impact metrics of CivicProof.

## 1. Verified Core Milestones

### Milestone A: Cognitive Evidence Extraction
* **Target:** `analyzeReportSmart(report)`
* **Input:** Visual photo + voice transcription / notes.
* **Extraction:** Category normalization, hazard elements, pedestrian risk factors.
* **Validation:** Verified via strict Zod schema checking.

### Milestone B: Duplicate-to-Corroboration
* **Target:** `findDuplicateCandidates(report, analysis, cases)`
* **Logic:** Computes exact Haversine metric plus semantic text similarity.
* **Threshold:** Overlaps **>= 72%** automatically map into an existing parent case, preventing duplicate docket fatigue and escalating public pressure.

### Milestone C: Math-Controlled Harm Score
* **Target:** `calculateHarmScore(input)`
* **Formula:** Pure, deterministic TypeScript logic with no hallucinations.
* **Milestone Assert:** An "Open drain near school" must score **>= 75** points out of 100, immediately flagging critical category.

### Milestone D: Active SLA Silence Clock
* **Target:** `getSilenceClock(issue)`
* **Logic:** Continuously tracks unaddressed municipal delays against ward citizen charters. If exceeded, automatically flags status as overdue.

### Milestone E: Forensic Photographic Verification
* **Target:** `verifyResolutionSmart(originalDesc, resolutionPhotoUrl, citizenVerificationNote)`
* **Cognitive Audit:** Compares visual resolution proof and resident comments against original defect logs, sealing the case file only if repairs are complete.

---

## 2. Programmatic Execution Check
The programmatic engine assertions can be run live at:
`/api/demo/engine-smoke`

This runs simulated on-site reports verifying classification, deduplication, scoring, and department dispatching within milliseconds.
