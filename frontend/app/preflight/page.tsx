'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { Upload, ArrowRight, CheckCircle, AlertTriangle, XCircle, Loader2, Copy } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface ScanResult {
  overall_health_score: number
  recommendation: 'SAFE_TO_TRAIN' | 'CAUTION' | 'DO_NOT_TRAIN'
  filename: string
  rows: number
  scans: {
    representation: { score: number; status: string; issues: string[]; per_group: Record<string, Record<string, { count: number; proportion: number }>> }
    label_noise: { score: number; status: string; issues: string[]; per_attribute: Record<string, Record<string, number>> }
    proxy_density: { score: number; status: string; issues: string[]; proxy_features: string[]; non_proxy_features: string[] }
  }
  fixes: { issue: string; fix: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }[]
}

const AMBER = '#f59e0b'
const AMBER_LIGHT = 'rgba(245,158,11,0.08)'

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 75 ? '#22c55e' : score >= 55 ? AMBER : '#ef4444'
  const status = score >= 75 ? 'CLEAN' : score >= 55 ? 'CAUTION' : 'BIASED'
  const r = 44, cx = 52, cy = 52
  const circ = 2 * Math.PI * r
  const progress = (score / 100) * circ

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={104} height={104} viewBox="0 0 104 104" style={{ display: 'block', margin: '0 auto' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={10} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={circ - progress}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle" fontSize={22} fontWeight={800} fill={color}>{score}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize={10} fill="var(--slate)" fontWeight={700}>/100</text>
      </svg>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginTop: 6 }}>{status}</div>
      <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function PreflightPage() {
  const { showToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [scanning, setScanning] = useState(false)
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<ScanResult | null>(null)
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

  const STEPS = ['Parsing dataset structure…', 'Analysing representation balance…', 'Detecting label noise…', 'Scanning proxy features…', 'Generating health report…']

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) { showToast('Only CSV files supported', 'error'); return }
    setScanning(true); setResult(null); setStep(0)
    
    const stepInterval = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 800)

    const form = new FormData()
    form.append('file', file)
    form.append('protected_attributes', JSON.stringify(['race', 'gender', 'age']))
    form.append('label_col', 'true_label')

    try {
      const res = await fetch(`${BACKEND}/preflight/`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setResult(data)
      showToast('Pre-flight scan complete!', 'success')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      showToast(`Scan failed: ${msg}`, 'error')
    } finally {
      clearInterval(stepInterval)
      setScanning(false)
    }
  }

  const recColor = result?.recommendation === 'SAFE_TO_TRAIN' ? '#22c55e' : result?.recommendation === 'CAUTION' ? AMBER : '#ef4444'
  const recBg = result?.recommendation === 'SAFE_TO_TRAIN' ? 'rgba(34,197,94,0.08)' : result?.recommendation === 'CAUTION' ? AMBER_LIGHT : 'rgba(239,68,68,0.08)'
  const recIcon = result?.recommendation === 'SAFE_TO_TRAIN' ? <CheckCircle size={22} color="#22c55e" /> : result?.recommendation === 'CAUTION' ? <AlertTriangle size={22} color={AMBER} /> : <XCircle size={22} color="#ef4444" />
  const recText: Record<string, string> = {
    SAFE_TO_TRAIN: 'SAFE TO TRAIN — Dataset passes pre-flight checks',
    CAUTION: 'CAUTION — Address high-priority issues before training',
    DO_NOT_TRAIN: 'DO NOT TRAIN — Historical bias will be amplified by any model trained on this data',
  }

  return (
    <div className="page-container fade-up">
      <div style={{ marginBottom: 40 }}>
        <div className="label" style={{ color: AMBER }}>Pre-Training Analysis</div>
        <h1 className="section-title" style={{ fontSize: 40, marginTop: 8, letterSpacing: '-0.02em', color: 'var(--navy)' }}>Pre-Flight Scanner</h1>
        <p style={{ color: 'var(--slate)', fontSize: 16, lineHeight: 1.6, maxWidth: 620, marginTop: 8 }}>
          Catch bias <strong>before</strong> you train. Upload your raw dataset to check representation balance, 
          label historical bias, and proxy feature density.
        </p>
      </div>

      {/* Upload zone */}
      {!result && (
        <div
          className="card fade-up delay-1"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          style={{ textAlign: 'center', padding: '60px 40px', cursor: 'pointer', border: `2px dashed ${AMBER}`, background: AMBER_LIGHT, marginBottom: 32, transition: 'all 0.2s' }}
        >
          {scanning ? (
            <div>
              <Loader2 size={40} color={AMBER} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 18, marginBottom: 8 }}>Scanning dataset…</div>
              <div style={{ color: AMBER, fontSize: 14, fontWeight: 600 }}>{STEPS[step]}</div>
              <div style={{ marginTop: 16, height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', maxWidth: 300, margin: '16px auto 0' }}>
                <div style={{ height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`, background: AMBER, borderRadius: 4, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          ) : (
            <div>
              <Upload size={40} color={AMBER} style={{ margin: '0 auto 16px' }} />
              <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 20, marginBottom: 8 }}>Drop your raw dataset here</div>
              <div style={{ color: 'var(--slate)', fontSize: 14 }}>or click to browse — CSV files only</div>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      )}

      {result && (
        <>
          {/* Recommendation banner */}
          <div style={{ padding: '16px 20px', borderRadius: 12, marginBottom: 28, background: recBg, border: `1.5px solid ${recColor}`, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            {recIcon}
            <div>
              <div style={{ fontWeight: 700, color: recColor, fontSize: 16 }}>{recText[result.recommendation]}</div>
              <div style={{ color: 'var(--slate)', fontSize: 13, marginTop: 4 }}>{result.filename} — {result.rows} rows analyzed</div>
            </div>
            <button onClick={() => setResult(null)} className="btn btn-outline" style={{ marginLeft: 'auto', fontSize: 12, padding: '6px 12px' }}>New Scan</button>
          </div>

          {/* Three health cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
            {[
              { key: 'representation', label: 'Representation' },
              { key: 'label_noise', label: 'Label Fairness' },
              { key: 'proxy_density', label: 'Proxy Density' },
            ].map(({ key, label }) => {
              const scan = result.scans[key as keyof typeof result.scans]
              return (
                <div key={key} className="card" style={{ textAlign: 'center' }}>
                  <ScoreGauge score={scan.score} label={label} />
                  {scan.issues.length > 0 && (
                    <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      {scan.issues.slice(0, 2).map((iss, i) => (
                        <div key={i} style={{ fontSize: 11, color: 'var(--slate)', textAlign: 'left', marginBottom: 4, display: 'flex', gap: 6 }}>
                          <span style={{ color: AMBER }}>⚠</span>{iss}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Proxy features */}
          {result.scans.proxy_density.proxy_features.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: AMBER, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Proxy Features Detected</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {result.scans.proxy_density.proxy_features.map(f => (
                  <span key={f} style={{ padding: '4px 10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#d97706', fontFamily: 'DM Mono, monospace' }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* Fixes */}
          {result.fixes.length > 0 && (
            <div className="card" style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Recommended Fixes — Ordered by Priority</div>
              {result.fixes.map((fix, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16, paddingBottom: 16, borderBottom: i < result.fixes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: fix.priority === 'HIGH' ? 'rgba(239,68,68,0.1)' : fix.priority === 'MEDIUM' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', color: fix.priority === 'HIGH' ? '#ef4444' : fix.priority === 'MEDIUM' ? '#d97706' : '#16a34a', whiteSpace: 'nowrap', height: 'fit-content', marginTop: 2 }}>
                    {fix.priority}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 14, marginBottom: 4 }}>{fix.issue}</div>
                    <div style={{ color: 'var(--slate)', fontSize: 13, lineHeight: 1.5 }}>{fix.fix}</div>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(fix.fix); showToast('Copied!', 'success') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', padding: 4 }} title="Copy fix">
                    <Copy size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/audit" className="btn btn-teal">Proceed to Full Audit <ArrowRight size={15} /></Link>
            <button onClick={() => setResult(null)} className="btn btn-outline">Scan Another Dataset</button>
          </div>
        </>
      )}
    </div>
  )
}
