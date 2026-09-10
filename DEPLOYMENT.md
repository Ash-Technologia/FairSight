# 🚀 FairSight: Production Deployment Guide

This guide provides end-to-end instructions for deploying FairSight to production across **Google Cloud Platform (Cloud Run + Firebase)**, **Docker / Docker Compose**, and **PaaS platforms (Render + Vercel)**.

---

## 📑 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & System Requirements](#2-prerequisites--system-requirements)
3. [Environment Variables Reference](#3-environment-variables-reference)
4. [Deployment Target 1: Google Cloud Platform (Recommended)](#4-deployment-target-1-google-cloud-platform-recommended)
   - [4.1 Backend on Google Cloud Run](#41-backend-on-google-cloud-run)
   - [4.2 Firebase Auth & Firestore Setup](#42-firebase-auth--firestore-setup)
   - [4.3 Frontend on Cloud Run or Vercel](#43-frontend-on-cloud-run-or-vercel)
5. [Deployment Target 2: Docker & Docker Compose (Self-Hosted)](#5-deployment-target-2-docker--docker-compose-self-hosted)
6. [Deployment Target 3: PaaS (Render + Vercel)](#6-deployment-target-3-paas-render--vercel)
7. [Post-Deployment Health Checks & Verification](#7-post-deployment-health-checks--verification)
8. [Production Hardening & Security Checklist](#8-production-hardening--security-checklist)
9. [Troubleshooting & Common Issues](#9-troubleshooting--common-issues)

---

## 1. Architecture Overview

```
                        ┌───────────────────────────────┐
                        │     Client (Browser / SDK)    │
                        └───────────────┬───────────────┘
                                        │ HTTPS
                                        ▼
    ┌───────────────────────────────────┬───────────────────────────────────┐
    │                                   │                                   │
    ▼                                   ▼                                   ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│   Next.js Frontend    │   │    FastAPI Backend    │   │  Firebase & Firestore │
│   (Vercel / Cloud Run)│   │  (Google Cloud Run)   │   │  (Auth & Persistence) │
│   Port 3000           │   │  Port 8000 / $PORT    │   │  NoSQL Cloud DB       │
└───────────┬───────────┘   └───────────┬───────────┘   └───────────────────────┘
            │                           │
            │ REST / SSE                │ Inference Calls
            ▼                           ▼
┌───────────────────────┐   ┌───────────────────────────────────────────────────┐
│ AI Reasoning Quorum   │   │ Google Gemini 2.0 Flash / 1.5 Flash (Google AI)  │
│ Multi-Provider Backup │   │ Groq (Llama 3.3-70B) • Mistral • HuggingFace      │
└───────────────────────┘   └───────────────────────────────────────────────────┘
```

---

## 2. Prerequisites & System Requirements

### Hardware / Cloud Sizing
* **Backend:** Minimum 1 vCPU, 1 GB RAM (2 GB recommended for datasets > 25k rows).
* **Frontend:** Minimum 1 vCPU, 512 MB RAM.

### Software Requirements
* **Python:** 3.10, 3.11, or 3.12 (Python 3.11.9 recommended).
* **Node.js:** 18.x or 20.x LTS.
* **Docker:** 24.x+ (if deploying via containers).
* **Google Cloud SDK (`gcloud`):** If deploying to GCP.

---

## 3. Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | Optional | `8000` | Port for Uvicorn server (automatically set by Cloud Run and Render). |
| `ALLOW_ALL_ORIGINS` | Optional | `true` | When `true`, enables CORS for all domains. Set to `false` in strict corporate environments. |
| `FRONTEND_URL` | Optional | `http://localhost:3000` | Comma-separated list of allowed frontend origins when `ALLOW_ALL_ORIGINS=false`. |
| `GOOGLE_GEMINI_API_KEY` | Optional | None | Used for optional backend Gemini integration (if calling LLM directly from Python). |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Optional | None | Service account JSON string for Firebase Admin verification. |

### Frontend (`frontend/.env.local` or Cloud Provider Env)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | **Yes** | `http://localhost:8000` | Public URL of the deployed FastAPI backend. |
| `GOOGLE_GEMINI_API_KEY` | **Yes** | None | Google AI Studio API key for Gemini 2.0 Flash reasoning. |
| `GROQ_API_KEY` | Optional | None | Groq API key (for multi-LLM consensus verification). |
| `MISTRAL_API_KEY` | Optional | None | Mistral API key (for consensus quorum). |
| `HUGGINGFACE_API_KEY` | Optional | None | Hugging Face inference key. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Optional | None | Firebase Web API key. (If omitted, app runs in Demo Mode). |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Optional | None | Firebase Auth domain (e.g. `fairsight.firebaseapp.com`). |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Optional | None | Firebase Project ID. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`| Optional | None | Firebase Storage bucket. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Optional | None | Firebase Messaging sender ID. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Optional | None | Firebase Web Application ID. |

---

## 4. Deployment Target 1: Google Cloud Platform (Recommended)

### 4.1 Backend on Google Cloud Run

Google Cloud Run provides serverless, auto-scaling container hosting that scales to zero when idle.

#### Step 1: Authenticate and Set Project
```bash
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
```

#### Step 2: Deploy Backend Directly from Source
Navigate to `backend/` and deploy with `gcloud run deploy`:

```bash
cd backend

gcloud run deploy fairsight-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars="ALLOW_ALL_ORIGINS=true"
```

Cloud Run will build the container using `Dockerfile`, inject the `$PORT` environment variable, and output a Service URL:
```
Service URL: https://fairsight-backend-xxxxxx.us-central1.run.app
```

#### Step 3: Verify Backend
```bash
curl -s https://fairsight-backend-xxxxxx.us-central1.run.app/health
# Response: {"status":"healthy"}
```

---

### 4.2 Firebase Auth & Firestore Setup

1. Open the [Firebase Console](https://console.firebase.google.com/) and create or select your Google Cloud project.
2. Enable **Firestore Database**:
   - Create database in **Production mode** (or test mode during verification).
   - Region: `us-central1` (match your Cloud Run region).
3. Enable **Authentication**:
   - Enable **Anonymous** and **Email/Password** or **Google Sign-in** providers.
4. Register a Web App:
   - Project Settings -> General -> "Your apps" -> Add Web App (`FairSight Web`).
   - Copy the `firebaseConfig` object into your frontend environment variables.

---

### 4.3 Frontend Deployment

#### Option A: Vercel (Recommended for Next.js)
1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) -> New Project -> Import `FairSight`.
3. Set **Root Directory** to `frontend`.
4. Configure Environment Variables in Vercel:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://fairsight-backend-xxxxxx.us-central1.run.app
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   ```
5. Click **Deploy**.

#### Option B: Google Cloud Run (Containerized Frontend)
From the root directory:
```bash
cd frontend

gcloud run deploy fairsight-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars="NEXT_PUBLIC_BACKEND_URL=https://fairsight-backend-xxxxxx.us-central1.run.app,GOOGLE_GEMINI_API_KEY=your_key"
```

---

## 5. Deployment Target 2: Docker & Docker Compose (Self-Hosted)

For on-premises, private cloud, or single-server deployment, use Docker Compose.

### Step 1: Create `docker-compose.yml` in Root
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
      - ALLOW_ALL_ORIGINS=true
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_BACKEND_URL=http://backend:8000
      - GOOGLE_GEMINI_API_KEY=${GOOGLE_GEMINI_API_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
    depends_on:
      - backend
    restart: unless-stopped
```

### Step 2: Build and Run
```bash
docker-compose up -d --build
```
Access the application at `http://localhost:3000`.

---

## 6. Deployment Target 3: PaaS (Render + Vercel)

### Backend on Render
The repository includes a ready-to-use `backend/render.yaml` configuration.

1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Web Service**:
   * **Root Directory:** `backend`
   * **Environment:** `Python 3`
   * **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
   * **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add Environment Variables:
   * `ALLOW_ALL_ORIGINS` = `true`
   * `PYTHON_VERSION` = `3.11.9`
4. Deploy service and copy your `https://your-service.onrender.com` URL.

---

## 7. Post-Deployment Health Checks & Verification

Run these automated verification commands against your live deployment:

### 1. Basic Health Check
```bash
curl -i https://YOUR_BACKEND_URL/health
# Expected: HTTP/1.1 200 OK
# Body: {"status":"healthy"}
```

### 2. Live Fairness Firewall Test
```bash
curl -X POST https://YOUR_BACKEND_URL/firewall/intercept \
  -H "Content-Type: application/json" \
  -d '{
    "decision": 0,
    "protected_attributes": {"race": "Black", "gender": "Female"},
    "confidence": 0.52
  }'
# Expected response contains: "status": "BLOCKED" or "ALLOWED", "risk_score": ...
```

### 3. CI/CD Gate Health Check
```bash
curl -i "https://YOUR_BACKEND_URL/cicd/gate?threshold=80"
# Expected: HTTP/1.1 200 OK with checks evaluation
```

---

## 8. Production Hardening & Security Checklist

* [ ] **CORS Restriction:** In corporate environments, set `ALLOW_ALL_ORIGINS=false` and list your exact frontend domains in `FRONTEND_URL`.
* [ ] **HTTPS Only:** Ensure your load balancer or Cloud Run enforces HTTPS redirects.
* [ ] **API Keys Protection:** Never commit `.env` or service account JSON files to git. Use Secret Manager (e.g., Google Secret Manager or Vercel Environment Variables).
* [ ] **Rate Limiting:** If deploying backend publicly without an API gateway, register `rate_limit_middleware` or attach Cloud Armor / Cloudflare rate limiting.
* [ ] **No Raw Data Persistence:** Verify that datasets are processed in-memory and discarded post-analysis.

---

## 9. Troubleshooting & Common Issues

### Issue 1: Cloud Run Container Fails to Start (`Port not listening`)
* **Cause:** Uvicorn was configured with a static port instead of binding to Cloud Run's dynamic `$PORT`.
* **Fix:** Verify `backend/Dockerfile` uses `CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]`.

### Issue 2: Cold Start Delays
* **Cause:** Serverless instances (Cloud Run / Render Free) spin down after inactivity.
* **Fix:** Set `--min-instances 1` in Cloud Run to keep one warm instance permanently.

### Issue 3: Firebase "Permission Denied" in Firestore
* **Cause:** Firestore security rules blocking reads/writes from the client app.
* **Fix:** During hackathons or internal trials, use permissive development rules for authenticated users:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if true;
      }
    }
  }
  ```
  *(FairSight also includes an automatic zero-config local cache fallback if Firestore is unreachable).*

### Issue 4: CSV Upload Returns "Parse Error: 'utf-8' codec can't decode..."
* **Cause:** Dataset saved in Windows Latin-1 or ISO-8859-1 format.
* **Fix:** FairSight automatically falls back to `latin-1` decoding. Ensure backend is running the latest `analyze.py`.
