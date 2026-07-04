# CivicProof API Smoke Tests

This document describes how to execute, verify, and monitor the CivicProof product engine using diagnostic endpoints.

## 1. Automated Test Sandbox
We provide an automated, in-memory sandboxed pipeline runner that validates our core workflows without impacting external databases.

### Programmatic Endpoint
* **URL:** `/api/demo/engine-smoke`
* **Method:** `GET` or `POST`
* **Response:**
```json
{
  "success": true,
  "timestamp": "2026-06-29T10:45:00Z",
  "logs": [
    "=== CIVICPROOF ENGINE SMOKE TEST RUN ===",
    "Seeded in-memory cases database successfully.",
    "--- STEP 1: Submit Initial Citizen Report ---",
    "SUCCESS: Case CP-WATR opened for: 'Critical Open Drain near School'",
    "- Decided Severity: CRITICAL",
    "- Calculated Harm Score: 88/100",
    "--- STEP 2: Submit Second Neighbor Report ---",
    "SUCCESS: Duplicate detected successfully!",
    "- Parent Case Linked: CP-WATR-A93E",
    "- Parent Case updated! New Harm Score boosted to 93/100"
  ]
}
```

---

## 2. Server AI Health Monitor
Assess if Gemini API keys are active, what model profiles are currently running, and if local storage overrides are active.

* **URL:** `/api/demo/ai-health`
* **Method:** `GET`
* **Response:**
```json
{
  "success": true,
  "timestamp": "2026-06-29T10:45:00Z",
  "geminiStatus": {
    "isConfiguredAndActive": true,
    "apiKeyLoaded": true,
    "apiKeyLength": 40,
    "textModel": "gemini-3.5-flash",
    "multimodalModel": "gemini-3.5-flash",
    "forceLocalStorageActive": false
  }
}
```

---

## 3. Manual CURL Examples

### Submit Report
```bash
curl -X POST http://localhost:3000/api/gemini/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "photoUrl": "data:image/jpeg;base64,...",
    "userNotes": "Water leak on road near Indiranagar primary school"
  }'
```

### Generate Complaint
```bash
curl -X POST http://localhost:3000/api/gemini/complaint \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "CP-WATR-15E3",
    "title": "Open Drain",
    "category": "water_leakage",
    "department": "BWSSB",
    "gpsString": "12.97, 77.59",
    "elapsedDays": 3,
    "analysisText": "Severe drainage overflow."
  }'
```
