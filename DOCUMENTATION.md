# FairSight: Technical Architecture & System Documentation

> **Real-Time AI Bias Compliance, Mitigation & Firewall Layer**  
> *Google Developer Student Clubs (GDSC) Solution Challenge 2026*  
> **Team:** Robo maters  

---

## 📑 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement: Algorithmic Discrimination & The Blind Spot](#2-problem-statement-algorithmic-discrimination--the-blind-spot)
   - [2.1 The Silent Scaling of Bias](#21-the-silent-scaling-of-bias)
   - [2.2 The "Fairness Through Blindness" Fallacy & Proxy Leakage](#22-the-fairness-through-blindness-fallacy--proxy-leakage)
   - [2.3 The Global Regulatory Landscape](#23-the-global-regulatory-landscape)
3. [The FairSight Solution](#3-the-fairsight-solution)
   - [3.1 Paradigm Shift: From Post-Hoc Audit to Runtime Compliance](#31-paradigm-shift-from-post-hoc-audit-to-runtime-compliance)
   - [3.2 Core Value Proposition & USPs](#32-core-value-proposition--usps)
4. [End-to-End System Architecture](#4-end-to-end-system-architecture)
   - [4.1 Architectural Blueprint](#41-architectural-blueprint)
   - [4.2 Data Ingestion & Zero-Retention Security Layer](#42-data-ingestion--zero-retention-security-layer)
   - [4.3 Mathematical Fairness Engine](#43-mathematical-fairness-engine)
   - [4.4 Counterfactual Flip Test Engine](#44-counterfactual-flip-test-engine)
   - [4.5 Intersectional Radar](#45-intersectional-radar)
   - [4.6 Multi-LLM Consensus Reasoning Engine](#46-multi-llm-consensus-reasoning-engine)
   - [4.7 Live Fairness Firewall (Decision Interceptor)](#47-live-fairness-firewall-decision-interceptor)
   - [4.8 Magic Debiasing Engine (Kamiran & Calders Reweighing)](#48-magic-debiasing-engine-kamiran--calders-reweighing)
   - [4.9 AI Constitution (Plain-English Governance)](#49-ai-constitution-plain-english-governance)
   - [4.10 CI/CD Quality Gate & Regulatory Reporting](#410-cicd-quality-gate--regulatory-reporting)
5. [Mathematical Formulations & Algorithms](#5-mathematical-formulations--algorithms)
6. [SDK & Developer Ecosystem](#6-sdk--developer-ecosystem)
7. [API Reference & Data Contracts](#7-api-reference--data-contracts)
8. [Conclusion & Societal Impact](#8-conclusion--societal-impact)

---

## 1. Executive Summary

Modern enterprises and public institutions increasingly rely on machine learning models to automate high-stakes decisions: evaluating loan applications, screening employment resumes, assessing recidivism risk, approving medical treatments, and pricing insurance policies. While these models promise efficiency and data-driven objectivity, they routinely inherit, amplify, and automate historical societal discrimination.

**FairSight** is a comprehensive, production-grade **AI Bias Compliance and Mitigation Platform** designed to solve this crisis. It acts as an intelligent firewall and governance layer that sits between machine learning models and end users. FairSight pairs rigorous mathematical fairness metrics with Google Gemini-powered reasoning to inspect datasets, detect proxy discrimination, explain algorithmic root causes, simulate real-time interventions, and intercept biased predictions before real people are harmed.

---

## 2. Problem Statement: Algorithmic Discrimination & The Blind Spot

### 2.1 The Silent Scaling of Bias

Machine learning systems do not understand fairness; they optimize mathematical loss functions over training distributions. When trained on historical datasets, models inevitably learn historical inequities:
* **Hiring Algorithms:** Resume filtering models trained on past technical hires disproportionately penalize female applicants and candidates from underrepresented colleges.
* **Credit & Lending:** Underwriting algorithms penalize minority borrowers with lower credit limits or higher interest rates due to historical wealth disparities and discriminatory lending practices.
* **Healthcare Prioritization:** Commercial risk-prediction algorithms assign lower risk scores to Black patients than to White patients with the same illness severity because health costs (rather than illness) were used as an outcome proxy.
* **Criminal Justice:** Recidivism scoring algorithms yield significantly higher false positive rates for minority defendants compared to Caucasian defendants.

Unlike human decision-makers, biased algorithms operate silently at massive scale, executing thousands or millions of discriminatory determinations per second.

### 2.2 The "Fairness Through Blindness" Fallacy & Proxy Leakage

A common misconception among engineering teams is **"fairness through unawareness"** — the belief that simply removing protected attributes (e.g., race, gender, religion, age) from the feature set renders a model unbiased.

In reality, machine learning models exploit high-dimensional correlational proxies:
* **ZIP Code / Postal Code** acts as a direct proxy for race and socioeconomic status due to residential segregation.
* **Alma Mater, Sports, or Sorority/Fraternity Memberships** act as proxies for gender and class.
* **Employment Gaps or Part-Time History** correlate strongly with pregnancy, maternity leave, and caregiving responsibilities.

Removing explicit protected labels leaves these proxy channels completely unmonitored, allowing models to reconstruct protected identities with high accuracy while giving organizations a false sense of legal compliance.

### 2.3 The Global Regulatory Landscape

Governments worldwide have moved from voluntary ethical guidelines to enforceable, punitive legal frameworks:

| Regulation / Standard | Jurisdiction | Enforcement Scope & Penalties |
|---|---|---|
| **EU AI Act (Regulation 2024/1689)** | European Union | Mandatory governance for "High-Risk AI Systems" (Articles 9 & 10). Demands pre-deployment dataset auditing, bias testing, and continuous post-market monitoring. Fines up to **€35,000,000 or 7% of global annual turnover**. |
| **US EEOC Uniform Guidelines (80% Rule)** | United States | Title VII enforcement: A selection rate for any race, sex, or ethnic group which is less than 4/5 (80%) of the rate for the highest group is evidence of adverse impact. |
| **NYC Local Law 144** | New York City, USA | Mandates annual independent bias audits for automated employment decision tools (AEDTs) before use, with mandatory public disclosure of disparity metrics. |
| **GDPR Article 22** | European Union | Right not to be subject to solely automated decisions having legal or significant effects, requiring meaningful explanation and human intervention mechanisms. |
| **FTC Algorithmic Accountability** | United States | Enforcement against deceptive or unfair practices involving algorithmic discrimination, demanding algorithmic disgorgement (destroying illegally trained models). |

**The Core Challenge:** Existing fairness toolkits (e.g., Fairlearn, AIF360) are offline research scripts requiring deep machine learning expertise. Compliance teams, legal officers, and executives cannot operate them, and engineering teams lack a real-time runtime firewall. Organizations remain blind to algorithmic risk in production.

---

## 3. The FairSight Solution

### 3.1 Paradigm Shift: From Post-Hoc Audit to Runtime Compliance

FairSight bridges the gap between deep mathematical fairness engineering and non-technical governance. It shifts bias mitigation from a retrospective, once-a-year audit into an **active, continuous runtime compliance firewall**.

```
[ Incoming Prediction Request ]
              │
              ▼
    ┌──────────────────┐
    │  Model Inference │
    └─────────┬────────┘
              │
              ▼
   ┌─────────────────────┐
   │  FairSight Firewall │  ◄── Counterfactual Flip Test & AI Constitution Gate
   └──────────┬──────────┘
              │
     ┌────────┴────────┐
     ▼                 ▼
[ ALLOWED ]      [ QUARANTINED ]
 Delivered to     Sent to Human-in-the-Loop Review
 End User         Audit Logged & Slack Alert Fired
```

### 3.2 Core Value Proposition & USPs

1. **Live Fairness Firewall:** Evaluates live inferences in milliseconds. If flipping a protected attribute (e.g., changing gender from Female to Male) flips the decision boundary, the prediction is intercepted and quarantined.
2. **Multi-LLM Consensus Reasoning:** Synthesizes statistical disparity figures into plain-English diagnostics using a quorum of models (**Google Gemini 2.0 Flash**, Groq Llama 3.3, Mistral, HuggingFace, and Ollama), eliminating hallucinations.
3. **Magic Debiasing Engine:** Automatically balances datasets using Kamiran & Calders mathematical reweighing, outputting a cleaned, balanced dataset ready for model retraining without sacrificing utility.
4. **AI Constitution:** Allows non-technical compliance officers to express plain-English governance policies (e.g., *"Ensure hiring approval disparity between genders does not exceed 5%"*), which Gemini translates into enforceable mathematical constraints.
5. **Zero-Retention Privacy:** Datasets are never persisted to disk or cloud storage. Uploaded data is processed in memory, hashed via SHA-256 for provenance, and discarded immediately.
6. **Instant Regulatory Certification:** Generates PDF compliance certificates formatted for EU AI Act, EEOC, and NYC Local Law 144 audits in one click.

---

## 4. End-to-End System Architecture

### 4.1 Architectural Blueprint

FairSight is structured as a decoupled, microservices-oriented platform:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          FAIRSIGHT CLIENT LAYER                        │
│  Next.js 14 Web App  │  Python SDK Wrapper  │  CI/CD CLI GitHub Action │
└───────────────────┬───────────────────┬────────────────────────────────┘
                    │                   │
                    ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY & ROUTING                         │
│  FastAPI Backend (Cloud Run)  │  Next.js API Edge Routes (Vercel)      │
│  • Rate Limiting              • Reverse Proxy                          │
│  • Bearer Token / Firebase    • Streaming Analysis & SSE               │
└───────────────────┬───────────────────┬────────────────────────────────┘
                    │                   │
                    ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE INTELLIGENCE ENGINES                       │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌──────────────┐   │
│  │ Mathematical Engine  │  │ Counterfactual Flip │  │ Intersect-   │   │
│  │ (Demographic Parity, │  │ Testing Engine      │  │ ional Radar  │   │
│  │ Equalized Odds)      │  │ (Individual Bias)   │  │ Engine       │   │
│  └──────────┬───────────┘  └──────────┬──────────┘  └──────┬───────┘   │
│             └────────────────┬────────┘                    │           │
│                              ▼                             │           │
│              ┌───────────────────────────────┐             │           │
│              │ Multi-LLM Consensus Engine    │ ◄───────────┘           │
│              │ • Google Gemini 2.0 Flash     │                         │
│              │ • Groq (Llama 3.3-70B)        │                         │
│              │ • Mistral / HuggingFace       │                         │
│              └───────────────┬───────────────┘                         │
│                              │                                         │
│                              ▼                                         │
│              ┌───────────────────────────────┐                         │
│              │ Runtime Enforcement & Defense │                         │
│              │ • Live Firewall Interceptor   │                         │
│              │ • Kamiran & Calders Debiasing │                         │
│              │ • PDF Compliance Generator    │                         │
│              └───────────────────────────────┘                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Ingestion & Zero-Retention Security Layer

1. **Multi-Encoding Parser:** Handles UTF-8 and Latin-1 / Windows-1252 encodings (common in legacy banking and HR software).
2. **Automatic Schema Inference:** Auto-detects target labels (`predicted_label`, `decision`, `approved`, `class`) and protected attributes (`race`, `gender`, `age`, `ethnicity`, `sex`) using semantic keyword matching if unmapped.
3. **PII Detection:** Scans string columns against regular expression patterns for emails, Social Security Numbers (SSN), phone numbers, credit card sequences, and regional identifiers (Aadhaar, PAN), alerting users before analysis.
4. **Cryptographic Fingerprint:** Generates a canonical `sha256:` digest of the input bytes. This digest provides an immutable proof-of-audit trail while guaranteeing zero raw data storage.

### 4.3 Mathematical Fairness Engine

The engine calculates both **group fairness** and **error rate fairness** across each protected attribute:

* **Demographic Parity (Statistical Parity):** Evaluates whether the probability of receiving a positive outcome is independent of group membership.
* **Equalized Odds:** Evaluates whether true positive and false positive rates are equal across protected groups, ensuring accuracy is balanced.
* **Disparate Impact Ratio:** Computes the ratio of selection rates between the unprivileged and privileged groups, directly measuring adherence to the US EEOC 80% rule.
* **Calibration Gap:** Assesses whether predicted confidence levels reflect the same true event probability regardless of demographic group.

### 4.4 Counterfactual Flip Test Engine

While group fairness evaluates aggregates, **individual fairness** requires that similar individuals receive similar outcomes regardless of protected status.

FairSight implements an automated counterfactual perturbation pipeline:
1. For every record, it flips the protected attribute to its counterfactual counterpart (e.g., $X_{\text{gender}} = \text{Female} \rightarrow \text{Male}$).
2. The model evaluates both original and perturbed records.
3. If $f(X) \neq f(X_{\text{flipped}})$, a **counterfactual flip violation** is registered.
4. The system aggregates the **Overall Flip Rate** and highlights the specific decision boundary shifts for inspection.

### 4.5 Intersectional Radar

Traditional auditing tests one protected dimension in isolation (e.g., race alone or gender alone). This creates dangerous blind spots where a model appears fair to Black applicants overall and fair to women overall, but severely discriminates against Black women.

FairSight's Intersectional Radar constructs cross-product sub-cohorts:
$$\text{Group}_{ij} = A_i \times B_j \quad (\text{e.g., Race} \times \text{Gender}, \text{Age} \times \text{Income})$$
It calculates compound selection disparities across every subgroup combination and visualizes the intersectional risk profile on a radar topology.

### 4.6 Multi-LLM Consensus Reasoning Engine

FairSight features a multi-model consensus architecture that prevents hallucinations and guarantees defensible audit findings:

1. **Primary Model — Google Gemini 2.0 Flash:** Chosen for exceptional latency (<1.2s), massive context window, and native structured JSON adherence. Gemini parses the mathematical disparity vectors, isolates proxy feature correlations, and writes the clinical diagnosis.
2. **Verification Quorum:** The prompt is evaluated in parallel against Groq (Llama 3.3-70B), Mistral, and HuggingFace.
3. **Majority-Vote Consensus Algorithm:**
   - **Strong Consensus:** All active models agree on severity classification (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `CLEAR`).
   - **Partial Consensus:** Plurality majority agreement.
   - **Dissent Flagging:** If an outlier model disagrees (e.g., 4 models report `CRITICAL` while 1 reports `LOW`), the dissenting rationale is flagged in the auditor dashboard for human inspection.

### 4.7 Live Fairness Firewall (Decision Interceptor)

The firewall endpoint (`POST /firewall/intercept`) operates as a real-time proxy in production inference pipelines:
* Evaluates input payload: decision, protected attributes, model confidence score.
* Computes distance from the decision boundary: $\Delta_{\text{boundary}} = |P - 0.50|$.
* Evaluates against calibrated empirical bias magnitudes.
* **Verdict:**
  - **ALLOWED:** Decision verified; forward to end user.
  - **BLOCKED / QUARANTINED:** Counterfactual disparity detected. The transaction is withheld and forwarded to a human review queue, and an incident payload is pushed to the operational webhook (Slack / PagerDuty).

### 4.8 Magic Debiasing Engine (Kamiran & Calders Reweighing)

When a dataset is flagged as biased, engineering teams typically face the difficult task of re-collecting data. FairSight solves this with the **Magic Debiasing Engine**, implementing Kamiran & Calders (2012) pre-processing reweighing:

Rather than discarding records, it calculates statistical sample weights such that the weighted probability of a positive outcome is identical across protected classes. The engine:
1. Calculates unprivileged/privileged population distributions.
2. Computes the reweighing coefficient for each $(S, Y)$ combination.
3. Attaches sample weights to each row.
4. Generates an exportable `fairsight_debiased_<id>.csv` alongside projected post-reweighing Demographic Parity and Equalized Odds improvements.

### 4.9 AI Constitution (Plain-English Governance)

FairSight allows policy leads, Chief Risk Officers, and legal counsel to define governance rules in natural language without writing SQL or Python:

```
"Applicants over 50 must have at least 85% of the approval rate of applicants under 30"
```

Gemini parses the policy into a formal mathematical constraint specification:
```json
{
  "attribute": "age_group",
  "privileged_group": "under 30",
  "unprivileged_group": "50+",
  "metric": "disparate_impact_ratio",
  "operator": ">=",
  "threshold": 0.85,
  "severity_if_violated": "CRITICAL"
}
```
During every audit and CI/CD gate run, the active AI Constitution rules are evaluated. Any violation immediately fails the gate and overrides the model verdict to `GUILTY`.

### 4.10 CI/CD Quality Gate & Regulatory Reporting

* **Automated Pull Request Gate:** `GET /cicd/gate?threshold=80` enables GitHub Actions and GitLab CI to fail model deployments that violate fairness thresholds.
* **SVG Status Badges:** Dynamically generated status badges (`PASSED` / `FAILED` / `SCORE: 92`) for embedding in model registry READMEs.
* **One-Click Compliance PDF:** Built on `ReportLab`, FairSight generates audit certificates containing cryptographic signatures, metric breakdowns, root-cause syntheses, and citation references mapped directly to EU AI Act Article 10 and EEOC Uniform Guidelines.

---

## 5. Mathematical Formulations & Algorithms

### 5.1 Demographic Parity Difference (DPD)

Let $A \in \{0, 1\}$ represent the binary protected attribute (where $A=1$ is privileged and $A=0$ is unprivileged), and let $\hat{Y} \in \{0, 1\}$ represent the model's binary decision.

$$\text{DPD} = | P(\hat{Y} = 1 \mid A = 0) - P(\hat{Y} = 1 \mid A = 1) |$$

* **Fairness Condition:** $\text{DPD} \leq \epsilon$ (typically $\epsilon \leq 0.10$).

### 5.2 Disparate Impact Ratio (DIR) / Four-Fifths Rule

$$\text{DIR} = \frac{P(\hat{Y} = 1 \mid A = 0)}{P(\hat{Y} = 1 \mid A = 1)}$$

* **EEOC 80% Rule Standard:** A system exhibits adverse impact if $\text{DIR} < 0.80$.

### 5.3 Equalized Odds Difference (EOD)

Let $Y \in \{0, 1\}$ be the true ground-truth label. Equalized odds requires equality of both True Positive Rates (TPR) and False Positive Rates (FPR):

$$\Delta_{\text{TPR}} = | P(\hat{Y} = 1 \mid A = 0, Y = 1) - P(\hat{Y} = 1 \mid A = 1, Y = 1) |$$
$$\Delta_{\text{FPR}} = | P(\hat{Y} = 1 \mid A = 0, Y = 0) - P(\hat{Y} = 1 \mid A = 1, Y = 0) |$$
$$\text{EOD} = \max(\Delta_{\text{TPR}}, \Delta_{\text{FPR}})$$

* **Fairness Condition:** $\text{EOD} \leq 0.10$.

### 5.4 Counterfactual Flip Rate (CFR)

For dataset $D = \{ (x_i, a_i) \}_{i=1}^N$, let $x_i'$ be the identical feature vector with protected attribute $a_i$ replaced with counterfactual reference value $a^*$:

$$\text{CFR} = \frac{1}{N} \sum_{i=1}^N \mathbb{I}\left( f(x_i, a_i) \neq f(x_i', a^*) \right)$$

* **Individual Fairness Condition:** $\text{CFR} \leq 0.05$ (ideally $0$).

### 5.5 Kamiran & Calders Sample Reweighing Weight

For any individual with protected status $S = s$ and observed label $Y = y$, the assigned weight $W(s, y)$ is:

$$W(s, y) = \frac{P(S = s) \cdot P(Y = y)}{P(S = s, Y = y)} = \frac{\frac{|D_{S=s}|}{|D|} \times \frac{|D_{Y=y}|}{|D|}}{\frac{|D_{S=s \wedge Y=y}|}{|D|}}$$

Under these assigned weights:
$$\sum_{i \in D_{S=0, Y=1}} W(0, 1) = \sum_{i \in D_{S=1, Y=1}} W(1, 1)$$
The weighted demographic parity disparity becomes mathematically zero.

---

## 6. SDK & Developer Ecosystem

FairSight provides a lightweight Python SDK (`fairsight`) that wraps any trained scikit-learn, XGBoost, LightGBM, PyTorch, or custom Python model with zero changes to existing inference code:

```python
import pandas as pd
from fairsight import FairSight

# 1. Initialize FairSight monitor
fs = FairSight(
    model=trained_model,
    protected=["race", "gender"],
    api_key="fs_live_your_key_here",
    endpoint="https://fairsight-backend-967859676631.us-central1.run.app",
    batch_size=25,
    async_mode=True
)

# 2. Predict as normal — zero latency overhead for user decisions
predictions = fs.predict(X_test)
```

### SDK Architecture Highlights:
* **Non-Blocking Background Thread:** Telemetry is buffered in memory and flushed via daemon thread. Inference latency overhead is under 0.2ms.
* **Graceful Failure Guarantee:** If the FairSight network endpoint is unreachable, the SDK silently fails open, ensuring client applications never crash.

---

## 7. API Reference & Data Contracts

### Core Endpoints Summary

| Method | Path | Description | Key Parameters |
|---|---|---|---|
| `POST` | `/analyze/` | Full bias analysis of dataset | `file` (CSV/JSON), `protected_attributes` (JSON), `target_column` |
| `POST` | `/firewall/intercept` | Real-time decision interception | `decision` (0/1), `protected_attributes` (dict), `confidence` (float) |
| `GET` | `/firewall/log` | Last 50 intercepted decisions | None |
| `GET` | `/firewall/stats` | Aggregate block rate & risk score | None |
| `POST` | `/debias/{audit_id}` | Calculate Kamiran & Calders weights | `file` (CSV), `protected_columns` (JSON) |
| `GET` | `/debias/{audit_id}/download` | Download debiased dataset CSV | `audit_id` |
| `POST` | `/report/pdf` | Generate compliance certificate | Full audit JSON payload |
| `GET` | `/cicd/gate` | CI/CD deployment blocker | `threshold` (int), `uid` (str) |
| `GET` | `/cicd/badge` | Dynamic SVG status shield | `uid` (str) |
| `POST` | `/sdk/ingest` | Ingest batched SDK decisions | `decisions` (list), `api_key` (str) |
| `GET` | `/health` | Service health status | None |

---

## 8. Conclusion & Societal Impact

FairSight transforms AI bias compliance from an academic exercise into accessible, operational infrastructure. By uniting Google Gemini 2.0 Flash with proven mathematical fairness algorithms, FairSight enables companies to:
1. **Safeguard Citizens:** Prevent algorithmic discrimination in hiring, credit, housing, and healthcare before deployment.
2. **Ensure Regulatory Immunity:** Guarantee audit readiness under the EU AI Act, EEOC, and NYC Local Law 144.
3. **Democratize Responsible AI:** Equip developers, compliance officers, and executives alike with intuitive tools to build trustworthy artificial intelligence.
