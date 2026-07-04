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
* [ ] **Operations Health (`GET /api/ops/health`)**: Run a request to verify the service status shows connected or gracefully routes to `local_storage_active` when keys are unconfigured.
* [ ] **Readiness Status (`GET /api/ops/readiness`)**: Verify the response output has `overallOk: true` and correctly identifies configured BTL AI models and Supabase.
* [ ] **Runtime Diagnostic (`GET /api/ops/runtime`)**: Confirm the endpoint successfully reports node versions and build environment parameters.

---

## 🎥 4. Presentation & Demo Script Test
* [ ] **Demo Landing `/demo`**: Access `/demo` and confirm "Watch one report become civic proof" displays.
* [ ] **Interactive Progress Stepper**: Navigate sequentially from Step 1 through Step 10. Check if UI elements change (Phone Mockup, Extraction Grid, Map Circle, Recalculated Harm Scores, BWSSB letters, Silence clocks).
* [ ] **Live Simulation Mode**: Click "Run live demo" to ensure automated autoplay advances correctly.

---

## 🗄️ 5. Supabase Persistence Tests
* [ ] **Credentials Presence**: Verify environment detects standard Supabase project variables.
* [ ] **Graceful Fallback**: Unconfigure Supabase settings, restart the server, and confirm that the client falls back to browser memory storage without throwing fatal white screens of death.

---

## 🤖 6. BTL Gateway Integration & Fallbacks
* [ ] **Active API Verification**: Submit a text/photo report on the main dashboard with an active `GATEWAY_API_KEY` to ensure the NLP extraction works and populates timeline structures via BTL models.
* [ ] **Fallback Ingestion**: Remove the GATEWAY_API_KEY, and confirm that the local procedural fallback takes over, allowing full usage with deterministic categorization.

---

## 📱 7. Responsive & Aesthetic Layout Check
* [ ] **Desktop Fit**: Ensure that the application utilizes responsive limits (`max-w-7xl mx-auto`) to present dense information neatly on widescreen monitors.
* [ ] **Mobile Touch-Targets**: Scale the viewport to a mobile breakpoint. Confirm the following:
  * [ ] Sidebar or bottom navigation remains readable with tap-targets of at least 44px.
  * [ ] The interactive demo slider adjusts width gracefully without clipping layout boundaries.
  * [ ] Images are rendered with appropriate aspect ratios.
