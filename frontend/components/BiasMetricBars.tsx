'use client'
import { useEffect, useRef } from 'react'
import { BiasMetrics } from '@/lib/types'

interface BiasMetricBarsProps {
  metrics: {
    demographic_parity: number
    equalized_odds: number
    calibration_gap: number
    individual_fairness: number
  }
}

const METRIC_ITEMS = [
  { key: 'demographic_parity' as const, label: 'Demographic Parity', threshold: 0.1, description: 'Difference in positive outcome rates across groups', icon: '⚖' },
  { key: 'equalized_odds' as const, label: 'Equalized Odds', threshold: 0.1, description: 'Difference in true/false positive rates across groups', icon: '🎯' },
  { key: 'calibration_gap' as const, label: 'Calibration Gap', threshold: 0.05, description: 'Difference in predicted probability accuracy across groups', icon: '📊' },
  { key: 'individual_fairness' as const, label: 'Individual Fairness', threshold: 0.15, description: 'Maximum accuracy disparity between any two groups', icon: '👥' },
]

export function BiasMetricBars({ metrics }: BiasMetricBarsProps) {
  const barsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Start bars at 0, then animate to final width after a short delay
    if (!barsRef.current) return
    const fills = barsRef.current.querySelectorAll<HTMLDivElement>('.bias-fill')
    fills.forEach(el => { el.style.width = '0%' })

    const timer = setTimeout(() => {
      fills.forEach(el => {
        const target = el.dataset.target || '0%'
        el.style.width = target
      })
    }, 120)
    return () => clearTimeout(timer)
  }, [metrics])

  if (!metrics) return null

  return (
    <div ref={barsRef} className="card" style={{ marginBottom: 24 }}>
      <div className="section-title">Bias Metrics</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {METRIC_ITEMS.map(item => {
          const value = metrics[item.key] ?? 0
          const isBiased = value > item.threshold
          const barPct = Math.min(value / (item.threshold * 3) * 100, 100)
          const barColor = isBiased
            ? 'linear-gradient(90deg, var(--orange), var(--red))'
            : 'linear-gradient(90deg, var(--teal-light), var(--teal))'
          const textColor = isBiased ? 'var(--red-strong)' : 'var(--teal-strong)'

          return (
            <div key={item.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
                <div>
                  <span style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 600 }}>
                    {item.icon} {item.label}
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--slate)', marginTop: 1 }}>{item.description}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: textColor, fontFamily: 'DM Mono, monospace' }}>
                    {value.toFixed(3)}
                  </span>
                  <span style={{ marginLeft: 5, fontSize: 13 }}>{isBiased ? '⚠' : '✓'}</span>
                </div>
              </div>

              {/* Animated progress bar */}
              <div className="progress-track" style={{ height: 8, borderRadius: 4, background: isBiased ? 'var(--red-dim)' : 'var(--green-dim)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div
                  className="bias-fill"
                  data-target={`${barPct}%`}
                  style={{
                    width: '0%',
                    background: barColor,
                    height: '100%',
                    borderRadius: 4,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--slate)' }}>Threshold: {item.threshold}</span>
                {isBiased && (
                  <span style={{ fontSize: 11, color: 'var(--red-strong)', fontWeight: 700 }}>
                    +{((value - item.threshold) * 100).toFixed(1)}% over limit
                  </span>
                )}
                {!isBiased && (
                  <span style={{ fontSize: 11, color: 'var(--teal-strong)', fontWeight: 600 }}>Within threshold ✓</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
