# 👁️‍🗨️ FAIRSIGHT: Comprehensive Project Documentation & Technical Dossier

**Real-Time AI Bias Compliance, Mitigation & Firewall Layer**

---

### 📌 Project & Team Metadata

| Field | Details |
|---|---|
| **Project Title** | **FairSight** (Real-Time AI Bias Compliance & Mitigation Layer) |
| **Team Name** | **Robo maters** |
| **Competition / Initiative** | **Google Developer Student Clubs (GDSC) Solution Challenge 2026** |
| **Core Mission** | Detect • Explain • Fix • Prevent AI Bias — Before It Impacts Real People |
| **UN Sustainable Development Goals (SDGs)** | **SDG 10:** Reduced Inequalities<br>**SDG 8:** Decent Work and Economic Growth<br>**SDG 16:** Peace, Justice, and Strong Institutions |
| **Repository URL** | [https://github.com/Ash-Technologia/FairSight](https://github.com/Ash-Technologia/FairSight) |
| **Production Deployment (GCP Cloud Run)** | [https://fairsight-frontend-967859676631.us-central1.run.app](https://fairsight-frontend-967859676631.us-central1.run.app/) |
| **Edge Backup Deployment (Vercel)** | [https://fair-sight.vercel.app](https://fair-sight.vercel.app/) |
| **Video Walkthrough Demo** | [Watch Demo Video](https://drive.google.com/file/d/134RP0yo_0PEiXXDFHH5u3_eFijMIvMto/view?usp=sharing) |

---

## 1. Executive Summary

As artificial intelligence systems automate life-altering decisions—from who qualifies for a mortgage, to who gets invited for a job interview, to who receives priority clinical care—they systematically inherit, amplify, and scale historical human biases. 

**FairSight** is an enterprise-grade, production-ready **AI Bias Firewall and Continuous Governance Platform** built by team **Robo maters** for the **GDSC Solution Challenge 2026**. Sitting between machine learning inference models and end users, FairSight intercepts discriminatory decisions in real time, diagnoses root causes through **Google Gemini 2.0 Flash** multi-LLM consensus, mathematically repairs biased training datasets, and generates regulatory-ready compliance certificates in one click.

---

## 2. Problem Statement: Algorithmic Discrimination & The Blind Spot

### 2.1 The Silent Scaling of Unchecked Bias
In traditional human decision-making, bias is constrained by human throughput. In automated machine learning pipelines, a single biased model can execute millions of discriminatory decisions every hour with zero accountability:
* **Hiring & Employment:** Screening models trained on historical hiring data penalize female candidates and minority applicants who lack traditional non-minority pedigree markers.
* **Credit & Banking:** Algorithmic credit scoring penalizes minority applicants with higher APRs or outright rejections due to historical redlining and wealth inequality.
* **Healthcare Prioritization:** Commercial triage algorithms have historically allocated less healthcare spending and lower priority to Black patients with the same chronic conditions as White patients.
* **Criminal Justice:** Recidivism prediction systems produce false-positive arrest predictions for minority defendants at nearly double the rate of Caucasian defendants.

### 2.2 The "Fairness Through Blindness" Fallacy & Proxy Leakage
Engineers often believe that omitting protected attributes (e.g., race, gender, age) renders a model unbiased. This is mathematically and practically false:
* In modern high-dimensional datasets, models exploit correlational **proxies**:
  * **ZIP / Postal Code** acts as a direct surrogate for race and ethnicity due to residential segregation.
  * **University, athletic teams, and fraternities/sororities** act as proxies for gender and class.
  * **Gaps in employment history** act as proxies for maternity leave and caregiving.
* Removing protected attributes blinds auditors while allowing the model to reconstruct protected characteristics implicitly.

### 2.3 Regulatory Mandates & Punitive Penalties
Governments worldwide have enacted binding statutory requirements requiring automated decision systems to be mathematically audited:
* **EU AI Act (Regulation 2024/1689):** High-risk AI systems must undergo mandatory bias testing, continuous mitigation, and human oversight. Non-compliance results in fines of up to **€35,000,000 or 7% of total global annual turnover**.
* **US EEOC Uniform Guidelines on Employee Selection Procedures (80% Rule):** Mandates that selection rates for unprivileged groups must be at least 80% of the privileged group rate; otherwise, adverse impact is established under Title VII.
* **NYC Local Law 144:** Requires mandatory annual independent bias audits of automated employment decision tools (AEDTs) before deployment.
* **GDPR Article 22:** Grants individuals the legal right to challenge solely automated decisions and receive human intervention.

**The Fundamental Market Failure:** Existing academic fairness libraries (Fairlearn, AIF360) require Python data science expertise, run strictly offline, and do not provide runtime protection. Non-technical compliance officers, HR leaders, and risk committees remain completely blind to algorithmic liability in production.

---

## 3. Our Solution: FairSight

FairSight shifts algorithmic fairness from an offline, retrospective post-mortem into an **active, real-time compliance firewall**.

### 3.1 Architectural Philosophy: The Runtime Bias Firewall
Rather than relying solely on pre-deployment checks, FairSight monitors predictions live:
```
[ Incoming Inference Request ]
              │
              ▼
    ┌──────────────────┐
    │  ML Model Output │
    └─────────┬────────┘
              │
              ▼
   ┌─────────────────────┐
   │  FairSight Firewall │  ◄── Counterfactual Flip Test & AI Constitution
   └──────────┬──────────┘
              │
     ┌────────┴────────┐
     ▼                 ▼
[ ALLOWED ]      [ QUARANTINED ]
 Forwarded to     Intercepted & Flagged for Human Review
 End User         Operational Webhook Pings Slack / PagerDuty
```

### 3.2 Key Pillars of FairSight
1. **Detect:** Automated dataset analysis across Demographic Parity, Equalized Odds, Disparate Impact, and Intersectional Radar.
2. **Explain:** Google Gemini 2.0 Flash diagnostic narratives translating statistical disparities into board-level root cause explanations.
3. **Fix:** Magic Debiasing engine applying Kamiran & Calders sample reweighing to produce clean, ready-to-train datasets without sacrificing utility.
4. **Prevent:** Production firewall intercepting biased inferences pre-user delivery using counterfactual perturbation.
5. **Certify:** One-click PDF generation of regulator-ready audit reports aligned with the EU AI Act and EEOC.

---

## 4. Comprehensive Feature Breakdown & USPs

### 4.1 Live Fairness Firewall (Decision Interceptor)
* **Real-Time Pre-Decision Gate:** Sits as an API middleware between the model and end users.
* **Counterfactual Flip Testing:** For each prediction, flips the protected attribute to reference majority groups in memory. If flipping the protected identity reverses the model's decision, the inference is identified as biased.
* **Automated Quarantine:** Decisions identified with high disparity risk are held in quarantine for human-in-the-loop inspection, preventing unlawful real-world harm.

### 4.2 AI Constitution (Plain-English Governance Engine)
* Allows legal counsel, HR managers, and non-technical stakeholders to write natural language compliance policies:
  * *"Ensure approval rates across age brackets remain within 10% of each other"*
  * *"Hiring decisions must remain strictly gender-neutral across all engineering departments"*
* **Gemini Translation:** Google Gemini 2.0 Flash compiles natural language rules into mathematical constraints (`demographic_parity <= 0.10`, `disparate_impact_ratio >= 0.80`) and enforces them automatically across all audits and CI/CD pipelines.

### 4.3 Multi-LLM Consensus Reasoning Engine
* Generative AI audits run through a quorum of models:
  * **Primary:** Google Gemini 2.0 Flash (sub-second latency, structured JSON output).
  * **Secondary Quorum:** Groq (Llama 3.3-70B), Mistral AI, Hugging Face (Qwen / Phi-3.5), and local Ollama.
* **Majority-Vote Consensus:** Eliminates hallucinations. If 4 models classify severity as `CRITICAL` and 1 model dissents, the dissenting rationale is flagged explicitly for human review.

### 4.4 Intersectional Radar
* Uncovers hidden compound bias that single-attribute scans miss (e.g., Black Women, Senior Citizens with Low Credit).
* Evaluates cross-product combinatorial groups ($A_i \times B_j$) and plots the risk topology on a dynamic multi-axis radar chart.

### 4.5 Magic Debiasing Engine (Kamiran & Calders Reweighing)
* Implements the foundational Kamiran & Calders (2012) mathematical reweighing algorithm.
* Calculates exact statistical sample weights so that the joint probability of positive outcomes across protected attributes is equalized.
* Exports a balanced `fairsight_debiased_<id>.csv` along with projected post-mitigation metrics.

### 4.6 Zero-Retention Privacy Architecture
* **GDPR & HIPAA Compliant by Design:** Uploaded datasets are streamed in-memory, analyzed, cryptographically fingerprinted using SHA-256 digests (`sha256:7f83b16...`), and immediately discarded.
* Built-in PII detector flags emails, Social Security Numbers, phone numbers, credit card strings, and regional IDs (Aadhaar, PAN) before analysis begins.

### 4.7 CI/CD Automated Quality Gate & SVG Status Badges
* `GET /cicd/gate?threshold=80` integrates into GitHub Actions, GitLab CI, and Jenkins to fail model training or deployment jobs that violate fairness thresholds.
* Generates live SVG shield badges for display on model registries and internal repositories.

### 4.8 One-Click Regulatory Compliance Certificates
* Generates formal PDF audit certificates using ReportLab, containing cryptographic provenance hashes, compliance standard citations, fairness scores, metric matrices, and executive summaries ready for regulatory submission.

---

## 5. Complete Technical Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                            │
│  • Next.js 14 (App Router)     • TypeScript 5                          │
│  • TailwindCSS (Custom tokens) • Framer Motion Animations              │
│  • Recharts Visualization      • Lucide React Icons                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST / SSE / WebSocket
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           API & GATEWAY LAYER                          │
│  • FastAPI (Python 3.11)       • Uvicorn ASGI Server                   │
│  • Next.js Edge Route Proxies  • Dynamic Port Binding ($PORT)          │
│  • Pydantic Schema Validation  • Token-based & Bearer Auth             │
└───────────────────┬───────────────────────────────────┬────────────────┘
                    │                                   │
                    ▼                                   ▼
┌───────────────────────────────────────┐   ┌────────────────────────────┐
│      GOOGLE CLOUD PLATFORM INFRA      │   │    MULTI-LLM AI ENGINES    │
│  • Google Cloud Run (Serverless)      │   │  • Google Gemini 2.0 Flash │
│  • Firebase Authentication            │   │  • Groq (Llama 3.3-70B)    │
│  • Google Cloud Firestore (NoSQL)     │   │  • Mistral AI              │
│  • Artifact Registry                  │   │  • Hugging Face Serverless │
└───────────────────────────────────────┘   └────────────────────────────┘
```

### Complete Technology Stack Matrix

| Layer | Technologies Used | Purpose |
|---|---|---|
| **Frontend Framework** | Next.js 14.2 (App Router), React 18, TypeScript 5 | Server-side rendering, responsive UI, edge API proxy routes |
| **Styling & Animation** | TailwindCSS, Framer Motion, Lucide Icons | Dark-mode design system, micro-interactions, glassmorphism |
| **Data Visualization** | Recharts, HTML5 Canvas | Disparity bar charts, radar topology, ROC curves, gauge charts |
| **Backend API** | Python 3.11, FastAPI 0.110+, Uvicorn ASGI | High-performance asynchronous REST endpoints, WebSocket feed |
| **Data Science & ML** | Pandas 2.0, NumPy, Scikit-Learn, Fairlearn, SciPy | In-memory matrix computation, statistical disparity evaluation |
| **Document Generation** | ReportLab 4.0, jsPDF, html2canvas | High-fidelity cryptographic PDF certificate rendering |
| **Primary AI Reasoning** | **Google Gemini 2.0 Flash** (`@google/generative-ai`) | Sub-second diagnostic narrative, plain-English rule translation |
| **Secondary AI Quorum** | Groq (Llama 3.3-70B), Mistral, HuggingFace, Ollama | Multi-model consensus voting and anti-hallucination quorum |
| **Cloud Hosting** | **Google Cloud Run** | Serverless, auto-scaling container infrastructure |
| **Auth & State** | **Firebase Auth & Cloud Firestore** | User authentication and audit persistence (with local cache fallback) |
| **SDK** | Python `fairsight` client package | 2-line drop-in model wrapper with async background batching |

---

## 6. Mathematical Approach & Formulations

FairSight grounds every diagnostic finding in peer-reviewed statistical formulations:

### 6.1 Demographic Parity Difference (DPD)
Evaluates whether outcome probabilities are independent of demographic group membership:
$$\text{DPD} = | P(\hat{Y} = 1 \mid A = \text{unprivileged}) - P(\hat{Y} = 1 \mid A = \text{privileged}) |$$
* **Legal Standard:** $\text{DPD} \leq 0.10$ (EU AI Act Article 10).

### 6.2 Disparate Impact Ratio (DIR) / Four-Fifths Rule
Measures the ratio of selection rates between unprivileged and privileged groups:
$$\text{DIR} = \frac{P(\hat{Y} = 1 \mid A = \text{unprivileged})}{P(\hat{Y} = 1 \mid A = \text{privileged})}$$
* **Legal Standard:** $\text{DIR} \geq 0.80$ (US EEOC 80% Rule under Title VII).

### 6.3 Equalized Odds Difference (EOD)
Enforces equal accuracy rates by constraining both True Positive and False Positive rates:
$$\Delta_{\text{TPR}} = | \text{TPR}_{\text{unprivileged}} - \text{TPR}_{\text{privileged}} |$$
$$\Delta_{\text{FPR}} = | \text{FPR}_{\text{unprivileged}} - \text{FPR}_{\text{privileged}} |$$
$$\text{EOD} = \max(\Delta_{\text{TPR}}, \Delta_{\text{FPR}})$$
* **Fairness Standard:** $\text{EOD} \leq 0.10$ (Hardt et al., 2016).

### 6.4 Counterfactual Flip Rate (CFR)
Evaluates individual causal fairness across feature perturbations:
$$\text{CFR} = \frac{1}{N} \sum_{i=1}^N \mathbb{I}\left( f(x_i, a_i) \neq f(x_i, a^*) \right)$$
Where $a^*$ represents the counterfactual majority reference attribute.

### 6.5 Kamiran & Calders Sample Reweighing Weight
For an individual with protected status $S = s$ and observed target outcome $Y = y$:
$$W(s, y) = \frac{P(S = s) \cdot P(Y = y)}{P(S = s \wedge Y = y)} = \frac{|D_{S=s}| \cdot |D_{Y=y}|}{|D| \cdot |D_{S=s \wedge Y=y}|}$$
Assigning weight $W(s, y)$ ensures the reweighted demographic parity disparity equals exactly zero.

---

## 7. Workflow & User Journey

1. **Dataset Ingestion (`/audit`):**
   - User uploads a training or prediction dataset (CSV or JSON).
   - System auto-detects target labels and protected columns.
   - Cryptographic SHA-256 fingerprint is generated; PII is scanned and flagged.
2. **Interactive Bias Diagnostics (`/audit/[id]`):**
   - User reviews the FairSight Fairness Score (0–100) and overall verdict (`CLEAR`, `WARNING`, `GUILTY`).
   - Inspects demographic parity gaps, disparate impact ratios, and proxy feature importances.
   - Evaluates multi-LLM consensus breakdown and review Gemini diagnostic findings.
3. **Plain-English Governance (`/constitution`):**
   - Stakeholders add natural language fairness constraints that compile into mathematical rules.
4. **Auto-Remediation (`/sandbox` & `/audit/[id]`):**
   - One-click trigger of the Magic Debiasing Engine.
   - Download the reweighed, debiased dataset ready for retraining.
5. **Live Production Deployment (`/firewall`):**
   - Connect the FairSight SDK or REST interceptor to the live inference service.
   - Discriminatory decisions are blocked, alerted via Slack, and routed to human review.
6. **Regulatory Certification (`/compliance`):**
   - Export an official compliance PDF certificate formatted for EU AI Act and EEOC audits.

---

## 8. Impact, Societal Benefits & Alignment with UN SDGs

### 8.1 Protection of Marginalized Communities
By providing real-time counterfactual testing, FairSight prevents discriminatory outcomes from harming real humans in high-stakes decisions: protecting women from hiring bias, preventing minority loan rejections, and ensuring equitable healthcare triage.

### 8.2 Corporate Risk Reduction & Economic Value
* **Regulatory Immunity:** Protects organizations from crippling statutory fines (up to €35M under the EU AI Act).
* **Reputational Safety:** Prevents viral bias scandals and public algorithmic backlash.
* **Audit Democratization:** Enables compliance officers and internal auditors to evaluate models without requiring dedicated machine learning data science teams.

### 8.3 Alignment with United Nations Sustainable Development Goals (SDGs)
* 🎯 **SDG 10 (Reduced Inequalities):** Eliminates systemic discrimination in automated decision-making across race, gender, age, religion, and ethnicity.
* 🎯 **SDG 8 (Decent Work & Economic Growth):** Eliminates biased resume screening, ensuring fair and equitable access to employment opportunities.
* 🎯 **SDG 16 (Peace, Justice, & Strong Institutions):** Fosters institutional transparency, ethical artificial intelligence, and automated accountability.

---

## 9. Live Deployments & Verification Links

* **Google Cloud Platform Deployment:** [https://fairsight-frontend-967859676631.us-central1.run.app](https://fairsight-frontend-967859676631.us-central1.run.app/)
* **Vercel Edge Backup Deployment:** [https://fair-sight.vercel.app](https://fair-sight.vercel.app/)
* **Video Walkthrough Demonstration:** [Watch Video Demo](https://drive.google.com/file/d/134RP0yo_0PEiXXDFHH5u3_eFijMIvMto/view?usp=sharing)
* **GitHub Open-Source Repository:** [https://github.com/Ash-Technologia/FairSight](https://github.com/Ash-Technologia/FairSight)

---

## 10. Future Roadmap

1. **Automated Post-Processing Debiasing:** Adding Equalized Odds threshold optimization directly in the live firewall without retraining.
2. **Generative LLM Bias Auditing:** Extending the bias engine to audit bias and toxicity in Large Language Model completions.
3. **Zero-Knowledge Proofs for Auditing:** Enabling organizations to cryptographically prove compliance to regulatory authorities without revealing proprietary training data or model weights.

---

*Authored by Team **Robo maters** for the Google Developer Student Clubs (GDSC) Solution Challenge 2026.*
