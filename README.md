# CivicProof

### &ldquo;Citizens do not need another complaint form. They need civic proof.&rdquo;

CivicProof is a hyperlocal problem solver and accountability engine. It transforms unstructured civic complaints, tweets, and citizen voices into structured, aggregated, legally robust cases of verified community harm.

---

## 🏛️ Selected Problem Statement

Municipal grievance portals are built to fail by design. They suffer from:
1. **The Duplicate Noise Problem**: 50 individual citizens reporting the same pothole results in 50 separate tickets, creating administrative backlog and dilution.
2. **Systemic Government Apathy**: Reports are filed and quietly buried. There is no visible, binding countdown clock that penalizes administrative inaction.
3. **Filing Ambiguity**: Citizens do not know which complex municipal department (e.g. BBMP, BWSSB, BESCOM in Bengaluru) holds jurisdiction, causing wrong routing and dropped issues.

---

## 🚀 What CivicProof Does

CivicProof acts as an agentic intermediary between the community and municipal departments:
* **Evidence Consolidation**: Takes voice transcripts, photos, and geotags. If a duplicate is detected nearby, it compiles it as a **corroboration** of the master case rather than creating a new ticket.
* **Deterministic Harm Scoring**: Dynamically calculates a total public hazard score (1-100) based on safety severity, number of corroborators, proximity to schools/hospitals, and duration.
* **Smart Agency Routing**: Maps reports directly to correct municipal bodies based on jurisdictional categories and GPS coordinates.
* **Silence Clock Accountability**: Starts an active SLA countdown timer (7 days) the moment an issue is routed.
* **Automated Escalation Mobilization**: If the Silence Clock expires without resolution, the engine automatically drafts higher-level legal briefs targeted to commissioners and public ombudsmen.

---

## 🏗️ Architecture & Data Flow

```text
[ Citizen Intake ] (Photo, Notes, GPS)
       │
       ▼
[ BTL Runtime Vision/Text Analysis ]
       │
       ▼
[ Dedup / Corroboration Merge ] ────── (If duplicate detected)
       │
       ▼
[ Deterministic Harm Scoring ]
       │
       ▼
[ Authority Routing ]
       │
       ▼
[ Silence Clock Monitoring ]
       │
       ▼
[ Escalation Ladder ] (City → State → CPGRAMS)
       │
       ▼
[ RTI Generation ]
       │
       ▼
[ Before/After Resolution Proof ]
```

### Production Hygiene
Unlike typical hackathon prototypes, CivicProof is built with robust production-grade scaffolding:
- **Zod Validation**: Strict schema enforcement across all AI outputs and API endpoints.
- **Rate Limiting**: Built-in protection against spam and API abuse.
- **Audit Logs**: Immutable trailing logs for all system routing decisions and evidence processing.
- **Dead-Letter Queue**: Graceful fallback handling and retry mechanisms for network or AI timeouts.
- **Ops Endpoints**: Integrated `/api/ops/health`, `/api/ops/readiness`, and `/api/ops/runtime` for real-time observability.

---

## 💻 Tech Stack

* **Next.js 14.2.15 (App Router)**: High-performance, production-ready React framework.
* **Supabase**: Provides durable, multi-user real-time persistence of all active cases, timelines, and corroboration ledgers.
* **BTL Runtime Gateway**: All AI (text and vision) runs entirely on the BTL Gateway via OpenAI-compatible endpoints (`deepseek-v4-flash` for text, `gpt-4o-mini` for vision).
* **Tailwind CSS v4**: Adaptive, high-contrast visual interface styled with Inter and JetBrains Mono typography.

---

## 🛠️ How to Run

### Prerequisites
* Node.js (v18+)
* NPM (v10+)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file at the root:
```env
# BTL Runtime Gateway configuration
GATEWAY_API_KEY=
BTL_BASE_URL=https://api.badtheorylabs.com/v1
BTL_TEXT_MODEL=deepseek-v4-flash
BTL_VISION_MODEL=gpt-4o-mini

# Supabase Credentials for Persistence
SUPABASE_ENABLED=true
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Scheduled Jobs Configuration
CRON_SECRET=

# Google Maps Platform configuration
GOOGLE_MAPS_API_KEY=
```

### 3. Build & Compile
```bash
npm run build
```

### 4. Run Development Server
```bash
npm run dev
```

---

### **&ldquo;CivicProof turns posts into proof, duplicates into verification, and complaints into cases.&rdquo;**
