'use client'
import { useEffect, useState, useRef } from 'react'

// Professional, realistic analysis steps
const ANALYSIS_STEPS = [
  'Ingesting dataset and computing baseline metrics...',
  'Quantifying demographic representation parity...',
  'Extracting Equalized Odds and Disparate Impact...',
  'Executing counterfactual margin analysis...',
  'Polling multi-model AI consensus logic...',
  'Synthesizing board-ready compliance report...',
]

// Professional diagnostic log lines instead of "hacker" text
const DIAGNOSTIC_LOGS = [
  "INFO: Dimensionality check passed. Protected classes detected.",
  "COMPUTE: Covariance matrix aligned for sensitive attributes.",
  "WARN: Potential target variable skew detected in segment [A].",
  "NET: Establishing secure connection to consensus nodes...",
  "SHAP: Calculating Shapley values for boundary thresholds.",
  "INFO: Fairness constraint definitions loaded successfully.",
  "ML: Executing local decision tree to isolate proxy features.",
  "DB: Preparing cryptographic hash for audit registry.",
  "COMPUTE: Iterating gradient steps to optimize threshold...",
  "INFO: System load nominal. Waiting on external AI provider.",
  "NET: Handshake verified.",
  "JSON: Normalizing raw metrics payload for severity mapping.",
]

export function ScanningOverlay({ visible }: { visible: boolean }) {
  const [activeStep, setActiveStep] = useState(-1)
  const [doneSteps, setDoneSteps] = useState<number[]>([])
  const [terminalLines, setTerminalLines] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) {
      setActiveStep(-1)
      setDoneSteps([])
      setTerminalLines([])
      setProgress(0)
      return
    }

    let isSubscribed = true
    let step = 0
    setActiveStep(0)

    // Smooth, realistic progress bar curve
    const progT = setInterval(() => {
      if (!isSubscribed) return
      setProgress(p => {
        if (p >= 99) return 99
        // Slower near the end
        const increment = p > 80 ? Math.random() * 1.5 : Math.random() * 4 + 1
        return p + increment
      })
    }, 250)

    // Log injector - structured, intermittent
    const injectLog = () => {
      if (!isSubscribed) return
      const randomLog = DIAGNOSTIC_LOGS[Math.floor(Math.random() * DIAGNOSTIC_LOGS.length)]
      const timeMs = new Date().getMilliseconds().toString().padStart(3, '0')
      const timeSec = new Date().getSeconds().toString().padStart(2, '0')
      
      setTerminalLines(prev => {
        const next = [...prev, `[+${timeSec}.${timeMs}s] ${randomLog}`]
        // Cap lines aggressively to avoid DOM bloat, though CSS handles overflow
        if (next.length > 30) return next.slice(next.length - 30)
        return next
      })
      
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
      
      // Variable speed to look realistic (sometimes batches, sometimes waits)
      const nextDelay = Math.random() > 0.8 ? 50 : 300 + Math.random() * 500
      setTimeout(injectLog, nextDelay)
    }
    const termT = setTimeout(injectLog, 300)

    // Progressive Steps logic
    const advance = () => {
      if (!isSubscribed) return
      setDoneSteps(prev => [...prev, step])
      step++
      if (step < ANALYSIS_STEPS.length) {
        setActiveStep(step)
        // Simulate real processing times (AI step takes longest)
        const waitTime = step === 4 ? 4000 + Math.random() * 3000 : 1500 + Math.random() * 1000
        setTimeout(advance, waitTime)
      }
    }
    // Start step progression
    const stepT = setTimeout(advance, 1000)

    return () => {
      isSubscribed = false
      clearInterval(progT)
      clearTimeout(termT)
      clearTimeout(stepT)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div style={{
      background: 'var(--white)',
      borderRadius: 16,
      border: '1px solid var(--border)',
      boxShadow: '0 8px 30px -10px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      maxWidth: 900,
      margin: '0 auto',
    }}>
      {/* Top Progress Bar */}
      <div style={{ height: 4, background: 'var(--border)', width: '100%', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(progress, 99)}%`,
          background: 'linear-gradient(90deg, var(--teal-light), var(--teal))',
          transition: 'width 0.3s ease-out'
        }} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
        minHeight: 340, // strict fixed height to prevent stretching
      }}>
        
        {/* Left Side: Pipeline Steps */}
        <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
                Generating Diagnostic Audit
              </div>
              <div style={{ fontSize: 13, color: 'var(--slate)', marginTop: 4 }}>
                This process typically takes 15-20 seconds.
              </div>
            </div>
            <div style={{ position: 'relative', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Outer dashed track */}
              <div style={{ position: 'absolute', inset: 0, border: '2px dashed rgba(20,184,166,0.3)', borderRadius: '50%', animation: 'spin 8s linear infinite' }} />
              
              {/* High-speed Teal partial ring */}
              <div style={{ position: 'absolute', inset: -4, border: '2px solid transparent', borderTopColor: 'var(--teal)', borderBottomColor: 'var(--teal)', borderRadius: '50%', animation: 'spin 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite' }} />
              
              {/* Inner Navy reverse ring */}
              <div style={{ position: 'absolute', inset: 5, border: '2px solid transparent', borderLeftColor: 'var(--navy)', borderRightColor: 'var(--navy-light)', borderRadius: '50%', animation: 'spin 2s linear infinite reverse' }} />
              
              {/* Core reactor */}
              <div style={{ width: 12, height: 12, background: 'var(--teal)', borderRadius: '50%', animation: 'pulse-glow 1.5s infinite' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
            {ANALYSIS_STEPS.map((label, i) => {
              const isDone = doneSteps.includes(i)
              const isActive = activeStep === i && !isDone
              const isPending = !isDone && !isActive

              return (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  opacity: isPending ? 0.4 : 1,
                  transition: 'opacity 0.3s ease',
                }}>
                  {/* Status Indicator */}
                  <div style={{
                    width: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDone ? 'var(--bg)' : isActive ? 'transparent' : 'transparent',
                    border: isDone ? '1px solid var(--border)' : isActive ? '2px solid var(--teal)' : '1px solid var(--slate-light)',
                    flexShrink: 0,
                    position: 'relative'
                  }}>
                    {isDone && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    {isActive && (
                      <div style={{
                        position: 'absolute', inset: 3, background: 'var(--teal)', borderRadius: '50%',
                        animation: 'scan-pulse 1.5s ease-in-out infinite'
                      }} />
                    )}
                  </div>
                  
                  <div style={{
                    fontSize: 13.5,
                    fontWeight: isActive || isDone ? 600 : 500,
                    color: isActive ? 'var(--navy)' : isDone ? 'var(--slate)' : 'var(--slate)',
                  }}>
                    {label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Side: Professional Telemetry Block */}
        <div style={{ 
          background: '#f8fafc', // Light sleek background matching SaaS theme
          borderLeft: '1px solid var(--border)',
          padding: '36px 32px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6, background: 'var(--white)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate)'
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
            </div>
            <span style={{ color: 'var(--slate)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              System Trace
            </span>
          </div>

          {/* Code Window */}
          <div 
            style={{
              flex: 1,
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 16,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
              position: 'relative'
            }}
          >
            <div ref={scrollRef} style={{ 
              flex: 1, 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: 6,
              paddingRight: 8 // room for scrollbar
            }} className="scroll-box">
              {terminalLines.map((line, idx) => (
                <div key={idx} style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: 11.5,
                  lineHeight: 1.5,
                  color: 'var(--slate)',
                  wordBreak: 'break-word',
                  animation: 'fade-up 0.2s ease-out'
                }}>
                  {line}
                </div>
              ))}
            </div>
            
            {/* Top/Bottom Fade masks to make scrolling look extremely polished */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 16, background: 'linear-gradient(var(--white), transparent)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, background: 'linear-gradient(transparent, var(--white))', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
