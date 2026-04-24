'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { ScanningOverlay } from '@/components/ScanningOverlay'

type AnalysisState = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'

const STEPS = [
  { label: 'Parsing dataset', threshold: 15 },
  { label: 'Running flip test', threshold: 40 },
  { label: 'Detecting proxy features', threshold: 60 },
  { label: 'Generating AI consensus', threshold: 80 },
  { label: 'Saving report', threshold: 95 },
]

export default function AuditPage() {
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<AnalysisState>('idle')
  const [progress, setProgress] = useState(0)
  const [isSlow, setIsSlow] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const { user } = useAuth()

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.json'))) {
      setFile(f)
      setErrorMsg('')
    } else {
      setErrorMsg('Please upload a .csv or .json file')
    }
  }, [])

  const runAnalysis = async () => {
    if (!file) return

    setState('uploading')
    setProgress(10)
    setErrorMsg('')
    setIsSlow(false)

    // Store file reference for debiased download
    ;(window as any).__fairsight_last_file = file

    // Show slow warning after 20s
    const slowTimer = setTimeout(() => setIsSlow(true), 20000)

    try {
      // ── Auto-detect protected columns from CSV headers ─────────────────────
      // Instead of hardcoding ['race','gender','age'], parse the CSV headers
      // and pick any columns that match known demographic keywords.
      let detectedProtected: string[] = []
      try {
        const text = await file.text()
        const firstLine = text.split('\n')[0] || ''
        const headers = firstLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase())
        const demoKeywords = ['race', 'gender', 'sex', 'age', 'ethnicity', 'nationality', 'religion', 'disability']
        detectedProtected = headers.filter(h => demoKeywords.some(k => h.includes(k)))
      } catch { /* ignore parse errors — backend will auto-detect */ }

      // ── Step 1: Backend statistical analysis ──────────────────────────────
      setState('analyzing')
      setProgress(15)

      const formData = new FormData()
      formData.append('file', file)
      // Send detected columns; if empty, backend will auto-detect
      formData.append('protected_attributes', JSON.stringify(detectedProtected))
      formData.append('uid', user?.uid ?? 'guest')

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
      const cleanUrl = backendUrl.replace(/\/$/, '')

      let metricsData: any
      let usedMock = false

      try {
        const metricsRes = await fetch(`${cleanUrl}/analyze`, {
          method: 'POST',
          body: formData,
        })

        if (!metricsRes.ok) {
          const errText = await metricsRes.text()
          let errDetail = errText.slice(0, 300)
          try {
            const parsed = JSON.parse(errText)
            errDetail = parsed.detail || parsed.error || errDetail
          } catch { }
          // Only fall back to mock on dev/localhost; on prod surface the error
          if (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1')) {
            console.warn(`Backend ${metricsRes.status}: ${errDetail} — using mock metrics`)
            metricsData = getMockMetrics(file.name)
            usedMock = true
          } else {
            throw new Error(`Analysis failed (${metricsRes.status}): ${errDetail}`)
          }
        } else {
          metricsData = await metricsRes.json()
        }
      } catch (networkErr: any) {
        if (cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1')) {
          console.warn('Backend unreachable on localhost, using mock metrics:', networkErr.message)
          metricsData = getMockMetrics(file.name)
          usedMock = true
        } else {
          throw new Error(
            `Cannot reach FairSight backend at ${cleanUrl}. ` +
            `Ensure NEXT_PUBLIC_BACKEND_URL is correctly set on Vercel, and the Render service is running. ` +
            `Error: ${networkErr.message}`
          )
        }
      }

      setProgress(50)

      // ── Step 2: AI Consensus ──────────────────────────────────────────────
      const metricsPayload = {
        ...(metricsData.metrics ?? metricsData),
        flip_test: metricsData.flip_test ?? metricsData.metrics?.flip_test ?? {},
        feature_importance:
          metricsData.feature_importance ?? metricsData.metrics?.feature_importance ?? {},
        dataset_hash: metricsData.dataset_hash ?? metricsData.metrics?.dataset_hash ?? '',
        row_count: metricsData.row_count ?? metricsData.metrics?.row_count ?? 0,
        protected_attributes: metricsData.protected_attributes ?? detectedProtected,
        by_attribute: metricsData.by_attribute ?? metricsData.metrics?.by_attribute ?? {},
      }

      setProgress(60)

      const verdictRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: metricsPayload,
          filename: file.name,
          uid: user?.uid ?? 'guest',
          // Pass through top-level fields so api/analyze can correctly map them
          flip_test: metricsData.flip_test ?? {},
          feature_importance: metricsData.feature_importance ?? {},
          dataset_hash: metricsData.dataset_hash ?? '',
          row_count: metricsData.row_count ?? 0,
          protected_attributes: metricsData.protected_attributes ?? detectedProtected,
          by_attribute: metricsData.by_attribute ?? metricsData.metrics?.by_attribute ?? {},
          pii_warnings: metricsData.pii_warnings ?? null,
          intersectional: metricsData.intersectional ?? null,
        }),
      })

      setProgress(90)

      if (!verdictRes.ok) {
        const errText = await verdictRes.text()
        let parsed: any = {}
        try { parsed = JSON.parse(errText) } catch { }
        throw new Error(parsed.error ?? `AI verdict failed (${verdictRes.status})`)
      }

      const result = await verdictRes.json()

      if (result.error) {
        throw new Error(result.error)
      }

      if (!result.auditId) {
        throw new Error('No audit ID returned from server')
      }

      setProgress(100)
      setState('done')
      clearTimeout(slowTimer)

      setTimeout(() => router.push(`/audit/${result.auditId}`), 700)
    } catch (err: any) {
      clearTimeout(slowTimer)
      console.error('Audit pipeline error:', err)
      setState('error')
      setErrorMsg(
        err.message || 'An unexpected error occurred. Check the browser console for details.'
      )
    }
  }


  return (
    <div className="page-container-narrow">
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 48, textAlign: 'center' }}>
        <div className="label">Bias Diagnostic Engine</div>
        <h1
          className="section-title"
          style={{ fontSize: 48, marginTop: 8, letterSpacing: '-0.03em' }}
        >
          Run Fairness Audit
        </h1>
        <p
          style={{
            color: 'var(--slate)',
            fontSize: 16,
            marginTop: 12,
            lineHeight: 1.65,
            maxWidth: 600,
            margin: '12px auto 0',
          }}
        >
          Upload a CSV dataset or prediction log. FairSight runs 12 fairness metrics,
          detects proxy features, and generates a multi-model AI consensus verdict.
        </p>
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
            padding: '72px 40px',
            background: file ? 'rgba(13,148,136,0.04)' : 'var(--white)',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => {
            if (!file)
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--teal-light)'
          }}
          onMouseLeave={(e) => {
            if (!file)
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
          }}
        >
          <input
            id="file-input"
            type="file"
            accept=".csv,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                setFile(f)
                setErrorMsg('')
              }
            }}
          />
          {file ? (
            <>
              <FileText size={52} color="var(--teal)" style={{ margin: '0 auto 16px' }} />
              <div
                style={{
                  fontWeight: 700,
                  color: 'var(--navy)',
                  fontSize: 20,
                  marginBottom: 8,
                }}
              >
                {file.name}
              </div>
              <div style={{ fontSize: 14, color: 'var(--teal)', fontWeight: 600 }}>
                {(file.size / 1024).toFixed(1)} KB · Click to change file
              </div>
            </>
          ) : (
            <>
              <UploadCloud
                size={52}
                color="var(--slate)"
                style={{ margin: '0 auto 20px' }}
              />
              <div
                style={{
                  fontWeight: 700,
                  color: 'var(--navy)',
                  fontSize: 20,
                  marginBottom: 8,
                }}
              >
                Drop CSV or JSON here
              </div>
              <div style={{ fontSize: 14, color: 'var(--slate)' }}>
                or click to browse · Max 10MB per file
              </div>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid rgba(239,68,68,0.3)',
            padding: '16px 20px',
            borderRadius: 12,
            marginTop: 20,
            color: '#dc2626',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            fontSize: 14,
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Privacy Notice */}
      {state === 'idle' && (
        <div
          className="fade-up"
          style={{
            display: 'flex',
            gap: 12,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            padding: '14px 20px',
            borderRadius: 12,
            marginTop: 16,
            color: '#15803d',
            fontSize: 13,
          }}
        >
          <span>🔒</span>
          <span>
            Your data is <strong>never stored</strong>. Processed in-memory only. Only a
            SHA-256 hash is saved for audit trail integrity. GDPR-compliant.
          </span>
        </div>
      )}

      {/* Progress */}
      {(state === 'uploading' || state === 'analyzing') && (
        <div className="fade-up" style={{ marginTop: 32 }}>
          <ScanningOverlay visible={true} />
        </div>
      )}

      {/* Done */}
      {state === 'done' && (
        <div
          className="card fade-up"
          style={{
            background: '#f0fdf4',
            borderColor: '#bbf7d0',
            marginTop: 24,
            textAlign: 'center',
            padding: '60px 20px',
          }}
        >
          <CheckCircle2 size={56} color="#22c55e" style={{ margin: '0 auto 16px' }} />
          <div
            style={{ fontWeight: 800, color: '#15803d', fontSize: 24, marginBottom: 8 }}
          >
            Audit Complete!
          </div>
          <div style={{ color: '#16a34a', fontSize: 14 }}>
            Redirecting to your report...
          </div>
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
          onClick={() => {
            setState('idle')
            setProgress(0)
            setIsSlow(false)
          }}
          className="btn btn-outline btn-full btn-lg"
          style={{ marginTop: 20 }}
        >
          Try Again
        </button>
      )}
    </div>
  )
}

// Mock metrics when backend is unavailable
function getMockMetrics(filename: string) {
  return {
    dataset_hash: 'mock-' + Date.now(),
    row_count: 1000,
    protected_attributes: ['race', 'gender'],
    metrics: {
      by_attribute: {
        race: {
          demographic_parity: 0.18,
          equalized_odds: 0.12,
          group_accuracy: { White: 0.88, Black: 0.71 },
          overall_accuracy: 0.79,
          max_group_disparity: 0.17,
          approval_rates: { White: 0.72, Black: 0.54 },
          calibration_gap: 0.09,
          individual_fairness: 0.17,
          is_biased: true,
        },
        gender: {
          demographic_parity: 0.09,
          equalized_odds: 0.07,
          group_accuracy: { Male: 0.84, Female: 0.76 },
          overall_accuracy: 0.8,
          max_group_disparity: 0.08,
          approval_rates: { Male: 0.65, Female: 0.57 },
          calibration_gap: 0.04,
          individual_fairness: 0.08,
          is_biased: false,
        },
      },
      fairness_score: 68,
      overall_verdict: 'GUILTY',
      bias_severity: 'HIGH',
      avg_demographic_parity: 0.135,
    },
    flip_test: {
      overall_flip_rate: 0.23,
      by_attribute: {
        race: { flip_count: 230, total: 1000, flip_rate: 0.23 },
      },
    },
    feature_importance: {
      top_features: [{ feature: 'zip_code', importance: 0.42 }],
      proxy_features: ['zip_code', 'income_bracket'],
      root_cause:
        "Features 'zip_code' and 'income_bracket' act as proxies for protected attributes and drive disparate outcomes.",
    },
  }
}