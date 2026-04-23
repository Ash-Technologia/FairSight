<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/scale.svg" alt="FairSight Logo" width="80" height="80">
  <h1 align="center">FairSight</h1>
  <p align="center">
    <strong>The Absolute Standard for AI Bias Detection, Consensus Explanation, & Automated Remediation</strong>
  </p>
  <p align="center">
    <a href="#the-platform">The Platform</a> •
    <a href="#core-usps--features">Core Features</a> •
    <a href="#system-architecture">Architecture</a> •
    <a href="#quick-start">Quick Start</a>
  </p>
</div>

---

## 🎯 The Problem
As AI pipelines scale into critical sectors like finance, hiring, and criminal justice, algorithmic bias carries existential regulatory (EU AI Act) and ethical risks. Traditional tools offer passive, post-hoc fairness metrics that are painfully disconnected from the agile developer workflow. Developers need tools that don't just *flag* bias, but **explain** it, **prove** it, and **fix** it in real-time.

## 🚀 The Solution: FairSight
FairSight bridges the gap between static AI compliance and active engineering execution. It is a full-stack, developer-first platform designed to:
1. **Detect** bias instantly via statistical validation and Live WebSocket Monitoring.
2. **Diagnose** root causes using a Multi-Agent AI Consensus engine.
3. **Explain** hidden dataset correlations securely via SHAP proxy heatmapping.
4. **Remediate** datasets automatically using mathematically proven IBM Reweighing algorithms.
5. **Govern** pipelines continuously using automated CI/CD webhooks and constitution rules.

---

## ✨ Core USPs & Features

FairSight goes far beyond simple metric evaluation. We've built an enterprise-grade compliance toolkit designed around zero-friction engineering.

### 🧠 Multi-Model AI Consensus Engine
Why rely on one model's opinion of bias? FairSight aggregates parallel reasoning from three distinct LLM architectures:
- **Google Gemini (2.5-Flash)**
- **Meta Llama 3.3 (70B via Groq)**
- **Mistral Mixtral 8x7B (via Hugging Face)**
The platform synthesizes these independent reads into a unified, cryptographically hashed consensus verdict (`GUILTY`, `BORDERLINE`, `CLEAR`). 

### 🛡 In-Memory Privacy Sandbox (GDPR Compliant)
We never commit user datasets to a physical disk or cloud database. CSV matrices are processed entirely in ephemeral server RAM, ensuring absolute data sovereignty. Instead of storing the data, FairSight calculates a **SHA-256 Cryptographic Fingerprint** to bind an immutable proof to your compliance certificates.

### 🪄 Magic Debiasing Export (Kamiran & Calders Reweighing)
FairSight doesn't just point out problems; it fixes them. Our backend natively implements the IBM Reweighing algorithm to mathematically upweight minority cohorts and downweight privileged cohorts. Instantly project your new "After" fairness score and export a statically fair `.csv` ready for retraining.

### 🗺 SHAP Proxy Feature Heatmap
Models rarely learn bias via direct attributes like "Race". Usually, they learn "proxy" variables (e.g., *Zip Code* indirectly mapping to *Race*). Our native Proxy Heatmap computes real-time Pearson correlations and visually clusters high-risk features so you can scrub your DataFrame effectively.

### 💻 Developer Hub & SDK Snippet Generator
Friction is the enemy of adoption. The **DevHub** instantly generates dynamic, drop-in integration scripts for `Python (Scikit-Learn)`, `FastAPI`, and `Jupyter Notebooks`. It automatically embeds your actively generated API keys so you can pipe inference decisions to FairSight in three lines of code.

### ⚡ Resilient "Zero-Crash" Fallback Architecture
Built to survive the hackathon demo stage:
- **LLM Failsafe**: If an LLM rate-limits or 404s, the Consensus Engine dynamically aggregates the remaining successful votes.
- **Database Failsafe**: If Firebase goes down, the system intercepts the disruption and gracefully falls back to a local `.fairsight_cache.json`.
- **Auth Failsafe**: Universal Demo-Auth degrades gracefully. If OAuth configurations are missing, the UI automatically injects a sandbox "Demo Mode" profile.

### 📡 Fairness Firewall & Webhook Alerts
Monitor thousands of ML decisions a second via raw FastAPI WebSockets. If the model breaches your predefined Demographics Parity threshold or triggers a `GUILTY` consensus, the Firewall trips and instantly fires rich JSON payloads to your Slack, Discord, or Microsoft Teams webhooks.

### 📜 Dynamic Compliance PDF Export
Export beautiful, high-fidelity compliance reports natively on the client utilizing `jsPDF`—bypassing heavy headless server browser limits. Perfect for generating instantaneous EU AI Act Readiness artifacts.

---

## 🏗 System Architecture

FairSight operates as a decoupled microservices platform specifically designed for high-performance scale:

- **Frontend Interface:** Next.js 14 App Router (React), TypeScript, Tailwind CSS, Recharts.
- **Analysis Backend:** FastAPI (Python 3.12), Pandas, Scikit-Learn, SHAP, Fairlearn.
- **Communication Protocol:** Persistent WebSocket gateways backed by high-throughput REST APIs.

*UI aesthetics utilize pure CSS "liquid glass-morphism" and ultra-lightweight keyframe animations to maintain a 60fps experience.*

---

## ⚡ Quick Start

### 1. Start the Machine Learning Backend
\`\`\`bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`
*Backend server mounts successfully on `http://127.0.0.1:8000`*

### 2. Start the Frontend Dashboard
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
*React Application mounts successfully on `http://localhost:3000`*

---

## 🧪 Recommended Demo Flow (The Hackathon Script)

Want to see FairSight flex its complete pipeline? Follow this 3-minute flow to experience the entire detect-explain-remediate loop:

1. **Connect the Pipes:** Go to the dashboard and open the `</> Get SDK Code` developer modal. Copy the API key and Python script to show how seamlessly real-time pipelines attach to FairSight.
2. **Configure the Firewall:** Navigate to **Settings > Webhook Alerts**. Establish a threshold (e.g., 75/100) and link a dummy Slack endpoint. Turn the Firewall ON.
3. **Run the Audit:** Go to **Run Audit**, upload the pre-provided `backend/data/adult_income.csv` dataset, and target `gender` and `race` as protected attributes.
4. **Observe the Consensus:** Watch the Multi-Agent LLMs asynchronously process the statistical disparity (showing severe Demographic Parity violations) and generate a unified `GUILTY` verdict and an active fairness score (e.g., 40/100).
5. **Diagnose the Proxies:** Scroll down the report to the **Proxy Heatmap**. Reveal that innocent-looking variables are secretly correlating heavily with demographic markers, driving the AI's bias.
6. **Deploy the Fix:** Click `Use Magic Debias`. Observe the math engine recalculate sample weights, immediately projecting a newly resolved Fairness Score (98/100), and download the scrubbed `.csv` to fix the pipeline!

---

<div align="center">
  <p><i>The absolute standard for the AI Safety Hackathon 2026.</i></p>
</div>
