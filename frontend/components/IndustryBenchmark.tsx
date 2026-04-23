'use client'
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface BenchmarkData {
  global_average: number
  total_audits: number
  user_percentile: number | null
  user_score: number
  industry_averages: Record<string, { avg: number; label: string }>
}

interface Props {
  score: number
}

export function IndustryBenchmark({ score }: Props) {
  const [data, setData] = useState<BenchmarkData | null>(null)

  useEffect(() => {
    fetch(`/api/benchmarks?score=${score}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [score])

  if (!data) return null

  const pctLabel = data.user_percentile !== null
    ? data.user_percentile >= 75 ? `Top ${100 - data.user_percentile}%` : data.user_percentile <= 25 ? `Bottom ${data.user_percentile}%` : `${data.user_percentile}th percentile`
    : null
  const pctColor = data.user_percentile !== null
    ? data.user_percentile >= 75 ? '#22c55e' : data.user_percentile <= 40 ? '#f59e0b' : 'var(--teal)'
    : 'var(--slate)'

  return (
    <div className="card fade-up" style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Industry Benchmarks</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--navy)', margin: '0 0 20px' }}>How Does Your Model Compare?</h3>

      {/* Score vs global avg bar */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: 'var(--slate)' }}>
            Your model scored <strong style={{ color: 'var(--navy)' }}>{score}/100</strong>.
            {data.total_audits > 0 && <> The FairSight average is <strong style={{ color: 'var(--teal)' }}>{data.global_average}/100</strong> across {data.total_audits} audits.</>}
          </span>
          {pctLabel && (
            <span style={{ padding: '3px 10px', borderRadius: 20, background: `${pctColor}15`, border: `1px solid ${pctColor}40`, fontSize: 12, fontWeight: 700, color: pctColor, whiteSpace: 'nowrap', marginLeft: 12 }}>{pctLabel}</span>
          )}
        </div>

        {/* Comparison bar */}
        <div style={{ position: 'relative', height: 12, background: 'var(--border)', borderRadius: 6, overflow: 'visible' }}>
          {/* Your score */}
          <div style={{ position: 'absolute', top: 0, left: `${score}%`, transform: 'translateX(-50%)', width: 4, height: 12, background: 'var(--navy)', borderRadius: 2, zIndex: 2 }} />
          {/* Global avg */}
          <div style={{ position: 'absolute', top: 0, left: `${data.global_average}%`, transform: 'translateX(-50%)', width: 4, height: 12, background: 'var(--teal)', borderRadius: 2, zIndex: 2 }} />
          {/* Fill */}
          <div style={{ height: '100%', width: `${score}%`, background: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444', borderRadius: 6, opacity: 0.4 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--slate)', marginTop: 4 }}>
          <span>■ Your score ({score})</span>
          <span style={{ color: 'var(--teal)' }}>■ Platform avg ({data.global_average})</span>
        </div>
      </div>

      {/* Industry table */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Industry Context</div>
      {Object.entries(data.industry_averages).map(([key, { avg, label }]) => {
        const diff = score - avg
        const Icon = diff > 2 ? TrendingUp : diff < -2 ? TrendingDown : Minus
        const diffColor = diff > 2 ? '#22c55e' : diff < -2 ? '#f59e0b' : 'var(--slate)'
        const rowHighlight = diff < -2

        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '8px 10px', borderRadius: 8, background: rowHighlight ? 'rgba(245,158,11,0.05)' : 'transparent', border: rowHighlight ? '1px solid rgba(245,158,11,0.15)' : '1px solid transparent' }}>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--navy)', fontWeight: 600 }}>{label}</div>
            <div style={{ width: 100, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${avg}%`, background: 'var(--teal)', borderRadius: 3 }} />
            </div>
            <div style={{ width: 36, fontSize: 13, fontWeight: 700, color: 'var(--slate)', textAlign: 'right' }}>{avg}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: diffColor, width: 52, justifyContent: 'flex-end' }}>
              <Icon size={12} /> {diff > 0 ? '+' : ''}{diff}
            </div>
          </div>
        )
      })}
    </div>
  )
}
