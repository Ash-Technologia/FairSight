'use client'
import { useState } from 'react'
import { Download, Loader2, TrendingUp, Zap } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface ThresholdAdj {
  current_threshold: number
  new_threshold: number
  adjustment: number
}

interface MitigationResult {
  strategy: string
  threshold_adjustments: Record<string, Record<string, ThresholdAdj>>
  projected_metrics: {
    new_fairness_score: number
    new_dp_gap: number
    new_eo_gap: number
    improvement_dp: number
    improvement_eo: number
    improvement_score: number
  }
  original_metrics: {
    fairness_score: number
    dp_gap: number
    eo_gap: number
  }
  python_script: string
  json_config: Record<string, unknown>
}

interface Props {
  verdict: string
  metricsPayload: Record<string, unknown>
}

export function AutoMitigationPanel({ verdict, metricsPayload }: Props) {
  const { showToast } = useToast()
  const [strategy, setStrategy] = useState<'equalize_to_mean' | 'equalize_to_best'>('equalize_to_mean')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MitigationResult | null>(null)
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

  if (verdict !== 'GUILTY') return null

  const fetch_mitigation = async (strat: 'equalize_to_mean' | 'equalize_to_best') => {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/mitigate/compute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: metricsPayload, strategy: strat }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setResult(data)
    } catch (e: unknown) {
      showToast('Mitigation computation failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStrategyChange = (s: 'equalize_to_mean' | 'equalize_to_best') => {
    setStrategy(s)
    if (result) fetch_mitigation(s)
  }

  const downloadBlob = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const pct = (v: number) => `${(v * 100).toFixed(1)}%`

  return (
    <div className="card fade-up" style={{ marginBottom: 32, border: '1.5px solid var(--orange)', background: 'var(--orange-dim)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: 10, background: 'var(--orange-dim)', borderRadius: 10, border: '1px solid var(--orange)' }}><Zap size={20} color="var(--orange)" /></div>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--orange-strong)', margin: 0 }}>Auto-Mitigation Available</h3>
          <p style={{ color: 'var(--orange-strong)', opacity: 0.8, fontSize: 13, margin: '4px 0 0' }}>Download a post-processing fix. No model retraining required.</p>
        </div>
      </div>

      {/* Strategy tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['equalize_to_mean', 'equalize_to_best'] as const).map(s => (
          <button
            key={s}
            onClick={() => handleStrategyChange(s)}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
              background: strategy === s ? 'var(--orange)' : 'transparent',
              borderColor: strategy === s ? 'var(--orange)' : 'var(--border)',
              color: strategy === s ? '#fff' : 'var(--slate)',
            }}
          >
            {s === 'equalize_to_mean' ? 'Equalize to Mean' : 'Equalize to Best Group'}
          </button>
        ))}
        <button onClick={() => fetch_mitigation(strategy)} disabled={loading} className="btn btn-outline" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {loading ? <Loader2 size={14} /> : <TrendingUp size={14} />}
          {result ? 'Recalculate' : 'Generate Fix'}
        </button>
      </div>

      {result && (
        <>
          {/* Before / After table */}
          <div style={{ marginBottom: 20, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>{['Metric', 'Before', 'After', 'Improvement'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', background: 'var(--bg)', fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid var(--border)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {[
                  { label: 'Fairness Score', before: `${result.original_metrics.fairness_score}/100`, after: `${result.projected_metrics.new_fairness_score}/100`, imp: `+${result.projected_metrics.improvement_score} pts`, positive: true },
                  { label: 'DP Gap', before: pct(result.original_metrics.dp_gap), after: pct(result.projected_metrics.new_dp_gap), imp: `-${pct(result.projected_metrics.improvement_dp)}`, positive: true },
                  { label: 'EO Gap', before: pct(result.original_metrics.eo_gap), after: pct(result.projected_metrics.new_eo_gap), imp: `-${pct(result.projected_metrics.improvement_eo)}`, positive: true },
                ].map(row => (
                  <tr key={row.label} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--navy)' }}>{row.label}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--slate)' }}>{row.before}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--teal-strong)' }}>{row.after}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--green-strong)' }}>{row.imp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Per-group thresholds */}
          {Object.entries(result.threshold_adjustments).map(([attr, groups]) => (
            <div key={attr} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Threshold Adjustments — {attr}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr>{['Group', 'Current', 'New', 'Change'].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 10px', background: 'var(--bg)', fontSize: 10, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {Object.entries(groups).map(([grp, adj]) => (
                      <tr key={grp} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--navy)' }}>{grp}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--slate)' }}>{adj.current_threshold}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--teal-strong)' }}>{adj.new_threshold}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: adj.adjustment < 0 ? 'var(--green-strong)' : adj.adjustment > 0 ? 'var(--red-strong)' : 'var(--slate)' }}>
                          {adj.adjustment > 0 ? '+' : ''}{adj.adjustment} {adj.adjustment < 0 ? '↓' : adj.adjustment > 0 ? '↑' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Download buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => downloadBlob(result.python_script, 'fairsight_mitigation.py', 'text/x-python')} className="btn btn-teal" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={14} /> Download Python Script (.py)
            </button>
            <button onClick={() => downloadBlob(JSON.stringify(result.json_config, null, 2), 'fairsight_thresholds.json', 'application/json')} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Download size={14} /> Download JSON Config (.json)
            </button>
          </div>

          <p style={{ fontSize: 12, color: 'var(--slate)', marginTop: 16, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, borderLeft: '3px solid var(--border)' }}>
            ⚠ This fix equalizes approval rates. It does not guarantee individual fairness. Review with your legal team before deploying.
          </p>
        </>
      )}
    </div>
  )
}
