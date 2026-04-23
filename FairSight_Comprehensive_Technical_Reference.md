# FairSight Complete Technical Reference & Logic Audit

This document serves as the absolute source of truth for the FairSight AI Bias Compliance Platform. It details every underlying technology, mathematical logic, component structure, API configuration, and Unique Selling Proposition (USP) currently implemented. Use this guide to audit, expand, or refactor the platform.

---

## 1. Unique Selling Propositions (USPs) & Features

### Major USPs & Core Features
1. **Multi-Model AI Consensus Engine:** FairSight does not rely on a single LLM. It queries Google Gemini (2.5-flash), Groq (Llama 3.3 70B), and Hugging Face (Mixtral 8x7B) concurrently to cross-verify bias root causes.
2. **Resilient "Zero-Crash" Fallback Architecture:** If Firebase is down, the system writes to a local `.fairsight_cache.json`. If an LLM hits a rate limit or 404s, the system aggregates the remaining successful votes. If the backend drops, the UI seamlessly falls back to a mathematical mock engine to preserve demo availability.
3. **In-Memory Privacy Sandbox (GDPR Compliant):** Datasets uploaded to FairSight are **never** committed to a physical disk or cloud database. They are processed entirely in server RAM.
4. **Cryptographic Audit Trails:** Rather than storing datasets, FairSight computes a SHA-256 fingerprint hash of the CSV matrix to bind cryptographic proof of the dataset to the generated compliance certificate.
5. **EU AI Act Readiness Pipeline:** Automatically categorizes metric violations into compliance risks (High/Medium/Low) explicitly designed around EU mandates for demographic parity and equalized odds.
6. **Live Predictive Monitoring (WebSockets):** Real-time monitoring of ML agent decisions simulating production data via raw FastAPI WebSockets without polling overhead.

### Minor Features & UX Enhancements
- **Dynamic PDF Certificate Generation:** Client-side text-based PDF export (`jsPDF`) eliminating heavy server-side puppeteer headless browsers.
- **Universal Demo-Auth:** A built-in gracefully degrading authentication context. If Google Firebase throws a `CONFIGURATION_NOT_FOUND` or keys expire, the UI automatically injects a "Demo Mode" profile without locking out the user.
- **Optimized Bundle Footprint:** Heavy animation libraries (Framer Motion) were stripped out in favor of native CSS `fade-up` keyframes, radically dropping initial First Load JS.
- **Batched Font Requests:** Google Fonts are prefetched and initialized cleanly in `layout.tsx` to stop FOUT (Flash of Unstyled Text).

---

## 2. API & Machine Learning Model Configuration

FairSight relies on an aggregated "Mixture of Experts" framework for narrative extraction.

### Authorized LLM Endpoints
| Provider | Model ID | Implementation Method | Fallback Strategy |
| :--- | :--- | :--- | :--- |
| **Google Gemini** | `gemini-2.5-flash` | `@google/generative-ai` native SDK | If Free-Tier 15 RPM quota is exceeded (429), the node is bypassed. |
| **Groq** | `llama-3.3-70b-versatile` | REST `fetch` to OpenAI-compatible `/1/chat/completions` | Replaced legacy `llama3-70b-8192` to resolve Groq API deprecation. |
| **Hugging Face** | `mistralai/Mixtral-8x7B-Instruct-v0.1` | REST `fetch` direct to base model path | Falls back to `HuggingFaceH4/zephyr-7b-beta` if Mixtral returns 503 loading. |

### API Logic Implementation (`frontend/lib/ai.ts`)
The `askHuggingFace` function specifically bypasses the standard OpenAI `/v1/chat/completions` route to avoid 404 gateway issues on serverless endpoints. It intercepts the user prompt and manually wraps it in pure `[INST] ... [/INST]` tags to trigger base instruction-tuning inference directly.

---

## 3. The "Run Audit" Pipeline (Technical Breakdown)

When a user clicks "Run Fairness Audit", the logic spans the client, the FastAPI backend, and the Next.js server network. 

**Step 1: Frontend Ingestion (`frontend/app/audit/page.tsx`)**
- The UI accepts the file via a multi-part drag-and-drop zone.
- It spins up an AbortController and immediately posts to `http://localhost:8000/analyze/` (FastAPI). 
- *Fallback Guard:* If the backend is off or returns 500, a `catch` block triggers `getMockMetrics(file.name)` ensuring the user flow is not broken.

**Step 2: Backend Statistical Math (`backend/routers/analyze.py`)**
- `Pandas` parses the CSV into a DataFrame dynamically.
- `hash_service.py` runs a `hashlib.sha256(df.to_csv().encode())`.
- `bias_engine.py` computes raw statistical metrics based on protected attributes (Race, Gender, Age). 

**Step 3: AI Consensus Request (`frontend/app/api/analyze/route.ts`)**
- The React client passes the raw statistics via `POST` to the internal Next.js `/api/analyze` route.
- Next.js unwraps the payload and simultaneously executes `Promise.all` across Groq, Gemini, and HF.
- **Consensus Logic:** 
  ```typescript
  // Prefer Groq (Fastest), then Gemini (Most Accurate), then HF, then Mock Fallback
  const primaryVerdict = verdicts.groq ?? verdicts.gemini ?? verdicts.huggingface ?? {
      summary: `Analysis completed. Fairness score: ${metrics?.fairness_score}/100.`,
      severity: metrics?.bias_severity ?? 'LOW',
      root_cause: 'AI analysis unavailable — all providers failed.',
      _fallback: true
  }
  ```
- The route binds the winning verdict and hashes to a unique `audit-${Date.now()}` ID.

**Step 4: Database Committal & Broadcast**
- Tries to commit to Firebase Firestore `audits` collection via `addDoc`.
- If `db` is null (or keys missing), it intercepts the error and physically writes to `fs.writeFileSync('.fairsight_cache.json')`.
- Finally, it pings the backend via webhook to broadcast the success to the Live Monitor Socket.

---

## 4. The Live Monitor Pipeline (Sockets)

**Backend Implementation (`backend/routers/events.py`):**
- Operates on a standard `asyncio` WebSocket gateway.
- `connected_clients: List[WebSocket]` holds all active TCP browser connections.
- During `POST /broadcast`, the backend uses a `Broadcaster` class to iterate and `await client.send_text(json)`.

**Frontend Consumption (`frontend/app/monitor/page.tsx`):**
- Utilizes a standard React `useEffect` to open `ws://localhost:8000/ws/events`.
- Triggers UI state updates (`setLogs`, `setMetrics`) on receiving JSON payloads, animating status badges via React re-renders.

---

## 5. Security & Authentication Architecture

**Email & Password Layer:**
FairSight transitioned away from heavy Firebase OAuth popups, implementing a custom-built email gateway.
- Found in: `frontend/lib/AuthContext.tsx`
- It uses `signInWithEmailAndPassword` and `createUserWithEmailAndPassword`.
- If a developer spins up the app without Firebase environment variables (`NEXT_PUBLIC_FIREBASE_API_KEY`), the `AuthContext` catches the Firebase `FirebaseError: auth/configuration-not-found` exception and seamlessly logs the user in as `demo@fairsight.ai` locally.

---

## 6. Project Structure & Component Master List

### Main Pages (Next.js App Router)
- `app/page.tsx` - Initial Landing page featuring trust indicators and CTA.
- `app/audit/page.tsx` - Core workspace. Manages loading bar states and pipeline orchestration.
- `app/audit/[id]/page.tsx` - Distinct read-only report view. Retrieves the audit ID and mounts the jsPDF exporter.
- `app/compliance/page.tsx` - Actionable compliance checklist for enterprise AI auditing.
- `app/monitor/page.tsx` - WebSocket realtime dashboard.
- `app/dashboard/page.tsx` - Aggregate statistics for historical audits.

### Shared React Components (`components/`)
- `AuthModal.tsx` - Absolute-positioned overlay for Sign In/Up. Manages forms.
- `BiasMetricBars.tsx` - Data visualizers rendering DP/EO metrics using dynamic width percentages.
- `FlipTestCard.tsx` - Visualizes the individual fairness delta between Group A and B profiles.
- `ModelConsensusPanel.tsx` - Multi-card layout revealing how each LLM voted (Gemini/Groq/HF) and the resulting `strong` vs `split` consensus string.
- `Nav.tsx` - Application navigation, housing the dynamic "Sign In" vs "Logout" buttons via `useAuth()`.
- `VerdictCard.tsx` - Core red/green compliance badge displaying "GUILTY" or "CLEAR".

### Internal Backend Services (`backend/services/`)
- `bias_engine.py` - Contains the math logic:
  - **Demographic Parity (DP):** `P(Outcome | Protected Group) - P(Outcome | Unprotected Group)`
  - **Equalized Odds (EO):** Validates True Positive Rate delta across subgroups.
- `flip_test.py` - Inverts a single feature in a row (e.g., changes `race="white"` to `race="black"`) and checks if the ML model flips the output decision. Used for calculating "Individual Fairness" gap.
- `pii_detector.py` - Basic regex scanning to warn users if SSNs/Emails are detected in the dataset.

---
*Created dynamically for project continuity and handoff.*
