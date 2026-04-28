# FairSight 👁️‍🗨️
### Real-Time AI Bias Compliance & Mitigation Layer

<div align="center">
  <b>Team:</b> Robo maters <br/>
  <b>Built for:</b> Google Developer Student Clubs (GDSC) Solution Challenge 2026
</div>

<br/>

## 🚨 Problem Statement: Unbiased AI Decision
**Ensuring Fairness and Detecting Bias in Automated Decisions**

Computer programs now make life-changing decisions about who gets a job, a bank loan, or even medical care. However, if these programs learn from flawed or unfair historical data, they will repeat and amplify those exact same discriminatory mistakes, exposing organizations to massive regulatory liabilities (e.g., EU AI Act, EEOC) and causing severe real-world harm.

## 🎯 Objective
Build a clear, accessible solution to thoroughly inspect data sets and software models for hidden unfairness or discrimination. Provide organizations with an easy way to measure, flag, and fix harmful bias before their systems impact real people.

## 💡 Our Solution
**FairSight** is the world’s first production-ready, zero-retention AI bias firewall and compliance engine built exclusively for enterprise compliance officers. We sit seamlessly between a company’s ML models and their end-users. 

Instead of forcing auditors to run complex Python scripts, FairSight provides an intuitive, fully interactive dashboard. Powered by **Google Gemini 1.5 Flash**, organizations can write their compliance rules in plain English ("The AI Constitution"), instantly scan their live prediction logs for hidden biases, and mathematically mitigate the bias using advanced Kamiran & Calders reweighing algorithms. 

Best of all, using our **Live Fairness Firewall**, biased decisions are intercepted and blocked in real-time before they can ever reach the end-user.

### ✨ Core Features & USPs
- **Zero-Retention Architecture:** Raw data is SHA-256 hashed and immediately discarded after analysis. Total GDPR immunity.
- **The AI Constitution:** Write compliance rules in plain English; Gemini 1.5 translates them into strict mathematical JSON constraints.
- **Live Fairness Firewall:** A runtime API that blocks discriminatory model inferences in real-time.
- **Intersectional Radar:** Detects hidden compound discrimination (e.g., Race × Gender overlapping).
- **Magic Debiasing:** Automatically reweigh and mathematically fix biased datasets instantly.
- **Multi-LLM Consensus Engine:** Uses Gemini alongside other open-source models to vote on bias severity, completely eliminating AI hallucination risks.

## 🏗️ Architecture & Tech Stack
- **Frontend:** Next.js 14, React, TailwindCSS, Framer Motion
- **Backend:** Python, FastAPI, Pandas, Scikit-Learn
- **Google Cloud Infrastructure:** Cloud Run, Firebase Auth, Firestore
- **AI Models:** Google Gemini 1.5 Flash (Core), Groq, Together AI

## 🚀 Deployment
FairSight is fully containerized using Docker and deployed on highly scalable, serverless architecture.
* **Frontend UI:** Google Cloud Run (Containerized Next.js)
* **Backend API:** Google Cloud Run (Containerized FastAPI)

## 🛠️ Running Locally
**1. Clone the repo:**
```bash
git clone https://github.com/Ash-Technologia/FairSight.git
cd FairSight
```

**2. Start the Backend:** 
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**3. Start the Frontend:**
```bash
cd frontend
npm install
npm run dev
```
