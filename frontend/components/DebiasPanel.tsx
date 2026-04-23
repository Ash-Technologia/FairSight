'use client'
import { useState } from 'react'
import { ArrowLeftRight, CheckCircle2, Download, IterationCcw, Loader2 } from 'lucide-react'

interface DebiasResult {
  audit_id: string
  primary_attribute: string
  privileged_group: string
  weight_stats: { min: number; max: number; mean: number; std: number }
  rows_upweighted: number
  rows_downweighted: number
  current_fairness_score: number
  projected_fairness_score: number
  current_dp_gap: number
  projected_dp_gap: number
  algorithm: string
  citation: string
  download_ready: boolean
}

const getBackendUrl = () =>
  (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000').replace(/\/$/, '')

export function DebiasPanel({ audit, onReAudit }: { audit: any; onReAudit: (csvContent: string) => Promise<void> }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 're-auditing' | 're-audit-done'>('idle')
  const [fileNeeded, setFileNeeded] = useState(false)
  const [debiasData, setDebiasData] = useState<DebiasResult | null>(null)
  const [fileObject, setFileObject] = useState<File | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleGenerate = async () => {
    const w = window as any
    const f = fileObject || w.__fairsight_last_file

    if (!f) {
      setFileNeeded(true)
      return
    }

    setState('loading')
    setErrorMsg('')

    try {
      const backendUrl = getBackendUrl()
      const auditId = audit.id ?? `local-${Date.now()}`

      // Build protected columns list from audit data
      const protectedCols: string[] = (
        audit.protectedColumns ??
        audit.affectedGroups ??
        []
      ).filter((c: string) => typeof c === 'string' && c.length > 0)

      const fd = new FormData()
      fd.append('file', f)
      fd.append('protected_columns', JSON.stringify(protectedCols))
      fd.append('target_column', 'predicted_label')
      fd.append('label_column', 'true_label')

      const res = await fetch(`${backendUrl}/debias/${auditId}`, {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        let detail = `Server error (${res.status})`
        try {
          const err = await res.json()
          detail = err.detail || detail
        } catch {
          const text = await res.text()
          // If HTML (404 page etc.), give a clear message
          if (text.startsWith('<')) detail = `Backend not reachable (${res.status}). Check NEXT_PUBLIC_BACKEND_URL.`
        }
        throw new Error(detail)
      }

      const data = await res.json()
      setDebiasData(data)
      setState('ready')
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Debiasing failed')
      setState('idle')
    }
  }

  const handleDownload = async () => {
    try {
      const backendUrl = getBackendUrl()
      const auditId = audit.id ?? 'unknown'
      const res = await fetch(`${backendUrl}/debias/${auditId}/download`)
      if (!res.ok) throw new Error(`Download failed (${res.status})`)
      const blob = await res.blob()
      const cdh = res.headers.get('Content-Disposition') || ''
      const name = cdh.match(/filename="([^"]+)"/)?.[1] || `fairsight_debiased_${String(auditId).slice(0, 8)}.csv`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Download failed')
    }
  }

  const handleReAudit = async () => {
    setState('re-auditing')
    try {
      const backendUrl = getBackendUrl()
      const auditId = audit.id ?? 'unknown'
      const res = await fetch(`${backendUrl}/debias/${auditId}/download`)
      const csvContent = await res.text()
      await onReAudit(csvContent)
      setState('re-audit-done')
    } catch (err) {
      console.error(err)
      setState('ready')
    }
  }

  return (
    <div style={{ marginTop: 40, border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
      <div style={{ padding: '24px 30px', background: 'var(--teal-dim)', borderLeft: '4px solid var(--teal)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--navy)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowLeftRight size={20} color="var(--teal)" />
          Magic Debiasing Available
        </h3>
        <p style={{ margin: '8px 0 0', color: 'var(--slate)', fontSize: 14 }}>
          Generate a reweighed dataset that corrects the bias without retraining your model.
        </p>
      </div>

      <div style={{ padding: '30px' }}>
        {(state === 'idle' || fileNeeded) && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: 'var(--navy-light)' }}>
                <strong>Algorithm:</strong> IBM Reweighing (Kamiran &amp; Calders, 2012)
              </div>
              <div style={{ fontSize: 14, color: 'var(--slate)' }}>
                <strong>What it does:</strong> Assigns per-sample weights so minority groups are fairly represented during model training.
              </div>
            </div>

            {fileNeeded && (
              <div style={{ marginBottom: 20, padding: 16, border: '1px dashed var(--border)', borderRadius: 8 }}>
                <p style={{ fontSize: 14, color: 'var(--amber-dark)', marginBottom: 10 }}>
                  Re-upload the original dataset to enable debiasing.
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => {
                    if (e.target.files?.[0]) {
                      setFileObject(e.target.files[0])
                      setFileNeeded(false)
                    }
                  }}
                />
              </div>
            )}

            {errorMsg && (
              <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12, padding: '10px 14px', background: 'var(--red-dim)', borderRadius: 8, border: '1px solid var(--red)' }}>
                ⚠ {errorMsg}
              </div>
            )}

            <button
              onClick={handleGenerate}
              style={{ width: '100%', padding: 14, background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 500, fontSize: 15, cursor: 'pointer' }}
            >
              Generate Debiased Dataset →
            </button>
          </div>
        )}

        {state === 'loading' && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--slate)' }}>
            <Loader2 size={32} style={{ color: 'var(--teal)', marginBottom: 16, animation: 'spin 1s linear infinite' }} />
            <div style={{ fontWeight: 500 }}>Running IBM Reweighing Algorithm...</div>
          </div>
        )}

        {(state === 'ready' || state === 're-auditing' || state === 're-audit-done') && debiasData && (
          <div>
            <h4 style={{ margin: '0 0 16px', fontSize: 16, color: 'var(--navy)' }}>Before vs After</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--slate)' }}>Metric</th>
                  <th style={{ padding: '12px 16px', color: 'var(--slate)' }}>Before</th>
                  <th style={{ padding: '12px 16px', color: 'var(--slate)' }}>After</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>Fair. Score</td>
                  <td style={{ padding: '12px 16px', color: 'var(--red)' }}>{debiasData.current_fairness_score} / 100</td>
                  <td style={{ padding: '12px 16px', color: 'var(--green)', fontWeight: 600 }}>{debiasData.projected_fairness_score} / 100</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>DP Gap</td>
                  <td style={{ padding: '12px 16px' }}>{debiasData.current_dp_gap.toFixed(3)}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--green)' }}>{debiasData.projected_dp_gap.toFixed(3)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>Rows changed</td>
                  <td style={{ padding: '12px 16px', color: 'var(--slate)' }}>—</td>
                  <td style={{ padding: '12px 16px' }}>{debiasData.rows_upweighted + debiasData.rows_downweighted} rows</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: 24, fontSize: 13, color: 'var(--slate)' }}>
              <div>Primary fix: <strong>{debiasData.primary_attribute}</strong> attribute ({debiasData.privileged_group} group downweighted)</div>
              <div>Algorithm: {debiasData.algorithm}</div>
            </div>

            {state === 're-auditing' ? (
              <div style={{ textAlign: 'center', marginTop: 24, padding: 16 }}>
                <Loader2 size={24} style={{ color: 'var(--teal)', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : state === 're-audit-done' ? (
              <div style={{ marginTop: 24, padding: 16, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#15803d', display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle2 size={24} />
                <div>
                  <strong>Debiasing successful.</strong> Fairness score improved by +{(debiasData.projected_fairness_score - debiasData.current_fairness_score).toFixed(0)} points.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  onClick={handleDownload}
                  style={{ flex: 1, padding: 12, background: 'none', border: '1px solid var(--border)', color: 'var(--navy)', borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
                >
                  <Download size={18} />
                  Download Debiased CSV
                </button>
                <button
                  onClick={handleReAudit}
                  style={{ flex: 1, padding: 12, background: 'var(--teal)', border: 'none', color: '#fff', borderRadius: 8, fontWeight: 500, fontSize: 14, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
                >
                  <IterationCcw size={18} />
                  Re-Audit After Debiasing →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
