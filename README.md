# 👁️‍🗨️ FairSight

### Real-Time AI Bias Compliance, Mitigation & Firewall Infrastructure

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)](https://nextjs.org)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.0%20Flash-4285F4.svg)](https://ai.google.dev)
[![Google Cloud Run](https://img.shields.io/badge/Google%20Cloud-Cloud%20Run-4285F4.svg)](https://cloud.google.com/run)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Team:** Robo maters  
**Built for:** Google Developer Student Clubs (GDSC) Solution Challenge 2026  

⚖️ **Detect • Explain • Fix • Prevent AI Bias — Before It Impacts Real People**

[**Explore Full Technical Documentation**](./DOCUMENTATION.md) • [**Production Deployment Guide**](./DEPLOYMENT.md)

</div>

---

## 🚨 Problem Statement

Modern machine learning systems increasingly automate high-stakes decisions:
* **Who gets hired** (resume screening and candidate filtering)
* **Who gets loans** (credit underwriting and risk assessment)
* **Who qualifies for insurance** (pricing and policy limits)
* **Who receives healthcare prioritization** (treatment triage)

However, models trained on historical data frequently inherit and scale **systemic discrimination**. Traditional mitigation approaches ("fairness through blindness") fail because high-dimensional proxies (e.g., ZIP codes, university affiliations) allow models to reconstruct protected identities. 

Meanwhile, sweeping global regulations (**EU AI Act Article 10**, **US EEOC 80% Rule**, **NYC Local Law 144**, **GDPR Article 22**) impose severe penalties of up to **€35M or 7% of global turnover** for discriminatory AI. Existing fairness libraries are offline research scripts that require specialized ML skills—leaving compliance teams and executives blind to algorithmic risk.

---

## 💡 The Solution: FairSight

**FairSight** is a production-ready **AI Bias Firewall and Continuous Compliance Engine** that sits between ML models and end users. It transforms AI auditing from a retrospective manual task into **real-time, enforceable compliance infrastructure**.

```
[ Prediction Request ] ──► [ Model Inference ] ──► [ FairSight Firewall ]
                                                             │
                                        ┌────────────────────┴────────────────────┐
                                        ▼                                         ▼
                                   [ ALLOWED ]                              [ BLOCKED ]
                              Delivered to End User                  Quarantined for Human Review
                                                                     Slack / Webhook Alert Fired
```

Powered by **Google Gemini 2.0 Flash**, FairSight translates plain-English governance policies into enforceable mathematical fairness constraints, monitors inferences live, and provides automated dataset remediation.

---

## ✨ Key Features & USPs

* 🛡 **Live Fairness Firewall:** Intercepts predictions before they reach users. Runs real-time counterfactual checks; if flipping protected attributes changes the decision boundary, the prediction is quarantined.
* 🧠 **AI Constitution (Plain-English Rules):** Write compliance rules in natural language (e.g., *"Ensure hiring approval rate across age groups stays within 10%"*). Gemini compiles them into mathematical constraints.
* 🤖 **Multi-LLM Consensus Reasoning:** Evaluates statistical findings through a quorum of models (**Google Gemini 2.0 Flash**, Groq Llama 3.3-70B, Mistral, and Hugging Face) to eliminate hallucinations and detect dissenting opinions.
* 📡 **Intersectional Radar:** Analyzes compound discrimination across multi-dimensional attribute intersections (Race × Gender, Age × Income, Location × Education).
* ✨ **Magic Debiasing Engine:** Automatically rebalances biased training datasets using the **Kamiran & Calders (2012)** reweighing algorithm, exporting a production-ready `debiased_dataset.csv`.
* 🧾 **One-Click Regulatory Certificates:** Generates regulator-ready PDF compliance audit reports formatted for EU AI Act, EEOC, and NYC Local Law 144 compliance.
* 🔐 **Zero-Retention Privacy:** Uploaded datasets are parsed in-memory, cryptographically fingerprinted via SHA-256 for provenance, and discarded immediately. Raw PII is never stored.
* 🚦 **CI/CD Quality Gate:** Halts automated deployments in GitHub Actions if a model falls below organizational fairness thresholds.

---

## 🏗️ Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                  │
│  Next.js 14 (App Router)  │  TypeScript  │  TailwindCSS  │  Recharts   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST / SSE / WebSocket
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                   │
│  FastAPI (Python 3.11)  │  Pandas  │  Scikit-Learn  │  ReportLab (PDF) │
└───────────────────┬───────────────────────────────────┬────────────────┘
                    │                                   │
                    ▼                                   ▼
┌───────────────────────────────────────┐   ┌────────────────────────────┐
│      GOOGLE CLOUD INFRASTRUCTURE      │   │     AI REASONING ENGINES   │
│  • Google Cloud Run (Containers)      │   │  • Google Gemini 2.0 Flash │
│  • Firebase Authentication            │   │  • Groq (Llama 3.3-70B)    │
│  • Cloud Firestore (Audit History)    │   │  • Mistral & HuggingFace   │
└───────────────────────────────────────┘   └────────────────────────────┘
```

---

## 🚀 Live Demo & Deployment

| Resource | Link | Notes |
|---|---|---|
| **🌐 Production Deployment (Cloud Run)** | [Launch FairSight on GCP](https://fairsight-frontend-967859676631.us-central1.run.app/) | Primary Google Cloud Run deployment |
| **⚡ Backup Deployment (Vercel)** | [Launch FairSight on Vercel](https://fair-sight.vercel.app/) | High-speed global edge deployment |
| **🎥 Video Walkthrough** | [Watch Demo Video](https://drive.google.com/file/d/134RP0yo_0PEiXXDFHH5u3_eFijMIvMto/view?usp=sharing) | Full feature demonstration & walkthrough |
| **📘 Technical Architecture** | [Read DOCUMENTATION.md](./DOCUMENTATION.md) | Full mathematical formulas & specifications |
| **🚢 Deployment Manual** | [Read DEPLOYMENT.md](./DEPLOYMENT.md) | Step-by-step production setup |

---

## 🛠️ Quickstart: Running Locally

### 1. Clone Repository
```bash
git clone https://github.com/Ash-Technologia/FairSight.git
cd FairSight
```

### 2. Start Backend
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend API docs available at: `http://localhost:8000/docs`

### 3. Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 🐍 Python SDK: 2-Line Integration

Wrap existing machine learning models to monitor live predictions in production with zero code changes:

```bash
pip install -e ./sdk
```

```python
import pandas as pd
from fairsight import FairSight

# Wrap your existing model (scikit-learn, XGBoost, PyTorch, etc.)
fs = FairSight(
    model=your_trained_model,
    protected=["race", "gender"],
    api_key="fs_live_your_key_here",
    endpoint="http://localhost:8000"
)

# Predict as usual — telemetry is buffered and monitored in the background
predictions = fs.predict(X_test)
```

---

## 🔌 API Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze/` | Audits dataset for bias, proxies, and individual disparity |
| `POST` | `/firewall/intercept` | Real-time counterfactual flip test decision firewall |
| `GET` | `/firewall/stats` | Aggregate blocked decisions and risk score |
| `POST` | `/debias/{audit_id}` | Applies Kamiran & Calders reweighing algorithm |
| `GET` | `/debias/{audit_id}/download` | Downloads debiased balanced dataset |
| `POST` | `/report/pdf` | Generates regulator-ready PDF compliance certificate |
| `GET` | `/cicd/gate` | CI/CD deployment blocker gate for automated pipelines |
| `GET` | `/cicd/badge` | SVG fairness status shield for model registries |
| `POST` | `/sdk/ingest` | Ingests real-time batched SDK model decisions |
| `GET` | `/health` | Service health status |

---

## 🌍 Real-World Impact

FairSight empowers organizations to:
* **Protect Vulnerable Groups:** Eradicate bias in automated decisions before real individuals are denied loans, jobs, or healthcare.
* **Eliminate Regulatory Penalties:** Comply with the EU AI Act, EEOC Uniform Guidelines, and NYC Local Law 144 proactively.
* **Bridge Engineering & Compliance:** Provide both deep mathematical APIs for data scientists and natural language governance dashboards for compliance officers.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
