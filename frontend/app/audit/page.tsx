'use client'
import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Zap, Share2 } from 'lucide-react'
import { ScanningOverlay } from '@/components/ScanningOverlay'

type AnalysisState = 'idle' | 'waking' | 'uploading' | 'analyzing' | 'done' | 'error'

// ── Demo Dataset: small COMPAS-inspired hiring bias CSV (embedded, no network) ─
const DEMO_CSV = `applicant_id,age,race,gender,education,years_experience,credit_score,zip_code,predicted_label,true_label
1,34,White,Male,Bachelor,8,720,10001,1,1
2,28,Black,Female,Bachelor,4,680,10002,0,1
3,45,White,Male,Master,15,780,10003,1,1
4,31,Hispanic,Female,Bachelor,6,650,10004,0,0
5,52,White,Male,PhD,22,810,10001,1,1
6,26,Black,Male,Bachelor,2,620,10005,0,0
7,38,Asian,Female,Master,12,740,10003,1,1
8,29,Black,Female,Bachelor,5,630,10002,0,1
9,41,White,Female,Master,14,760,10001,1,1
10,33,Hispanic,Male,Bachelor,7,660,10004,0,0
11,55,White,Male,Master,25,830,10001,1,1
12,27,Black,Female,Bachelor,3,610,10005,0,0
13,36,Asian,Male,PhD,10,750,10003,1,1
14,30,Hispanic,Female,Bachelor,5,640,10004,0,1
15,48,White,Male,Bachelor,20,800,10001,1,1
16,25,Black,Male,Bachelor,1,590,10002,0,0
17,39,White,Female,Master,13,770,10001,1,1
18,32,Hispanic,Male,Bachelor,7,655,10004,0,0
19,44,Asian,Female,Master,16,745,10003,1,1
20,28,Black,Female,Bachelor,4,625,10005,0,0
21,37,White,Male,Bachelor,11,730,10001,1,1
22,31,Black,Female,Master,6,670,10002,0,1
23,50,White,Male,PhD,23,820,10001,1,1
24,29,Hispanic,Female,Bachelor,4,635,10004,0,0
25,42,Asian,Male,Master,15,755,10003,1,1
26,26,Black,Male,Bachelor,2,600,10005,0,0
27,35,White,Female,Bachelor,9,725,10001,1,1
28,33,Hispanic,Female,Bachelor,7,645,10004,0,0
29,46,White,Male,Master,19,790,10001,1,1
30,27,Black,Female,Bachelor,3,615,10002,0,0
31,40,Asian,Male,PhD,14,760,10003,1,1
32,30,Hispanic,Male,Bachelor,5,640,10004,0,0
33,53,White,Female,Master,24,815,10001,1,1
34,28,Black,Male,Bachelor,4,620,10005,0,0
35,38,White,Male,Bachelor,12,735,10001,1,1
36,32,Black,Female,Bachelor,6,660,10002,0,1
37,45,Asian,Female,Master,17,750,10003,1,1
38,29,Hispanic,Female,Bachelor,5,638,10004,0,0
39,41,White,Male,Master,15,775,10001,1,1
40,26,Black,Male,Bachelor,2,598,10005,0,0`

function makeDemoFile(): File {
  const blob = new Blob([DEMO_CSV], { type: 'text/csv' })
  return new File([blob], 'fairsight_demo_hiring_bias.csv', { type: 'text/csv' })
}

// ── SSE step types matching the backend stream endpoint ──────────────────────
interface StreamStep {
  step: string
  label: string
  detail: string
  progress: number
  [key: string]: any
}

export default function AuditPage() {
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<AnalysisState>('idle')
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<StreamStep | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [backendReady, setBackendReady] = useState<boolean | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  const abortRef = useRef<AbortController | null>(null)

  // ── F1: Cold-start wake-up ping ──────────────────────────────────────────
  useEffect(() => {
    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000').replace(/\/$/, '')
    setState('waking')
    fetch(`${backendUrl}/health`, { signal: AbortSignal.timeout(8000) })
      .then(() => { setBackendReady(true); setState('idle') })
      .catch(() => { setBackendReady(false); setState('idle') })
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.json'))) {
      setFile(f); setErrorMsg('')
    } else {
      setErrorMsg('Please upload a .csv or .json file')
    }
  }, [])

  // ── F2: Demo dataset loader ───────────────────────────────────────────────
  const loadDemo = () => {
    const f = makeDemoFile()
    setFile(f)
    setErrorMsg('')
    ;(window as any).__fairsight_last_file = f
  }

  // ── F3: SSE Streaming pipeline ────────────────────────────────────────────
  const runAnalysis = async () => {
    if (!file) return
    setState('uploading')
    setProgress(5)
    setErrorMsg('')
    setCurrentStep(null)

    ;(window as any).__fairsight_last_file = file
    abortRef.current = new AbortController()

    try {
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000').replace(/\/$/, '')

      // ── Auto-detect protected columns from CSV headers ───────────────────
      let detectedProtected: string[] = []
      try {
        const text = await file.text()
        const headers = text.split('\n')[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase())
        const demoKw = ['race', 'gender', 'sex', 'age', 'ethnicity', 'nationality', 'religion', 'disability']
        detectedProtected = headers.filter(h => demoKw.some(k => h.includes(k)))
      } catch {}

      setState('analyzing')
      setProgress(8)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('protected_attributes', JSON.stringify(detectedProtected))
      formData.append('uid', user?.uid ?? 'guest')

      // ── Try SSE streaming first ──────────────────────────────────────────
      let metricsData: any = null

      try {
        const streamRes = await fetch(`${backendUrl}/analyze/stream`, {
          method: 'POST',
          body: formData,
          signal: abortRef.current.signal,
        })

        if (streamRes.ok && streamRes.body) {
          const reader = streamRes.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n\n')
            buffer = lines.pop() ?? ''

            for (const chunk of lines) {
              const dataLine = chunk.split('\n').find(l => l.startsWith('data: '))
              if (!dataLine) continue
              try {
                const evt: StreamStep = JSON.parse(dataLine.slice(6))
                setProgress(evt.progress)
                setCurrentStep(evt)

                if (evt.step === 'done') {
                  // Extract result data from the final event
                  metricsData = {
                    dataset_hash: evt.dataset_hash,
                    metrics: evt.metrics,
                    flip_test: evt.flip_test,
                    feature_importance: evt.feature_importance,
                    intersectional: evt.intersectional,
                    row_count: evt.row_count,
                    protected_attributes: evt.protected_attributes,
                    pii_warnings: evt.pii_warnings,
                    filename: evt.filename,
                  }
                } else if (evt.step === 'error') {
                  throw new Error(evt.detail)
                }
              } catch (parseErr: any) {
                if (parseErr.message !== 'Unexpected end of JSON input') throw parseErr
              }
            }
          }
        }
      } catch (streamErr: any) {
        if (streamErr.name === 'AbortError') throw streamErr
        // Fall back to non-streaming endpoint
        console.warn('[Audit] SSE stream failed, falling back to regular endpoint:', streamErr.message)
        const fallbackFd = new FormData()
        fallbackFd.append('file', file)
        fallbackFd.append('protected_attributes', JSON.stringify(detectedProtected))
        fallbackFd.append('uid', user?.uid ?? 'guest')

        const res = await fetch(`${backendUrl}/analyze`, {
          method: 'POST',
          body: fallbackFd,
          signal: abortRef.current.signal,
        })
        if (!res.ok) {
          const txt = await res.text()
          let detail = txt.slice(0, 300)
          try { detail = JSON.parse(txt).detail ?? detail } catch {}
          throw new Error(`Backend error (${res.status}): ${detail}`)
        }
        metricsData = await res.json()
      }

      if (!metricsData) throw new Error('No analysis result received from backend')

      setProgress(92)
      setCurrentStep({ step: 'ai', label: 'Generating AI consensus', detail: 'Querying Gemini, Groq, HuggingFace & Mistral in parallel…', progress: 92 })

      // ── Call Next.js AI consensus route ──────────────────────────────────
      const metricsPayload = {
        ...(metricsData.metrics ?? metricsData),
        flip_test: metricsData.flip_test ?? {},
        feature_importance: metricsData.feature_importance ?? {},
        dataset_hash: metricsData.dataset_hash ?? '',
        row_count: metricsData.row_count ?? 0,
        protected_attributes: metricsData.protected_attributes ?? detectedProtected,
        by_attribute: metricsData.metrics?.by_attribute ?? metricsData.by_attribute ?? {},
      }

      const verdictRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: metricsPayload,
          filename: file.name,
          uid: user?.uid ?? 'guest',
          flip_test: metricsData.flip_test ?? {},
          feature_importance: metricsData.feature_importance ?? {},
          dataset_hash: metricsData.dataset_hash ?? '',
          row_count: metricsData.row_count ?? 0,
          protected_attributes: metricsData.protected_attributes ?? detectedProtected,
          by_attribute: metricsData.metrics?.by_attribute ?? metricsData.by_attribute ?? {},
          pii_warnings: metricsData.pii_warnings ?? null,
          intersectional: metricsData.intersectional ?? null,
        }),
        signal: abortRef.current.signal,
      })

      if (!verdictRes.ok) {
        const errText = await verdictRes.text()
        let parsed: any = {}
        try { parsed = JSON.parse(errText) } catch {}
        throw new Error(parsed.error ?? `AI verdict failed (${verdictRes.status})`)
      }

      const result = await verdictRes.json()
      if (result.error) throw new Error(result.error)
      if (!result.auditId) throw new Error('No audit ID returned')

      setProgress(100)
      setCurrentStep({ step: 'save', label: 'Audit report saved!', detail: 'Redirecting to your compliance report…', progress: 100 })
      setState('done')

      setTimeout(() => router.push(`/audit/${result.auditId}`), 800)
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error('[Audit] Error:', err)
      setState('error')
      setErrorMsg(err.message || 'An unexpected error occurred')
    }
  }

  return (
    <div className="page-container-narrow">
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 48, textAlign: 'center' }}>
        <div className="label">Bias Diagnostic Engine</div>
        <h1 className="section-title" style={{ fontSize: 48, marginTop: 8, letterSpacing: '-0.03em' }}>
          Run Fairness Audit
        </h1>
        <p style={{ color: 'var(--slate)', fontSize: 16, marginTop: 12, lineHeight: 1.65, maxWidth: 600, margin: '12px auto 0' }}>
          Upload a CSV dataset or prediction log. FairSight runs 12 fairness metrics,
          detects proxy features, and generates a multi-model AI consensus verdict.
        </p>

        {/* F1: Backend status indicator */}
        {backendReady === false && (
          <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, fontSize: 13, color: '#92400e' }}>
            <span style={{ animation: 'pulse-glow 1s infinite', display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
            Backend is warming up — first audit may take ~30s
          </div>
        )}
        {backendReady === true && (
          <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, fontSize: 13, color: '#15803d' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
            Backend ready
          </div>
        )}
      </div>

      {/* Drag & Drop Zone */}
      {state === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('file-input')?.click()}
          className="fade-up"
          style={{
            border: `2px dashed ${file ? 'var(--teal)' : 'var(--border)'}`,
            borderRadius: 20,
            textAlign: 'center',
            cursor: 'pointer',
            padding: '64px 40px',
            background: file ? 'rgba(13,148,136,0.04)' : 'var(--white)',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={e => { if (!file) (e.currentTarget as HTMLElement).style.borderColor = 'var(--teal-light)' }}
          onMouseLeave={e => { if (!file) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
        >
          <input
            id="file-input"
            type="file"
            accept=".csv,.json"
            hidden
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) { setFile(f); setErrorMsg('') }
            }}
          />
          {file ? (
            <>
              <FileText size={52} color="var(--teal)" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 20, marginBottom: 8 }}>{file.name}</div>
              <div style={{ fontSize: 14, color: 'var(--teal)', fontWeight: 600 }}>
                {(file.size / 1024).toFixed(1)} KB · Click to change file
              </div>
            </>
          ) : (
            <>
              <UploadCloud size={52} color="var(--slate)" style={{ margin: '0 auto 20px' }} />
              <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 20, marginBottom: 8 }}>
                Drop CSV or JSON here
              </div>
              <div style={{ fontSize: 14, color: 'var(--slate)' }}>or click to browse · Max 10MB</div>
            </>
          )}
        </div>
      )}

      {/* F2: Demo Dataset Button */}
      {state === 'idle' && (
        <div className="fade-up" style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={e => { e.stopPropagation(); loadDemo() }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 22px',
              background: file?.name === 'fairsight_demo_hiring_bias.csv' ? 'var(--teal-dim)' : 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 30,
              fontSize: 13, fontWeight: 600, color: 'var(--navy)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Zap size={14} color="var(--teal)" />
            Try sample dataset — COMPAS Hiring Bias
          </button>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div style={{
          background: '#fef2f2', border: '1px solid rgba(239,68,68,0.3)',
          padding: '16px 20px', borderRadius: 12, marginTop: 20,
          color: '#dc2626', display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14,
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Privacy Notice */}
      {state === 'idle' && (
        <div className="fade-up" style={{
          display: 'flex', gap: 12, background: '#f0fdf4', border: '1px solid #bbf7d0',
          padding: '14px 20px', borderRadius: 12, marginTop: 16, color: '#15803d', fontSize: 13,
        }}>
          <span>🔒</span>
          <span>Your data is <strong>never stored</strong>. Processed in-memory only. Only a SHA-256 hash is saved for audit trail integrity. GDPR-compliant.</span>
        </div>
      )}

      {/* SSE Live Progress */}
      {(state === 'uploading' || state === 'analyzing') && (
        <div className="fade-up" style={{ marginTop: 32 }}>
          <ScanningOverlay visible={true} progress={progress} currentStep={currentStep} />
        </div>
      )}

      {/* Done */}
      {state === 'done' && (
        <div className="card fade-up" style={{
          background: '#f0fdf4', borderColor: '#bbf7d0', marginTop: 24,
          textAlign: 'center', padding: '60px 20px',
        }}>
          <CheckCircle2 size={56} color="#22c55e" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontWeight: 800, color: '#15803d', fontSize: 24, marginBottom: 8 }}>Audit Complete!</div>
          <div style={{ color: '#16a34a', fontSize: 14 }}>Redirecting to your report…</div>
        </div>
      )}

      {/* Action Button */}
      {file && state === 'idle' && (
        <button
          onClick={runAnalysis}
          className="btn btn-teal btn-full btn-lg fade-up"
          style={{ marginTop: 28, fontSize: 17, height: 60 }}
        >
          Run Fairness Diagnostic →
        </button>
      )}

      {state === 'error' && (
        <button
          onClick={() => { setState('idle'); setProgress(0); setCurrentStep(null) }}
          className="btn btn-outline btn-full btn-lg"
          style={{ marginTop: 20 }}
        >
          Try Again
        </button>
      )}
    </div>
  )
}

// Mock metrics (localhost fallback only)
function getMockMetrics(filename: string) {
  return {
    dataset_hash: 'mock-' + Date.now(),
    row_count: 40,
    protected_attributes: ['race', 'gender'],
    metrics: {
      by_attribute: {
        race: { demographic_parity: 0.22, equalized_odds: 0.15, max_group_disparity: 0.20, approval_rates: { White: 0.78, Black: 0.54 }, calibration_gap: 0.09, individual_fairness: 0.20, is_biased: true },
        gender: { demographic_parity: 0.10, equalized_odds: 0.08, max_group_disparity: 0.09, approval_rates: { Male: 0.70, Female: 0.60 }, calibration_gap: 0.04, individual_fairness: 0.09, is_biased: false },
      },
      fairness_score: 61,
      overall_verdict: 'GUILTY',
      bias_severity: 'HIGH',
      avg_demographic_parity: 0.16,
    },
    flip_test: { overall_flip_rate: 0.28, by_attribute: { race: { flip_count: 11, total: 40, flip_rate: 0.28 } } },
    feature_importance: { top_features: [{ feature: 'zip_code', importance: 0.41 }], proxy_features: ['zip_code'], root_cause: "zip_code acts as a proxy for race." },
  }
}