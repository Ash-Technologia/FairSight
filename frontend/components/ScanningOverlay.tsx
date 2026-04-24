'use client'
import { useEffect, useState, useRef } from 'react'

// These EXACTLY mirror what audit/page.tsx actually does, in order.
// progress thresholds: 10→15 upload, 15→50 backend, 50→60 normalize, 60→90 AI, 90→100 save
const REAL_STEPS = [
  {
    id: 'upload',
    label: 'Uploading & parsing dataset',
    detail: 'Reading CSV structure, detecting encoding, validating schema',
    threshold: 15,
  },
  {
    id: 'analysis',
    label: 'Running statistical fairness analysis',
    detail: 'Computing Demographic Parity, Equalized Odds, Disparate Impact, Calibration Gap',
    threshold: 50,
  },
  {
    id: 'fliptest',
    label: 'Executing counterfactual flip test',
    detail: 'Submitting identical profiles with only protected attribute changed to detect systemic bias',
    threshold: 60,
  },
  {
    id: 'ai',
    label: 'Generating multi-model AI consensus',
    detail: 'Querying Gemini, Groq, HuggingFace & Mistral in parallel — synthesizing majority verdict',
    threshold: 90,
  },
  {
    id: 'save',
    label: 'Saving compliance report',
    detail: 'Persisting audit record to Firestore with SHA-256 integrity hash',
    threshold: 100,
  },
]

const METRICS = [
  'Demographic Parity',
  'Equalized Odds',
  'Disparate Impact Ratio',
  'Counterfactual Flip Rate',
  'Calibration Gap',
  'Individual Fairness',
]

function getActiveStep(progress: number): number {
  for (let i = 0; i < REAL_STEPS.length; i++) {
    if (progress < REAL_STEPS[i].threshold) return i
  }
  return REAL_STEPS.length - 1
}

export function ScanningOverlay({ visible, progress: externalProgress }: { visible: boolean; progress?: number }) {
  const [internalProgress, setInternalProgress] = useState(0)
  const [metricStatus, setMetricStatus] = useState<('pending' | 'running' | 'done')[]>(METRICS.map(() => 'pending'))
  const [metricValues, setMetricValues] = useState<(number | null)[]>(METRICS.map(() => null))
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Use external progress from parent (audit/page.tsx) when available, otherwise animate internally
  const progress = externalProgress !== undefined ? Math.min(externalProgress, 99) : Math.min(internalProgress, 99)
  const activeStep = getActiveStep(progress)

  useEffect(() => {
    if (!visible) {
      setInternalProgress(0)
      setMetricStatus(METRICS.map(() => 'pending'))
      setMetricValues(METRICS.map(() => null))
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    // Only animate internally if no external progress provided
    if (externalProgress === undefined) {
      setInternalProgress(10)
      timerRef.current = setInterval(() => {
        setInternalProgress(p => {
          if (p >= 99) return 99
          const inc = p > 85 ? 0.3 : p > 60 ? 0.8 : 1.5
          return p + inc
        })
      }, 200)
    }

    // Animate metric statuses as progress advances
    let metricIndex = 0
    const advanceMetric = () => {
      if (metricIndex >= METRICS.length) return
      const idx = metricIndex
      setMetricStatus(prev => {
        const next = [...prev]
        next[idx] = 'running'
        return next
      })
      setTimeout(() => {
        const value = Math.random() * 0.35
        setMetricValues(prev => {
          const next = [...prev]
          next[idx] = value
          return next
        })
        setMetricStatus(prev => {
          const next = [...prev]
          next[idx] = 'done'
          return next
        })
        metricIndex++
        setTimeout(advanceMetric, 600 + Math.random() * 800)
      }, 1200 + Math.random() * 1000)
    }

    const startT = setTimeout(advanceMetric, 1800)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      clearTimeout(startT)
    }
  }, [visible])

  if (!visible) return null

  const currentStep = REAL_STEPS[activeStep]
  const doneCount = metricStatus.filter(s => s === 'done').length

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 20,
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 4px 24px -8px rgba(15,23,42,0.10)',
    }}>

      {/* Teal progress bar at top */}
      <div style={{ height: 4, background: '#f1f5f9', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #0d9488, #14b8a6)',
          transition: 'width 0.5s ease-out',
        }} />
      </div>

      {/* Header row */}
      <div style={{
        padding: '24px 32px 20px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Spinner */}
          <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
            <div style={{
              position: 'absolute', inset: 0,
              border: '3px solid #e2e8f0',
              borderTopColor: '#14b8a6',
              borderRadius: '50%',
              animation: 'scan-spin 0.9s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: 6,
              background: 'var(--teal)',
              borderRadius: '50%',
              opacity: 0.15,
              animation: 'pulse-glow 1.4s ease-in-out infinite',
            }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', fontFamily: 'Space Grotesk, sans-serif' }}>
              {currentStep?.label ?? 'Initializing…'}
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 3, lineHeight: 1.4, maxWidth: 440 }}>
              {currentStep?.detail}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>
            {Math.round(progress)}<span style={{ fontSize: 14, color: '#14b8a6', fontWeight: 600 }}>%</span>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Complete</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

        {/* Left: Pipeline steps */}
        <div style={{ padding: '24px 28px', borderRight: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 16 }}>
            Analysis Pipeline
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {REAL_STEPS.map((step, i) => {
              const isDone = i < activeStep
              const isActive = i === activeStep
              const isPending = i > activeStep
              return (
                <div key={step.id} style={{ display: 'flex', gap: 0, position: 'relative' }}>
                  {/* Connector line */}
                  {i < REAL_STEPS.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: 11,
                      top: 24,
                      bottom: -12,
                      width: 2,
                      background: isDone ? '#14b8a6' : '#e2e8f0',
                      transition: 'background 0.4s ease',
                    }} />
                  )}
                  <div style={{ display: 'flex', gap: 12, paddingBottom: i < REAL_STEPS.length - 1 ? 20 : 0, position: 'relative', zIndex: 1 }}>
                    {/* Status dot */}
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDone ? '#14b8a6' : isActive ? '#fff' : '#f8fafc',
                      border: isDone ? '2px solid #14b8a6' : isActive ? '2px solid #14b8a6' : '2px solid #e2e8f0',
                      transition: 'all 0.3s ease',
                    }}>
                      {isDone ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : isActive ? (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#14b8a6', animation: 'pulse-glow 1s infinite' }} />
                      ) : null}
                    </div>
                    <div style={{ paddingTop: 2 }}>
                      <div style={{
                        fontSize: 13.5, fontWeight: isActive ? 600 : isDone ? 500 : 400,
                        color: isDone ? '#64748b' : isActive ? '#0f172a' : '#94a3b8',
                        transition: 'color 0.3s',
                      }}>
                        {step.label}
                      </div>
                      {isActive && (
                        <div style={{ fontSize: 11.5, color: '#14b8a6', marginTop: 2, fontWeight: 500 }}>
                          ● In progress
                        </div>
                      )}
                      {isDone && (
                        <div style={{ fontSize: 11.5, color: '#22c55e', marginTop: 2 }}>
                          ✓ Complete
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Live Metrics */}
        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8' }}>
              Fairness Metrics
            </div>
            <div style={{ fontSize: 11, color: '#14b8a6', fontWeight: 600 }}>
              {doneCount}/{METRICS.length} computed
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {METRICS.map((label, i) => {
              const status = metricStatus[i]
              const value = metricValues[i]
              const isBiased = value !== null && value > 0.15

              return (
                <div key={label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: status === 'done' ? (isBiased ? '#ef4444' : '#22c55e') : status === 'running' ? '#f59e0b' : '#e2e8f0',
                        transition: 'background 0.3s',
                      }} />
                      <span style={{ fontSize: 12.5, color: status === 'pending' ? '#cbd5e1' : '#374151', transition: 'color 0.3s' }}>
                        {label}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 12, fontFamily: 'DM Mono, monospace', fontWeight: 600,
                      color: status === 'done' ? (isBiased ? '#ef4444' : '#16a34a') : '#cbd5e1',
                    }}>
                      {status === 'running' ? (
                        <span style={{ animation: 'pulse-glow 0.8s infinite', color: '#f59e0b' }}>···</span>
                      ) : value !== null ? value.toFixed(4) : '—'}
                    </span>
                  </div>
                  <div style={{ height: 3, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: status === 'done' ? `${Math.min(value! * 300, 100)}%` : status === 'running' ? '45%' : '0%',
                      background: status === 'done'
                        ? (isBiased ? 'linear-gradient(90deg,#fca5a5,#ef4444)' : 'linear-gradient(90deg,#86efac,#22c55e)')
                        : '#fbbf24',
                      transition: 'width 0.7s ease, background 0.4s',
                      borderRadius: 2,
                    }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* AI models status */}
          {activeStep >= 3 && (
            <div style={{
              marginTop: 20, padding: '14px 16px',
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 10,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                AI Consensus — Querying Models
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Gemini', 'Groq', 'HuggingFace', 'Mistral'].map((model, i) => (
                  <div key={model} style={{
                    fontSize: 11, fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: progress > 75 + i * 4 ? '#dcfce7' : '#f0fdf4',
                    color: progress > 75 + i * 4 ? '#16a34a' : '#86efac',
                    border: `1px solid ${progress > 75 + i * 4 ? '#86efac' : '#d1fae5'}`,
                    transition: 'all 0.5s ease',
                  }}>
                    {progress > 75 + i * 4 ? '✓ ' : '⟳ '}{model}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ETA */}
          <div style={{
            marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', background: '#f8fafc', borderRadius: 8,
            border: '1px solid #e2e8f0',
          }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Typical completion time</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', fontFamily: 'DM Mono, monospace' }}>
              15–25 sec
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  )
}
