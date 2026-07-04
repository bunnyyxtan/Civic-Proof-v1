# CivicProof Agentic Workflow Architecture

This document describes how CivicProof orchestrates the 10-step agentic core loop to build high-integrity, evidence-backed civic case files out of raw community posts.

---

## 1. The 10-Step Core Loop

```
  [Citizen Intake]
         │
         ▼
 1. Geotag & Photo Intake
         │
         ▼
 2. AI Evidence Extraction (Gemini)
         │
         ▼
 3. Proximity Sweep (Deduplication) ──(Similarity >= 0.72)──► [Corroboration Link]
         │                                                      - Merge with Parent Case
         ▼ (Similarity < 0.72)                                   - Boost Harm Score
 4. Open New Case File
         │
         ▼
 5. Deterministic Harm Score (Category, Severity, Proximity, Delay)
         │
         ▼
 6. Department Routing Matrix (BBMP / BWSSB)
         │
         ▼
 7. Compile Complaint Packet (Grievance representation)
         │
         ▼
 8. Silence Clock SLA Countdown (Daily checks)
         │
         ▼
 9. Escalation Docket Generation (Overdue triggers)
         │
         ▼
10. Forensic Resolution Audit (Post-repair photo analysis) ──► [Seal Case]
```

---

## 2. Duplicate Detection & Corroboration Logic
Rather than treating multiple reports of the same issue as spam, CivicProof converts them into **collective proof**.

* **Proximity Check:** Uses Haversine math (`src/lib/civic/duplicateDetection.ts`) to calculate distance.
* **Proximity Thresholds:**
  * **Immediate block (<150m):** High likelihood of being the identical issue.
  * **Neighborhood block (150m - 450m):** Medium-high proximity block.
* **Text Keyword Overlaps:** Matches shared semantic tags (e.g., `school`, `drain`, `sewage`).
* **Merge Decision:** If composite score is **>= 0.72**, the issue is merged into the parent case, saving municipal bandwidth and strengthening the local voice.

---

## 3. Harm Score Mathematical Formula
Our scoring engine (`src/lib/civic/scoring.ts`) computes a dynamic public hazard score from 0 to 100 points:

$$\text{Harm Score} = \text{Base Risk} \times \text{Severity Multiplier} + \text{Vulnerability Factor} + \text{Environmental Risk} + \text{Corroboration Factor} + \text{Silence Factor}$$

1. **Base Risk:** `water_leakage = 20`, `road_damage = 15`, `waste_management = 10`, `streetlight = 8`.
2. **Severity Multiplier:** `low = 1.0`, `medium = 1.5`, `high = 2.0`, `critical = 2.5`.
3. **Vulnerability Factor:** `+15` points if located near schools, hospitals, or dense transit zones.
4. **Environmental Risk:** `+15` points if open stagnant blackwater, vector breeding, or waterlogging is active.
5. **Corroboration Scale:** `+5` points per unique neighbor signature, capped at `+20` points.
6. **Silence Factor:** `+2` points per unaddressed day post-SLA breach, plus an immediate `+10` points on initial breach.

---

## 4. Silence Clock & SLA Breaches
The Silence Clock (`src/lib/civic/silenceClock.ts`) acts as a persistent watchdog:
* **Road Damage SLA:** 7 Days
* **Water Leakage/Flooding SLA:** 2 Days (Urgent health hazard)
* **Waste Management SLA:** 3 Days
* **Streetlight Failure SLA:** 5 Days

When elapsed duration exceeds the designated SLA, the Silence Clock triggers warning alerts, shifts case statuses to `overdue`, and unlocks administrative escalation options.
