# CivicProof API Smoke Tests

This document describes how to execute, verify, and monitor the CivicProof product engine using the live production endpoints.

## 1. Operational & Readiness Endpoints

Use these endpoints to verify that the BTL Runtime Gateway, Supabase, and Node environments are properly configured.

### Health Check
```bash
curl -X GET http://localhost:3000/api/ops/health
```

### Readiness Check
```bash
curl -X GET http://localhost:3000/api/ops/readiness
```

### Runtime Diagnostics
```bash
curl -X GET http://localhost:3000/api/ops/runtime
```

---

## 2. Core Application Routes

### Get Active Cases
```bash
curl -X GET http://localhost:3000/api/cases
```

### Submit a New Report
```bash
curl -X POST http://localhost:3000/api/report \
  -H "Content-Type: application/json" \
  -d '{
    "report": {
      "locationName": "Indiranagar Primary School",
      "latitude": 12.9716,
      "longitude": 77.5946,
      "citizenNote": "Water leak on road near school",
      "reportedAt": "2026-07-04T10:45:00Z"
    }
  }'
```

---

## 3. BTL AI Analysis Endpoints

### Run Photographic and Contextual Analysis
```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "photoUrl": "data:image/jpeg;base64,...",
    "userNotes": "Water leak on road near Indiranagar primary school",
    "gps": {
      "latitude": 12.9716,
      "longitude": 77.5946
    }
  }'
```

### Generate a Complaint Draft
```bash
curl -X POST http://localhost:3000/api/ai/complaint \
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

### Verify Resolution via Photographic Audit
```bash
curl -X POST http://localhost:3000/api/ai/verify \
  -H "Content-Type: application/json" \
  -d '{
    "originalPhotoUrl": "https://example.com/before.jpg",
    "resolutionPhotoUrl": "https://example.com/after.jpg",
    "category": "water_leakage"
  }'
```
