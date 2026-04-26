'use client'
// frontend/components/DetailedAuditReport.tsx
//
// Comprehensive, richly-formatted audit report display.
// Explains WHY the model is biased, HOW each metric was calculated,
// shows detailed per-group stats, and provides actionable improvement steps.
//
// Also contains:
//   - "Re-upload & Compare" panel (upload revised dataset, compare scores)
//   - "Audit Different File" button (navigate to /audit fresh)

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Helpers ────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 85) return 'var(--green-strong)'
  if (s >= 70) return 'var(--teal-strong)'
  if (s >= 55) return 'var(--orange-strong)'
  if (s >= 40) return 'var(--red-strong)'
  return 'var(--red-strong)'
}

function scaleColor(s: number) {
  if (s >= 85) return { bg: 'var(--green-dim)', text: 'var(--green-strong)', border: 'var(--green)' }
  if (s >= 70) return { bg: 'var(--teal-dim)', text: 'var(--teal-strong)', border: 'var(--teal)' }
  if (s >= 55) return { bg: 'var(--orange-dim)', text: 'var(--orange-strong)', border: 'var(--orange)' }
  return { bg: 'var(--red-dim)', text: 'var(--red-strong)', border: 'var(--red)' }
}

function pct(v: number) { return `${(v * 100).toFixed(1)}%` }

const METRIC_EXPLANATIONS: Record<string, { short: string; formula: string; threshold: string; good: string }> = {
  demographic_parity: {
    short: 'Measures if the AI approves/rejects different demographic groups at different rates.',
    formula: '|P(outcome=1 | GroupA) − P(outcome=1 | GroupB)|',
    threshold: '> 0.10 (10%) triggers a bias flag — EU AI Act high-risk threshold',
    good: 'A score near 0.00 means all groups are approved at the same rate.',
  },
  equalized_odds: {
    short: "Measures if the AI's True Positive Rate (correctly approving qualified candidates) is equal across groups.",
    formula: '|TPR_GroupA − TPR_GroupB|  where  TPR = P(predict=1 | label=1)',
    threshold: '> 0.10 triggers a bias flag — model gives qualified members of Group B fewer approvals.',
    good: 'Near 0.00 means the model is equally accurate for all groups.',
  },
  calibration_gap: {
    short: "Measures if the model's confidence/approval rate is systematically higher or lower for one group.",
    formula: '|ApprovalRate_best − ApprovalRate_worst| (across all subgroups)',
    threshold: '> 0.05 is notable; indicates systematic under/over-prediction for a group.',
    good: 'Near 0.00 means the model is equally calibrated for all groups.',
  },
  individual_fairness: {
    short: 'Measures the maximum spread in approval rates across all demographic subgroups.',
    formula: 'max(all group approval rates) − min(all group approval rates)',
    threshold: '> 0.15 means some groups are treated dramatically differently from others.',
    good: 'Near 0.00 means no group is receiving dramatically better or worse outcomes.',
  },
  disparate_impact_ratio: {
    short: "The 4/5ths rule (US EEOC & EU AI Act). Compares minority group's approval rate to the majority.",
    formula: 'P(outcome=1 | minority) / P(outcome=1 | majority)',
    threshold: '< 0.80 is legally actionable adverse impact (the 80% rule).',
    good: 'A ratio ≥ 0.80 means the minority group receives at least 80% as many approvals as the majority.',
  },
}

// ── Sub-components ─────────────────────────────────────────────────────────

function MetricRow({ label, value, threshold, isViolation, explanation, formula }: {
  label: string; value: number; threshold: number; isViolation: boolean
  explanation: string; formula: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: isViolation ? 'var(--red)' : 'var(--green)',
          boxShadow: isViolation ? '0 0 6px var(--red)' : '0 0 6px var(--green)',
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{label}</span>
            {isViolation && (
              <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                background: 'var(--red-dim)', color: 'var(--red-strong)', border: '1px solid var(--red)' }}>
                VIOLATION
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>{explanation}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'DM Mono, monospace',
            color: isViolation ? 'var(--red-strong)' : 'var(--green-strong)' }}>
            {value.toFixed(4)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--slate)' }}>threshold: {threshold}</div>
        </div>
        <span style={{ color: 'var(--slate)', fontSize: 14, marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ marginTop: 14, paddingLeft: 20, borderLeft: '2px solid var(--border)' }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              How It's Calculated
            </div>
            <code style={{ fontSize: 12, background: 'var(--white)', padding: '8px 12px', borderRadius: 6,
              display: 'block', color: 'var(--navy)', border: '1px solid var(--border)', fontFamily: 'DM Mono, monospace', lineHeight: 1.6 }}>
              {formula}
            </code>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1, background: 'var(--card-bg)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', marginBottom: 4 }}>Your Result</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: isViolation ? 'var(--red-strong)' : 'var(--green-strong)', fontFamily: 'DM Mono, monospace' }}>
                {value.toFixed(4)}
              </div>
            </div>
            <div style={{ flex: 2, background: isViolation ? 'var(--red-dim)' : 'var(--green-dim)', borderRadius: 8, padding: '10px 14px',
              border: `1px solid ${isViolation ? 'var(--red)' : 'var(--green)'}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: isViolation ? 'var(--red-strong)' : 'var(--green-strong)', marginBottom: 4 }}>
                {isViolation ? '⚠ Above Safe Threshold' : '✓ Within Safe Threshold'}
              </div>
              <div style={{ fontSize: 12, color: isViolation ? 'var(--red-strong)' : 'var(--green-strong)', opacity: 0.8, lineHeight: 1.5 }}>
                {METRIC_EXPLANATIONS[label.toLowerCase().replace(/ /g, '_')]?.good ?? 'Good — within tolerance.'}
              </div>
            </div>
          </div>
          {/* Visual bar */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--slate)', marginBottom: 4 }}>
              <span>0.00</span>
              <span style={{ color: '#d97706' }}>threshold: {threshold}</span>
              <span>1.00</span>
            </div>
            <div style={{ height: 10, background: 'var(--bg)', borderRadius: 5, position: 'relative', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{ position: 'absolute', left: `${threshold * 100}%`, top: 0, bottom: 0,
                width: 2, background: 'var(--orange-strong)', zIndex: 2 }} />
              <div style={{ height: '100%', width: `${Math.min(value * 100, 100)}%`,
                background: isViolation ? 'var(--red)' : 'var(--green)',
                transition: 'width 1s ease', borderRadius: 5 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ApprovalRateGrid({ rates }: { rates: Record<string, number> }) {
  const entries = Object.entries(rates)
  const max = Math.max(...entries.map(([, v]) => Number(v)))
  const min = Math.min(...entries.map(([, v]) => Number(v)))
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
      {entries.map(([group, rate]) => {
        const r = Number(rate)
        const isLowest = r === min && entries.length > 1
        const isHighest = r === max && entries.length > 1
        return (
          <div key={group} style={{
            background: isLowest ? 'var(--red-dim)' : isHighest ? 'var(--green-dim)' : 'var(--bg)',
            border: `2px solid ${isLowest ? 'var(--red)' : isHighest ? 'var(--green)' : 'var(--border)'}`,
            borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--slate)', marginBottom: 4, fontWeight: 600 }}>{group}</div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'DM Mono, monospace',
              color: isLowest ? 'var(--red-strong)' : isHighest ? 'var(--green-strong)' : 'var(--navy)' }}>
              {pct(r)}
            </div>
            {isLowest && <div style={{ fontSize: 10, color: 'var(--red-strong)', fontWeight: 700, marginTop: 4 }}>▼ Most affected</div>}
            {isHighest && entries.length > 1 && <div style={{ fontSize: 10, color: 'var(--green-strong)', fontWeight: 700, marginTop: 4 }}>▲ Reference group</div>}
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${r * 100}%`, background: isLowest ? '#ef4444' : '#0d9488', borderRadius: 2 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Re-upload Compare Panel ─────────────────────────────────────────────────

function ReuploadComparePanel({ originalScore, originalFilename, originalId }: {
  originalScore: number; originalFilename: string; originalId: string
}) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [comparing, setComparing] = useState(false)
  const [comparison, setComparison] = useState<{ newScore: number; newVerdict: string; newId: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFile = (f: File) => { setFile(f); setComparison(null) }

  const runCompare = useCallback(async () => {
    if (!file) return
    setComparing(true)
    setComparison(null)
    try {
      // Step 1: send file to Python backend
      const form = new FormData()
      form.append('file', file)
      // Use the same protected_attributes as the original audit
      form.append('protected_attributes', JSON.stringify(['race', 'gender', 'age']))
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')
      const backendRes = await fetch(`${backendUrl}/analyze`, { method: 'POST', body: form })
      if (!backendRes.ok) throw new Error(`Backend ${backendRes.status}`)
      const backendData = await backendRes.json()

      // Step 2: run AI consensus via Next.js API (same as the upload page)
      const nextRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...backendData,
          filename: file.name,
          uid: 'guest',
        }),
      })
      const nextData = await nextRes.json()
      const auditId = nextData.auditId ?? ''

      setComparison({
        newScore: nextData.metrics?.fairness_score ?? backendData.metrics?.fairness_score ?? 0,
        newVerdict: nextData.verdict ?? backendData.metrics?.overall_verdict ?? 'UNKNOWN',
        newId: auditId,
      })
    } catch (err: any) {
      console.error('[ReuploadCompare]', err)
      setComparison({ newScore: 0, newVerdict: 'ERROR', newId: '' })
    } finally {
      setComparing(false)
    }
  }, [file])

  const delta = comparison ? comparison.newScore - originalScore : 0
  const improved = delta > 0

  return (
    <div style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: 28, marginBottom: 28 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--navy)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>🔄</span> Re-upload & Compare
      </div>
      <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 18, lineHeight: 1.6 }}>
        After implementing the suggested mitigations, re-upload your revised dataset here. 
        FairSight will compare the new fairness score against this report and show your improvement.
        <strong> Target: 90+ points</strong>
      </p>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--teal)' : file ? 'var(--green)' : 'var(--border)'}`,
          borderRadius: 12, padding: '24px 20px', textAlign: 'center',
          background: dragging ? 'var(--teal-dim)' : file ? 'var(--green-dim)' : 'var(--bg)',
          cursor: 'pointer', transition: 'all 0.2s', marginBottom: 16,
        }}
      >
        <input ref={inputRef} type="file" accept=".csv,.json" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        {file
          ? <div><div style={{ fontSize: 24, marginBottom: 6 }}>✓</div>
              <div style={{ fontWeight: 700, color: 'var(--green-strong)' }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>Click to change file</div>
            </div>
          : <div><div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
              <div style={{ fontWeight: 600, color: 'var(--navy)' }}>Drop revised CSV/JSON here</div>
              <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>or click to browse</div>
            </div>
        }
      </div>

      {file && !comparison && (
        <button onClick={runCompare} disabled={comparing}
          style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
            background: comparing ? '#94a3b8' : 'var(--teal)', color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: comparing ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {comparing
            ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Analyzing…</>
            : '▶ Run Comparison Audit'
          }
        </button>
      )}

      {/* Comparison result */}
      {comparison && (
        <div style={{ marginTop: 20, padding: 20, borderRadius: 12,
          background: improved ? 'var(--green-dim)' : 'var(--red-dim)',
          border: `2px solid ${improved ? 'var(--green)' : 'var(--red)'}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: improved ? 'var(--green-strong)' : 'var(--red-strong)', marginBottom: 14 }}>
            {improved ? '🎉 Score Improved!' : '⚠ Score Decreased — Review Mitigations'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--slate)', marginBottom: 4 }}>Original</div>
              <div style={{ fontSize: 36, fontWeight: 900, fontFamily: 'DM Mono, monospace', color: scoreColor(originalScore) }}>
                {originalScore}
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 18 }}>→</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--slate)', marginBottom: 4 }}>New Score</div>
              <div style={{ fontSize: 36, fontWeight: 900, fontFamily: 'DM Mono, monospace', color: scoreColor(comparison.newScore) }}>
                {comparison.newScore.toFixed(1)}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'DM Mono, monospace',
              color: improved ? 'var(--green-strong)' : 'var(--red-strong)' }}>
              {improved ? '▲' : '▼'} {Math.abs(delta).toFixed(1)} points
            </span>
          </div>
          {comparison.newScore >= 90 && (
            <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--green-strong)', padding: '10px', background: 'var(--green-dim)', borderRadius: 8, marginBottom: 12, border: '1px solid var(--green)' }}>
              🏆 Target achieved! Your model is now above 90 — Compliance Ready.
            </div>
          )}
          {comparison.newScore < 90 && (
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--slate)', marginBottom: 12 }}>
              {90 - comparison.newScore < 20
                ? `You need ${(90 - comparison.newScore).toFixed(1)} more points to reach compliance (90+). Apply remaining mitigations.`
                : 'Continue implementing mitigations and re-test to reach 90+.'}
            </div>
          )}
          {comparison.newId && (
            <button onClick={() => router.push(`/audit/${comparison.newId}`)}
              style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
                background: 'var(--navy)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              View Full Comparison Report →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

interface Props {
  audit: any
}

export function DetailedAuditReport({ audit }: Props) {
  const router = useRouter()
  const isGuilty = audit.verdict === 'GUILTY'
  const isBorderline = audit.verdict === 'BORDERLINE'
  const byAttr = audit.byAttribute ?? {}
  const ft = audit.flipTest ?? {}
  const sc = scaleColor(audit.fairnessScore ?? 0)

  // Flatten first attribute metrics for backward compat
  const firstAttr: any = Object.values(byAttr)[0] ?? {}

  // ── Debiased dataset download ────────────────────────────────────────────
  const [debiasLoading, setDebiasLoading] = useState(false)
  const [debiasError, setDebiasError]     = useState<string | null>(null)
  const [debiasSuccess, setDebiasSuccess] = useState(false)

  const downloadDebiased = async () => {
    setDebiasLoading(true)
    setDebiasError(null)
    setDebiasSuccess(false)
    try {
      // The original file may not be stored client-side after navigation.
      // We re-fetch from the audit record's stored reference or show a prompt.
      // For sessions where the file is still in memory (audit page), we attach it.
      // For historical audits we fall back to telling the user to re-upload.
      const storedFile = (window as any).__fairsight_last_file as File | undefined

      if (!storedFile) {
        setDebiasError('Original file not available in this session. Re-upload your dataset on the Audit page and use the button there.')
        return
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:8000'
      const form = new FormData()
      form.append('file', storedFile)
      form.append('protected_columns', JSON.stringify(audit.protectedAttributes ?? ['race', 'gender']))
      form.append('target_column', audit.targetColumn ?? 'predicted_label')

      const res = await fetch(`${backendUrl}/debias/export`, { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Backend ${res.status}` }))
        throw new Error(err.error ?? `Export failed (${res.status})`)
      }

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      const base = (storedFile.name ?? 'dataset').replace(/\.csv$/i, '')
      a.href     = url
      a.download = `${base}_fairsight_debiased.csv`
      a.click()
      URL.revokeObjectURL(url)
      setDebiasSuccess(true)
    } catch (err: any) {
      setDebiasError(err.message ?? 'Download failed')
    } finally {
      setDebiasLoading(false)
    }
  }

  return (

    <div style={{ marginTop: 32 }}>

      {/* ── Score Explanation Card ─────────────────────────────────────── */}
      <div className="card fade-up" style={{
        marginBottom: 28, background: sc.bg,
        border: `2px solid ${sc.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 56, fontWeight: 900, fontFamily: 'DM Mono, monospace', color: sc.text, lineHeight: 1 }}>
              {audit.fairnessScore ?? 0}
            </div>
            <div style={{ fontSize: 11, color: sc.text, fontWeight: 700, marginTop: 4 }}>/ 100</div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: sc.text, marginBottom: 8 }}>
              {isGuilty ? '⚠ Model Found GUILTY of Algorithmic Bias'
                : isBorderline ? '🟡 Model is BORDERLINE — Monitoring Recommended'
                : '✅ Model Passed Fairness Audit — CLEAR'}
            </div>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
              {isGuilty
                ? `This model was scored ${audit.fairnessScore}/100. It violated one or more fairness thresholds across ${Object.keys(byAttr).length} protected attribute(s): ${Object.keys(byAttr).join(', ')}. The violations indicate that different demographic groups are receiving meaningfully different outcomes — which is both statistically problematic and potentially legally actionable under the EU AI Act and US EEOC guidelines.`
                : isBorderline
                ? `This model scored ${audit.fairnessScore}/100. While it did not clearly violate fairness thresholds, the margins are narrow. Minor shifts in data distribution could move the verdict to GUILTY. Continued monitoring is strongly recommended.`
                : `This model scored ${audit.fairnessScore}/100 — above the 85-point compliance threshold. All fairness metrics are within acceptable tolerances. The model does not show evidence of systematic bias against protected groups.`}
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div style={{ fontSize: 12, fontWeight: 700, color: sc.text, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          How Your Score Was Calculated
        </div>
        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8, background: '#fff', borderRadius: 8, padding: '14px 16px', border: `1px solid ${sc.border}` }}>
          The FairSight composite score uses a <strong>weighted penalty model</strong> based on 5 fairness metrics:
          <br />• <strong>Demographic Parity</strong> (weight: 30 pts) — Gap in approval rates between groups
          <br />• <strong>Equalized Odds</strong> (weight: 30 pts) — Gap in True Positive Rates between groups
          <br />• <strong>Calibration Gap</strong> (weight: 15 pts) — Systematic over/under-prediction for a group
          <br />• <strong>Individual Fairness</strong> (weight: 15 pts) — Max spread across all group approval rates
          <br />• <strong>Flip Rate</strong> (weight: 10 pts) — % of individuals whose decision changes if only their protected attribute is altered
          <br /><br />
          Each metric's penalty scales proportionally to how far it exceeds its threshold (0 penalty at threshold, max penalty at 3× threshold).
          Score = 100 − weighted average penalty across all protected attributes.
        </div>
      </div>

      {/* ── Per-Attribute Deep Dive ────────────────────────────────────── */}
      {Object.keys(byAttr).length > 0 && (
        <div className="card fade-up delay-1" style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 4 }}>
            📊 Metric Deep Dive — By Protected Attribute
          </div>
          <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 24, lineHeight: 1.6 }}>
            Click any metric to see its formula, what your result means, and whether it flags a violation.
          </p>

          {Object.entries(byAttr).map(([attr, data]: [string, any]) => (
            <div key={attr} style={{ marginBottom: 28 }}>
              {/* Attribute header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid var(--border)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>
                  {attr[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--navy)', textTransform: 'capitalize' }}>{attr}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate)' }}>
                    {data.is_biased ? '⚠ Bias detected in this attribute' : '✓ No significant bias detected'}
                    {data.most_disadvantaged_group && ` · Most affected: ${data.most_disadvantaged_group}`}
                  </div>
                </div>
                {data.disparate_impact_ratio !== undefined && (
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--slate)', marginBottom: 2 }}>Disparate Impact Ratio</div>
                    <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'DM Mono, monospace',
                      color: data.disparate_impact_ratio < 0.8 ? '#dc2626' : '#15803d' }}>
                      {Number(data.disparate_impact_ratio).toFixed(3)}
                      <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 6 }}>
                        {data.disparate_impact_ratio < 0.8 ? '✗ Fails 4/5 rule' : '✓ Passes 4/5 rule'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Approval rates grid */}
              {data.approval_rates && Object.keys(data.approval_rates).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Approval Rates by Group
                  </div>
                  <ApprovalRateGrid rates={data.approval_rates} />
                </div>
              )}

              {/* Metric rows */}
              <MetricRow
                label="Demographic Parity"
                value={data.demographic_parity ?? 0}
                threshold={0.10}
                isViolation={(data.demographic_parity ?? 0) > 0.10}
                explanation={METRIC_EXPLANATIONS.demographic_parity.short}
                formula={METRIC_EXPLANATIONS.demographic_parity.formula}
              />
              <MetricRow
                label="Equalized Odds"
                value={data.equalized_odds ?? 0}
                threshold={0.10}
                isViolation={(data.equalized_odds ?? 0) > 0.10}
                explanation={METRIC_EXPLANATIONS.equalized_odds.short}
                formula={METRIC_EXPLANATIONS.equalized_odds.formula}
              />
              <MetricRow
                label="Calibration Gap"
                value={data.calibration_gap ?? 0}
                threshold={0.05}
                isViolation={(data.calibration_gap ?? 0) > 0.05}
                explanation={METRIC_EXPLANATIONS.calibration_gap.short}
                formula={METRIC_EXPLANATIONS.calibration_gap.formula}
              />
              <MetricRow
                label="Individual Fairness"
                value={data.individual_fairness ?? 0}
                threshold={0.15}
                isViolation={(data.individual_fairness ?? 0) > 0.15}
                explanation={METRIC_EXPLANATIONS.individual_fairness.short}
                formula={METRIC_EXPLANATIONS.individual_fairness.formula}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Flip Test Explanation ──────────────────────────────────────── */}
      {ft.overall_flip_rate !== undefined && (
        <div className="card fade-up delay-2" style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>
            🔁 Counterfactual Flip Test — Individual Fairness
          </div>
          <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 16, lineHeight: 1.6 }}>
            The flip test asks: <em>"If we change ONLY a person's protected attribute (race, gender, age) 
            while keeping everything else identical, does the AI's decision change?"</em> A flip = evidence of direct discrimination.
            This test is the legal gold standard used in US and EU discrimination court proceedings.
          </p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
            <div style={{ textAlign: 'center', background: 'var(--bg)', borderRadius: 10, padding: '16px 24px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'DM Mono, monospace',
                color: ft.overall_flip_rate > 0.3 ? 'var(--red-strong)' : ft.overall_flip_rate > 0.1 ? 'var(--orange-strong)' : 'var(--green-strong)' }}>
                {pct(ft.overall_flip_rate)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>Overall Flip Rate</div>
            </div>
            <div style={{ flex: 1, fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
              {ft.overall_flip_rate > 0.3
                ? `⚠ HIGH: ${pct(ft.overall_flip_rate)} of individuals would receive a different decision if their protected attribute were changed. This is strong evidence of individual discrimination.`
                : ft.overall_flip_rate > 0.1
                ? `⚠ MODERATE: ${pct(ft.overall_flip_rate)} flip rate detected. The model's decisions are partially driven by protected attributes.`
                : `✓ LOW: Only ${pct(ft.overall_flip_rate)} of decisions would change — the model appears individually fair.`}
            </div>
          </div>

          {/* Example flips */}
          {Object.entries(ft.by_attribute ?? {}).map(([attr, attrData]: [string, any]) => (
            attrData.example_flips?.length > 0 && (
              <div key={attr} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Example Discrimination Cases — {attr}
                </div>
                {attrData.example_flips.slice(0, 2).map((ex: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px',
                    background: 'var(--red-dim)', borderRadius: 8, border: '1px solid var(--red)', marginBottom: 8 }}>
                    <div style={{ flex: 1, fontSize: 13 }}>
                      <strong>{attr} = {ex.original_group}</strong> → Decision: <strong style={{ color: ex.original_decision === 'APPROVED' ? 'var(--green-strong)' : 'var(--red-strong)' }}>{ex.original_decision}</strong>
                    </div>
                    <div style={{ fontSize: 18, color: 'var(--slate)' }}>→</div>
                    <div style={{ flex: 1, fontSize: 13 }}>
                      <strong>{attr} = {ex.counterfactual_group}</strong> → Decision: <strong style={{ color: ex.counterfactual_decision === 'APPROVED' ? 'var(--green-strong)' : 'var(--red-strong)' }}>{ex.counterfactual_decision}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )
          ))}
        </div>
      )}

      {/* ── Improvement Roadmap ────────────────────────────────────────── */}
      {audit.mitigations && audit.mitigations.length > 0 && (
        <div className="card fade-up delay-3" style={{ marginBottom: 28, background: 'var(--green-dim)', border: '1px solid var(--green)' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>
            🛣 Your Path to 90+ Points — Improvement Roadmap
          </div>
          <p style={{ fontSize: 13, color: '#374151', marginBottom: 20, lineHeight: 1.6 }}>
            Implement these steps in order to systematically increase your fairness score. 
            After each step, re-upload your revised dataset using the <strong>Re-upload & Compare</strong> panel below.
          </p>
          {audit.mitigations.map((m: any, i: number) => (
            <div key={i} style={{
              display: 'flex', gap: 16, padding: '18px 20px', background: 'var(--card-bg)',
              borderRadius: 12, border: '1px solid var(--border)', marginBottom: 12,
            }}>
              <div style={{ width: 36, height: 36, background: i === 0 ? 'var(--teal)' : 'var(--slate)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy)' }}>{m.title}</span>
                  {m.difficulty && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                      color: m.difficulty === 'Easy' ? 'var(--green-strong)' : m.difficulty === 'Medium' ? 'var(--orange-strong)' : 'var(--red-strong)',
                      background: m.difficulty === 'Easy' ? 'var(--green-dim)' : m.difficulty === 'Medium' ? 'var(--orange-dim)' : 'var(--red-dim)',
                      border: '1px solid', borderColor: m.difficulty === 'Easy' ? 'var(--green)' : m.difficulty === 'Medium' ? 'var(--orange)' : 'var(--red)',
                    }}>
                      {m.difficulty}
                    </span>
                  )}
                  {i === 0 && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal-strong)', padding: '2px 8px',
                    background: 'var(--teal-dim)', borderRadius: 4, border: '1px solid var(--teal)' }}>
                    ← Start Here
                  </span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--slate)', opacity: 0.9, lineHeight: 1.6, marginBottom: m.expected_improvement ? 10 : 0 }}>
                  {m.description}
                </div>
                {m.expected_improvement && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--green-dim)',
                    color: 'var(--green-strong)', padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: '1px solid var(--green)' }}>
                    📈 {m.expected_improvement}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Download Debiased Dataset ───────────────────────────────── */}
      <div className="fade-up delay-4" style={{ marginBottom: 24 }}>
        <div style={{
          border: '2px solid var(--teal)',
          background: 'var(--teal-dim)',
          borderRadius: 16, padding: '24px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--teal-strong)', marginBottom: 6 }}>
              ⬇ Download Debiased Dataset
            </div>
            <div style={{ fontSize: 13, color: 'var(--slate)', lineHeight: 1.6 }}>
              Applies <strong>Kamiran &amp; Calders (2012) Reweighing</strong> — the same algorithm used by IBM AIF360.
              Downloads a mathematically corrected CSV with <code>sample_weight</code> and <code>fairsight_debiased</code> columns
              that reduce disparate impact while preserving model accuracy.
            </div>
            {debiasError && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--red-strong)', background: 'var(--red-dim)',
                padding: '8px 12px', borderRadius: 8, border: '1px solid var(--red)' }}>
                ⚠ {debiasError}
              </div>
            )}
            {debiasSuccess && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--green-strong)', background: 'var(--green-dim)',
                padding: '8px 12px', borderRadius: 8, border: '1px solid var(--green)' }}>
                ✓ Debiased CSV downloaded successfully. Import sample_weight into your training pipeline.
              </div>
            )}
          </div>
          <button
            id="btn-download-debiased"
            onClick={downloadDebiased}
            disabled={debiasLoading}
            style={{
              padding: '13px 26px', borderRadius: 12, border: 'none', cursor: debiasLoading ? 'wait' : 'pointer',
              background: debiasLoading ? 'var(--slate)' : 'var(--teal)', color: '#fff',
              fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
              flexShrink: 0, transition: 'all 0.2s', opacity: debiasLoading ? 0.7 : 1,
            }}
          >
            {debiasLoading ? '⏳ Generating…' : '⬇ Download Corrected CSV'}
          </button>
        </div>
      </div>

      {/* ── Re-upload & Compare ────────────────────────────────────────── */}
      <div className="fade-up delay-4">
        <ReuploadComparePanel
          originalScore={audit.fairnessScore ?? 0}
          originalFilename={audit.filename ?? 'unknown'}
          originalId={audit.id ?? ''}
        />
      </div>

      {/* ── Audit Different File ───────────────────────────────────────── */}
      <div className="fade-up delay-5" style={{ textAlign: 'center', paddingBottom: 48 }}>
        <div style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 14 }}>
          Want to audit a completely different file or model?
        </div>
        <button
          onClick={() => router.push('/audit')}
          style={{ padding: '14px 32px', borderRadius: 12, border: '2px solid var(--navy)',
            background: 'transparent', color: 'var(--navy)', fontWeight: 800, fontSize: 15,
            cursor: 'pointer', transition: 'all 0.2s',
            display: 'inline-flex', alignItems: 'center', gap: 10 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--navy)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--navy)' }}
        >
          🆕 Audit a Different File
        </button>
      </div>
    </div>
  )
}
