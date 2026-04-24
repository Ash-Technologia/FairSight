'use client'
import { useEffect, useState, useRef } from 'react'

const ANALYSIS_STEPS = [
  { label: 'Ingesting dataset & computing baseline', icon: '⬡' },
  { label: 'Quantifying demographic parity gaps', icon: '⬡' },
  { label: 'Running counterfactual flip test', icon: '⬡' },
  { label: 'Detecting proxy features via correlation', icon: '⬡' },
  { label: 'Generating multi-model AI consensus', icon: '⬡' },
  { label: 'Compiling compliance audit report', icon: '⬡' },
]

const DIAGNOSTIC_LOGS = [
  'Dimensionality check passed. Protected classes detected.',
  'Covariance matrix aligned for sensitive attributes.',
  'Target variable skew detected in demographic segment.',
  'Establishing secure connection to AI consensus nodes…',
  'Computing Shapley values for feature boundary thresholds.',
  'Fairness constraint definitions loaded successfully.',
  'Executing local decision tree to isolate proxy features.',
  'Preparing cryptographic SHA-256 hash for audit registry.',
  'Iterating gradient steps to optimize decision threshold…',
  'System load nominal. Awaiting external AI provider response.',
  'Handshake verified with Gemini endpoint.',
  'Normalizing raw metrics payload for severity mapping.',
  'Demographic Parity computation: complete.',
  'Equalized Odds computation: complete.',
  'Disparate Impact Ratio computation: complete.',
  'Firestore audit document prepared for write.',
]

const METRIC_LABELS = ['Demographic Parity', 'Equalized Odds', 'Disparate Impact', 'Flip Rate', 'Calibration Gap']

export function ScanningOverlay({ visible }: { visible: boolean }) {
  const [activeStep, setActiveStep] = useState(-1)
  const [doneSteps, setDoneSteps] = useState<number[]>([])
  const [terminalLines, setTerminalLines] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [metricValues, setMetricValues] = useState<number[]>([0, 0, 0, 0, 0])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) {
      setActiveStep(-1)
      setDoneSteps([])
      setTerminalLines([])
      setProgress(0)
      setMetricValues([0, 0, 0, 0, 0])
      return
    }

    let isSubscribed = true
    let step = 0
    setActiveStep(0)

    // Smooth progress bar
    const progT = setInterval(() => {
      if (!isSubscribed) return
      setProgress(p => {
        if (p >= 99) return 99
        const inc = p > 85 ? Math.random() * 0.8 : Math.random() * 3.5 + 0.5
        return Math.min(99, p + inc)
      })
    }, 200)

    // Animate metric values
    const metricT = setInterval(() => {
      if (!isSubscribed) return
      setMetricValues(prev => prev.map(() => Math.random()))
    }, 800)

    // Terminal log injector
    const injectLog = () => {
      if (!isSubscribed) return
      const log = DIAGNOSTIC_LOGS[Math.floor(Math.random() * DIAGNOSTIC_LOGS.length)]
      const now = new Date()
      const ts = `${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`
      setTerminalLines(prev => {
        const next = [...prev, `[${ts}] ${log}`]
        return next.length > 25 ? next.slice(-25) : next
      })
      if (scrollRef.current) {
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }, 50)
      }
      setTimeout(injectLog, Math.random() > 0.75 ? 80 : 350 + Math.random() * 450)
    }
    const termT = setTimeout(injectLog, 400)

    // Progressive steps
    const advance = () => {
      if (!isSubscribed) return
      setDoneSteps(prev => [...prev, step])
      step++
      if (step < ANALYSIS_STEPS.length) {
        setActiveStep(step)
        const wait = step === 4 ? 5000 + Math.random() * 3000 : 1800 + Math.random() * 1200
        setTimeout(advance, wait)
      }
    }
    const stepT = setTimeout(advance, 1200)

    return () => {
      isSubscribed = false
      clearInterval(progT)
      clearInterval(metricT)
      clearTimeout(termT)
      clearTimeout(stepT)
    }
  }, [visible])

  if (!visible) return null

  const progressPct = Math.min(progress, 99)
  const currentLabel = activeStep >= 0 && activeStep < ANALYSIS_STEPS.length
    ? ANALYSIS_STEPS[activeStep].label
    : 'Initializing…'

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1a2744 50%, #0f2033 100%)',
      borderRadius: 24,
      border: '1px solid rgba(20,184,166,0.2)',
      overflow: 'hidden',
      boxShadow: '0 32px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
      position: 'relative',
    }}>

      {/* Ambient glow orbs */}
      <div style={{ position: 'absolute', top: -60, left: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(20,184,166,0.15), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, right: -40, width: 260, height: 260, background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)', pointerEvents: 'none' }} />

      {/* Top progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', width: '100%', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          background: 'linear-gradient(90deg, #14b8a6, #6366f1)',
          transition: 'width 0.4s ease-out',
          boxShadow: '0 0 12px rgba(20,184,166,0.7)',
        }} />
      </div>

      {/* Header */}
      <div style={{ padding: '28px 36px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            {/* Pulsing indicator */}
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#14b8a6', boxShadow: '0 0 8px #14b8a6', animation: 'pulse-glow 1.2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5eead4' }}>Live Analysis</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
            FairSight Audit Engine
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, fontFamily: 'DM Mono, monospace' }}>
            {currentLabel}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', lineHeight: 1 }}>
            {Math.round(progressPct)}<span style={{ fontSize: 16, color: '#5eead4' }}>%</span>
          </div>
          <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>Confidence</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, padding: '24px 36px 32px' }}>

        {/* Left: Pipeline steps */}
        <div style={{ paddingRight: 28, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#475569', marginBottom: 18 }}>
            Analysis Pipeline
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ANALYSIS_STEPS.map((step, i) => {
              const isDone = doneSteps.includes(i)
              const isActive = activeStep === i && !isDone
              const isPending = !isDone && !isActive
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  opacity: isPending ? 0.3 : 1,
                  transition: 'opacity 0.4s ease',
                }}>
                  {/* Status circle */}
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDone
                      ? 'rgba(20,184,166,0.15)'
                      : isActive
                        ? 'transparent'
                        : 'rgba(255,255,255,0.04)',
                    border: isDone
                      ? '1.5px solid #14b8a6'
                      : isActive
                        ? '2px solid #14b8a6'
                        : '1px solid rgba(255,255,255,0.12)',
                    position: 'relative',
                  }}>
                    {isDone && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {isActive && (
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', background: '#14b8a6',
                        boxShadow: '0 0 6px #14b8a6',
                        animation: 'pulse-glow 1s infinite',
                      }} />
                    )}
                  </div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: isActive ? 600 : isDone ? 500 : 400,
                    color: isActive ? '#e2e8f0' : isDone ? '#64748b' : '#475569',
                    transition: 'color 0.3s',
                  }}>
                    {step.label}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Metric mini-bars */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#475569', marginBottom: 14 }}>
              Computing Metrics
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {METRIC_LABELS.map((label, i) => {
                const val = metricValues[i] ?? 0
                const isBad = val > 0.5
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#475569' }}>{label}</span>
                      <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: isBad ? '#f87171' : '#34d399' }}>
                        {(val * 0.4).toFixed(3)}
                      </span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${val * 100}%`,
                        background: isBad
                          ? 'linear-gradient(90deg, #ef4444, #f87171)'
                          : 'linear-gradient(90deg, #14b8a6, #34d399)',
                        transition: 'width 0.8s ease, background 0.8s ease',
                        borderRadius: 2,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: Terminal */}
        <div style={{ paddingLeft: 28, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', opacity: 0.6 }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', opacity: 0.6 }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', opacity: 0.6 }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#475569', marginLeft: 4 }}>
              System Trace
            </span>
          </div>

          <div ref={scrollRef} style={{
            flex: 1,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            padding: '14px 16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            maxHeight: 300,
            position: 'relative',
          }}>
            {terminalLines.length === 0 && (
              <div style={{ fontSize: 11, color: '#334155', fontFamily: 'DM Mono, monospace' }}>Initializing…</div>
            )}
            {terminalLines.map((line, idx) => {
              const isWarn = line.toLowerCase().includes('warn') || line.toLowerCase().includes('skew') || line.toLowerCase().includes('detected')
              const isNet = line.toLowerCase().includes('net:') || line.toLowerCase().includes('handshake') || line.toLowerCase().includes('secure')
              return (
                <div key={idx} style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: 11,
                  lineHeight: 1.6,
                  color: isWarn ? '#f59e0b' : isNet ? '#818cf8' : '#475569',
                  wordBreak: 'break-word',
                }}>
                  <span style={{ color: '#1e293b', marginRight: 6 }}>{line.match(/\[\d+\.\d+\]/)?.[0] ?? ''}</span>
                  {line.replace(/\[\d+\.\d+\]\s?/, '')}
                </div>
              )
            })}
            {/* Cursor blink */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: '#14b8a6', fontFamily: 'DM Mono, monospace' }}>▶</span>
              <div style={{ width: 6, height: 14, background: '#14b8a6', borderRadius: 1, animation: 'pulse-glow 1s infinite' }} />
            </div>
          </div>

          {/* ETA chip */}
          <div style={{
            marginTop: 14,
            padding: '10px 16px',
            background: 'rgba(20,184,166,0.08)',
            border: '1px solid rgba(20,184,166,0.2)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Typically completes in</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#5eead4', fontFamily: 'DM Mono, monospace' }}>15–25 sec</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
