'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, AlertTriangle, ExternalLink } from 'lucide-react'
import { ModelConsensusPanel } from '@/components/ModelConsensusPanel'
import { BiasMetricBars } from '@/components/BiasMetricBars'
import { IntersectionalRadar } from '@/components/IntersectionalRadar'
import { FlipTestCard } from '@/components/FlipTestCard'
import { AutoMitigationPanel } from '@/components/AutoMitigationPanel'
import { IndustryBenchmark } from '@/components/IndustryBenchmark'
import { DetailedAuditReport } from '@/components/DetailedAuditReport'
import { FairnessScore } from '@/components/FairnessScore'

export default function BenchmarkResultPage({ params }: { params: { id: string } }) {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [boardMode, setBoardMode] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadResult = async () => {
      // First try sessionStorage (fast — set by lab page on first load)
      const cached = sessionStorage.getItem(`benchmark_${params.id}`)
      if (cached) {
        try {
          setResult(JSON.parse(cached))
          setLoading(false)
          return
        } catch {
          // Corrupted cache — fall through to API
        }
      }

      // FIX C6: sessionStorage was lost (refresh / direct link / back-nav).
      // Re-trigger the full benchmark audit via the API so the page always recovers.
      // This makes direct links shareable and the page refresh-safe.
      try {
        const metricsRes = await fetch(`/api/benchmark?id=${params.id}`, { method: 'POST' })
        if (!metricsRes.ok) {
          const err = await metricsRes.json()
          setError(err.error || 'Backend audit failed — ensure the backend is running.')
          setLoading(false)
          return
        }
        const metricsData = await metricsRes.json()

        // Re-run AI consensus with the recovered metrics
        const verdictRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metrics: metricsData.metrics,
            filename: metricsData.filename,
            uid: 'guest',
            feature_importance: metricsData.feature_importance,
            flip_test: metricsData.flip_test,
            row_count: metricsData.row_count,
            protected_attributes: metricsData.protected_attributes,
            dataset_hash: metricsData.dataset_hash,
          }),
        })
        const verdictData = verdictRes.ok ? await verdictRes.json() : {}

        const fullResult = {
          ...metricsData,
          aiVerdicts: verdictData.verdicts ?? null,
          auditId: verdictData.auditId ?? null,
        }
        // Re-cache for subsequent navigation
        sessionStorage.setItem(`benchmark_${params.id}`, JSON.stringify(fullResult))
        setResult(fullResult)
      } catch (e: any) {
        setError(e.message || 'Failed to load benchmark data.')
      } finally {
        setLoading(false)
      }
    }

    loadResult()
  }, [params.id])

  if (loading) {
    return (
      <div className="page-container-narrow fade-up" style={{ textAlign: 'center', paddingTop: 100 }}>
        <div style={{ color: 'var(--slate)', fontSize: 15 }}>Re-loading benchmark audit…</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="page-container-narrow fade-up" style={{ textAlign: 'center', paddingTop: 100 }}>
        <div style={{ background: '#fef2f2', border: '1px solid rgba(239,68,68,0.2)', padding: '48px 40px', borderRadius: 20 }}>
          <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontWeight: 700, color: '#dc2626', fontSize: 20, marginBottom: 8 }}>Benchmark Data Not Found</div>
          <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 24 }}>
            {error || 'Please return to the Benchmark Lab and run the audit again.'}
          </p>
          <Link href="/benchmark-lab" className="btn btn-teal">Return to Lab</Link>
        </div>
      </div>
    )
  }


  // Construct AuditRecord shaped object for the components
  const score = result.metrics?.fairness_score || 0
  const verdict = result.metrics?.overall_verdict || 'UNKNOWN'
  const isGuilty = verdict === 'GUILTY'
  const byAttr = result.metrics?.by_attribute || {}
  const ft = result.flip_test
  const aiVerdicts = result.aiVerdicts

  const auditRecord = {
    id: `bench-${result.dataset_hash?.slice(0,8)}`,
    verdict,
    fairnessScore: score,
    filename: result.filename,
    createdAt: new Date().toISOString(),
    datasetHash: result.dataset_hash,
    rowCount: result.row_count,
    protectedColumns: result.protected_attributes,
    metrics: result.metrics,
    flipTest: ft,
    // Provide a synthetic root cause if missing
    synthesizedRootCause: aiVerdicts?.gemini?.summary || `Benchmark analysis completed for ${result.dataset_name}.`,
    // Optional ai parts
    aiVerdicts: aiVerdicts,
  }

  // ── PDF Export ─────────────────────────────────────────────────────────
  const printBenchmarkPDF = () => {
    if (!result) return
    setPdfLoading(true)
    try {
      const s = result.metrics?.fairness_score ?? 0
      const v = result.metrics?.overall_verdict ?? 'UNKNOWN'
      const attrs = (result.protected_attributes ?? []).join(', ') || 'N/A'
      const byAttrRows = Object.entries(result.metrics?.by_attribute ?? {})
        .map(([attr, m]: [string, any]) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600">${attr}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${(m.demographic_parity??0).toFixed(3)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${(m.equalized_odds??0).toFixed(3)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${(m.disparate_impact_ratio??0).toFixed(3)}</td>
          </tr>`).join('')

      const aiRows = Object.entries(result.aiVerdicts ?? {})
        .filter(([, vd]: any) => vd)
        .map(([model, vd]: [string, any]) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-transform:capitalize;font-weight:600">${model}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${vd.verdict ?? '—'}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${vd.severity ?? '—'}</td>
          </tr>`).join('')

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>FairSight Benchmark Report — ${result.dataset_name ?? params.id}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Inter',system-ui,sans-serif;color:#0f172a;padding:48px;font-size:14px;line-height:1.5}
    h1{font-size:28px;font-weight:800;margin-bottom:4px;letter-spacing:-0.02em}
    h2{font-size:17px;font-weight:700;margin:32px 0 12px;color:#0f172a;border-bottom:2px solid #e2e8f0;padding-bottom:8px}
    .badge{display:inline-block;padding:4px 14px;border-radius:100px;font-weight:700;font-size:13px}
    .guilty{background:#fef2f2;color:#dc2626;border:1px solid #fca5a5}
    .clear{background:#f0fdf4;color:#16a34a;border:1px solid #86efac}
    .score{font-size:72px;font-weight:900;font-family:monospace;letter-spacing:-0.04em}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th{background:#f8fafc;padding:10px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b;letter-spacing:.05em;border-bottom:2px solid #e2e8f0}
    .footer{margin-top:56px;padding-top:16px;border-top:2px solid #e2e8f0;font-size:11px;color:#94a3b8;display:flex;justify-content:space-between}
    @media print{body{padding:32px}}
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
    <div>
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#64748b;margin-bottom:8px">
        FairSight · AI Fairness Benchmark Report
      </div>
      <h1>${result.dataset_name ?? params.id}</h1>
      <div style="font-size:13px;color:#64748b;margin-top:6px">
        ${result.domain ?? ''} &nbsp;·&nbsp; ${result.row_count?.toLocaleString() ?? '?'} rows
        &nbsp;·&nbsp; Protected: ${attrs}
        &nbsp;·&nbsp; <code style="font-size:11px">${result.dataset_hash?.slice(0,12)}</code>
      </div>
    </div>
    <div style="text-align:right">
      <div class="score" style="color:${s>=70?'#16a34a':s>=40?'#d97706':'#dc2626'}">${s}</div>
      <div style="font-size:12px;color:#64748b;margin-top:2px">/100 Fairness Score</div>
      <div style="margin-top:10px">
        <span class="badge ${v==='GUILTY'?'guilty':'clear'}">${v}</span>
      </div>
    </div>
  </div>

  <h2>Known Research Finding</h2>
  <blockquote style="border-left:4px solid #0d9488;padding:12px 20px;background:#f0fdfa;font-size:15px;font-style:italic;color:#134e4a">
    "${result.known_finding ?? 'No finding available.'}"
  </blockquote>
  <div style="font-size:12px;color:#64748b;margin-top:10px">
    <strong>Source:</strong> ${result.source ?? 'N/A'}<br>
    <strong>Citation:</strong> ${result.citation ?? 'N/A'}
  </div>

  <h2>Fairness Metrics</h2>
  <table>
    <thead><tr>
      <th>Protected Attribute</th>
      <th style="text-align:center">Demo. Parity</th>
      <th style="text-align:center">Equal. Odds</th>
      <th style="text-align:center">Disp. Impact</th>
    </tr></thead>
    <tbody>${byAttrRows || '<tr><td colspan="4" style="padding:16px;color:#94a3b8">No attribute data available</td></tr>'}</tbody>
  </table>
  <div style="font-size:11px;color:#94a3b8;margin-top:6px">
    Thresholds: Demo. Parity &lt;0.10 | Equal. Odds &lt;0.10 | Disp. Impact ≥0.80 (EEOC 80% rule)
  </div>

  ${aiRows ? `<h2>AI Consensus Verdicts (5-Model Panel)</h2>
  <table>
    <thead><tr><th>Model</th><th>Verdict</th><th>Severity</th></tr></thead>
    <tbody>${aiRows}</tbody>
  </table>` : ''}

  <div class="footer">
    <span>Generated by FairSight AI Fairness Auditing Platform</span>
    <span>${new Date().toLocaleString()}</span>
  </div>
</body>
</html>`

      const w = window.open('', '_blank', 'width=900,height=700')
      if (w) {
        w.document.write(html)
        w.document.close()
        setTimeout(() => { w.print(); setPdfLoading(false) }, 600)
      } else {
        setPdfLoading(false)
        alert('Pop-up blocked. Please allow pop-ups for this site to export PDF.')
      }
    } catch (err) {
      setPdfLoading(false)
      console.error('[PDF]', err)
    }
  }

  return (

    <div className="page-container-narrow fade-up" style={{ paddingBottom: 80 }}>
      {/* Back nav & CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Link href="/benchmark-lab" className="btn btn-outline" style={{ fontSize: 13, padding: '8px 14px', gap: 6 }}>
          <ArrowLeft size={14} /> Benchmark Lab
        </Link>
        
        <Link href="/audit" className="btn btn-teal" style={{ fontSize: 13, padding: '8px 14px', gap: 6 }}>
           Audit Your Own Model <ExternalLink size={14} />
        </Link>
      </div>

      {/* Context Banner */}
      <div className="card" style={{ background: 'var(--teal-dim)', border: '1px solid var(--teal-light)', marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, fontWeight: 800, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          <BookOpen size={14} /> Research Context
        </div>
        <div style={{ fontSize: 18, color: '#134e4a', fontWeight: 600, lineHeight: 1.5, marginBottom: 12, fontStyle: 'italic' }}>
          "{result.known_finding}"
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#115e59' }}>
          <div><strong>Source:</strong> {result.source}</div>
          <div><strong>Citation:</strong> {result.citation}</div>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>{result.domain} Benchmark</div>
          <h1 style={{ fontSize: 38, fontWeight: 800, color: 'var(--navy)', margin: '0 0 12px', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
            Verdict:{' '}
            <span style={{ color: isGuilty ? 'var(--red)' : 'var(--green)' }}>{verdict}</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 14, color: 'var(--slate)' }}>
            <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{result.dataset_name}</span>
            <span>•</span>
            <span>{result.row_count.toLocaleString()} rows</span>
            <span>•</span>
            <span className="mono">hash:{result.dataset_hash?.slice(0,8)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          <FairnessScore score={score} size="lg" />
          <button
            onClick={() => setBoardMode(!boardMode)}
            className={`btn ${boardMode ? 'btn-teal' : 'btn-outline'}`}
            style={{ padding: '7px 14px', fontSize: 12 }}
          >
            {boardMode ? '📉 Tech View' : '📋 Board View'}
          </button>
          <button
            id="btn-pdf-export"
            onClick={printBenchmarkPDF}
            disabled={pdfLoading}
            style={{
              padding: '7px 14px', fontSize: 12,
              background: pdfLoading ? 'var(--slate)' : 'var(--navy)',
              color: '#fff', border: 'none', borderRadius: 8,
              fontWeight: 700, cursor: pdfLoading ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {pdfLoading ? '⏳ Generating…' : '📄 Export PDF Report'}
          </button>
        </div>
      </div>

      {/* Dynamic Report Content */}
      
      {/* 1. AI Consensus Panel */}
      {aiVerdicts && (
        <div style={{ marginBottom: 28 }}>
          <ModelConsensusPanel
            verdicts={aiVerdicts}
            boardMode={boardMode}
            onToggleBoardMode={() => setBoardMode(!boardMode)}
            synthesizedRootCause={auditRecord.synthesizedRootCause}
          />
        </div>
      )}

      {/* 2. Metrics Bars */}
      {!boardMode && (
        <div style={{ marginBottom: 28 }}>
          <BiasMetricBars metrics={result.metrics} />
        </div>
      )}

      {/* 3. Intersectional Radar */}
      {!boardMode && result.metrics?.intersectional && (
        <div style={{ marginBottom: 28 }}>
          <IntersectionalRadar data={result.metrics.intersectional} />
        </div>
      )}

      {/* 4. Flip Test */}
      {!boardMode && ft && (
        <div style={{ marginBottom: 28 }}>
          <FlipTestCard data={ft} />
        </div>
      )}

      {/* 5. Detailed Report */}
      <div style={{ marginBottom: 28 }}>
         <DetailedAuditReport audit={{ ...auditRecord, byAttribute: byAttr, flipTest: ft } as any} />
      </div>

      {/* 6. Industry Benchmark */}
      {!boardMode && (
        <div style={{ marginBottom: 28 }}>
          <IndustryBenchmark score={score} />
        </div>
      )}

    </div>
  )
}
