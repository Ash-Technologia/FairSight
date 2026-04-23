# FairSight Deployment Guide (Hackathon Optimized)

Because FairSight uses a decoupled microservices architecture (Next.js Frontend + FastAPI Backend), you need to deploy the two pieces separately. For a hackathon, speed, cost (free), and zero-configuration are the most critical factors.

We will use **Render** for the Python Backend and **Vercel** for the Next.js Frontend.

---

## Part 1: Deploying the Backend (Render)

We deploy the backend first because the frontend needs its live URL to function.

1. Go to [Render.com](https://render.com/) and sign in with your GitHub account.
2. Click **New +** and select **Web Service**.
3. Select the `Ash-Technologia/FairSight` repository.
4. **Configuration Settings:**
   - **Name:** `fairsight-backend` (or similar)
   - **Root Directory:** `backend` *(⚠️ CRITICAL: Must be exactly "backend")*
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 10000`
   - **Instance Type:** Free (or whatever tier you prefer)
5. **Environment Variables (Advanced > Add Environment Variables):**
   - Add `GOOGLE_GEMINI_API_KEY` = `(your key here)`
   - Add `FIREBASE_SERVICE_ACCOUNT_JSON` = `(your raw single-line JSON blob here)`
   - Add `FRONTEND_URL` = *(leave blank for now, we will update this after Vercel)*
6. Click **Create Web Service**. 
7. The build will take ~2-3 minutes. Once it completes, you will receive a URL like `https://fairsight-backend.onrender.com`. **Copy this URL.**

---

## Part 2: Deploying the Frontend (Vercel)

Vercel is the creator of Next.js and provides zero-config, immediate deployments. 

1. Go to [Vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New... > Project**.
3. Import the `Ash-Technologia/FairSight` repository.
4. **Configuration Settings:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend` *(⚠️ CRITICAL: Click edit and select the "frontend" folder)*
5. **Environment Variables:**
   - Add `NEXT_PUBLIC_BACKEND_URL` = `https://fairsight-backend.onrender.com` *(The URL you copied from Render step 7)*
   - Add `NEXT_PUBLIC_FIREBASE_API_KEY` = `(your key)`
   - Add `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = `(your domain)`
   - Add `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = `(your id)`
   - Add `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = `(your storage bucket)`
   - Add `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = `(your sender id)`
   - Add `NEXT_PUBLIC_FIREBASE_APP_ID` = `(your app id)`
6. Click **Deploy**.
7. Vercel will install NPM packages and build the optimized Next.js app. Unlink Render, it finishes lightning fast. Once done, you will receive your live Vercel URL (e.g., `https://fairsight.vercel.app`). **Copy this URL.**

---

## Part 3: Tying the Knot (CORS Fix)

Your backend is currently blocking incoming traffic that isn't from `http://localhost:3000`. We need to tell the backend to trust the new Vercel URL.

1. Go back to your **Render Dashboard** > Select `fairsight-backend`.
2. Go to the **Environment** tab.
3. Update the `FRONTEND_URL` variable to your new Vercel URL (e.g., `https://fairsight.vercel.app`).
4. Render will automatically redeploy the backend with the new CORS origin.

---

## 🏆 Deployment Checklist Complete!
- [x] Backend logic is live and accepting API/WebSocket payloads.
- [x] Frontend is live, heavily cached on the Edge, and pointing to the backend.
- [x] CORS restricts browser access solely to your active Vercel domain.

You can now confidently present your live application via the Vercel URL!
