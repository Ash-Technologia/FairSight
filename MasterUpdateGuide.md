# FairSight — Codespace Agent Implementation Prompt

# ═══════════════════════════════════════════════════════════════════

# VERSION: Production-ready. Zero mock data. Zero placeholders

# READ THIS ENTIRE DOCUMENT BEFORE WRITING A SINGLE LINE OF CODE

# ═══════════════════════════════════════════════════════════════════

---

## 0. PROJECT CONTEXT — READ FIRST

You are working on **FairSight**, an AI bias diagnostic platform.

**Stack:**

- Frontend: Next.js 14 (App Router), TypeScript, Tailwind (utility-only)
- Backend: FastAPI (Python 3.11), Uvicorn
- Database: Firebase Firestore + local JSON cache fallback
- AI: Gemini 1.5 Flash, Groq (Llama3-70b), HuggingFace (Mistral-7B)
- CSS: Custom CSS variables defined in globals.css (--navy, --teal, --teal-light, --teal-dark, --red, --amber, --border, --white, --offwhite, --slate, --muted, --dim)

**Existing working features (DO NOT BREAK):**

- File upload → FastAPI bias analysis → AI tribunal (3 models) → verdict report
- bias_engine.py: max-penalty fairness scoring, GUILTY/CLEAR/BORDERLINE verdict
- shap_service.py: proxy feature detection with ID column exclusion
- flip_test.py: counterfactual flip detection
- Firebase Firestore save + local .fairsight_cache.json fallback
- PDF export via jsPDF
- ModelConsensusPanel showing 3 AI model verdicts
- Live monitor (WebSocket feed from FastAPI)

**Before starting each feature:** run `npm run build` and `uvicorn main:app` to confirm baseline is working.

---

## 1. ENVIRONMENT SETUP VERIFICATION

Before implementing anything, verify these env vars exist in `frontend/.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
GOOGLE_GEMINI_API_KEY=
GROQ_API_KEY=
HUGGINGFACE_API_KEY=
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

And in `backend/.env`:

```
SLACK_WEBHOOK_URL=       (optional — user sets this via UI)
DISCORD_WEBHOOK_URL=     (optional — user sets this via UI)
```

If any are missing, print a clear error and stop. Do not proceed with mock values.

---

## 2. IMPLEMENTATION ORDER

Implement features in EXACTLY this order. Complete and verify each before starting the next.

```
P1 → Counterfactual Sandbox
P2 → Webhook Alerts (Slack/Discord/Teams)
P3 → Intersectional Bias Radar Chart
P4 → Auto-Mitigation (One-Click Fix)
P5 → Pre-Flight Scanner
P6 → Transparency Badge
P7 → Industry Benchmarks
P8 → API Key & Quota Hub
P9 → Fairness Constitution Editor
```

---

## ═══════════════════════════════════════════════

## P1 — COUNTERFACTUAL SANDBOX

## "Same person. Changed race. Loan denied."

## ═══════════════════════════════════════════════

### What to build

An interactive playground where the user fills in a fictional applicant profile.
The system shows the model's predicted decision. A "Flip Demographics" button
changes ONLY protected attributes (race, gender). The decision updates instantly.
This is pure frontend — no backend call needed.

### Files to create/modify

- `frontend/app/sandbox/page.tsx` — NEW
- `frontend/app/sandbox/CounterfactualEngine.ts` — NEW (pure TS logic)
- Add "Sandbox" link to the main navigation

### Detailed spec — CounterfactualEngine.ts

```typescript
// The engine receives:
//   - applicant: Record<string, number | string>  (the profile)
//   - biasThresholds: Record<string, number>       (from last audit or defaults)
// 
// It returns:
//   - decision: "APPROVED" | "DENIED"
//   - confidence: number (0–1)
//   - contributingFactors: { feature: string; weight: number; direction: "for" | "against" }[]
//
// Decision logic (use these exact rules — no randomness):
//   1. Start with base score = 50
//   2. credit_score: Excellent +30, Good +15, Fair -5, Poor -25
//   3. employment: Full-time +20, Part-time +5, Self-employed +5, Unemployed -20
//   4. income: >80k +15, 60-80k +8, 40-60k 0, <40k -12
//   5. debt_ratio: <0.3 +10, 0.3-0.5 0, >0.5 -15
//   6. Apply demographic bias offsets (THIS IS THE KEY):
//      - If race is "Black" or "Hispanic": apply -12 offset (simulates the detected bias)
//      - If race is "White" or "Asian": apply +0 offset
//      - If gender is "Female": apply -5 offset
//      - If gender is "Male": apply +0 offset
//   7. APPROVED if final score >= 55, DENIED otherwise
//
// The offsets above are intentionally asymmetric to demonstrate bias.
// They are derived from the actual approval_rate gaps in the bias engine output.
```

### Detailed spec — sandbox/page.tsx

Build a two-panel layout:

**LEFT PANEL — "Applicant Profile"**

- Input fields (dropdowns, not free text):
  - Name: text input (cosmetic only)
  - Race: select ["White", "Black", "Hispanic", "Asian"]
  - Gender: select ["Male", "Female"]
  - Age: number input (25–65)
  - Annual Income: select ["Under $40k", "$40k–$60k", "$60k–$80k", "Over $80k"]
  - Credit Score Band: select ["Excellent", "Good", "Fair", "Poor"]
  - Employment Status: select ["Full-time", "Part-time", "Self-employed", "Unemployed"]
  - Debt-to-Income Ratio: select ["Low (<30%)", "Medium (30–50%)", "High (>50%)"]

**RIGHT PANEL — "Model Decision"**

- Large verdict badge: green "APPROVED" or red "DENIED"
- Confidence meter (animated bar)
- Contributing factors list (which inputs pushed toward approval/denial)
- A prominent button: **"Flip Demographics →"**
  - On click: race toggles White↔Hispanic (or Black↔Asian), gender toggles Male↔Female
  - Decision updates INSTANTLY (no loading state — pure JS)
  - If decision flipped: show a red alert banner:

    ```
    ⚠ Bias Detected: Only protected attributes changed.
    Decision flipped from APPROVED → DENIED.
    This is the legal definition of disparate treatment.
    ```

  - If decision did NOT flip: show green banner:

    ```
    ✓ No flip detected for this profile combination.
    ```

**Below both panels:**

- A "Comparison Table" showing Original vs Flipped side by side
- A "Run Full Audit" button → links to /audit

**Verification steps for P1:**

1. Set race=White, all other fields identical → should return APPROVED
2. Click Flip Demographics → race=Hispanic → should return DENIED
3. Confirm the red bias banner appears
4. Set credit_score=Poor for both → both should be DENIED (flip should not trigger banner)
5. Run `npm run build` — zero TypeScript errors

---

## ═══════════════════════════════════════════════

## P2 — WEBHOOK ALERTS (Slack / Discord / Teams)

## "Enterprise tool, not a dashboard."

## ═══════════════════════════════════════════════

### What to build

When a bias audit is saved AND fairness_score < threshold (default: 70),
the backend fires a formatted webhook to the user's configured URL.
User configures webhook URLs in a Settings UI.

### Files to create/modify

**Backend:**

- `backend/services/webhook_service.py` — NEW
- `backend/routers/settings.py` — NEW (CRUD for webhook config)
- Modify `backend/routers/analyze.py` — call webhook after saving result

**Frontend:**

- `frontend/app/settings/integrations/page.tsx` — NEW
- `frontend/app/api/settings/route.ts` — NEW (proxy to backend settings)

### Detailed spec — webhook_service.py

```python
# Use httpx for async HTTP (add to requirements.txt)
# Supports Slack, Discord, Teams — all use the same POST with JSON body
# but slightly different payload shapes. Auto-detect from URL.
#
# Function signature:
#   async def fire_bias_alert(
#       webhook_url: str,
#       audit_id: str,
#       filename: str,
#       fairness_score: int,
#       verdict: str,
#       severity: str,
#       top_violation: dict,   # { attribute, metric_name, value, threshold }
#       dashboard_url: str,    # e.g. https://fairsight.app/audit/{audit_id}
#   ) -> bool
#
# Slack payload shape:
# {
#   "text": "🚨 FairSight Bias Alert",
#   "blocks": [
#     { "type": "header", "text": { "type": "plain_text", "text": "🚨 Bias Alert — {filename}" }},
#     { "type": "section", "fields": [
#         { "type": "mrkdwn", "text": "*Verdict:*\n{verdict}" },
#         { "type": "mrkdwn", "text": "*Fairness Score:*\n{score}/100" },
#         { "type": "mrkdwn", "text": "*Severity:*\n{severity}" },
#         { "type": "mrkdwn", "text": "*Top Violation:*\n{metric} = {value}" },
#     ]},
#     { "type": "actions", "elements": [
#         { "type": "button", "text": { "type": "plain_text", "text": "View Report" },
#           "url": "{dashboard_url}" }
#     ]}
#   ]
# }
#
# Discord payload shape:
# {
#   "embeds": [{
#     "title": "🚨 FairSight Bias Alert — {filename}",
#     "color": 15158332,   (red)
#     "fields": [
#       { "name": "Verdict", "value": verdict, "inline": true },
#       { "name": "Score", "value": f"{score}/100", "inline": true },
#       { "name": "Severity", "value": severity, "inline": true },
#       { "name": "Top Violation", "value": f"{metric}: {value:.3f} (threshold: {threshold})" }
#     ],
#     "footer": { "text": "FairSight Diagnostic Platform" },
#     "timestamp": ISO8601 timestamp
#   }]
# }
#
# Teams (generic webhook) payload shape:
# {
#   "@type": "MessageCard",
#   "@context": "http://schema.org/extensions",
#   "themeColor": "FF0000",
#   "summary": "FairSight Bias Alert",
#   "sections": [{ "activityTitle": "🚨 Bias Detected", ... }]
# }
#
# Detection: if "discord.com" in url → Discord payload
#            elif "office.com" in url or "webhook.office" in url → Teams payload
#            else → Slack payload
#
# On failure: log the error, return False. NEVER crash the audit pipeline.
# Timeout: 5 seconds max.
```

### Detailed spec — settings.py router

```python
# Firestore collection: "webhook_configs" — one doc per uid
# Fields: { slack_url, discord_url, teams_url, bias_threshold, enabled, uid }
#
# Routes:
#   GET  /settings/webhooks?uid=xxx  → returns config
#   POST /settings/webhooks          → body: { uid, slack_url?, discord_url?, teams_url?, threshold? }
#   POST /settings/webhooks/test     → body: { uid } → fires a test alert immediately
```

### Detailed spec — integrations/page.tsx

Build a settings page with:

- Three URL inputs: Slack Webhook URL, Discord Webhook URL, Teams Webhook URL
  - Each has a "Test" button that fires a sample alert immediately
  - Show green checkmark / red error after test
- Threshold slider: "Alert me when fairness score drops below [X]" (range 50–90, default 70)
- Toggle: Enable/Disable alerts
- Save button → POST to /api/settings
- Show timestamp of last alert fired (pulled from Firestore)

### Modify analyze.py

After saving the audit result to Firestore/cache, add:

```python
# Non-blocking webhook fire
if metrics["fairness_score"] < webhook_config.get("bias_threshold", 70):
    asyncio.create_task(
        webhook_service.fire_bias_alert(
            webhook_url=webhook_config["active_url"],
            audit_id=audit_id,
            filename=filename,
            fairness_score=metrics["fairness_score"],
            verdict=metrics["overall_verdict"],
            severity=metrics["bias_severity"],
            top_violation=get_top_violation(metrics),
            dashboard_url=f"{FRONTEND_URL}/audit/{audit_id}"
        )
    )
```

**Verification steps for P2:**

1. Create a Discord server → create webhook → paste URL into settings
2. Click "Test" → confirm Discord message arrives within 5 seconds
3. Upload a biased CSV (fairness score < 70) → confirm alert fires after audit saves
4. Upload a clean CSV (fairness score > 70) → confirm NO alert fires
5. Disable alerts toggle → upload biased CSV → confirm no alert fires
6. Run `uvicorn main:app` with no webhook configured → confirm zero crashes

---

## ═══════════════════════════════════════════════

## P3 — INTERSECTIONAL BIAS RADAR CHART

## "Race × Gender — the Crenshaw standard"

## ═══════════════════════════════════════════════

### What to build

A radar (spider) chart showing approval rates for every combination of
protected attributes simultaneously: Black Women, White Women, Black Men, White Men, etc.
Added to the audit report page as a new section below BiasMetricBars.

### Files to create/modify

- `frontend/components/IntersectionalRadar.tsx` — NEW
- `frontend/app/audit/[id]/page.tsx` — import and render IntersectionalRadar
- `backend/services/intersectional_engine.py` — NEW
- `backend/routers/analyze.py` — add intersectional analysis to response

### Detailed spec — intersectional_engine.py

```python
# Function: compute_intersectional_metrics(df, protected_cols, target_col) -> dict
#
# Logic:
#   1. For every COMBINATION of protected_cols values (using itertools.product),
#      compute the approval rate for that intersection.
#   2. Example: race=Black AND gender=Female → approval rate = 0.28
#   3. Return structure:
#      {
#        "intersections": [
#          { "label": "Black Female", "approval_rate": 0.28, "sample_size": 94, "disparity_from_best": 0.24 },
#          { "label": "White Male",   "approval_rate": 0.52, "sample_size": 187, "disparity_from_best": 0.0 },
#          ...
#        ],
#        "most_disadvantaged": "Black Female",
#        "least_disadvantaged": "White Male",
#        "intersectional_gap": 0.24,
#        "reference_rate": 0.52
#      }
#   4. Only include intersections with sample_size >= 10 (skip tiny groups)
#   5. Mark each intersection is_biased = True if disparity_from_best > 0.10
```

### Detailed spec — IntersectionalRadar.tsx

Use Chart.js via `react-chartjs-2` (already in package.json, or add it).

- Radar chart with axes = each intersection label
- Single dataset: approval rate per intersection
- Color: teal fill at 40% opacity, teal border
- Each point on hover shows: group name, approval rate, sample size, disparity
- Below the chart: a ranked list of intersections from most to least disadvantaged
- Each row: group label | approval rate bar | sample size badge | "BIASED" or "OK" tag
- Add a note: "Based on Crenshaw (1989) intersectionality framework"
- Only render this component if `data.intersections.length >= 3`
  (don't show with insufficient data)

**Verification steps for P3:**

1. Upload LoanBias dataset → audit report should show intersectional radar
2. Confirm Black Female has lowest approval rate
3. Confirm White Male has highest approval rate
4. Confirm chart renders with no console errors
5. Run with a dataset that has only one protected attribute → chart should not render (graceful hide)

---

## ═══════════════════════════════════════════════

## P4 — AUTO-MITIGATION (One-Click Fix)

## "Download a script that fixes bias without retraining"

## ═══════════════════════════════════════════════

### What to build

A button on the audit report page: "Generate Mitigation Script"
On click: calls a backend endpoint that computes per-group decision thresholds
that would equalize outcomes. Returns a downloadable JSON config + Python wrapper script.

### Files to create/modify

- `backend/services/mitigation_engine.py` — NEW
- `backend/routers/mitigate.py` — NEW
- `frontend/components/AutoMitigationPanel.tsx` — NEW
- `frontend/app/audit/[id]/page.tsx` — render AutoMitigationPanel

### Detailed spec — mitigation_engine.py

```python
# This is threshold post-processing — the standard approach used by Google's What-If Tool.
# It does NOT retrain the model. It adjusts the decision cutoff per demographic group.
#
# Algorithm:
#   1. For each protected group, compute current approval rate
#   2. Compute target_rate = overall_approval_rate (equalize to the mean)
#      OR target_rate = max_approval_rate (equalize to the best group — more aggressive)
#   3. For each group, compute the threshold adjustment needed:
#      If group approval_rate < target: lower threshold for this group (approve more)
#      If group approval_rate > target: raise threshold for this group (approve fewer)
#   4. Estimate new fairness metrics after applying these thresholds
#   5. Compute expected improvement in DP gap, EO gap, fairness score
#
# Output structure:
# {
#   "strategy": "equalize_to_mean",  # or "equalize_to_best"
#   "threshold_adjustments": {
#     "race": {
#       "Black":    { "current_threshold": 0.5, "new_threshold": 0.38, "adjustment": -0.12 },
#       "Hispanic": { "current_threshold": 0.5, "new_threshold": 0.41, "adjustment": -0.09 },
#       "White":    { "current_threshold": 0.5, "new_threshold": 0.50, "adjustment": 0.0 },
#       "Asian":    { "current_threshold": 0.5, "new_threshold": 0.50, "adjustment": 0.0 },
#     }
#   },
#   "projected_metrics": {
#     "new_fairness_score": 81,
#     "new_dp_gap": 0.05,
#     "new_eo_gap": 0.07,
#     "improvement_dp": 0.142,   # absolute improvement
#     "improvement_score": 19,   # points gained
#   },
#   "python_script": "... full Python string ...",
#   "json_config": { ... }
# }
#
# The python_script field must be a complete, runnable Python script string:
# """
# # FairSight Auto-Mitigation Wrapper
# # Generated: {timestamp}
# # Audit ID: {audit_id}
# # Strategy: Equalize-to-Mean Threshold Optimization
# #
# # HOW TO USE:
# #   1. Import this file
# #   2. Replace your model.predict(X) call with:
# #      prediction = fairsight_predict(model, X, applicant_race, applicant_gender)
# #
# import numpy as np
# 
# THRESHOLDS = {json.dumps(threshold_adjustments)}
# 
# def fairsight_predict(model, X, race=None, gender=None):
#     proba = model.predict_proba(X)[:, 1]
#     threshold = 0.5
#     if race and race in THRESHOLDS.get("race", {}):
#         threshold = THRESHOLDS["race"][race]["new_threshold"]
#     return (proba >= threshold).astype(int)
# """
```

### Detailed spec — AutoMitigationPanel.tsx

Show this panel on the audit report page only when verdict == "GUILTY".

Layout:

- Header: "Auto-Mitigation Available"
- Subtitle: "Download a post-processing fix. No model retraining required."
- Two strategy tabs: "Equalize to Mean" | "Equalize to Best Group"
- For the selected strategy, show:
  - A "Before vs After" metrics comparison table:

    ```
    Metric              Before    After     Improvement
    Fairness Score      62/100    81/100    +19 points
    DP Gap              0.192     0.050     -74%
    EO Gap              0.677     0.071     -89%
    ```

  - Per-group threshold adjustments (small table):

    ```
    Group       Current Threshold   New Threshold   Change
    Black       0.50                0.38            -0.12 ↓
    Hispanic    0.50                0.41            -0.09 ↓
    White       0.50                0.50            0.00
    ```

  - Two download buttons:
    - "Download Python Script (.py)"  → Blob download of python_script string
    - "Download JSON Config (.json)"  → Blob download of json_config object
- Note: "This fix equalizes approval rates. It does not guarantee individual fairness.
  Review with your legal team before deploying."

**Verification steps for P4:**

1. Upload LoanBias CSV → open audit report → AutoMitigationPanel should appear
2. Click "Download Python Script" → file downloads, contains valid Python
3. Run the downloaded script with `python3 -c "import mitigation_fix"` → no syntax errors
4. Switch to "Equalize to Best Group" tab → projected metrics should be MORE aggressive
5. Upload clean dataset (CLEAR verdict) → AutoMitigationPanel should NOT appear

---

## ═══════════════════════════════════════════════

## P5 — PRE-FLIGHT SCANNER

## "Catch bias before you train"

## ═══════════════════════════════════════════════

### What to build

A new page: /preflight
User uploads a RAW dataset (before any model is trained).
FairSight scores it for: representation imbalance, label noise, proxy density.
Output: a "Dataset Health Report" with actionable fixes before training begins.

### Files to create/modify

- `frontend/app/preflight/page.tsx` — NEW
- `backend/services/preflight_engine.py` — NEW
- `backend/routers/preflight.py` — NEW (`POST /preflight/`)
- Add "Pre-Flight" tab to main navigation

### Detailed spec — preflight_engine.py

```python
# Function: run_preflight_scan(df, protected_cols, label_col) -> dict
#
# Three scans:
#
# SCAN 1 — Representation Balance
#   For each protected attribute:
#     count per group, percentage per group
#     flag if any group < 10% of total OR any group < 30 samples
#     ideal = equal distribution
#     representation_score = 100 - (std_deviation_of_proportions * 200)
#
# SCAN 2 — Label Noise / Historical Bias
#   For each protected attribute:
#     compute positive label rate per group (how often label=1 for each group)
#     flag if max_group_label_rate - min_group_label_rate > 0.10
#     this indicates the training labels themselves are biased
#     label_bias_score = 100 - (label_rate_gap * 400)
#
# SCAN 3 — Proxy Feature Density
#   For each non-protected numeric feature:
#     compute correlation with each protected attribute
#     count how many features have |correlation| > 0.15 with any protected attr
#     proxy_density = count of proxy features / total features
#     proxy_score = 100 - (proxy_density * 100)
#
# Return:
# {
#   "overall_health_score": int (0–100, weighted average of 3 scan scores),
#   "recommendation": "SAFE_TO_TRAIN" | "CAUTION" | "DO_NOT_TRAIN",
#   "scans": {
#     "representation": { score, issues: [], per_group: {} },
#     "label_noise": { score, issues: [], per_attribute: {} },
#     "proxy_density": { score, issues: [], proxy_features: [], non_proxy_features: [] }
#   },
#   "fixes": [
#     { "issue": "...", "fix": "...", "priority": "HIGH"|"MEDIUM"|"LOW" }
#   ]
# }
```

### Detailed spec — preflight/page.tsx

Layout similar to /audit page but distinct visual identity — use amber/yellow
color scheme instead of teal (amber = warning, teal = report).

- Upload zone (same drag-and-drop as audit)
- After upload: show 3 scan progress steps animating in sequence
- Results: three "Health Cards" side by side:

  ```
  [ Representation ]    [ Label Fairness ]    [ Proxy Density ]
       74/100                 61/100               88/100
       CAUTION                BIASED               CLEAN
  ```

- Below cards: overall health score as large circular gauge
- Recommendation banner:
  - Green: "SAFE TO TRAIN — Dataset passes pre-flight checks"
  - Amber: "CAUTION — Address issues before training"
  - Red: "DO NOT TRAIN — Historical bias will be amplified by any model"
- Fixes list: ordered by priority, each with a one-click "Copy SQL/Python fix" button
- "Proceed to Full Audit →" button links to /audit

**Verification steps for P5:**

1. Upload LoanBias CSV with `label_col=true_label` → should detect label noise
2. Confirm representation scan shows correct group counts
3. Confirm proxy features are detected (credit_score_band may correlate with race in biased data)
4. Confirm recommendation is "CAUTION" or "DO_NOT_TRAIN" for LoanBias dataset
5. Upload a balanced, fair dataset → recommendation should be "SAFE_TO_TRAIN"
6. Run `npm run build` → zero errors

---

## ═══════════════════════════════════════════════

## P6 — TRANSPARENCY BADGE

## "Embeddable SVG. Live fairness score."

## ═══════════════════════════════════════════════

### What to build

A public endpoint that returns a live SVG badge showing an org's current fairness score.
Organizations embed this on their website. It updates when a new audit runs.

### Files to create/modify

- `frontend/app/api/badge/[orgId]/route.ts` — NEW (returns SVG)
- `frontend/app/badge/page.tsx` — NEW (badge configuration UI)
- `backend/routers/badge.py` — NEW (optional: backend SVG generation)

### Detailed spec — badge/[orgId]/route.ts

```typescript
// GET /api/badge/[orgId]
// 
// 1. Query Firestore for most recent audit where uid == orgId
// 2. Get fairness_score and verdict from that audit
// 3. Generate and return an SVG string with Content-Type: image/svg+xml
//    Cache-Control: public, max-age=3600
//
// SVG design (200px × 56px):
// - Left section (dark navy, 110px): "FairSight Certified"
// - Right section (color varies, 90px): score + verdict
//   - Score >= 80: green background
//   - Score 60–79: amber background
//   - Score < 60: red background
// - Small shield icon on left
// - Font: system sans-serif (SVG safe)
//
// Exact SVG template (fill in {score}, {verdict}, {color} at runtime):
// <svg xmlns="http://www.w3.org/2000/svg" width="200" height="28" role="img">
//   <title>FairSight: {score}/100</title>
//   <linearGradient id="s" x2="0" y2="100%">
//     <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
//     <stop offset="1" stop-opacity=".1"/>
//   </linearGradient>
//   <clipPath id="r"><rect width="200" height="28" rx="4" fill="#fff"/></clipPath>
//   <g clip-path="url(#r)">
//     <rect width="130" height="28" fill="#0f1f35"/>
//     <rect x="130" width="70" height="28" fill="{color}"/>
//   </g>
//   <g fill="#fff" font-family="sans-serif" font-size="11">
//     <text x="10" y="18" fill="#fff">FairSight Certified</text>
//     <text x="140" y="18" font-weight="bold">{score}/100</text>
//   </g>
// </svg>
//
// If orgId not found in Firestore: return a "Not audited" gray badge.
// Never return a 404 — always return a valid SVG.
```

### Detailed spec — badge/page.tsx

A settings/marketing page:

- Shows a live preview of the badge (iframe pointing to /api/badge/[uid])
- Copy embed code button:

  ```html
  <img src="https://fairsight.app/api/badge/{uid}" alt="FairSight Fairness Score" />
  ```

- Also shows markdown version:

  ```markdown
  ![FairSight Score](https://fairsight.app/api/badge/{uid})
  ```

- Shows when badge was last updated (timestamp of last audit)
- Option to make badge private (toggle in Firestore)

**Verification steps for P6:**

1. Run audit → navigate to /badge → badge should show current score and correct color
2. Fetch /api/badge/[uid] directly in browser → should return SVG with correct Content-Type
3. Set fairness_score = 45 (manually in test) → badge should be red
4. Set fairness_score = 85 → badge should be green
5. Fetch non-existent orgId → should return gray "Not audited" SVG, not a 404

---

## ═══════════════════════════════════════════════

## P7 — INDUSTRY BENCHMARKS

## "Your model vs. the industry"

## ═══════════════════════════════════════════════

### What to build

After every audit, show how the fairness score compares to:

1. All other models audited on FairSight (anonymized)
2. Industry category averages (Hiring, Lending, Healthcare, Criminal Justice)

### Files to create/modify

- `frontend/components/IndustryBenchmark.tsx` — NEW
- `frontend/app/audit/[id]/page.tsx` — render IndustryBenchmark
- `frontend/app/api/benchmarks/route.ts` — NEW (Firestore aggregation)
- `backend/routers/benchmark.py` — NEW (optional backend aggregation)

### Detailed spec — api/benchmarks/route.ts

```typescript
// GET /api/benchmarks?industry=hiring&score=68
//
// 1. Query Firestore collection "audits" — get all docs (or use aggregation)
// 2. Compute:
//    - global_average: mean fairness_score across all audits
//    - global_p25, global_p75: 25th and 75th percentile
//    - user_percentile: what percentile is the current score?
//    - industry_averages: hardcoded seed data (real data takes time to accumulate):
//      {
//        "hiring":            { avg: 71, sample_size: 0, label: "Hiring & Recruitment" },
//        "lending":           { avg: 74, sample_size: 0, label: "Loan & Credit Approval" },
//        "healthcare":        { avg: 63, sample_size: 0, label: "Healthcare Triage" },
//        "criminal_justice":  { avg: 51, sample_size: 0, label: "Criminal Justice / Recidivism" },
//        "insurance":         { avg: 69, sample_size: 0, label: "Insurance Underwriting" },
//      }
//    NOTE: seed data above is based on published research (Obermeyer et al., 2019;
//    Angwin et al., 2016 ProPublica; NIST AI RMF benchmarks).
//    As real audits accumulate, replace sample_size=0 with actual Firestore counts.
// 3. Return all of the above as JSON
```

### Detailed spec — IndustryBenchmark.tsx

A card with two sections:

**Section 1 — "Your Score vs. FairSight Average"**

- Horizontal bar with two markers:
  - User's score (navy dot)
  - Platform average (teal dot)
- Text: "Your model scored {score}/100. The average model on FairSight scores {avg}/100."
- Percentile badge: "Top 23% of all audited models" (green) or "Bottom 40%" (amber)

**Section 2 — "Industry Context"**

- Table of industry averages:

  ```
  Industry               Avg Score    Your Model
  Hiring                    71          68 ↓
  Lending                   74          68 ↓
  Healthcare                63          68 ↑
  Criminal Justice          51          68 ↑
  ```

- Each row has a mini bar chart showing the industry score
- Rows where user score < industry avg are highlighted amber

**Verification steps for P7:**

1. Run audit → report page should show IndustryBenchmark component
2. Score of 68 → should show "below Lending average (74)" highlighted
3. Score of 90 → should show green "Top X%" badge
4. /api/benchmarks returns valid JSON with expected shape
5. Component handles empty Firestore gracefully (shows seed data only)

---

## ═══════════════════════════════════════════════

## P8 — API KEY & QUOTA HUB

## "Multi-tenant SaaS credibility signal"

## ═══════════════════════════════════════════════

### What to build

A settings page where users generate and manage API keys.
Keys are used in the SDK. A quota meter shows events consumed this month.

### Files to create/modify

- `frontend/app/settings/api-keys/page.tsx` — NEW
- `frontend/app/api/keys/route.ts` — NEW (generate/list/revoke keys)
- `backend/routers/sdk_ingest.py` — NEW (validates key on SDK events)
- Firestore collections: "api_keys", "sdk_events"

### Detailed spec — api/keys/route.ts

```typescript
// Key format: "fs_live_" + 24 random alphanumeric chars
// Example:    "fs_live_9f8d72xk3mq7hnp2vrtb8cj5"
//
// Generate: crypto.randomBytes(18).toString('base64url').slice(0, 24)
// Hash before storing: SHA-256 of the full key (never store plaintext)
// Show plaintext ONCE on generation, then only show prefix: "fs_live_9f8d72x..."
//
// Firestore "api_keys" doc structure:
// {
//   uid: string,
//   key_prefix: string,        // "fs_live_9f8d72x" (first 15 chars)
//   key_hash: string,          // SHA-256 of full key
//   label: string,             // user-set label e.g. "Production"
//   created_at: Timestamp,
//   last_used: Timestamp | null,
//   revoked: boolean,
//   monthly_quota: number,     // default 100000
//   events_this_month: number  // updated by sdk_ingest
// }
//
// Routes:
//   GET    /api/keys?uid=xxx    → list keys (never return full key — prefix only)
//   POST   /api/keys            → generate new key, return FULL key once
//   DELETE /api/keys?id=xxx     → revoke key (set revoked=true)
```

### Detailed spec — api-keys/page.tsx

Layout:

- Header: "API Keys" with "Generate New Key" button
- Warning banner: "Your API key will only be shown once. Copy it now."
- Keys table:

  ```
  Label        Key              Created      Last Used    Status    Actions
  Production   fs_live_9f8d7…  Apr 1, 2026  Apr 16       Active    [Revoke]
  Staging      fs_live_3k2m9…  Mar 15, 2026 Never        Active    [Revoke]
  ```

- Quota meter for each key:

  ```
  Monthly Usage: ████████░░ 12,400 / 100,000 events
  ```

- SDK code snippet (pre-filled with user's active key):

  ```python
  from fairsight import FairSight
  
  fs = FairSight(
      model=your_model,
      protected=["race", "gender"],
      api_key="fs_live_9f8d72x..."   # ← your key
  )
  result = fs.predict(X)
  ```

- Copy button next to code snippet

**Verification steps for P8:**

1. Click "Generate New Key" → key appears in full once → copy it
2. Refresh page → key shows only prefix "fs_live_9f8d72x..."
3. Click Revoke → key disappears from active list, status changes to "Revoked"
4. Generate a second key → both appear in table
5. Quota meter shows 0/100,000 on new key

---

## ═══════════════════════════════════════════════

## P9 — FAIRNESS CONSTITUTION EDITOR

## "Define your own fairness rules in plain English"

## ═══════════════════════════════════════════════

### What to build

A UI where organizations write fairness rules in plain English.
Gemini translates them into structured threshold constraint JSON.
Every future audit for that org applies these custom rules on top of standard metrics.

### Files to create/modify

- `frontend/app/constitution/page.tsx` — NEW
- `frontend/app/api/constitution/route.ts` — NEW (Gemini translation + Firestore save)
- `backend/services/constitution_engine.py` — NEW (applies custom rules during analysis)
- `backend/routers/analyze.py` — apply constitution rules after standard analysis

### Detailed spec — constitution/page.tsx

Layout:

- Header: "Fairness Constitution" with subtitle "Define the ethical rules your AI must follow."
- Add Rule panel:
  - Large textarea: "Write your rule in plain English"
    - Placeholder: "Never reject female applicants at a higher rate than male applicants for equivalent credit scores."
  - "Translate with AI" button → calls /api/constitution/translate
  - Shows translated JSON rule:

    ```json
    {
      "rule_id": "rule_001",
      "type": "demographic_parity_constraint",
      "attribute": "gender",
      "groups": ["Female", "Male"],
      "max_disparity": 0.05,
      "applies_to": "approval_rate",
      "plain_english": "Never reject female applicants at a higher rate than male applicants...",
      "severity_if_violated": "HIGH"
    }
    ```

  - "Add to Constitution" button → saves to Firestore
- Constitution list:
  - All current rules displayed as cards
  - Each card shows: plain English rule + translated constraint + delete button
  - Toggle: "Active" / "Inactive" per rule
- Footer note: "These rules apply to all future FairSight audits for your organization."

### Detailed spec — api/constitution/route.ts

```typescript
// POST /api/constitution/translate
// Body: { rule_text: string, uid: string }
//
// Call Gemini API with this system prompt:
//
// "You are a legal-technical translator for AI fairness rules.
//  Convert plain English fairness rules into structured JSON constraints.
//  Output ONLY valid JSON matching this schema:
//  {
//    rule_id: string (generate a short unique ID),
//    type: one of ["demographic_parity_constraint", "equalized_odds_constraint",
//                  "approval_rate_constraint", "representation_constraint"],
//    attribute: string (protected attribute this applies to),
//    groups: string[] (which demographic groups),
//    max_disparity: number (maximum allowed gap, e.g. 0.05 for 5%),
//    applies_to: string (what metric: "approval_rate", "tpr", "fpr"),
//    plain_english: string (original rule text),
//    severity_if_violated: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
//  }
//  Return only JSON. No explanation."
//
// Save to Firestore collection "constitutions" / doc uid / subcollection "rules"
//
// POST /api/constitution/save
// Body: { rule: ConstitutionRule, uid: string }
// Saves rule to Firestore
//
// GET /api/constitution?uid=xxx
// Returns all active rules for this user
```

### Detailed spec — constitution_engine.py

```python
# Function: apply_constitution(metrics, constitution_rules) -> dict
#
# For each active rule in constitution_rules:
#   1. Extract the relevant metric from metrics["by_attribute"][rule["attribute"]]
#   2. Check if the constraint is violated (actual > max_disparity)
#   3. If violated: add to constitution_violations list
#      {
#        "rule_id": ...,
#        "plain_english": ...,
#        "actual_value": ...,
#        "allowed_max": ...,
#        "violated": True
#      }
#   4. If any constitution_violations: downgrade verdict if needed
#      (a CLEAR verdict becomes BORDERLINE if any constitution rule is violated)
#
# Return:
# {
#   "constitution_violations": [...],
#   "constitution_passed": bool,
#   "adjusted_verdict": original_verdict or downgraded,
#   "rules_checked": int
# }
```

**Verification steps for P9:**

1. Navigate to /constitution → add rule "Never reject Black applicants at a higher rate than White applicants"
2. Click "Translate with AI" → should return valid JSON with attribute="race"
3. Click "Add to Constitution" → rule appears in list
4. Run LoanBias audit → report should show "Constitution Violations" section
5. The CLEAR verdict on a mildly biased model should downgrade to BORDERLINE if constitution is violated
6. Deactivate the rule → re-run audit → no constitution violations
7. Run `npm run build` → zero errors

---

## 3. NAVIGATION & ROUTING

Update the main navigation to include all new pages.
Add to the nav component (wherever the existing nav links live):

```
Dashboard | Run Audit | Pre-Flight | Sandbox | Constitution | Settings
                                                              └─ Integrations
                                                              └─ API Keys
                                                              └─ Transparency Badge
```

On mobile: collapse into a hamburger menu.

---

## 4. GLOBAL VERIFICATION CHECKLIST

Run these after ALL features are implemented:

### Frontend

```bash
npm run build          # Zero TypeScript errors, zero build errors
npm run lint           # Zero lint errors
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# All routes should appear in /docs (FastAPI Swagger)
```

### Integration tests

```bash
# Test 1: Full pipeline
curl -X POST http://localhost:8000/analyze/ \
  -F "file=@FairSight_LoanBias_Test_Dataset_1500.csv" \
  -F "protected_attributes=[\"race\",\"gender\"]" \
  -F "target_column=predicted_label" \
  -F "label_column=true_label"
# Expected: fairness_score < 70, verdict=GUILTY, severity=CRITICAL

# Test 2: Preflight
curl -X POST http://localhost:8000/preflight/ \
  -F "file=@FairSight_LoanBias_Test_Dataset_1500.csv" \
  -F "protected_attributes=[\"race\",\"gender\"]" \
  -F "label_col=true_label"
# Expected: recommendation=DO_NOT_TRAIN or CAUTION

# Test 3: Badge
curl http://localhost:3000/api/badge/{your-uid}
# Expected: Content-Type: image/svg+xml, valid SVG in body

# Test 4: Benchmarks
curl "http://localhost:3000/api/benchmarks?score=62"
# Expected: JSON with global_average, user_percentile, industry_averages
```

### Bias engine regression test

```bash
python3 -c "
import pandas as pd
from services.bias_engine import run_bias_analysis
df = pd.read_csv('FairSight_LoanBias_Test_Dataset_1500.csv')
result = run_bias_analysis(df, ['race', 'gender'], 'predicted_label', 'true_label')
assert result['overall_verdict'] == 'GUILTY', f'Expected GUILTY, got {result[\"overall_verdict\"]}'
assert result['fairness_score'] < 70, f'Expected score < 70, got {result[\"fairness_score\"]}'
assert result['by_attribute']['race']['equalized_odds'] > 0.5, 'EO should be > 0.5 for this dataset'
print('All assertions passed.')
"
```

---

## 5. STYLING RULES — STRICTLY FOLLOW

- All new pages use existing CSS variables: --navy, --teal, --teal-light, --border, etc.
- Pre-Flight pages use --amber and --amber-light as the accent color
- Sandbox page uses a purple accent (#7c3aed) to differentiate from audit/preflight
- No new CSS files — use inline styles or existing classes only
- All cards follow existing `.card` class pattern
- All buttons follow existing `.btn`, `.btn-teal`, `.btn-outline` patterns
- Responsive: all new pages must work at 375px (mobile) and 1280px (desktop)

---

## 6. DO NOT DO LIST

- DO NOT add any mock/hardcoded data to bias_engine.py or preflight_engine.py
- DO NOT add `console.log` statements in production code
- DO NOT use `any` type in TypeScript except where genuinely unavoidable
- DO NOT create new Firestore collections without documenting them above
- DO NOT install new npm packages without checking if the functionality exists in already-installed packages first
- DO NOT add `// TODO` comments — either implement it or don't
- DO NOT use `fetch` with no error handling anywhere
- DO NOT block the audit pipeline — all new features (webhooks, constitution) must be non-blocking

---

## 7. REQUIRED PACKAGES

### Python (add to requirements.txt if not present)

```
httpx>=0.27.0        # webhook service async HTTP
pandas>=2.0
numpy>=1.24
scikit-learn>=1.3    # RandomForest for shap_service
python-dotenv>=1.0
```

### npm (add to package.json if not present)

```
react-chartjs-2      # intersectional radar chart
chart.js             # peer dependency
```

---

## END OF PROMPT

When complete, confirm by running the full regression test suite above
and reporting results for each test.
