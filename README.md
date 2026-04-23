<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/scale.svg" alt="FairSight Logo" width="80" height="80">
  <h1 align="center">FairSight</h1>
  <p align="center">
    <strong>A Developer-First AI Bias Detection & Remediation Platform</strong>
  </p>
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#demo">Demo Flow</a>
  </p>
</div>

---

## 🎯 The Problem
As AI rapidly permeates critical sectors like finance, hiring, and criminal justice, algorithmic bias carries existential regulatory and ethical risks. Traditional tools only offer passive, post-hoc fairness metrics that are disconnected from the developer workflow. 

## 🚀 The Solution: FairSight
FairSight bridges the gap between AI compliance and engineering execution. We provide an end-to-end framework to:
1. **Detect** bias instantly via our Live Dashboard or REST API integrations.
2. **Explain** correlation with protected attributes mapping via our native SHAP proxy heatmap.
3. **Remediate** datasets automatically via Magic Debiasing (IBM Reweighing algorithms).
4. **Govern** pipelines continuously using automated CI/CD webhooks and constitution rules.

---

## ✨ Core Hackathon Features

### 1. Magic Debiasing Export (IBM Reweighing)
FairSight doesn't just point out problems; it fixes them. Our backend natively implements **Kamiran & Calders' (2012)** reweighing algorithm to mathematically upweight/downweight demographic cohorts, allowing you to instantly export a statically fair `.csv` dataset.

### 2. SHAP Proxy Heatmap
Models rarely learn bias directly. Usually, they learn "proxy" variables (e.g., zip code indirectly representing race). Our Proxy Heatmap computes real-time Pearson correlations and clusters high-risk features so you can scrub your data before it hits the model.

### 3. Developer SDK Hub
Friction is the enemy of adoption. The **DevHub Snippet Generator** instantly constructs Python (Scikit-Learn), FastAPI, and Jupyter integration scripts embedded with your live API keys so you can pipe decisions straight to FairSight within 3 lines of code.

### 4. Fairness Firewall & Webhook Alerts
Monitor thousands of ML decisions a second. If your model drops below its designated fairness threshold or flags a `GUILTY` verdict, the Firewall trips and instantly pushes an alert webhook to your Slack/Discord. 

---

## 🏗 System Architecture

FairSight operates as a decoupled microservices platform specifically designed for high-performance scale:

- **Frontend Interface:** Next.js 14 App Router (React), TypeScript, Tailwind CSS, Recharts.
- **Analysis Engine:** FastAPI (Python 3.12), Pandas, Scikit-Learn, SHAP, Fairlearn.
- **Integration Layer:** WebSocket and REST ingestion gateways for ML SDK drops.

The user interface uses liquid glass-morphism aesthetics built purely via native CSS to maintain a blazingly fast framerate.

---

## ⚡ Quick Start

### 1. Start the Machine Learning Backend
\`\`\`bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`
*Backend server runs on `http://127.0.0.1:8000`*

### 2. Start the Frontend Dashboard
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
*Dashboard runs on `http://localhost:3000`*

---

## 🧪 Recommended Demo Script

Want to see FairSight in action? Follow this 2-minute flow:

1. **Get the SDK:** Go to the dashboard and click `</> Get SDK Code` to see how easy it is to pipe data.
2. **Audit a Model:** Go to **Run Audit**, and upload the `backend/data/adult_income.csv` dataset. Select `race` and `gender` as protected attributes.
3. **See the Carnage:** Notice the model flags as `GUILTY` with a fairness score of ~40/100 due to severe statistical parity differences.
4. **Locate the Problem:** Scroll to the **Proxy Feature Heatmap** to see exactly which supposedly "neutral" features are heavily tied to protected attributes.
5. **Fix the Problem:** Click `Use Magic Debias`, instantly project the new mathematically reweighed dataset, and download the clean CSV to feed back into your training pipeline!

---

<div align="center">
  <p><i>Built for the AI Safety Hackathon 2026.</i></p>
</div>
