'use client'
import { useEffect, useState, useRef } from 'react'
import { BiasMetricBars } from '@/components/BiasMetricBars'
import { FlipTestCard } from '@/components/FlipTestCard'
import { FairnessScore } from '@/components/FairnessScore'
import { ModelConsensusPanel } from '@/components/ModelConsensusPanel'
import { ScanningOverlay } from '@/components/ScanningOverlay'
import { IntersectionalRadar } from '@/components/IntersectionalRadar'
import { AutoMitigationPanel } from '@/components/AutoMitigationPanel'
import { IndustryBenchmark } from '@/components/IndustryBenchmark'
import { AuditRecord } from '@/lib/types'
import { Download, ArrowLeft, AlertTriangle, Copy, Check, Shield, Share2 } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { MitigationSandbox } from '@/components/MitigationSandbox'
import { DetailedAuditReport } from '@/components/DetailedAuditReport'
import { DebiasPanel } from '@/components/DebiasPanel'
import { ProxyHeatmap } from '@/components/ProxyHeatmap'
import Link from 'next/link'

// ── Severity badge helper ─────────────────────────────────────────────────
const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: 'var(--red-dim)', text: 'var(--red-strong)', border: 'var(--red)' },
  HIGH: { bg: 'var(--orange-dim)', text: 'var(--orange-strong)', border: 'var(--orange)' },
  MEDIUM: { bg: 'rgba(234, 179, 8, 0.1)', text: '#a16207', border: '#fde68a' }, // Keeping yellow unique or mapping to orange if preferred
  LOW: { bg: 'var(--green-dim)', text: 'var(--green-strong)', border: 'var(--green)' },
}

function SeverityBadge({ severity }: { severity?: string }) {
  if (!severity) return null
  const s = severity.toUpperCase()
  const c = SEVERITY_COLORS[s] ?? SEVERITY_COLORS['MEDIUM']
  return (
    <span style={{
      fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
      padding: '4px 10px', borderRadius: 6,
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
    }}>
      {s}
    </span>
  )
}

// ── Consensus badge helper ────────────────────────────────────────────────
const CONSENSUS_COLORS: Record<string, { bg: string; text: string }> = {
  strong: { bg: 'var(--green-dim)', text: 'var(--green-strong)' },
  partial: { bg: 'var(--orange-dim)', text: 'var(--orange-strong)' },
  split: { bg: 'var(--red-dim)', text: 'var(--red-strong)' },
  single: { bg: 'var(--bg)', text: 'var(--slate)' },
  none: { bg: 'var(--bg)', text: 'var(--slate)' },
}

function ConsensusBadge({ level }: { level?: string }) {
  if (!level || level === 'none') return null
  const c = CONSENSUS_COLORS[level] ?? CONSENSUS_COLORS['none']
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
      padding: '4px 10px', borderRadius: 6,
      background: c.bg, color: c.text,
      border: `1px solid ${c.text}22`,
    }}>
      Consensus: {level.toUpperCase()}
    </span>
  )
}

export default function AuditReport({ params }: { params: { id: string } }) {
  const [audit, setAudit] = useState<AuditRecord | null>(null)
  const [loading, setLoading] = useState(true)
  // [BUG-10 FIX] boardMode persisted in localStorage
  const [boardMode, setBoardMode] = useState<boolean>(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fairsight_board_mode')
      if (saved) setBoardMode(JSON.parse(saved))
    } catch { }
  }, [])
  const [exporting, setExporting] = useState(false)
  const [hashCopied, setHashCopied] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [gdprCompliant, setGdprCompliant] = useState<boolean | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  // Validate against constitution for GDPR badge
  useEffect(() => {
    if (audit) {
      fetch(`/api/constitution/validate?uid=${audit.uid ?? 'guest'}&audit_id=${audit.id}`)
        .then(r => r.json())
        .then(data => {
          if (data && typeof data.compliant === 'boolean') setGdprCompliant(data.compliant)
        })
        .catch(() => {})
    }
  }, [audit])

  useEffect(() => {
    localStorage.setItem('fairsight_board_mode', JSON.stringify(boardMode))
  }, [boardMode])

  useEffect(() => {
    fetch(`/api/verdict?id=${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setAudit(data)
          showToast('Audit report loaded', 'success')
        } else {
          setAudit(null)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  const copyHash = () => {
    if (!audit?.datasetHash) return
    navigator.clipboard.writeText(audit.datasetHash).then(() => {
      setHashCopied(true)
      showToast('Hash copied to clipboard', 'success')
      setTimeout(() => setHashCopied(false), 2000)
    })
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true)
      showToast('Public link copied to clipboard', 'success')
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  const exportJSON = () => {
    if (!audit) return
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(audit, null, 2))
    const a = document.createElement('a')
    a.href = dataStr
    a.download = `FairSight_Audit_${(audit.id || 'report').slice(0, 8)}_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    showToast('JSON exported', 'success')
  }

  // ── PDF Export — real reportlab backend ────────────────────────────────
  const exportPDF = async () => {
    if (!audit) return
    setExporting(true)
    showToast('Generating compliance PDF…', 'info')
    try {
      const body = {
        id:               audit.id,
        filename:         audit.filename,
        datasetHash:      audit.datasetHash,
        rowCount:         audit.rowCount,
        verdict:          audit.verdict,
        fairnessScore:    audit.fairnessScore,
        severity:         audit.severity,
        metrics:          (audit as any).metrics,
        flipTest:         (audit as any).flipTest,
        aiVerdicts:       (audit as any).aiVerdicts,
        protectedColumns: (audit as any).protectedColumns,
        createdAt:        (audit as any).createdAt,
      }
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.text()
        showToast('PDF failed: ' + err.slice(0, 80), 'error')
        return
      }
      const blob = await res.blob()
      const cdh  = res.headers.get('Content-Disposition') || ''
      const name = cdh.match(/filename="([^"]+)"/)?.[1] ||
        `FairSight_Compliance_${(audit.id || 'report').slice(0, 8)}.pdf`
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href = url; a.download = name; a.click()
      URL.revokeObjectURL(url)
      showToast('Compliance PDF downloaded!', 'success')
    } catch(e: any) {
      console.error('PDF error:', e)
      showToast('PDF export failed', 'error')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container-narrow fade-up" style={{ paddingTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* The Decryptor Engine */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
          width: '100%', maxWidth: 720, 
          borderRadius: 24, padding: 40,
          boxShadow: '0 32px 80px -20px rgba(15,23,42,0.5)',
          border: '1px solid #334155',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 10
        }}>
          {/* Holographic sweeping light */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 0% 50%, rgba(20,184,166,0.1), transparent 60%)', animation: 'scan-spin-outer 4s linear infinite' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 36, position: 'relative', zIndex: 10 }}>
            {/* Holographic Lock Mechanism */}
            <div style={{ position: 'relative', width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, border: '2px dashed rgba(20,184,166,0.4)', borderRadius: '50%', animation: 'spin 12s linear infinite' }} />
              <div style={{ position: 'absolute', inset: -8, border: '2px solid transparent', borderTopColor: '#14b8a6', borderBottomColor: '#14b8a6', borderRadius: '50%', animation: 'spin 2.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite' }} />
              <div style={{ position: 'absolute', inset: 8, border: '2px solid transparent', borderRightColor: '#6366f1', borderLeftColor: '#6366f1', borderRadius: '50%', animation: 'spin 1.5s linear infinite reverse' }} />
              
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(20,184,166,0.5)', animation: 'pulse-glow 2s infinite' }}>
                <Shield color="#fff" size={22} fill="currentColor" />
              </div>
            </div>

            {/* Terminal Telemetry */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#5eead4', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16, fontFamily: 'DM Mono, monospace', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, background: '#5eead4', borderRadius: '50%', animation: 'pulse-glow 1s infinite' }} />
                Assembling Audit Payload
              </div>
              <div style={{ height: 3, background: '#334155', borderRadius: 2, overflow: 'hidden', marginBottom: 20 }}>
                {/* Fast moving trace line */}
                <div style={{ height: '100%', width: '40%', background: '#14b8a6', animation: 'scan-spin-outer 1s infinite linear alternate', borderRadius: 2 }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px 24px' }}>
                {[
                  { label: 'Verification Hash', val: 'SECURE', col: '#4ade80' },
                  { label: 'AI Consensus', val: 'SYNCING...', col: '#facc15' },
                  { label: 'Metrics Matrices', val: 'EXTRACTED', col: '#4ade80' },
                  { label: 'PDF Blueprint', val: 'RENDERING', col: '#94a3b8' }
                ].map((stat, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontFamily: 'DM Mono, monospace', borderBottom: '1px dotted #334155', paddingBottom: 6 }}>
                    <span style={{ color: '#94a3b8' }}>{stat.label}</span>
                    <span style={{ color: stat.col, fontWeight: 700 }}>{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Skeletal Blueprint Background */}
        <div style={{ width: '100%', maxWidth: 720, height: 260, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 24, marginTop: 24, opacity: 0.35, padding: 40, backgroundImage: 'linear-gradient(var(--bg) 1px, transparent 1px), linear-gradient(90deg, var(--bg) 1px, transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }}>
           <div style={{ height: 16, width: 140, background: 'var(--border)', borderRadius: 4, marginBottom: 20 }} />
           <div style={{ height: 48, width: '60%', background: 'var(--slate-light)', borderRadius: 8, marginBottom: 40 }} />
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
             <div style={{ height: 80, background: 'var(--border)', borderRadius: 12 }} />
             <div style={{ height: 80, background: 'var(--border)', borderRadius: 12 }} />
             <div style={{ height: 80, background: 'var(--border)', borderRadius: 12 }} />
           </div>
        </div>

      </div>
    )
  }

  if (!audit) {
    return (
      <div className="page-container-narrow fade-up" style={{ textAlign: 'center', paddingTop: 100 }}>
        <div style={{ background: '#fef2f2', border: '1px solid rgba(239,68,68,0.2)', padding: '48px 40px', borderRadius: 20 }}>
          <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontWeight: 700, color: '#dc2626', fontSize: 20, marginBottom: 8 }}>Report Not Found</div>
          <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 24 }}>
            This audit could not be loaded. It may have been deleted or you may not have permission to view it.
          </p>
          <Link href="/audit" className="btn btn-teal">Run a New Audit</Link>
        </div>
      </div>
    )
  }

  const isGuilty = audit.verdict === 'GUILTY'
  const byAttr = (audit as any).byAttribute ?? {}
  const ft = (audit as any).flipTest
  const piiWarnings = (audit as any).piiWarnings

  return (
    <div className="page-container-narrow" ref={reportRef} style={{ paddingBottom: 80 }}>
      {/* Back nav & Floating Action Bar */}
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <Link href="/dashboard" className="btn btn-outline" style={{ fontSize: 13, padding: '8px 14px', gap: 6 }}>
          <ArrowLeft size={14} /> Dashboard
        </Link>
      </div>

      <div className="fade-up" style={{
        position: 'fixed',
        top: 100,
        right: 40,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        padding: '16px',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Actions</div>
        <button onClick={exportPDF} disabled={exporting} className="btn btn-teal" style={{ padding: '10px 16px', fontSize: 13, gap: 8 }}>
          {exporting
            ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span> PDF…</>
            : <><Download size={14} /> Export PDF</>
          }
        </button>
        <button onClick={exportJSON} className="btn btn-outline" style={{ padding: '10px 16px', fontSize: 13, gap: 8 }}>
          <Download size={14} /> Raw JSON
        </button>
        <button onClick={handleShare} className="btn btn-outline" style={{ padding: '10px 16px', fontSize: 13, gap: 8 }}>
          {linkCopied ? <Check size={14} color="#22c55e" /> : <Share2 size={14} />}
          {linkCopied ? 'Copied!' : 'Share Link'}
        </button>
        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
        <button
          onClick={() => setBoardMode(!boardMode)}
          className={`btn ${boardMode ? 'btn-teal' : 'btn-outline'}`}
          style={{ padding: '10px 16px', fontSize: 12 }}
        >
          {boardMode ? '📉 Tech View' : '📋 Board View'}
        </button>
      </div>

      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>Audit #{(audit.id || '').slice(0, 8).toUpperCase()}</div>
          <h1 className="text-gradient gradient-primary" style={{ fontSize: 38, fontWeight: 800, margin: '0 0 12px', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
            Verdict:{' '}
            <span style={{ color: isGuilty ? 'var(--red)' : 'var(--green)', WebkitTextFillColor: isGuilty ? 'var(--red)' : 'var(--green)' }}>{audit.verdict}</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 14, color: 'var(--slate)' }}>
            <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{audit.filename}</span>
            <span>•</span>
            <span>{new Date(audit.createdAt).toLocaleString()}</span>
            {(audit as any).rowCount > 0 && (
              <><span>•</span><span>{(audit as any).rowCount.toLocaleString()} rows</span></>
            )}
            {/* [FIX] Severity badge beside score */}
            <SeverityBadge severity={(audit as any).severity} />
            {/* [FIX] Consensus badge */}
            <ConsensusBadge level={(audit as any).consensusLevel} />
            {/* [FEATURE] Confidence Badge */}
            {(audit as any).confidenceLevel !== undefined && (
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                padding: '4px 10px', borderRadius: 6,
                background: 'var(--bg)', color: 'var(--slate)',
                border: '1px solid var(--border)',
              }}>
                Confidence: {Math.round((audit as any).confidenceLevel * 100)}%
              </span>
            )}
            {/* [FEATURE] GDPR Compliance Badge */}
            {gdprCompliant !== null && (
              <span style={{
                fontSize: 11, fontWeight: 800, letterSpacing: '0.05em',
                padding: '4px 10px', borderRadius: 6,
                background: gdprCompliant ? '#f0fdf4' : '#fef2f2',
                color: gdprCompliant ? '#15803d' : '#dc2626',
                border: `1px solid ${gdprCompliant ? '#bbf7d0' : '#fca5a5'}`,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <Shield size={12} fill="currentColor" color={gdprCompliant ? '#f0fdf4' : '#fef2f2'} />
                {gdprCompliant ? 'GDPR / AI ACT COMPLIANT' : 'GDPR / AI ACT VIOLATION'}
              </span>
            )}
          </div>

          {/* [FIX] Dataset hash with copy button */}
          {audit.datasetHash && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--slate)', opacity: 0.7 }}>
                {audit.datasetHash.slice(0, 20)}…
              </span>
              <button
                onClick={copyHash}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--slate)', display: 'flex' }}
                title="Copy full hash"
              >
                {hashCopied ? <Check size={13} color="var(--teal)" /> : <Copy size={13} />}
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <FairnessScore score={audit.fairnessScore || 0} size="lg" />
        </div>
      </div>

      {/* [FIX] Protected attributes + PII warnings */}
      {!boardMode && (
        <>
          {(audit as any).protectedColumns?.length > 0 && (
            <div className="card fade-up delay-1" style={{ marginBottom: 20, background: '#f8fafc', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Protected Attributes Analyzed
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(audit as any).protectedColumns.map((col: string) => (
                  <span key={col} className="mono" style={{
                    fontSize: 13, background: 'var(--blue-dim)', color: 'var(--blue-strong)',
                    padding: '5px 12px', borderRadius: 8, fontWeight: 600,
                    border: '1px solid var(--blue)',
                    opacity: 0.9
                  }}>
                    {col}
                  </span>
                ))}
              </div>
            </div>
          )}

          {piiWarnings?.warnings?.length > 0 && (
            <div className="card fade-up delay-1" style={{ marginBottom: 20, background: 'var(--orange-dim)', border: '1px solid var(--orange)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange-strong)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                ⚠ Potential PII Detected
              </div>
              {piiWarnings.warnings.map((w: string, i: number) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--orange-strong)', opacity: 0.9, marginBottom: 4 }}>• {w}</div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 1. Header (Already rendered above) */}

      {/* 2. AI Diagnostic Panel (MOVED TO TOP) */}
      {audit.aiVerdicts ? (
        <div className="fade-up delay-1" style={{ marginBottom: 28 }}>
            <ModelConsensusPanel
            verdicts={audit.aiVerdicts}
            latencies={audit.aiLatencies}
            boardMode={boardMode}
            onToggleBoardMode={() => setBoardMode(!boardMode)}
            boardSummary={audit.boardSummary}
            synthesizedRootCause={audit.synthesizedRootCause || audit.rootCause}
            consensusLevel={(audit as any).consensusLevel as any}
            />
        </div>
      ) : (
        <div className="card fade-up delay-1" style={{ marginBottom: 28, borderLeft: `4px solid ${isGuilty ? 'var(--red)' : 'var(--green)'}` }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: 'var(--navy)' }}>AI Diagnostic</h3>
          <p style={{ fontSize: 15, color: 'var(--slate)', lineHeight: 1.7 }}>{audit.aiVerdict}</p>
        </div>
      )}

      {/* 3. Metrics (BiasMetricBars) */}
      {!boardMode && (
        <div className="fade-up delay-1" style={{ marginBottom: 28 }}>
          {audit.metrics && <BiasMetricBars metrics={audit.metrics as any} />}
        </div>
      )}

      {/* 3. Intersectional Radar */}
      {!boardMode && (() => {
        const intersectional = (audit as any).intersectional
        if (!intersectional) return null
        return (
          <div className="fade-up delay-1" style={{ marginBottom: 28 }}>
            <IntersectionalRadar data={intersectional} />
          </div>
        )
      })()}

      {/* 4. Per-Attribute Analysis */}
      {!boardMode && Object.keys(byAttr).length > 0 && (
        <div className="fade-up delay-2" style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: 'var(--slate)', marginBottom: 16, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
            Per-Attribute Analysis
          </div>
          {Object.entries(byAttr).map(([attr, data]: [string, any]) => (
            <div key={attr} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--navy)', textTransform: 'capitalize' }}>{attr}</div>
                {data.disparate_impact_ratio !== undefined && (
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                    background: data.disparate_impact_ratio < 0.8 ? 'var(--red-dim)' : 'var(--green-dim)',
                    color: data.disparate_impact_ratio < 0.8 ? 'var(--red-strong)' : 'var(--green-strong)',
                    border: `1px solid ${data.disparate_impact_ratio < 0.8 ? 'var(--red)' : 'var(--green)'}`,
                  }}>
                    DI Ratio: {Number(data.disparate_impact_ratio).toFixed(3)}{' '}
                    {data.disparate_impact_ratio < 0.8 ? '✗ Fails 4/5' : '✓ Passes 4/5'}
                  </span>
                )}
              </div>

              {(data.reference_group || data.most_disadvantaged_group) && (
                <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13 }}>
                  {data.reference_group && (
                    <span style={{ color: 'var(--slate)' }}>
                      Reference: <strong>{data.reference_group}</strong>
                    </span>
                  )}
                  {data.most_disadvantaged_group && (
                    <span style={{ color: 'var(--red)' }}>
                      Most affected: <strong>{data.most_disadvantaged_group}</strong>
                    </span>
                  )}
                </div>
              )}

              {data.approval_rates && typeof data.approval_rates === 'object' && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    Approval Rates by Group
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                    {Object.entries(data.approval_rates).map(([group, rate]: [string, any]) => {
                      const pct = (Number(rate) * 100).toFixed(1)
                      return (
                        <div key={group} style={{
                          background: '#f8fafc', borderRadius: 8, padding: '10px 12px',
                          border: '1px solid var(--border)',
                        }}>
                          <div style={{ fontSize: 11, color: 'var(--slate)', marginBottom: 4 }}>{group}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', fontFamily: 'DM Mono, monospace' }}>{pct}%</div>
                          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--teal)', borderRadius: 2 }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 5. Proxy Features (Heatmap + List) */}
      {!boardMode && (() => {
        const fi = (audit.metrics as any)?.feature_importance
        const cm = fi?.correlation_matrix
        if (!cm || Object.keys(cm).length < 2) return null
        return (
          <ProxyHeatmap
            auditId={audit.id ?? ''}
            correlationMatrix={cm}
            proxyFeatures={fi.proxy_features || []}
            proxyThreshold={fi.proxy_threshold_used || 0.15}
          />
        )
      })()}

      {/* 6. Flip Test */}
      {!boardMode && ft && (
        <div className="fade-up delay-2" style={{ marginBottom: 28 }}>
          <FlipTestCard data={ft as any} />
        </div>
      )}

      {/* (AI Diagnostic was moved to the top) */}

      {/* 8. Root Cause */}
      {!boardMode && !audit.synthesizedRootCause && audit.rootCause && (
        <div className="card fade-up delay-3" style={{ background: 'var(--orange-dim)', borderColor: 'var(--orange)', marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--orange-strong)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Root Cause Pathology
          </div>
          <p style={{ fontSize: 15, color: 'var(--orange-strong)', opacity: 0.9, lineHeight: 1.7, margin: 0 }}>{audit.rootCause}</p>
        </div>
      )}

      {/* 9. Auto-Mitigation Panel */}
      {!boardMode && (
        <div className="fade-up delay-4" style={{ marginBottom: 28 }}>
            <AutoMitigationPanel
            verdict={audit.verdict}
            metricsPayload={{ by_attribute: byAttr, fairness_score: audit.fairnessScore }}
            />
        </div>
      )}

      {/* 9.5 Auto-Debiasing Panel (F1 feature) */}
      {!boardMode && isGuilty && (
        <div className="fade-up delay-4" style={{ marginBottom: 28 }}>
          <DebiasPanel
            audit={audit}
            onReAudit={async (csvContent) => {
              // Stub for re-audit logic. The UI handles state and will reload.
              window.location.reload()
            }}
          />
        </div>
      )}

      {/* 10. Industry Benchmarks */}
      {!boardMode && (
        <div className="fade-up delay-4" style={{ marginBottom: 28 }}>
          <IndustryBenchmark score={audit.fairnessScore ?? 0} />
        </div>
      )}

      {/* 11. Detailed Report */}
      <div className="fade-up delay-4" style={{ marginBottom: 28 }}>
          <DetailedAuditReport audit={{ ...audit, byAttribute: byAttr, flipTest: ft }} />
      </div>

      {/* 12. Mitigation Sandbox */}
      {!boardMode && audit.mitigations && audit.mitigations.length > 0 && (
        <div className="fade-up delay-5" style={{ marginBottom: 28 }}>
          <MitigationSandbox
            auditId={audit.id ?? ''}
            currentScore={audit.fairnessScore ?? 0}
            currentVerdict={audit.verdict ?? 'GUILTY'}
            metrics={{
              demographic_parity: (audit.metrics as any)?.demographic_parity ?? 0,
              equalized_odds: (audit.metrics as any)?.equalized_odds ?? 0,
              calibration_gap: (audit.metrics as any)?.calibration_gap ?? 0,
              individual_fairness: (audit.metrics as any)?.individual_fairness ?? 0,
              flip_rate: (audit as any).flipTest?.overall_flip_rate ?? 0,
            }}
            mitigations={audit.mitigations as any[]}
          />
        </div>
      )}

      {/* Human Feedback Panel */}
      <FeedbackPanel auditId={audit.id ?? ''} />
    </div>
  )
}

// ── Feedback Panel ──────────────────────────────────────────────────────────
function FeedbackPanel({ auditId }: { auditId: string }) {
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const submitFeedback = async (rating: 'positive' | 'negative', issue_type?: string) => {
    if (submitted || loading) return
    setLoading(true)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId, rating, issue_type: issue_type ?? null }),
      })
      setSubmitted(rating)
      showToast(rating === 'positive' ? '✓ Thank you for your feedback!' : '⚠ Feedback noted — we will improve.', rating === 'positive' ? 'success' : 'info')
    } catch {
      showToast('Could not submit feedback', 'error')
    } finally {
      setLoading(false)
    }
  }

  const ISSUES = [
    { key: 'severity', label: 'Incorrect severity' },
    { key: 'proxy', label: 'Incorrect proxy detection' },
    { key: 'mitigation', label: 'Unhelpful mitigations' },
    { key: 'explanation', label: 'Incorrect explanation' },
  ]

  return (
    <div className="card fade-up delay-5" style={{ marginTop: 24, border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
        Was this audit accurate?
      </div>
      {submitted ? (
        <div style={{ fontSize: 14, color: submitted === 'positive' ? 'var(--teal)' : 'var(--slate)', fontWeight: 600 }}>
          {submitted === 'positive' ? '✓ Marked as helpful' : '✓ Feedback recorded'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            onClick={() => submitFeedback('positive')}
            disabled={loading}
            className="btn btn-teal"
            style={{ padding: '8px 16px', fontSize: 13 }}
          >
            👍 Helpful
          </button>
          {ISSUES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => submitFeedback('negative', key)}
              disabled={loading}
              className="btn btn-outline"
              style={{ padding: '8px 14px', fontSize: 12 }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}