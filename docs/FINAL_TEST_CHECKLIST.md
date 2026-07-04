# CivicProof Final Test Checklist

This checklist documents the testing steps, regression verifications, and system validations required for CivicProof submission readiness.

---

## 💻 1. Local & Preview Tests
* [ ] **Clean Dependency Verification**: Run `npm install` to confirm all peer dependencies resolve without peer-dependency conflicts.
* [ ] **Compilation Validation**: Execute `npm run build` with `NODE_ENV=production` to verify clean production compilation. No TypeScript, Lint, or Webpack module resolution errors should occur.
* [ ] **Local Serve Check**: Start local development with `npm run dev` and navigate to `http://localhost:3000` to verify home view displays without hydration mismatches.

---

## 🌐 2. Deployed URL Tests
* [ ] **Development URL Validation**: Confirm active dev workspace serves and compiles on the Cloud Run development environment.
* [ ] **Shared URL Verification**: Access the public shared preview link from outside the developer console to confirm global assets are served.

---

## 🔌 3. Core API Endpoint Tests
* [ ] **Case Feed (`GET /api/cases`)**: Verify that calling this route returns an `ok: true` state and an array of existing cases.
* [ ] **Persistence Health (`GET /api/demo/persistence-health`)**: Run a request to verify the service status shows connected or gracefully routes to `local_storage_active` when keys are unconfigured.
* [ ] **DB Hydration (`POST /api/demo/seed-cases`)**: Confirm database seed routes populate standard items successfully.
* [ ] **Engine Smoke Suite (`GET /api/demo/engine-smoke`)**: Verify the response output has `success: true` and all assertions under the `validation` schema pass.
* [ ] **AI Model Check (`GET /api/demo/ai-health`)**: Confirm the endpoint detects whether Gemini is loaded and displays the exact model configuration in use.

---

## 🎥 4. Presentation & Demo Script Test
* [ ] **Demo Landing `/demo`**: Access `/demo` and confirm "Watch one report become civic proof" displays.
* [ ] **Interactive Progress Stepper**: Navigate sequentially from Step 1 through Step 10. Check if UI elements change (Phone Mockup, Extraction Grid, Map Circle, Recalculated Harm Scores, BWSSB letters, Silence clocks).
* [ ] **Live Simulation Mode**: Click "Run live demo" to ensure automated autoplay advances correctly.
* [ ] **Interactive Trigger Tests**:
  * [ ] Click "Re-Seed Database" to trigger live data hydration.
  * [ ] Click "Run Engine Smoke Test" to test mathematical logic live in front of judges.

---

## 🗄️ 5. Firestore Persistence Tests
* [ ] **Credentials Presence**: Verify environment detects standard Firestore project variables.
* [ ] **Graceful Fallback**: Unconfigure Firestore settings, restart the server, and confirm that the client falls back to browser memory storage without throwing fatal white screens of death.

---

## 🤖 6. Gemini Integration & Fallbacks
* [ ] **Active API Verification**: Submit a voice/text report on the main dashboard with an active `GEMINI_API_KEY` to ensure the NLP extraction works and populates timeline structures.
* [ ] **Fallback Ingestion**: Remove the Gemini key, and confirm that the local procedural fallback takes over, allowing full usage with heuristic categorization.

---

## 📱 7. Responsive & Aesthetic Layout Check
* [ ] **Desktop Fit**: Ensure that the application utilizes responsive limits (`max-w-7xl mx-auto`) to present dense information neatly on widescreen monitors.
* [ ] **Mobile Touch-Targets**: Scale the viewport to a mobile breakpoint. Confirm the following:
  * [ ] Sidebar or bottom navigation remains readable with tap-targets of at least 44px.
  * [ ] The interactive demo slider adjusts width gracefully without clipping layout boundaries.
  * [ ] Images are rendered with appropriate aspect ratios.
