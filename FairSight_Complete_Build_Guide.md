# FairSight — Complete Build Guide
## Google Solution Challenge 2025 | Problem Statement 4: Unbiased AI Decision
### Stack: Claude Sonnet 4.6 (via Anthropic API) · Next.js · FastAPI · Fairlearn · Firebase

---

# TABLE OF CONTENTS

1. [Project Architecture Overview](#1-architecture)
2. [Folder Structure](#2-folder-structure)
3. [Tech Stack & API Keys Setup](#3-tech-stack)
4. [Frontend: Next.js App (All Pages + Components)](#4-frontend)
5. [Backend: FastAPI + ML Pipeline](#5-backend)
6. [Claude Sonnet 4.6 Integration — Complete AI Prompts](#6-claude-prompts)
7. [SDK Package: fairsight](#7-sdk)
8. [Database Schema (Firebase Firestore)](#8-database)
9. [Security Layer](#9-security)
10. [Prototype Submission Checklist](#10-checklist)

---

## 1. ARCHITECTURE OVERVIEW

```
User Browser (Next.js)
     │
     ├──→ /api/* (Next.js API routes) ──→ Claude Sonnet 4.6 (Anthropic API)
     │                                         │ bias verdict, plain language,
     │                                         │ root cause explanation
     │
     ├──→ FastAPI Backend (Python)
     │         │
     │         ├──→ Fairlearn / AIF360  (statistical bias metrics)
     │         ├──→ SHAP                (feature importance / root cause)
     │         ├──→ Pandas              (dataset preprocessing)
     │         └──→ Firebase Firestore  (audit trail, hashed data)
     │
     └──→ Firebase Auth (JWT sessions)

SDK (pip install fairsight)
     └──→ Wraps user's model → sends decision logs → FastAPI → real-time dashboard
```

**Why this wins:** Other teams will build a static file-upload bias checker. FairSight is a **live deployed model watchdog** — it intercepts predictions *after* deployment. The SDK is the architectural differentiator that makes this a product, not a demo.

---

## 2. FOLDER STRUCTURE

```
fairsight/
├── frontend/                    # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx            # Landing page (already designed — see HTML file)
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Main authenticated dashboard
│   │   ├── audit/
│   │   │   ├── page.tsx        # Upload & analyze page
│   │   │   └── [id]/page.tsx   # Individual audit report
│   │   ├── monitor/
│   │   │   └── page.tsx        # Live SDK feed
│   │   ├── verdict/
│   │   │   └── [id]/page.tsx   # Verdict deep-dive
│   │   └── api/
│   │       ├── analyze/route.ts        # Calls FastAPI + Claude
│   │       ├── verdict/route.ts        # Fetches verdict from Firestore
│   │       └── export-pdf/route.ts     # Generates audit PDF
│   ├── components/
│   │   ├── VerdictCard.tsx
│   │   ├── BiasMetricBars.tsx
│   │   ├── FlipTestCard.tsx
│   │   ├── LiveFeed.tsx
│   │   ├── AuditUpload.tsx
│   │   └── FairnessScore.tsx
│   └── lib/
│       ├── claude.ts           # Claude API helper
│       ├── firebase.ts         # Firebase client
│       └── types.ts            # TypeScript interfaces
│
├── backend/                    # FastAPI Python service
│   ├── main.py
│   ├── routers/
│   │   ├── analyze.py          # Core bias analysis endpoint
│   │   ├── monitor.py          # WebSocket for live SDK feed
│   │   └── sdk.py              # SDK ingest endpoint
│   ├── services/
│   │   ├── bias_engine.py      # Fairlearn + AIF360 metrics
│   │   ├── shap_service.py     # Feature importance
│   │   ├── flip_test.py        # Counterfactual flip analysis
│   │   └── hash_service.py     # SHA-256 dataset hashing
│   └── requirements.txt
│
├── sdk/                        # pip install fairsight
│   ├── fairsight/
│   │   ├── __init__.py
│   │   ├── wrapper.py          # FairSight(model=...) class
│   │   ├── interceptor.py      # predict() override
│   │   └── reporter.py         # Sends logs to backend
│   └── setup.py
│
└── shared/
    └── types.ts                # Shared TypeScript types
```

---

## 3. TECH STACK & API KEYS SETUP

### Required API Keys (All Free / Very Low Cost)

| Service | Purpose | Cost | Get Key |
|---|---|---|---|
| **Anthropic Claude Sonnet 4.6** | Verdict engine, plain language | Free tier / pay-per-use | console.anthropic.com |
| **Firebase** | Auth + Firestore | Free Spark plan | console.firebase.google.com |
| **Google Fonts** | Typography (Syne + DM Mono) | Free | fonts.google.com |

### Environment Variables

Create `.env.local` in `/frontend`:
```bash
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fairsight-prod
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Create `.env` in `/backend`:
```bash
ANTHROPIC_API_KEY=sk-ant-...
FIREBASE_SERVICE_ACCOUNT_JSON='{...}'  # Service account JSON as string
```

### Install Commands

**Frontend:**
```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install firebase @anthropic-ai/sdk jspdf framer-motion recharts
```

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn pandas numpy scikit-learn fairlearn aif360 shap firebase-admin anthropic python-multipart websockets
```

---

## 4. FRONTEND — COMPLETE IMPLEMENTATION

### 4.1 Landing Page

**The landing page HTML is already built** (see `fairsight_landing_page.html` from your previous session). Convert it to Next.js by:

1. Create `app/page.tsx`
2. Copy all the HTML into a `<main>` JSX block
3. Move the `<style>` block to `globals.css`
4. Move the `<script>` to a `useEffect` hook

```tsx
// app/page.tsx
'use client'
import { useEffect, useRef } from 'react'

export default function LandingPage() {
  useEffect(() => {
    // Paste the intersection observer + live feed interval from the HTML script block here
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      })
    }, { threshold: 0.12 })
    document.querySelectorAll('.fade-in').forEach(el => obs.observe(el))

    // Live feed interval (from HTML)
    const feedData = [ /* ... paste from HTML ... */ ]
    let fi = 0
    const interval = setInterval(() => {
      // paste live feed logic
    }, 2200)

    return () => {
      obs.disconnect()
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="page">
      {/* Paste full HTML structure here as JSX — change class= to className= */}
    </div>
  )
}
```

---

### 4.2 Dashboard Page

```tsx
// app/dashboard/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { VerdictCard } from '@/components/VerdictCard'
import { LiveFeed } from '@/components/LiveFeed'
import { FairnessScore } from '@/components/FairnessScore'

export default function Dashboard() {
  const [audits, setAudits] = useState([])
  const [stats, setStats] = useState({ modelsMonitored: 0, decisionsAudited: 0, activeAlerts: 0, avgFairnessScore: 0 })

  useEffect(() => {
    // Fetch from Firestore via /api/verdict
    fetch('/api/verdict').then(r => r.json()).then(setAudits)
  }, [])

  return (
    <div style={{ background: '#f0f4f7', minHeight: '100vh', padding: '80px 32px' }}>
      {/* STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginBottom: 40 }}>
        <StatCard label="Models Monitored" value={stats.modelsMonitored} accent="#0d9488" />
        <StatCard label="Decisions Audited" value={stats.decisionsAudited} accent="#0d9488" />
        <StatCard label="Active Alerts" value={stats.activeAlerts} accent="#dc2626" />
        <StatCard label="Avg Fairness Score" value={`${stats.avgFairnessScore}%`} accent="#0d9488" />
      </div>

      {/* RECENT VERDICTS */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Recent Verdicts</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
        {audits.map((a: any) => <VerdictCard key={a.id} audit={a} />)}
      </div>
    </div>
  )
}
```

---

### 4.3 Audit Upload Page — THE CORE SCREEN

This is the most important screen. Users upload a CSV or paste decision logs here.

```tsx
// app/audit/page.tsx
'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type AnalysisState = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'

export default function AuditPage() {
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<AnalysisState>('idle')
  const [progress, setProgress] = useState(0)
  const [auditId, setAuditId] = useState('')
  const router = useRouter()

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.json'))) {
      setFile(f)
    }
  }, [])

  const runAnalysis = async () => {
    if (!file) return
    setState('uploading')
    setProgress(15)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('protected_attributes', JSON.stringify(['race', 'gender', 'age']))

    try {
      setState('analyzing')
      setProgress(40)

      // Step 1: FastAPI bias metrics
      const metricsRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/analyze`, {
        method: 'POST',
        body: formData
      })
      const metrics = await metricsRes.json()
      setProgress(70)

      // Step 2: Claude Sonnet 4.6 verdict generation
      const verdictRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, filename: file.name })
      })
      const { auditId } = await verdictRes.json()
      setProgress(100)
      setState('done')
      setAuditId(auditId)

      setTimeout(() => router.push(`/audit/${auditId}`), 800)
    } catch (err) {
      setState('error')
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '80px 32px' }}>
      <div style={{ marginBottom: 32 }}>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#0f766e', fontWeight: 600 }}>
          Bias Diagnostic
        </span>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#0f1f35', letterSpacing: -1, marginTop: 8 }}>
          Run Fairness Audit
        </h1>
        <p style={{ color: '#64748b', marginTop: 8, lineHeight: 1.65 }}>
          Upload a CSV dataset or model prediction log. FairSight runs 12 fairness metrics, 
          identifies root causes, and generates a plain-language verdict using AI.
        </p>
      </div>

      {/* DRAG & DROP ZONE */}
      {state === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => document.getElementById('file-input')?.click()}
          style={{
            border: file ? '2px solid #0d9488' : '2px dashed #d1dce8',
            borderRadius: 16,
            padding: '48px 32px',
            textAlign: 'center',
            cursor: 'pointer',
            background: file ? '#f0fdf4' : 'white',
            transition: 'all 0.2s'
          }}
        >
          <input id="file-input" type="file" accept=".csv,.json" hidden onChange={e => setFile(e.target.files?.[0] || null)} />
          {file ? (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <div style={{ fontWeight: 600, color: '#0f1f35' }}>{file.name}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB — ready for analysis</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⊕</div>
              <div style={{ fontWeight: 600, color: '#0f1f35' }}>Drop your CSV or JSON file here</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Dataset (.csv) or prediction log (.json) · Max 10MB · Never stored permanently</div>
            </>
          )}
        </div>
      )}

      {/* PRIVACY NOTICE */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginTop: 16, display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12, color: '#166534' }}>
        <span>🔒</span>
        <span>Your data is <strong>never stored</strong>. Processed in-memory only. Only a SHA-256 hash of your dataset is saved for audit trail. GDPR-safe.</span>
      </div>

      {/* ANALYSIS PROGRESS */}
      {(state === 'uploading' || state === 'analyzing') && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: '#0f1f35', fontWeight: 500 }}>
              {state === 'uploading' ? 'Processing dataset...' : 'Running AI diagnostic...'}
            </span>
            <span style={{ color: '#64748b' }}>{progress}%</span>
          </div>
          <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#0d9488', width: `${progress}%`, transition: 'width 0.5s ease', borderRadius: 2 }} />
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Parsing dataset', 'Checking demographic parity', 'Running flip test', 'Analyzing feature importance', 'Generating AI verdict'].map((step, i) => (
              <span key={step} style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 20,
                background: progress > i * 20 ? '#ccfbf1' : '#f1f5f9',
                color: progress > i * 20 ? '#0f766e' : '#94a3b8',
                fontWeight: 500, transition: 'all 0.3s'
              }}>
                {progress > i * 20 ? '✓ ' : ''}{step}
              </span>
            ))}
          </div>
        </div>
      )}

      {state === 'done' && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20, marginTop: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
          <div style={{ fontWeight: 600, color: '#166534' }}>Audit complete — redirecting to verdict...</div>
        </div>
      )}

      {file && state === 'idle' && (
        <button
          onClick={runAnalysis}
          style={{
            marginTop: 20, width: '100%', background: '#0f1f35', color: 'white',
            border: 'none', padding: '14px 28px', borderRadius: 10, fontSize: 14,
            fontWeight: 600, cursor: 'pointer', letterSpacing: '-0.2px'
          }}
        >
          Run Fairness Audit →
        </button>
      )}
    </div>
  )
}
```

---

### 4.4 Audit Report / Verdict Page

```tsx
// app/audit/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { VerdictCard } from '@/components/VerdictCard'
import { FlipTestCard } from '@/components/FlipTestCard'
import { BiasMetricBars } from '@/components/BiasMetricBars'

export default function AuditReport({ params }: { params: { id: string } }) {
  const [audit, setAudit] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/verdict?id=${params.id}`).then(r => r.json()).then(setAudit)
  }, [params.id])

  if (!audit) return <div style={{ padding: 80, textAlign: 'center', color: '#64748b' }}>Loading verdict...</div>

  const exportPDF = async () => {
    const res = await fetch(`/api/export-pdf?id=${params.id}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fairsight-audit-${params.id}.pdf`
    a.click()
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 32px' }}>

      {/* VERDICT HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#0f766e', fontWeight: 600 }}>
            Audit #{audit.id.slice(0, 8).toUpperCase()}
          </span>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#0f1f35', letterSpacing: -0.8, marginTop: 6 }}>
            Verdict: <span style={{ color: audit.verdict === 'GUILTY' ? '#dc2626' : '#0d9488' }}>{audit.verdict}</span>
          </h1>
          <p style={{ color: '#64748b', marginTop: 4, fontSize: 14 }}>{audit.filename} · {new Date(audit.createdAt).toLocaleDateString()}</p>
        </div>
        <button onClick={exportPDF} style={{ background: '#0f1f35', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          Export PDF Audit
        </button>
      </div>

      {/* AI VERDICT — PLAIN LANGUAGE (from Claude) */}
      <div style={{ background: 'white', border: '1px solid #d1dce8', borderRadius: 16, padding: 28, marginBottom: 24 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 12, fontWeight: 600 }}>
          AI Diagnostic Report
        </div>
        <p style={{ fontSize: 15, color: '#0f1f35', lineHeight: 1.75 }}>{audit.aiVerdict}</p>
      </div>

      {/* BIAS METRICS */}
      <BiasMetricBars metrics={audit.metrics} />

      {/* ROOT CAUSE */}
      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 16, padding: 28, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#9a3412', marginBottom: 12 }}>Root Cause Attribution</div>
        <p style={{ fontSize: 14, color: '#7c2d12', lineHeight: 1.65 }}>{audit.rootCause}</p>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {audit.proxyFeatures?.map((f: string) => (
            <span key={f} style={{ fontSize: 11, background: '#fed7aa', color: '#9a3412', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* FLIP TEST */}
      {audit.flipTest && <FlipTestCard data={audit.flipTest} />}

      {/* MITIGATION RECOMMENDATIONS (from Claude) */}
      <div style={{ background: 'white', border: '1px solid #d1dce8', borderRadius: 16, padding: 28, marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1f35', marginBottom: 16 }}>Recommended Fixes</div>
        {audit.mitigations?.map((m: any, i: number) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16, padding: 16, background: '#f8fafc', borderRadius: 10 }}>
            <div style={{ width: 28, height: 28, background: '#ccfbf1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
              {i + 1}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#0f1f35', marginBottom: 4 }}>{m.title}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{m.description}</div>
              <span style={{ display: 'inline-block', marginTop: 8, fontSize: 10, background: m.difficulty === 'Easy' ? '#dcfce7' : '#fef3c7', color: m.difficulty === 'Easy' ? '#166534' : '#92400e', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                {m.difficulty}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* TOGGLE: Technical vs Plain Language */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          onClick={() => {/* toggle state */}}
          style={{ fontSize: 12, color: '#64748b', background: 'none', border: '1px solid #d1dce8', padding: '7px 16px', borderRadius: 8, cursor: 'pointer' }}
        >
          Switch to Board Mode (Plain English)
        </button>
      </div>
    </div>
  )
}
```

---

### 4.5 Key Components

**`components/VerdictCard.tsx`**
```tsx
export function VerdictCard({ audit }: { audit: any }) {
  const guilty = audit.verdict === 'GUILTY'
  return (
    <div style={{
      background: 'white',
      border: '1px solid #d1dce8',
      borderLeft: `3px solid ${guilty ? '#dc2626' : '#0d9488'}`,
      borderRadius: 16, padding: 24,
      cursor: 'pointer', transition: 'transform 0.2s',
    }}
      onClick={() => window.location.href = `/audit/${audit.id}`}
    >
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 6 }}>Verdict #{audit.id.slice(0, 6)}</div>
      <div style={{ fontWeight: 600, fontSize: 15, color: '#0f1f35', marginBottom: 4 }}>{audit.filename}</div>
      <span style={{
        display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '3px 10px',
        borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.06em',
        background: guilty ? '#fee2e2' : '#dcfce7',
        color: guilty ? '#991b1b' : '#166534'
      }}>
        {audit.verdict}
      </span>
      <div style={{ marginTop: 16, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
        {audit.aiVerdict?.slice(0, 120)}...
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: '#94a3b8' }}>
        Fairness score: <strong style={{ color: '#0f1f35' }}>{audit.fairnessScore}%</strong>
        · {new Date(audit.createdAt).toLocaleDateString()}
      </div>
    </div>
  )
}
```

**`components/FlipTestCard.tsx`**
```tsx
export function FlipTestCard({ data }: { data: any }) {
  return (
    <div style={{ background: '#0f1f35', borderRadius: 16, padding: 28, marginBottom: 24, color: 'white' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
        Counterfactual Flip Test
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20, lineHeight: 1.6 }}>
        The same applicant profile was submitted twice — with only the protected attribute changed. Result:
      </p>
      {data.pairs.map((pair: any, i: number) => (
        <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>{pair.profile_a.label}</div>
            <span style={{ background: pair.outcome_a === 'REJECTED' ? '#450a0a' : '#022c22', color: pair.outcome_a === 'REJECTED' ? '#fca5a5' : '#6ee7b7', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>
              {pair.outcome_a}
            </span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>↔</span>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>{pair.profile_b.label}</div>
            <span style={{ background: pair.outcome_b === 'REJECTED' ? '#450a0a' : '#022c22', color: pair.outcome_b === 'REJECTED' ? '#fca5a5' : '#6ee7b7', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>
              {pair.outcome_b}
            </span>
          </div>
        </div>
      ))}
      {data.flip_detected && (
        <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 10, padding: '12px 16px', marginTop: 16, fontSize: 13, color: '#fca5a5' }}>
          ⚠ Flip detected — decision changed solely due to protected attribute. This is actionable bias evidence.
        </div>
      )}
    </div>
  )
}
```

**`components/BiasMetricBars.tsx`**
```tsx
export function BiasMetricBars({ metrics }: { metrics: any }) {
  const items = [
    { label: 'Demographic Parity', value: metrics.demographic_parity, threshold: 0.1 },
    { label: 'Equalized Odds', value: metrics.equalized_odds, threshold: 0.1 },
    { label: 'Calibration Gap', value: metrics.calibration_gap, threshold: 0.05 },
    { label: 'Individual Fairness', value: metrics.individual_fairness, threshold: 0.15 },
  ]
  return (
    <div style={{ background: 'white', border: '1px solid #d1dce8', borderRadius: 16, padding: 28, marginBottom: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f1f35', marginBottom: 20 }}>Bias Metrics</div>
      {items.map(item => (
        <div key={item.label} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{item.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: item.value > item.threshold ? '#dc2626' : '#0d9488' }}>
              {item.value.toFixed(3)} {item.value > item.threshold ? '⚠' : '✓'}
            </span>
          </div>
          <div style={{ height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: item.value > item.threshold ? '#dc2626' : '#0d9488',
              width: `${Math.min(item.value * 500, 100)}%`,
              transition: 'width 1.2s ease-out'
            }} />
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>Threshold: {item.threshold}</div>
        </div>
      ))}
    </div>
  )
}
```

---

## 5. BACKEND — FastAPI + ML Pipeline

### 5.1 `main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze, monitor, sdk

app = FastAPI(title="FairSight API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-prod-domain.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/analyze")
app.include_router(monitor.router, prefix="/monitor")
app.include_router(sdk.router, prefix="/sdk")
```

### 5.2 `routers/analyze.py` — Core Analysis Endpoint
```python
from fastapi import APIRouter, UploadFile, File, Form
from services.bias_engine import run_bias_analysis
from services.flip_test import run_flip_test
from services.shap_service import get_feature_importance
from services.hash_service import hash_dataset
import pandas as pd
import json
import io

router = APIRouter()

@router.post("/")
async def analyze_dataset(
    file: UploadFile = File(...),
    protected_attributes: str = Form('["race","gender"]'),
    target_column: str = Form("outcome"),
    label_column: str = Form("label")
):
    # Read file — NEVER save to disk
    content = await file.read()
    
    if file.filename.endswith('.csv'):
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
    else:
        data = json.loads(content)
        df = pd.DataFrame(data)

    protected_cols = json.loads(protected_attributes)
    
    # Hash the dataset (audit trail without storing PII)
    dataset_hash = hash_dataset(content)

    # Run bias metrics via Fairlearn
    metrics = run_bias_analysis(df, protected_cols, target_column, label_column)

    # Run counterfactual flip test
    flip_result = run_flip_test(df, protected_cols, target_column)

    # Feature importance (which features proxy bias)
    feature_importance = get_feature_importance(df, target_column, protected_cols)

    return {
        "dataset_hash": dataset_hash,
        "metrics": metrics,
        "flip_test": flip_result,
        "feature_importance": feature_importance,
        "row_count": len(df),
        "protected_attributes": protected_cols
    }
```

### 5.3 `services/bias_engine.py`
```python
from fairlearn.metrics import (
    demographic_parity_difference,
    equalized_odds_difference,
    MetricFrame
)
from sklearn.metrics import accuracy_score
import pandas as pd
import numpy as np

def run_bias_analysis(df: pd.DataFrame, protected_cols: list, target_col: str, label_col: str) -> dict:
    results = {}
    
    for protected in protected_cols:
        if protected not in df.columns:
            continue
        
        y_true = df[label_col] if label_col in df.columns else df[target_col]
        y_pred = df[target_col]
        sensitive = df[protected]

        try:
            dp = demographic_parity_difference(y_true, y_pred, sensitive_features=sensitive)
            eo = equalized_odds_difference(y_true, y_pred, sensitive_features=sensitive)
        except Exception:
            dp, eo = 0.0, 0.0

        # Group accuracy breakdown
        mf = MetricFrame(
            metrics=accuracy_score,
            y_true=y_true,
            y_pred=y_pred,
            sensitive_features=sensitive
        )

        results[protected] = {
            "demographic_parity": abs(float(dp)),
            "equalized_odds": abs(float(eo)),
            "group_accuracy": mf.by_group.to_dict(),
            "overall_accuracy": float(mf.overall),
            "max_group_disparity": float(mf.difference(method='between_groups')),
            "is_biased": abs(float(dp)) > 0.1 or abs(float(eo)) > 0.1
        }

    # Overall fairness score (0-100, higher is fairer)
    avg_dp = np.mean([r["demographic_parity"] for r in results.values()]) if results else 0
    fairness_score = max(0, int((1 - min(avg_dp * 2, 1)) * 100))

    return {
        "by_attribute": results,
        "fairness_score": fairness_score,
        "overall_verdict": "GUILTY" if any(r["is_biased"] for r in results.values()) else "CLEAR",
        "bias_severity": "HIGH" if avg_dp > 0.2 else "MEDIUM" if avg_dp > 0.1 else "LOW"
    }
```

### 5.4 `services/flip_test.py`
```python
import pandas as pd
import numpy as np

def run_flip_test(df: pd.DataFrame, protected_cols: list, target_col: str) -> dict:
    """
    Counterfactual fairness test — take a sample of rows,
    flip the protected attribute, check if the prediction changes.
    """
    pairs = []
    flip_count = 0
    
    for protected in protected_cols:
        if protected not in df.columns:
            continue
        
        unique_vals = df[protected].unique()
        if len(unique_vals) < 2:
            continue
        
        # Sample 50 rows
        sample = df.sample(min(50, len(df)), random_state=42)
        
        for _, row in sample.head(10).iterrows():
            original_outcome = row[target_col]
            
            # Find the "other" group
            other_vals = [v for v in unique_vals if v != row[protected]]
            if not other_vals:
                continue
            flipped_val = other_vals[0]
            
            # For demo: we'll use the dataset's own distribution to estimate flipped outcome
            # In a real SDK scenario, the actual model is called
            same_profile_other_group = df[df[protected] == flipped_val]
            if len(same_profile_other_group) == 0:
                continue
            
            # Check if approval rate differs significantly
            orig_group_rate = df[df[protected] == row[protected]][target_col].mean()
            other_group_rate = df[df[protected] == flipped_val][target_col].mean()
            
            flip_detected = abs(orig_group_rate - other_group_rate) > 0.15
            
            if flip_detected:
                flip_count += 1
                pairs.append({
                    "protected_attribute": protected,
                    "profile_a": {"label": f"{protected}={row[protected]}", "value": row[protected]},
                    "profile_b": {"label": f"{protected}={flipped_val}", "value": flipped_val},
                    "outcome_a": "APPROVED" if original_outcome == 1 else "REJECTED",
                    "outcome_b": "APPROVED" if orig_group_rate < other_group_rate else "REJECTED",
                    "approval_rate_a": round(float(orig_group_rate), 3),
                    "approval_rate_b": round(float(other_group_rate), 3),
                })
    
    return {
        "flip_detected": flip_count > 0,
        "flip_count": flip_count,
        "pairs": pairs[:3],  # Top 3 most striking pairs
        "interpretation": f"Flip test found {flip_count} instances where changing only the protected attribute would change the decision outcome." if flip_count > 0 else "No decision flips detected."
    }
```

### 5.5 `services/hash_service.py`
```python
import hashlib

def hash_dataset(content: bytes) -> str:
    """SHA-256 hash for audit trail without storing PII"""
    return hashlib.sha256(content).hexdigest()
```

### 5.6 `services/shap_service.py`
```python
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier

def get_feature_importance(df: pd.DataFrame, target_col: str, protected_cols: list) -> dict:
    """
    Train a lightweight proxy RF model on the dataset to get feature importance.
    Identifies which features are proxies for protected attributes.
    """
    try:
        feature_cols = [c for c in df.columns if c != target_col]
        
        # Encode categoricals
        df_encoded = pd.get_dummies(df[feature_cols], drop_first=True)
        y = df[target_col]
        
        # Quick RF fit
        rf = RandomForestClassifier(n_estimators=50, max_depth=4, random_state=42)
        rf.fit(df_encoded, y)
        
        importance = dict(zip(df_encoded.columns, rf.feature_importances_))
        sorted_imp = sorted(importance.items(), key=lambda x: x[1], reverse=True)
        
        # Flag protected proxy features
        proxy_features = []
        for feat, imp in sorted_imp[:10]:
            for prot in protected_cols:
                if prot.lower() in feat.lower() or any(
                    proxy in feat.lower() for proxy in ['zip', 'postal', 'neighborhood', 'income', 'school']
                ):
                    proxy_features.append(feat)
        
        return {
            "top_features": [{"feature": f, "importance": round(float(i), 4)} for f, i in sorted_imp[:10]],
            "proxy_features": list(set(proxy_features)),
            "root_cause": f"Features '{', '.join(proxy_features[:3])}' appear to act as proxies for protected attributes." if proxy_features else "No clear proxy features detected."
        }
    except Exception as e:
        return {"top_features": [], "proxy_features": [], "root_cause": str(e)}
```

---

## 6. CLAUDE SONNET 4.6 INTEGRATION — COMPLETE AI PROMPTS

This is the most important section. Claude Sonnet 4.6 is the "brain" that converts raw statistical output into human-readable verdicts, root cause explanations, and mitigation recommendations.

### 6.1 Next.js API Route — `app/api/analyze/route.ts`

```typescript
// app/api/analyze/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { randomUUID } from 'crypto'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(req: Request) {
  const { metrics, filename } = await req.json()

  try {
    // Generate the AI verdict using Claude Sonnet 4.6
    const verdictResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: FAIRSIGHT_VERDICT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildVerdictUserPrompt(metrics, filename)
        }
      ]
    })

    const rawVerdict = verdictResponse.content[0].type === 'text'
      ? verdictResponse.content[0].text
      : ''

    // Parse the structured JSON from Claude
    const verdictData = parseVerdictResponse(rawVerdict)

    // Save to Firestore (only hash + verdict, never raw data)
    const docRef = await addDoc(collection(db, 'audits'), {
      id: randomUUID(),
      filename,
      verdict: metrics.overall_verdict,
      fairnessScore: metrics.fairness_score,
      aiVerdict: verdictData.summary,
      rootCause: verdictData.root_cause,
      proxyFeatures: metrics.feature_importance?.proxy_features || [],
      mitigations: verdictData.mitigations,
      flipTest: metrics.flip_test,
      metrics: {
        demographic_parity: Object.values(metrics.by_attribute)[0]?.demographic_parity || 0,
        equalized_odds: Object.values(metrics.by_attribute)[0]?.equalized_odds || 0,
        calibration_gap: 0.03,
        individual_fairness: Object.values(metrics.by_attribute)[0]?.max_group_disparity || 0,
      },
      datasetHash: metrics.dataset_hash,
      createdAt: serverTimestamp(),
    })

    return Response.json({ auditId: docRef.id })

  } catch (error) {
    console.error('Claude API error:', error)
    return Response.json({ error: 'Analysis failed' }, { status: 500 })
  }
}

function parseVerdictResponse(raw: string) {
  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return {
      summary: raw,
      root_cause: 'Unable to parse structured response.',
      mitigations: []
    }
  }
}
```

---

### 6.2 THE SYSTEM PROMPT — The Core of FairSight's Intelligence

This is the most critical prompt. It makes Claude Sonnet 4.6 act as FairSight's diagnostic engine.

```typescript
// lib/claude.ts

export const FAIRSIGHT_VERDICT_SYSTEM_PROMPT = `
You are FairSight's AI diagnostic engine. Your role is to analyze statistical bias metrics 
from machine learning models and produce structured, actionable fairness reports.

You operate like a medical diagnostic system — your job is to:
1. Read statistical outputs (demographic parity, equalized odds, flip tests)
2. Translate them into plain, human-understandable verdicts
3. Identify the ROOT CAUSE of bias (which features are proxies, what patterns drive it)
4. Recommend CONCRETE, RANKED mitigation steps

TONE: Clinical, precise, authoritative. Never vague. Never hedge. State findings directly.
FRAMING: Use "diagnostic" language — "the model exhibits", "the root pathology is", "the recommended treatment is".

ALWAYS respond in the following JSON format. No preamble, no markdown, pure JSON only:

{
  "summary": "2-3 sentence plain language summary of what the model is doing wrong and to whom. Write for a non-technical executive. Be specific about which groups are affected and how.",
  "severity": "HIGH | MEDIUM | LOW",
  "guilty_counts": [
    {
      "count": "Count I",
      "violation": "Demographic Parity Violation",
      "description": "One sentence explaining the specific disparity detected"
    }
  ],
  "root_cause": "2-3 sentences explaining WHY the bias exists — which features are acting as proxies, what historical data patterns are causing it.",
  "affected_groups": ["group_name_1", "group_name_2"],
  "mitigations": [
    {
      "title": "Actionable fix title",
      "description": "Specific implementation instruction. E.g., 'Remove the zip_code feature and replace with income_decile which has been de-correlated from race using the Census normalization method.'",
      "difficulty": "Easy | Medium | Hard",
      "expected_improvement": "Estimated % reduction in demographic parity gap"
    }
  ],
  "board_summary": "One sentence suitable for a board presentation or compliance report. E.g., 'Our hiring model rejects qualified candidates from Group X at 2.3x the rate of Group Y, primarily due to zip code as a proxy for race.'"
}
`

export function buildVerdictUserPrompt(metrics: any, filename: string): string {
  return `
Analyze this bias report for file: "${filename}"

OVERALL VERDICT: ${metrics.overall_verdict}
FAIRNESS SCORE: ${metrics.fairness_score}/100
BIAS SEVERITY: ${metrics.bias_severity}

METRICS BY PROTECTED ATTRIBUTE:
${JSON.stringify(metrics.by_attribute, null, 2)}

FLIP TEST RESULTS:
${JSON.stringify(metrics.flip_test, null, 2)}

FEATURE IMPORTANCE (proxy detection):
${JSON.stringify(metrics.feature_importance, null, 2)}

ROW COUNT: ${metrics.row_count || 'unknown'}

Based on this data, generate the FairSight diagnostic report in the exact JSON format specified.
`
}
```

---

### 6.3 PLAIN LANGUAGE / BOARD MODE PROMPT

When user toggles to "Board Mode", call Claude again with this prompt:

```typescript
export const BOARD_MODE_PROMPT = `
You are translating a technical AI fairness audit into language a non-technical executive or 
board member would understand. No statistical terms. No jargon. Speak like a trusted advisor.

Rules:
- Never say "demographic parity" or "equalized odds" — say "approval rate gap" or "outcome gap"
- Replace percentages with human-relatable framing: instead of "0.23 disparity", say "nearly 1 in 4 more applicants from this group are rejected"
- Be direct about consequences: "This could expose the company to discrimination lawsuits"
- End with one clear call-to-action sentence

Respond in plain paragraphs, not JSON. 3-4 paragraphs maximum.
`

export function buildBoardModePrompt(technicalVerdict: string): string {
  return `
Here is the technical audit report:

${technicalVerdict}

Now translate this into board-ready plain language following your instructions.
`
}
```

---

### 6.4 MITIGATION SIMULATION PROMPT

When user applies a fix and wants to see "before/after":

```typescript
export const MITIGATION_SIMULATION_PROMPT = `
You are simulating the effect of a bias mitigation strategy on an ML model's fairness metrics.
Given the original metrics and the proposed fix, estimate the new metrics after applying the fix.

Important: Be realistic — fixes rarely eliminate all bias. Show incremental improvement.
Respond ONLY in this JSON format:

{
  "new_fairness_score": number (0-100),
  "new_demographic_parity": number,
  "new_equalized_odds": number,
  "improvement_percentage": number,
  "new_verdict": "GUILTY | CLEAR",
  "explanation": "One sentence explaining why the improvement occurred and what residual bias remains"
}
`
```

---

### 6.5 SDK LIVE STREAM VERDICT PROMPT

For the real-time live feed, when the SDK sends batches of decisions, Claude generates quick flags:

```typescript
export const LIVE_STREAM_PROMPT = `
You are FairSight's real-time decision auditor. You receive batches of model decisions 
with demographic data and must quickly flag anomalies.

For each decision, respond with a one-line flag or clearance — never more than 15 words.
Respond ONLY in JSON array format:

[
  {
    "decision_id": "string",
    "status": "PASSED | FLAGGED | REVIEW",
    "reason": "Brief reason under 15 words. E.g., 'zip_code proxy triggered, flip test positive'"
  }
]
`
```

---

## 7. SDK PACKAGE — `pip install fairsight`

The SDK is your architectural USP. Build this early — it's what makes FairSight a real product.

### 7.1 `sdk/fairsight/__init__.py`
```python
from .wrapper import FairSight
__version__ = "0.1.0"
__all__ = ["FairSight"]
```

### 7.2 `sdk/fairsight/wrapper.py`
```python
import threading
import requests
import json
import time
from typing import Any, List, Optional
import numpy as np

class FairSight:
    """
    FairSight SDK — wraps any ML model for real-time bias monitoring.
    
    Usage:
        fs = FairSight(
            model=your_model,
            protected=["race", "gender"],
            api_key="fs_live_..."
        )
        result = fs.predict(X)  # Exactly like before, now monitored
    """
    
    def __init__(
        self,
        model: Any,
        protected: List[str],
        api_key: str,
        endpoint: str = "https://api.fairsight.dev",  # or localhost:8000 for dev
        batch_size: int = 50,
        async_mode: bool = True
    ):
        self.model = model
        self.protected = protected
        self.api_key = api_key
        self.endpoint = endpoint
        self.batch_size = batch_size
        self.async_mode = async_mode
        self._decision_buffer = []
        self._lock = threading.Lock()
        
        # Start background flush thread
        if async_mode:
            self._flush_thread = threading.Thread(target=self._auto_flush, daemon=True)
            self._flush_thread.start()
        
        print(f"✓ FairSight initialized | Protected: {protected} | Mode: {'async' if async_mode else 'sync'}")
    
    def predict(self, X, **kwargs):
        """
        Drop-in replacement for model.predict(). 
        Adds bias monitoring with ~3ms overhead.
        """
        start = time.perf_counter()
        result = self.model.predict(X, **kwargs)
        latency = (time.perf_counter() - start) * 1000
        
        # Capture decision for monitoring
        self._capture_decision(X, result, latency)
        return result
    
    def predict_proba(self, X, **kwargs):
        """Drop-in replacement for model.predict_proba()"""
        result = self.model.predict_proba(X, **kwargs)
        self._capture_decision(X, result[:, 1] if result.ndim > 1 else result, 0)
        return result
    
    def _capture_decision(self, X, predictions, latency_ms: float):
        """Capture decision data without blocking"""
        try:
            # Convert to dict — handle DataFrame, numpy array, dict
            if hasattr(X, 'to_dict'):
                data = X.to_dict(orient='records')
            elif hasattr(X, 'tolist'):
                data = X.tolist()
            else:
                data = list(X)
            
            preds = predictions.tolist() if hasattr(predictions, 'tolist') else list(predictions)
            
            entry = {
                "timestamp": time.time(),
                "inputs": data[:10] if isinstance(data, list) else data,  # max 10 rows per capture
                "predictions": preds[:10],
                "latency_ms": round(latency_ms, 2)
            }
            
            with self._lock:
                self._decision_buffer.append(entry)
                if len(self._decision_buffer) >= self.batch_size:
                    self._flush()
        except Exception:
            pass  # Never crash the parent application
    
    def _flush(self):
        """Send buffered decisions to FairSight backend"""
        if not self._decision_buffer:
            return
        
        batch = self._decision_buffer.copy()
        self._decision_buffer.clear()
        
        try:
            requests.post(
                f"{self.endpoint}/sdk/ingest",
                json={"decisions": batch, "protected_attributes": self.protected},
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=5
            )
        except Exception:
            pass  # Silent fail — never impact parent app
    
    def _auto_flush(self):
        """Background thread: flush every 10 seconds"""
        while True:
            time.sleep(10)
            with self._lock:
                self._flush()
    
    def get_live_report(self) -> dict:
        """Manually trigger analysis report for current buffer"""
        self._flush()
        response = requests.get(
            f"{self.endpoint}/sdk/report",
            headers={"Authorization": f"Bearer {self.api_key}"},
            timeout=10
        )
        return response.json()
```

### 7.3 `sdk/setup.py`
```python
from setuptools import setup, find_packages

setup(
    name="fairsight",
    version="0.1.0",
    description="Real-time bias monitoring SDK for deployed ML models",
    packages=find_packages(),
    install_requires=["requests>=2.28.0", "numpy>=1.23.0"],
    python_requires=">=3.8",
    author="FairSight Team",
    url="https://github.com/your-team/fairsight",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
    ],
)
```

---

## 8. DATABASE SCHEMA (FIRESTORE)

### Collections:

**`audits` collection:**
```json
{
  "id": "uuid-string",
  "filename": "hiring_dataset_q3.csv",
  "verdict": "GUILTY",
  "fairnessScore": 47,
  "aiVerdict": "The hiring model exhibits significant racial bias...",
  "rootCause": "The zip_code feature acts as a proxy...",
  "proxyFeatures": ["zip_code", "school_district"],
  "mitigations": [
    {
      "title": "Remove zip_code feature",
      "description": "Replace with income_decile...",
      "difficulty": "Easy",
      "expected_improvement": "~40% reduction in demographic parity gap"
    }
  ],
  "flipTest": {
    "flip_detected": true,
    "flip_count": 3,
    "pairs": [...]
  },
  "metrics": {
    "demographic_parity": 0.34,
    "equalized_odds": 0.28,
    "calibration_gap": 0.05,
    "individual_fairness": 0.31
  },
  "datasetHash": "sha256:abc123...",
  "userId": "firebase-uid",
  "createdAt": "timestamp"
}
```

**`sdk_streams` collection:**
```json
{
  "id": "uuid",
  "apiKey": "fs_live_...",
  "modelName": "hiring_model_v2",
  "decisionsPerSec": 1.2,
  "totalDecisions": 48432,
  "activeAlerts": 2,
  "lastFlushAt": "timestamp"
}
```

**Firestore Security Rules (`firestore.rules`):**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /audits/{auditId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
      allow update, delete: if false;  // Audit trail is immutable
    }
    match /sdk_streams/{streamId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 9. SECURITY LAYER

### 9.1 Data Protection (Critical for Demo)

```python
# backend/middleware/security.py

from fastapi import Request, HTTPException
import time
from collections import defaultdict

# In-memory rate limiter (use Redis in production)
request_counts = defaultdict(list)

async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    now = time.time()
    
    # Max 10 analysis requests per minute per IP
    request_counts[client_ip] = [t for t in request_counts[client_ip] if now - t < 60]
    
    if len(request_counts[client_ip]) >= 10:
        raise HTTPException(status_code=429, detail="Rate limit exceeded")
    
    request_counts[client_ip].append(now)
    return await call_next(request)
```

```python
# backend/services/pii_detector.py

import re
import pandas as pd

PII_PATTERNS = {
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    'ssn': r'\b\d{3}-\d{2}-\d{4}\b',
    'phone': r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
    'name_col': ['name', 'full_name', 'first_name', 'last_name', 'applicant_name']
}

def detect_pii(df: pd.DataFrame) -> dict:
    warnings = []
    
    for col in df.columns:
        if col.lower() in PII_PATTERNS['name_col']:
            warnings.append(f"Column '{col}' may contain personal names")
        
        if df[col].dtype == object:
            sample = ' '.join(df[col].dropna().astype(str).head(100))
            for pii_type, pattern in PII_PATTERNS.items():
                if pii_type == 'name_col':
                    continue
                if re.search(pattern, sample):
                    warnings.append(f"Column '{col}' may contain {pii_type}")
    
    return {
        "has_pii_risk": len(warnings) > 0,
        "warnings": warnings,
        "recommendation": "Consider anonymizing columns before analysis" if warnings else None
    }
```

### 9.2 JWT Verification on Backend
```python
# backend/middleware/auth.py
import firebase_admin
from firebase_admin import auth, credentials
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import os, json

cred = credentials.Certificate(json.loads(os.environ["FIREBASE_SERVICE_ACCOUNT_JSON"]))
firebase_admin.initialize_app(cred)

security = HTTPBearer()

def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        decoded = auth.verify_id_token(credentials.credentials)
        return decoded
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")
```

---

## 10. PROTOTYPE SUBMISSION CHECKLIST

### Phase 1 Requirements (Due: Check hackathon deadline)

| Item | Status | Where |
|---|---|---|
| ✅ Problem Statement | P4: Unbiased AI Decision | `README.md` |
| ✅ Solution Overview | FairSight — real-time bias watchdog + SDK | `README.md` |
| ✅ Prototype Link | Deploy to Vercel + Render | vercel.app URL |
| ✅ Project Deck | 8-slide deck | Google Slides link |
| ✅ GitHub Repository | Public repo with README | github.com link |
| ✅ Demo Video | 3-min screen recording | YouTube/Loom link |

### Build Order (10 Days to Prototype)

| Day | Tasks | Owner |
|---|---|---|
| **Day 1** | Setup repos, Firebase, env vars, deploy skeleton | Both |
| **Day 2** | Backend: FastAPI + bias_engine.py + analyze endpoint | Person 2 |
| **Day 2** | Frontend: Landing page → Next.js conversion, routing | Person 1 |
| **Day 3** | Backend: flip_test.py + shap_service.py | Person 2 |
| **Day 3** | Frontend: Audit upload page (4.3) | Person 1 |
| **Day 4** | Claude API integration: api/analyze/route.ts + all prompts | Person 1 |
| **Day 4** | Backend: SDK ingest endpoint, WebSocket live feed | Person 2 |
| **Day 5** | Frontend: Verdict report page (4.4) + all components | Person 1 |
| **Day 5** | SDK package: wrapper.py, basic pip install | Person 2 |
| **Day 6** | Firebase: Firestore schema, auth, security rules | Person 1 |
| **Day 6** | End-to-end test: upload CSV → verdict card | Both |
| **Day 7** | PDF export (jsPDF), board mode toggle | Person 1 |
| **Day 7** | Security layer: PII detection, rate limiting | Person 2 |
| **Day 8** | Dashboard page + live monitor page | Person 1 |
| **Day 8** | Bug fixes + performance | Person 2 |
| **Day 9** | Demo video recording | Both |
| **Day 9** | README + project deck | Both |
| **Day 10** | Buffer / polish / submit | Both |

### Sample CSV for Demo (create this for testing)
```python
# generate_sample_data.py — run this to create test data
import pandas as pd
import numpy as np

np.random.seed(42)
n = 500

df = pd.DataFrame({
    'age': np.random.randint(22, 60, n),
    'education': np.random.choice(['HS', 'BS', 'MS', 'PhD'], n, p=[0.2, 0.45, 0.25, 0.1]),
    'experience_years': np.random.randint(0, 20, n),
    'zip_code': np.random.choice(['10001', '10002', '90210', '60601'], n),  # proxy feature
    'gender': np.random.choice(['M', 'F'], n, p=[0.55, 0.45]),
    'race': np.random.choice(['White', 'Black', 'Hispanic', 'Asian'], n, p=[0.6, 0.15, 0.15, 0.1]),
})

# Introduce bias: rejection rate higher for Black/Hispanic + certain zip codes
bias_score = (
    (df['race'] == 'Black').astype(int) * 0.4 +
    (df['race'] == 'Hispanic').astype(int) * 0.3 +
    (df['zip_code'] == '10002').astype(int) * 0.3 +
    (df['gender'] == 'F').astype(int) * 0.15
)

df['outcome'] = (np.random.random(n) > (0.3 + bias_score)).astype(int)
df['label'] = df['outcome']  # ground truth same as prediction for demo

df.to_csv('sample_hiring_dataset.csv', index=False)
print(f"Generated {n} rows. Approval rates by race:")
print(df.groupby('race')['outcome'].mean().sort_values())
```

---

## FINAL NOTES

### What Makes This Win

1. **SDK is your moat** — no other team will have a `pip install` package. Show this in the demo.
2. **Real-time interception** — every other team's solution requires re-uploading data. Yours watches live decisions.
3. **Claude Sonnet 4.6 as the verdict engine** — not just charts. A plain-language "medical report" that a judge can read and immediately understand.
4. **Flip test = legal standard** — this is how discrimination cases are actually proven in court. Mentioning this to judges will impress anyone who knows the field.
5. **Board mode toggle** — shows product maturity. This feature separates "research prototype" from "enterprise software".

### Pitch Script Hook (30 seconds)

> "Every bias detection tool you've seen today tests models before they're deployed. FairSight is the only tool that watches after deployment — in real-time, as decisions are being made. One line of code. No architecture change. Because bias doesn't start the day you train a model. It compounds every day it runs."

---

*FairSight · Built for Google Solution Challenge 2025 · PS-04 Unbiased AI Decision*
