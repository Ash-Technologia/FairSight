'use client'
// frontend/components/MitigationSandbox.tsx
//
// Before vs After simulation panel.
// Fetches real projections from POST /simulate (backend).
// Falls back to client-side estimate if backend is unavailable.
// Completely self-contained — does not modify any existing component.

import { useState, useCallback } from 'react'

interface Mitigation {
  title: string
  description?: string
  difficulty?: string
  expected_improvement?: string
}

interface FlatMetrics {
  demographic_parity?: number
  equalized_odds?: number
  calibration_gap?: number
  individual_fairness?: number
  flip_rate?: number
}

interface SimResult {
  projected_score: number
  projected_verdict: string
  projected_severity: string
  original_score: number
  delta: number
  metric_deltas: Record<string, number>
  mitigations_applied: number
}

interface Props {
  auditId: string
  currentScore: number
  currentVerdict: string
  metrics: FlatMetrics
  mitigations: Mitigation[]
}

const METRIC_LABELS: Record<string, string> = {
  demographic_parity:  'Demographic Parity Gap',
  equalized_odds:      'Equalized Odds Gap',
  calibration_gap:     'Calibration Gap',
  individual_fairness: 'Individual Fairness Gap',
  flip_rate:           'Flip Rate',
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy:   '#15803d',
  Medium: '#a16207',
  Hard:   '#b91c1c',
}

function ScoreBar({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--slate)', fontWeight: 600 }}>{label}</span>
        <span style={{
          fontSize: 20, fontWeight: 800, fontFamily: 'DM Mono, monospace', color,
        }}>{score.toFixed(1)}</span>
      </div>
      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.min(score, 100)}%`,
          background: color, borderRadius: 4,
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  )
}

export function MitigationSandbox({ currentScore, currentVerdict, metrics, mitigations }: Omit<Props, 'auditId'> & { auditId?: string }) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [result, setResult] = useState<SimResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:8000'

  const toggleMitigation = (idx: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
    setResult(null) // Reset when selection changes
  }

  const runSimulation = useCallback(async () => {
    if (selected.size === 0) return
    setLoading(true)
    setError(null)

    const chosenMitigations = Array.from(selected).map(i => mitigations[i])

    try {
      const res = await fetch(`${backendUrl}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, mitigations: chosenMitigations }),
      })
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const data: SimResult = await res.json()
      setResult(data)
    } catch (err: any) {
      // Graceful client-side fallback estimate (simple linear model)
      const reduction = selected.size * 0.12
      const projected = Math.min(98, currentScore + currentScore * reduction)
      const verdict = projected >= 85 ? 'CLEAR' : projected >= 75 ? 'BORDERLINE' : 'GUILTY'
      setResult({
        projected_score: parseFloat(projected.toFixed(1)),
        projected_verdict: verdict,
        projected_severity: projected >= 75 ? 'LOW' : projected >= 60 ? 'MEDIUM' : 'HIGH',
        original_score: currentScore,
        delta: parseFloat((projected - currentScore).toFixed(1)),
        metric_deltas: {},
        mitigations_applied: selected.size,
      })
      setError('Backend unavailable — showing estimate')
    } finally {
      setLoading(false)
    }
  }, [selected, metrics, mitigations, currentScore, backendUrl])

  const projectedScore = result?.projected_score ?? currentScore
  const scoreColor = (s: number) => s >= 75 ? 'var(--teal)' : s >= 50 ? '#d97706' : 'var(--red)'
  const verdictWouldClear = result && result.projected_verdict !== currentVerdict && result.projected_verdict === 'CLEAR'
  const verdictWouldBorderline = result && result.projected_verdict === 'BORDERLINE' && currentVerdict === 'GUILTY'

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 16,
      overflow: 'hidden', marginBottom: 32,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            ⚗ Mitigation Sandbox
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
            Select mitigations to simulate their effect on the fairness score
          </div>
        </div>
        {selected.size > 0 && (
          <button
            onClick={runSimulation}
            disabled={loading}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: loading ? '#475569' : 'var(--teal)',
              color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {loading
              ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> Simulating…</>
              : `▶ Simulate ${selected.size} Mitigation${selected.size > 1 ? 's' : ''}`
            }
          </button>
        )}
      </div>

      <div style={{ padding: 24 }}>
        {/* Mitigation checkboxes */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Available Mitigations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mitigations.map((m, i) => {
              const isSelected = selected.has(i)
              return (
                <div
                  key={i}
                  onClick={() => toggleMitigation(i)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${isSelected ? 'var(--teal)' : 'var(--border)'}`,
                    background: isSelected ? 'rgba(13,148,136,0.04)' : '#fff',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    border: `2px solid ${isSelected ? 'var(--teal)' : '#cbd5e1'}`,
                    background: isSelected ? 'var(--teal)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {isSelected && <span style={{ color: '#fff', fontSize: 13, fontWeight: 900 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{m.title}</span>
                      {m.difficulty && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                          color: DIFFICULTY_COLORS[m.difficulty] ?? '#475569',
                          background: `${DIFFICULTY_COLORS[m.difficulty] ?? '#475569'}18`,
                          border: `1px solid ${DIFFICULTY_COLORS[m.difficulty] ?? '#475569'}33`,
                        }}>
                          {m.difficulty}
                        </span>
                      )}
                    </div>
                    {m.description && (
                      <div style={{ fontSize: 12, color: 'var(--slate)', lineHeight: 1.5 }}>{m.description}</div>
                    )}
                    {m.expected_improvement && (
                      <div style={{ fontSize: 11, color: 'var(--teal)', marginTop: 4, fontWeight: 600 }}>
                        Expected: {m.expected_improvement}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Simulation result */}
        {result && (
          <div style={{
            borderRadius: 12, border: '1px solid var(--border)',
            overflow: 'hidden',
            animation: 'fade-up 0.3s ease',
          }}>
            <div style={{
              padding: '12px 20px', background: '#f8fafc',
              borderBottom: '1px solid var(--border)',
              fontSize: 12, fontWeight: 700, color: 'var(--slate)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>Simulation Result</span>
              {error && <span style={{ color: '#d97706', fontWeight: 600, textTransform: 'none' }}>⚠ {error}</span>}
            </div>

            <div style={{ padding: 20 }}>
              {/* Score comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 16, alignItems: 'center', marginBottom: 24 }}>
                <ScoreBar score={currentScore} label="Current Score" color={scoreColor(currentScore)} />
                <div style={{ textAlign: 'center', fontSize: 20, color: 'var(--slate)' }}>→</div>
                <ScoreBar score={projectedScore} label="Projected Score" color={scoreColor(projectedScore)} />
              </div>

              {/* Delta badge */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
                <span style={{
                  fontSize: 15, fontWeight: 800, fontFamily: 'DM Mono, monospace',
                  color: result.delta >= 0 ? 'var(--teal)' : 'var(--red)',
                  padding: '6px 16px', borderRadius: 8,
                  background: result.delta >= 0 ? 'rgba(13,148,136,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${result.delta >= 0 ? 'rgba(13,148,136,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  {result.delta >= 0 ? '▲' : '▼'} {Math.abs(result.delta).toFixed(1)} pts
                </span>

                {/* Verdict change */}
                {(verdictWouldClear || verdictWouldBorderline) && (
                  <span style={{
                    fontSize: 13, fontWeight: 700, padding: '6px 14px', borderRadius: 8,
                    background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                  }}>
                    ✓ {verdictWouldClear
                      ? 'These mitigations would likely resolve the GUILTY verdict'
                      : 'Would move verdict to BORDERLINE'}
                  </span>
                )}

                {result.projected_verdict && (
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8,
                    background: result.projected_verdict === 'CLEAR' ? '#f0fdf4'
                      : result.projected_verdict === 'BORDERLINE' ? '#fefce8' : '#fef2f2',
                    color: result.projected_verdict === 'CLEAR' ? '#15803d'
                      : result.projected_verdict === 'BORDERLINE' ? '#a16207' : '#b91c1c',
                    border: '1px solid',
                    borderColor: result.projected_verdict === 'CLEAR' ? '#bbf7d0'
                      : result.projected_verdict === 'BORDERLINE' ? '#fde68a' : '#fca5a5',
                  }}>
                    Projected: {result.projected_verdict}
                  </span>
                )}
              </div>

              {/* Per-metric deltas */}
              {Object.keys(result.metric_deltas ?? {}).length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    Metric-Level Improvements
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(result.metric_deltas).filter(([, v]) => v > 0).map(([field, reduction]) => (
                      <div key={field} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, color: 'var(--slate)', minWidth: 180 }}>
                          {METRIC_LABELS[field] ?? field}
                        </span>
                        <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${Math.min(reduction, 100)}%`,
                            background: 'var(--teal)', borderRadius: 3,
                            transition: 'width 0.8s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', fontFamily: 'DM Mono, monospace', minWidth: 48 }}>
                          ↓ {reduction.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selected.size === 0 && !result && (
          <div style={{
            textAlign: 'center', padding: '24px 0',
            color: 'var(--slate)', fontSize: 13,
          }}>
            Select one or more mitigations above to simulate their impact
          </div>
        )}
      </div>
    </div>
  )
}
