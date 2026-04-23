'use client'

import { useState, useCallback, useRef } from 'react'
import { Sliders, AlertTriangle, CheckCircle, RotateCcw, Zap } from 'lucide-react'

const SLIDERS = [
  {
    id: 'gender',
    label: 'Gender Bias',
    icon: '👤',
    description: 'Systematic prediction gap between Male/Female',
    metric: 'demographic_parity',
    subLabel: '→ Demographic Parity Gap',
    maxGap: 0.45,
  },
  {
    id: 'race',
    label: 'Race / Ethnicity Bias',
    icon: '🌍',
    description: 'Approval rate disparity across racial groups',
    metric: 'equalized_odds',
    subLabel: '→ Equalized Odds Gap',
    maxGap: 0.50,
  },
  {
    id: 'age',
    label: 'Age Discrimination',
    icon: '📅',
    description: 'Differential treatment based on age bracket',
    metric: 'calibration_gap',
    subLabel: '→ Calibration Gap',
    maxGap: 0.35,
  },
  {
    id: 'location',
    label: 'Geographic Proxy Bias',
    icon: '📍',
    description: 'Zip code / neighborhood as proxy for race',
    metric: 'individual_fairness',
    subLabel: '→ Individual Fairness Gap',
    maxGap: 0.40,
  },
  {
    id: 'salary',
    label: 'Salary History Proxy',
    icon: '💰',
    description: 'Prior salary perpetuates historic pay gaps',
    metric: 'flip_rate',
    subLabel: '→ Flip Rate',
    maxGap: 0.45,
  },
]

function ScoreRing({ score }: { score: number }) {
  const r  = 54
  const cx = 70
  const cy = 70
  const circumference = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, score))
  const offset = circumference * (1 - pct / 100)
  const color = pct >= 85 ? '#22c55e' : pct >= 70 ? '#f59e0b' : pct >= 50 ? '#ef4444' : '#b91c1c'

  return (
    <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={12} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s' }}
      />
      <text x={cx} y={cy + 6} textAnchor="middle"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px`, fill: 'var(--navy)', fontSize: 22, fontWeight: 800, fontFamily: 'sans-serif' }}>
        {pct}
      </text>
    </svg>
  )
}

export function BiasLabTab() {
  const [values, setValues]       = useState<Record<string,number>>({ gender: 0, race: 0, age: 0, location: 0, salary: 0 })
  const [result, setResult]       = useState<any>(null)
  const [loading, setLoading]     = useState(false)
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null)

  const computeMetrics = useCallback((vals: Record<string,number>) => {
    const get = (id: string) => vals[id] / 100
    return {
      demographic_parity:  get('gender')   * 0.45,
      equalized_odds:      get('race')     * 0.50,
      calibration_gap:     get('age')      * 0.35,
      individual_fairness: get('location') * 0.40,
      flip_rate:           get('salary')   * 0.45,
    }
  }, [])

  const runSimulate = useCallback(async (vals: Record<string,number>) => {
    setLoading(true)
    try {
      const metrics = computeMetrics(vals)
      const body = { metrics, mitigations: [] }
      const res = await fetch('/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) setResult(await res.json())
    } catch {}
    finally { setLoading(false) }
  }, [computeMetrics])

  const handleSlider = (id: string, val: number) => {
    const next = { ...values, [id]: val }
    setValues(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSimulate(next), 200)
  }

  const reset = () => {
    const neutral = { gender: 0, race: 0, age: 0, location: 0, salary: 0 }
    setValues(neutral)
    setResult(null)
  }

  const projectedScore  = result?.projected_score  ?? 100
  const projectedVerdict = result?.projected_verdict ?? 'CLEAR'
  const metricDeltas    = result?.projected_metrics ?? {}
  const currentMetrics  = computeMetrics(values)

  const verdictColor = projectedVerdict === 'CLEAR' ? '#22c55e' : projectedVerdict === 'BORDERLINE' ? '#f59e0b' : '#ef4444'
  const anyBias      = Object.values(values).some(v => v > 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
      {/* LEFT: Sliders */}
      <div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders size={16} color="var(--purple)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Bias Injection Controls
              </span>
            </div>
            <button onClick={reset} style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none',
              border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px',
              cursor: 'pointer', fontSize: 11, color: 'var(--slate)', fontWeight: 600,
            }}>
              <RotateCcw size={11} /> Reset
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {SLIDERS.map(s => {
              const val = values[s.id]
              const gapVal = (val / 100) * s.maxGap
              const severity = val >= 70 ? '#ef4444' : val >= 40 ? '#f59e0b' : 'var(--teal)'
              return (
                <div key={s.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{s.icon} {s.label}</span>
                      <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 1 }}>{s.description}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: severity }}>{val}%</div>
                      <div style={{ fontSize: 10, color: 'var(--slate)' }}>gap: {gapVal.toFixed(3)}</div>
                    </div>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="range" min={0} max={100} step={1} value={val}
                      onChange={e => handleSlider(s.id, Number(e.target.value))}
                      style={{ width: '100%', accentColor: severity, cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--slate)', marginTop: 2 }}>
                      <span>Neutral</span>
                      <span style={{ color: 'rgba(239,68,68,0.7)' }}>Severe Bias</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--slate)', marginTop: 2 }}>
                    {s.subLabel} → <strong style={{ color: 'var(--navy)' }}>{gapVal.toFixed(4)}</strong>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{
            marginTop: 20, padding: '12px 16px',
            background: 'rgba(139,92,246,0.06)', borderRadius: 10,
            border: '1px solid rgba(139,92,246,0.15)',
            fontSize: 12, color: 'var(--slate)', lineHeight: 1.5,
          }}>
            <Zap size={12} color="var(--purple)" style={{ marginRight: 6 }} />
            <strong>How it works:</strong> Slider values map directly to bias gap magnitudes fed into
            the FairSight <code style={{ fontSize: 11 }}>score_simulator.py</code> weighted penalty model.
            Result is a real projected fairness score — same engine used in all audits.
          </div>
        </div>
      </div>

      {/* RIGHT: Live Dashboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Score Ring */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
            Live Fairness Score
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <ScoreRing score={Math.round(projectedScore)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <div style={{
              padding: '6px 18px', borderRadius: 20, fontWeight: 800, fontSize: 13,
              background: `${verdictColor}15`, color: verdictColor,
              border: `1.5px solid ${verdictColor}`,
            }}>
              {projectedVerdict}
            </div>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--slate)', fontSize: 12 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--teal)', borderTop: '2px solid transparent', animation: 'spin 0.6s linear infinite' }} />
                Computing…
              </div>
            )}
          </div>
          {!anyBias && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--slate)' }}>
              Drag sliders to inject bias and see scores update in real-time
            </div>
          )}
        </div>

        {/* Metric Bars */}
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Active Bias Metrics
          </div>
          {SLIDERS.map(s => {
            const rawVal = (values[s.id] / 100) * s.maxGap
            const pct    = Math.min(100, (rawVal / 0.50) * 100)
            const threshold = s.id === 'age' ? 0.05 : 0.10
            const exceeded = rawVal > threshold
            const barColor = exceeded ? '#ef4444' : '#22c55e'
            return (
              <div key={s.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{s.icon} {s.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{rawVal.toFixed(4)}</span>
                    {exceeded
                      ? <AlertTriangle size={12} color="#ef4444" />
                      : <CheckCircle  size={12} color="#22c55e" />}
                  </div>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`, borderRadius: 4,
                    background: barColor,
                    transition: 'width 0.3s ease, background 0.3s',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--slate)', marginTop: 2 }}>
                  <span>0.00</span>
                  <span style={{ color: exceeded ? '#ef4444' : 'var(--slate)' }}>Threshold: {threshold}</span>
                  <span>0.50</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bias Cascade */}
        {result && anyBias && (
          <div className="card" style={{ background: projectedScore < 60 ? 'rgba(239,68,68,0.04)' : projectedScore < 85 ? 'rgba(245,158,11,0.04)' : 'rgba(34,197,94,0.04)', border: `1px solid ${verdictColor}30` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Bias Cascade Analysis
            </div>
            {SLIDERS.map(s => {
              const gapVal = (values[s.id] / 100) * s.maxGap
              const thrMap: Record<string,number> = { gender: 0.10, race: 0.10, age: 0.05, location: 0.15, salary: 0.10 }
              const thr = thrMap[s.id] ?? 0.10
              const triggered = gapVal > thr
              if (!triggered && values[s.id] === 0) return null
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 12 }}>
                  {triggered ? <AlertTriangle size={13} color="#ef4444" /> : <CheckCircle size={13} color="#22c55e" />}
                  <span style={{ color: triggered ? '#ef4444' : 'var(--slate)', fontWeight: triggered ? 600 : 400 }}>
                    {s.icon} {s.label}: {triggered ? `VIOLATION (${gapVal.toFixed(3)} > ${thr})` : `OK (${gapVal.toFixed(3)})`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
