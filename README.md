# 👁️‍🗨️ FairSight

## Real-Time AI Bias Compliance & Mitigation Layer

<div align="center">

**Team:** Robo maters
**Built for:** Google Developer Student Clubs (GDSC) Solution Challenge 2026

⚖️ Detect • Explain • Fix • Prevent AI Bias — Before It Impacts Real People

</div>

---

# 🚨 Problem Statement: Unbiased AI Decision

Modern AI systems increasingly decide:

* who gets hired
* who receives loans
* who qualifies for insurance
* who receives healthcare prioritization

However, these systems often inherit **historical discrimination embedded inside datasets**, silently scaling unfair decisions across thousands—or millions—of users.

Organizations face:

* regulatory penalties (EU AI Act, EEOC, NYC Local Law 144)
* reputational risk
* legal exposure
* ethical violations

Yet existing fairness tools require complex Python pipelines and ML expertise.

**Compliance teams remain blind to algorithmic risk.**

---

# 🎯 Objective

Build a clear, accessible platform that enables organizations to:

✅ inspect datasets
✅ detect hidden discrimination
✅ explain fairness violations
✅ automatically mitigate bias
✅ prevent biased decisions before deployment

---

# 💡 Our Solution: FairSight

**FairSight** is a production-ready **AI bias firewall and compliance engine** that sits between ML models and end users to detect and prevent discriminatory outcomes in real time.

Instead of requiring auditors to write fairness scripts manually, FairSight provides:

📊 interactive dashboards
⚖ statistical fairness verification
🤖 Gemini-powered reasoning
🛡 runtime decision blocking
📄 regulator-ready compliance reports

Powered by **Google Gemini 1.5 Flash**, FairSight converts plain-English compliance rules into enforceable mathematical fairness constraints.

Example:

> “Ensure hiring decisions remain gender-neutral across departments”

FairSight automatically translates this into:

* Demographic parity thresholds
* Equalized odds constraints
* disparity detection logic

Then monitors predictions live.

---

# ✨ Core Features & USPs

## 🛡 Live Fairness Firewall

Intercepts biased predictions **before they reach users**

If flipping protected attributes changes outcomes:

Decision blocked → Sent for review

Prevents real-world harm in production pipelines.

---

## 🧠 AI Constitution (Plain-English Compliance Rules)

Write fairness rules like:

Avoid bias across age groups

Gemini converts them into mathematical fairness constraints automatically.

No coding required.

---

## 📡 Intersectional Radar

Detects compound discrimination across attributes:

Race × Gender
Age × Income
Location × Education

Reveals bias invisible in traditional audits.

---

## ✨ Magic Debiasing Engine

Automatically repairs biased datasets using:

Kamiran & Calders reweighing

Exports:

clean_dataset.csv

ready for retraining safer models.

---

## 🧾 Compliance Certificate Generator

Generates regulator-ready fairness reports aligned with:

* EU AI Act
* EEOC audit expectations
* NYC Local Law 144

One-click export.

---

## 🤖 Multi-LLM Consensus Engine

Combines reasoning from:

* Gemini 1.5 Flash
* Groq inference API
* Together AI inference layer

to eliminate hallucinations and improve verdict reliability.

---

## 🔐 Zero-Retention Privacy Architecture

All uploaded datasets are:

SHA-256 hashed
analyzed
discarded immediately

Ensuring strong GDPR-aligned privacy guarantees.

---

# 🏗️ Architecture & Tech Stack

## Frontend

* Next.js 14
* React
* TailwindCSS
* Framer Motion

## Backend

* Python
* FastAPI
* Pandas
* Scikit-Learn

## Google Cloud Infrastructure ☁️

* Cloud Run (containerized deployment)
* Firebase Authentication
* Firestore database

## AI Models

* Google Gemini 1.5 Flash (primary reasoning engine)
* Groq inference API
* Together AI inference layer

---

# ⚙️ Platform Architecture

/audit
Dataset ingestion & fairness scan engine

/audit/[id]
Interactive bias diagnostics dashboard

/firewall
Live prediction interception simulator

/sandbox
Adversarial fairness testing playground

/pipeline
CI/CD fairness enforcement simulator

/compliance
Regulatory PDF export engine

---

# 🚀 Live Demo Links

## 🌐 Production Deployment (Google Cloud)

⚠ Note: Cloud Run instances may scale down automatically on inactivity and occasionally take time to wake.

👉 https://fairsight-frontend-967859676631.us-central1.run.app/

---

## ⚡ Stable Backup Deployment (Vercel Mirror)

Recommended if Cloud Run is slow or unavailable:

👉 https://fair-sight.vercel.app/

---

## 🎥 YouTube Demo Walkthrough

Watch the full system demo here:

👉 [https://YOUR_YOUTUBE_DEMO_LINK_HERE](https://drive.google.com/file/d/134RP0yo_0PEiXXDFHH5u3_eFijMIvMto/view?usp=sharing)


# 🧪 Example Workflow

Step 1

Upload dataset

predictions.csv

Step 2

FairSight scans:

* demographic parity
* equalized odds
* proxy leakage
* intersectional bias

Step 3

Receive verdict:

CLEAR
WARNING
GUILTY

Step 4

Auto-repair dataset

Download:

debiased_dataset.csv

Step 5

Deploy firewall protection

Prevent biased outputs in real time.

---

# 🛠 Running Locally

## 1️⃣ Clone repository

git clone https://github.com/Ash-Technologia/FairSight.git
cd FairSight

---

## 2️⃣ Start backend

cd backend
pip install -r requirements.txt
uvicorn main:app --reload

---

## 3️⃣ Start frontend

cd frontend
npm install
npm run dev

App runs at:

http://localhost:3000

---

# 🌍 Real-World Impact

FairSight enables organizations to:

✔ reduce algorithmic discrimination
✔ prevent regulatory penalties
✔ deploy trustworthy AI systems
✔ operationalize Responsible AI policies
✔ audit models without ML expertise

---

# 🏆 Why FairSight Matters

As global AI regulations expand, organizations must demonstrate measurable fairness guarantees before deploying automated decision systems.

FairSight transforms fairness auditing from:

manual research task

into:

real-time compliance infrastructure

making AI safer, transparent, and accountable at scale. ⚖️🤖📊
