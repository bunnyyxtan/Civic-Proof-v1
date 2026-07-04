# CivicProof AI Contract Specification

This document details the formal interfaces, schemas, and contract rules binding the CivicProof agentic workflow and the Gemini visual-cognitive models.

## 1. Scope and Boundaries
Deterministic application layers own critical decision flows. The AI operates exclusively as a cognitive analysis and documentation generation proxy.

| Dimension | AI Ownership (Gemini) | Deterministic Application Ownership |
| :--- | :--- | :--- |
| **Case ID generation** | ❌ Forbidden | ✅ Automated Cryptographic Generation |
| **Issue Category** | ✅ Recommended Classification | ✅ Standard Mapping Matrix Verification |
| **Harm Score** | ❌ Forbidden | ✅ Calculated mathematical sum |
| **Department Routing** | ✅ Suggested Entity | ✅ Standard Dispatch Map Matrix |
| **Timeline Logging** | ❌ Forbidden | ✅ Factory state transitions |
| **Complaint Packing** | ✅ Multi-paragraph narrative drafting | ✅ Offline fallbacks & templates |
| **Escalation Eligibility**| ❌ Forbidden | ✅ Silence Clock & SLA Breach detection |
| **Resolution Verification**| ✅ Visual forensic similarity recommendation | ✅ Sealed Case status transition |

---

## 2. Zod Contracts

### Report Analysis Input
```typescript
export const ReportIntakeSchema = z.object({
  imageDataUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  locationName: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  citizenNote: z.string().optional(),
  selectedCategory: IssueCategorySchema.optional(),
  reportedAt: z.string(),
});
```

### AI Structured Output Contract
```typescript
export const AIAnalysisResultSchema = z.object({
  detectedIssue: z.string(),
  normalizedCategory: z.enum(["road_damage", "waste_management", "streetlight", "water_leakage"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
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
```

### Forensic Resolution Audit Output Contract
```typescript
export const ResolutionVerificationSchema = z.object({
  beforeImageObservations: z.array(z.string()),
  afterImageObservations: z.array(z.string()),
  repairLikely: z.boolean(),
  confidence: z.number().min(0).max(1),
  remainingConcerns: z.array(z.string()),
  recommendedStatus: z.enum(["keep_open", "resolution_review", "verified_resolved"]),
  forensicReasoning: z.string().optional(),
});
```

---

## 3. Prompts & Security Rules
* **No Prose, Pure JSON:** All generative prompts instruct models to omit markdown fences and return purely parseable JSON strings.
* **API Key Safety:** Keys are retrieved strictly server-side using `process.env.GEMINI_API_KEY`. No client-side leaking is permitted.
* **Graceful Failure:** Any JSON, parsing, or API failure triggers a corresponding local fallback model inside `src/lib/ai/mockAi.ts`.
