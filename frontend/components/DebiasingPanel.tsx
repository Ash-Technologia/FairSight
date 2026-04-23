'use client'

import { useState, useRef } from 'react'
import { Download, RefreshCw, CheckCircle, ArrowRight, TrendingUp, Database } from 'lucide-react'

interface MetricRow {
  label:     string
  before:    number | null
  after:     number | null
  threshold: number
  lowerBetter: boolean
}

interface Props {
  /** The original CSV file object from the audit page state */
  originalFile?: File | null
  /** Protected columns detected by the audit engine */
  protectedColumns: string[]
  /** Target column name */
  targetColumn: string
  /** Current fairness score from audit */
  currentScore?: number
}

export function DebiasingPanel({ originalFile, protectedColumns, targetColumn, currentScore }: Props) {
  const [loading,     setLoading]     = useState(false)
  const [previewing,  setPreviewing]  = useState(false)
  const [preview,     setPreview]     = useState<any>(null)
  const [downloaded,  setDownloaded]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const activeFile = uploadedFile || originalFile

  const runPreview = async (file: File) => {
    setPreviewing(true)
    setPreview(null)
    const auditId = window.location.pathname.split('/').pop() || 'unknown'
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
    const cleanUrl = backendUrl.replace(/\/$/, '')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('protected_columns', JSON.stringify(protectedColumns))
      fd.append('target_column', targetColumn)
      const res = await fetch(`${cleanUrl}/debias/${auditId}`, { method: 'POST', body: fd })
      if (res.ok) setPreview(await res.json())
    } catch {}
    finally { setPreviewing(false) }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setUploadedFile(f); runPreview(f) }
  }

  const handleExport = async () => {
    if (!activeFile) { fileRef.current?.click(); return }
    setLoading(true)
    setDownloaded(false)
    const auditId = window.location.pathname.split('/').pop() || 'unknown'
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'
    const cleanUrl = backendUrl.replace(/\/$/, '')
    try {
      const fd = new FormData()
      fd.append('file', activeFile)
      fd.append('protected_columns', JSON.stringify(protectedColumns))
      fd.append('target_column', targetColumn)
      
      // Step 1: Generate debiased cache
      const res = await fetch(`${cleanUrl}/debias/${auditId}`, { method: 'POST', body: fd })
      if (!res.ok) { console.error(await res.text()); return }
      
      // Step 2: Download
      const resDl = await fetch(`${cleanUrl}/debias/${auditId}/download`)
      if (!resDl.ok) { console.error(await resDl.text()); return }

      const blob = await resDl.blob()
      const cdh  = resDl.headers.get('Content-Disposition') || ''
      const name = cdh.match(/filename="([^"]+)"/)?.[1] || `fairsight_debiased_${auditId.slice(0,8)}.csv`
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = name; a.click()
      URL.revokeObjectURL(url)
      setDownloaded(true)
    } finally { setLoading(false) }
  }

  const before = preview?.before
  const after  = preview?.after

  const metrics: MetricRow[] = before?.by_attribute
    ? Object.entries(before.by_attribute as Record<string,any>).flatMap(([attr, v]: [string, any]) => [
        { label: `DP Gap [${attr}]`,  before: v.demographic_parity, after: after?.by_attribute?.[attr]?.demographic_parity ?? null, threshold: 0.10, lowerBetter: true },
        { label: `EO Gap [${attr}]`,  before: v.equalized_odds,     after: after?.by_attribute?.[attr]?.equalized_odds ?? null,     threshold: 0.10, lowerBetter: true },
      ])
    : []

  const beforeScore = before?.fairness_score ?? currentScore ?? null
  const afterScore  = after?.fairness_score ?? null
  const improvement = afterScore && beforeScore && typeof afterScore === 'number' && typeof beforeScore === 'number'
    ? afterScore - beforeScore : null

  return (
    <div style={{
      background: '#fff', borderRadius: 20, border: '1px solid var(--border)',
      overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 28px', borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(13,148,136,0.05), rgba(20,184,166,0.02))',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--teal-light), var(--teal))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Database size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)' }}>1-Click Auto-Debiasing</div>
          <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>
            Kamiran & Calders (2012) · AIF360-equivalent Reweighing
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate)', textAlign: 'right' }}>
          <div>Protected: <strong style={{ color: 'var(--navy)' }}>{protectedColumns.join(', ') || 'Auto'}</strong></div>
          <div>Target: <strong style={{ color: 'var(--navy)' }}>{targetColumn}</strong></div>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* Algorithm explanation */}
        <div style={{
          background: 'rgba(13,148,136,0.04)', border: '1px solid rgba(13,148,136,0.15)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 20,
          fontSize: 13, color: 'var(--navy)', lineHeight: 1.6,
        }}>
          <strong>How it works:</strong> For each combination of (group, label), a sample weight
          is computed as{' '}
          <code style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
            W = P(Y) × P(A) / P(Y, A)
          </code>
          {' '}— amplifying under-represented groups, attenuating over-represented ones.
          The output CSV includes a <code style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>sample_weight</code> column.
          Use it with:{' '}
          <code style={{ background: 'rgba(0,0,0,0.06)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
            model.fit(X, y, sample_weight=df['sample_weight'])
          </code>
        </div>

        {/* Before/After comparison */}
        {(previewing || preview) && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Projected Impact After Re-Weighting
            </div>

            {previewing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px', color: 'var(--slate)', fontSize: 13 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--teal)', borderTop: '2px solid transparent', animation: 'spin 0.8s linear infinite' }} />
                Computing re-weighting…
              </div>
            ) : (
              <>
                {/* Score comparison */}
                {beforeScore !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <div style={{
                      background: 'var(--bg)', borderRadius: 12, padding: '12px 20px',
                      textAlign: 'center', flex: 1, border: '1px solid var(--border)',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', marginBottom: 4 }}>Before</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: (beforeScore as number) < 75 ? 'var(--red)' : 'var(--amber)' }}>{beforeScore}</div>
                    </div>
                    <ArrowRight size={20} color="var(--teal)" />
                    {afterScore !== null && (
                      <div style={{
                        background: 'rgba(34,197,94,0.06)', borderRadius: 12, padding: '12px 20px',
                        textAlign: 'center', flex: 1, border: '1.5px solid #22c55e',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', marginBottom: 4 }}>After</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a' }}>{afterScore}</div>
                      </div>
                    )}
                    {improvement !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px' }}>
                        <TrendingUp size={16} color="#16a34a" />
                        <span style={{ fontWeight: 800, color: '#16a34a', fontSize: 16 }}>+{improvement} pts</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Metric rows */}
                {metrics.length > 0 && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg)' }}>
                        {['Metric','Before','After','Δ','Threshold'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((m, i) => {
                        const delta = m.after !== null && m.before !== null ? m.after - m.before : null
                        const improved = delta !== null && (m.lowerBetter ? delta < 0 : delta > 0)
                        const passAfter = m.after !== null && (m.lowerBetter ? m.after <= m.threshold : m.after >= m.threshold)
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : 'var(--bg)' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--navy)' }}>{m.label}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--slate)' }}>{m.before?.toFixed(4) ?? '—'}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: passAfter ? '#16a34a' : 'var(--red)' }}>{m.after?.toFixed(4) ?? '—'}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: improved ? '#16a34a' : (delta !== null && delta > 0 ? 'var(--red)' : 'var(--slate)') }}>
                              {delta !== null ? `${delta > 0 ? '+' : ''}${(delta*100).toFixed(1)}%` : '—'}
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--slate)' }}>≤ {m.threshold}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}

                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate)' }}>
                  Algorithm: <strong>{preview?.algorithm}</strong>
                </div>
              </>
            )}
          </div>
        )}

        {/* File upload if no file available */}
        {!activeFile && !preview && (
          <div style={{
            border: '2px dashed var(--border)', borderRadius: 12, padding: '20px',
            textAlign: 'center', marginBottom: 16, cursor: 'pointer',
            transition: 'all 0.2s',
          }} onClick={() => fileRef.current?.click()}>
            <Database size={24} color="var(--slate)" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>Upload Dataset to Preview</div>
            <div style={{ fontSize: 12, color: 'var(--slate)' }}>Upload the same CSV you audited to compute re-weighting</div>
          </div>
        )}
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFileSelect} style={{ display: 'none' }} />

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          {!activeFile && (
            <button onClick={() => fileRef.current?.click()} style={{
              flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid var(--border)',
              background: 'transparent', color: 'var(--navy)', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <RefreshCw size={13} /> Upload & Preview
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={loading}
            style={{
              flex: 1, padding: '12px', borderRadius: 10, border: 'none',
              background: downloaded
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : loading
                  ? 'var(--slate)'
                  : 'linear-gradient(135deg, var(--teal-light), var(--teal))',
              color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(13,148,136,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.3s',
            }}>
            {loading ? (
              <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff4', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite' }} /> Computing…</>
            ) : downloaded ? (
              <><CheckCircle size={14} /> Downloaded!</>
            ) : (
              <><Download size={14} /> Download Debiased Dataset</>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
