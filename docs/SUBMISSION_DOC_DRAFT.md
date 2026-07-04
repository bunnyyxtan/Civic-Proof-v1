# CivicProof — Submission Document Draft
*Vibe2Ship Hackathon — Coding Ninjas x Google for Developers*

---

## 🏛️ 1. Problem Statement Selected
* **Problem Category**: Hyperlocal Public Safety and Municipal Grievance Inaction.
* **Problem Statement**: Traditional municipal complaint forms fail both citizens and officers. 
  1. **Redundant Noise**: Multiple citizens reporting the same street pothole or overflowing sewage grid create thousands of duplicate tickets that clog the municipal queue.
  2. **No Accountability**: Reports are submitted into a black box. There are no ticking timers visible to the public, meaning departments can ignore complaints indefinitely with zero consequence.
  3. **Routing Friction**: Citizens do not know which specific government division (e.g., BESCOM, BWSSB, BBMP) holds jurisdiction over their problem, leading to wrong classification and eventual abandonment.

---

## 🌟 2. Solution Overview
**CivicProof** is an intelligent accountability engine and evidence aggregator. Rather than acting as another passive complaint portal, CivicProof active-fuses individual reports into unified dockets of verified community harm. It extracts facts from citizen voice transcripts and photos, identifies duplicate issues within 450 meters to aggregate public standing, scores risk mathematically, dispatches official packets to specific departments, starts an active SLA countdown ("Silence Clock"), and automatically drafts legal escalations to commissioners when deadlines are breached.

---

## ✨ 3. Key Features
* **Cognitive Evidence Extraction**: Parses citizen photos and transcribes spoken voices into structured metadata (landmarks, hazard types, safety risks).
* **Duplicate-to-Corroboration Fusion**: Fuses similar active complaints in a 450-meter radius into a single master case docket, accumulating public weight (reporters) and evidence.
* **Deterministic Harm Score**: Re-computes public risk scores from 1 to 100 on every update, weighing category severity, population impact (corroborations), proximity to schools, and overdue duration.
* **Jurisdictional Routing Matrix**: Ruleset maps the issue to the exact government division holding responsibility with zero citizen friction.
* **The Silence Clock**: An unignorable, ticking countdown SLA showing the exact duration of government silence.
* **Automated Escalation Mobilization**: If the department ignores the case past its SLA, the system automatically drafts higher-level grievance appeal packages directed to senior ombudsmen and IAS commissioners.
* **Forensic Closure Audit**: Evaluates side-by-side photographic comparison of 'Before' and 'After' states to verify quality before sealing the case.

---

## 🛠️ 4. Technologies Used
* **Framework**: Next.js 15+ (App Router)
* **Frontend Style**: Tailwind CSS v4, Lucide React Icons
* **Animations**: Motion (for transitions and micro-interactions)
* **Type Safety & Schema Validation**: TypeScript, Zod
* **Data Flow**: React Context, State Managers, standard Web Audio APIs for real tactile feedback.

---

## ☁️ 5. Google Technologies Utilized
* **Google Gemini API**: Accessed server-side via the `@google/genai` SDK to run zero-shot structured JSON extraction on transcript strings, analyze visual content, and draft professional formal legal appeal packets.
* **Google Cloud Firestore**: Provides durable, multi-user real-time state synchronization, enabling case updates, corroborated timeline additions, and public tracking of active/breached/resolved dockets.

---

## 🏗️ 6. Architecture
```
[Citizen Input] -> [Voice / Photo Upload]
                         |
                         v
                [Gemini API Parser] -> Extracts structured metadata, risks, landmarks
                         |
                         v
          [Geomap Proximity Lookup (450m)]
             /                         \
    (Match Found)                 (No Match Found)
         /                               \
[Corroborate Existing Case]     [Create New Master Case File]
         |                               |
         \-----> [Harm Score Recalculator] <-----/
                         |
                         v
              [Smart Routing Engine] -> Mapped to BWSSB, BESCOM, BBMP, etc.
                         |
                         v
             [SLA Silence Clock (7 Days)] -> If breached, auto-compiles escalation letter
                         |
                         v
             [Photographic Repair Audit] -> Verified Closure -> RESOLVED
```

---

## 🤖 7. Agentic Depth
Unlike basic wrappers, CivicProof integrates a multi-agentic pipeline:
1. **The Ingest Agent**: Transforms noisy voice narratives and images into normalized JSON structures.
2. **The Auditor Agent**: Cross-references spatial coordinates and categories to verify duplicates.
3. **The Scoping Agent**: Evaluates geographical proximity to high-risk landmarks (schools, hospitals) to apply vulnerability multipliers.
4. **The Advocate Agent**: Translates public grievance data into dense, formal municipal complaints and subsequent escalation briefs.

---

## 💡 8. Innovation
CivicProof shifts the civic paradigm from **individual complaints** (vulnerable to apathy) to **collective evidence** (unignorable by law). Fusing reports under a unified case docket creates legal standing. The combination of the mathematical Harm Score and the visible Silence Clock brings immediate, measurable accountability to municipal public services.

---

## 📊 9. Impact
* **Reduces Municipal Backlog**: Groups hundreds of individual complaints into single-digit, highly-actionable dockets.
* **Amplifies Citizen Voice**: Fusing duplicates into corroborations means one's report actively supports a neighbor's existing report, increasing its urgency.
* **Exposes Bureaucratic Silence**: Quantifies administrative response delays, arming community associations with hard data for civic action.

---

## 🎥 10. Demo Flow
1. **Citizen Ingest**: A citizen files an open drain complaint near Saint Mary's School on Indiranagar 12th Main.
2. **AI Structuring**: Cognitive extraction maps key facts and identifies local child hazard risks.
3. **Deduplication Match**: A search finds another active case filed 60 meters away.
4. **Consolidation**: The report is merged into Case `CP-2026-W38A1` as a corroborating signature.
5. **Score Spike**: High-vulnerability school area and additional witnesses escalate Harm Score to `89` (Critical).
6. **Smart Route**: Assigned to BWSSB division.
7. **Letter Drafted**: Formal public grievance compiled detailing all 3 witness statements.
8. **Silence Clock Breach**: Time elapsed goes beyond 7 days SLA.
9. **Senior Escalation**: System compiles an SLA negligence report addressed to the BBMP Commissioner.
10. **Resolution Proof**: Construction workers cover the drain. A citizen uploads a verification photo, which is audited and marked "VERIFIED RESOLUTION".

---

## ⚠️ 11. Limitations and Future Scope
* **Limitations**: Current preset address routing is mapped to Bengaluru divisions. Real-time integration with governmental backends requires open APIs which are currently missing.
* **Future Scope**: Direct blockchain timestamps for immutable public proof, automated routing to municipal contractors' active WhatsApp channels, and decentralized, community-voted priority budgets using cumulative case harm weight.
