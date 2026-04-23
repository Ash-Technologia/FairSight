'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { ScanningOverlay } from '@/components/ScanningOverlay'
import { AlertTriangle, BookOpen, ChevronRight, Activity, Filter, Server } from 'lucide-react'

// Same interfaces defined in Prompt
interface BenchmarkDataset {
  id: string
  name: string
  domain: string
  domain_color: 'blue' | 'red' | 'teal' | 'amber'
  rows: number
  source: string
  citation: string
  protected_attributes: string[]
  bias_type: string
  known_finding: string
  tags: string[]
  description: string
  available: boolean
}

const DOMAIN_COLORS = {
  blue: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
  red: { bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5' },
  teal: { bg: '#ccfbf1', text: '#0f766e', border: '#99f6e4' },
  amber: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
}

export default function BenchmarkLab() {
  const [datasets, setDatasets] = useState<BenchmarkDataset[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  
  // Auditing States
  const [auditingId, setAuditingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    fetch('/api/benchmark')
      .then(r => r.json())
      .then(d => {
        if (d.datasets) setDatasets(d.datasets)
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [])

  const runBenchmarkAudit = async (datasetId: string) => {
    setAuditingId(datasetId)
    setErrorMsg('')
    try {
      // Step 1: Get statistical metrics from backend
      const metricsRes = await fetch(`/api/benchmark?id=${datasetId}`, { method: 'POST' })
      const metricsData = await metricsRes.json()
      
      if (!metricsRes.ok) {
        throw new Error(metricsData.error || 'Failed to analyze benchmark')
      }

      // Step 2: Get AI consensus
      const verdictRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: metricsData.metrics,
          filename: metricsData.filename,
          uid: user?.uid || 'guest',
        })
      })
      const result = await verdictRes.json()
      
      if (!verdictRes.ok) {
        throw new Error(result.error || 'Failed AI Consensus')
      }

      // Step 3: Merge and store
      const fullResult = { ...metricsData, aiVerdicts: result.verdicts, auditId: result.auditId }
      sessionStorage.setItem(`benchmark_${datasetId}`, JSON.stringify(fullResult))
      router.push(`/benchmark-lab/${datasetId}`)
    } catch (e: any) {
      console.error(e)
      setErrorMsg(e.message)
      setAuditingId(null)
    }
  }

  const domains = ['All', ...Array.from(new Set(datasets.map(d => d.domain)))]
  const filtered = filter === 'All' ? datasets : datasets.filter(d => d.domain === filter)

  if (auditingId) {
    return (
      <div className="page-container-narrow" style={{ paddingTop: 80 }}>
        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: 16, borderRadius: 12, color: '#b91c1c', marginBottom: 24 }}>
            <AlertTriangle size={18} style={{ display: 'inline', marginRight: 8 }} />
            {errorMsg}
          </div>
        )}
        <ScanningOverlay visible={true} />
      </div>
    )
  }

  return (
    <div className="page-container" style={{ maxWidth: 1000, paddingBottom: 100 }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 40, textAlign: 'center' }}>
        <div className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <Server size={14} /> Open-Source Library
        </div>
        <h1 className="section-title" style={{ fontSize: 44, margin: '0 0 12px' }}>Benchmark Lab</h1>
        <p style={{ color: 'var(--slate)', fontSize: 16, lineHeight: 1.6, maxWidth: 640, margin: '0 auto' }}>
          Evaluate the world's most important algorithmic bias cases live.
          No upload required. Click any dataset to run the full FairSight 12-metric diagnostic and multi-model AI consensus pipeline.
        </p>
      </div>

      {/* Filters */}
      <div className="fade-up delay-1" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 12, marginBottom: 24, justifyContent: 'center' }}>
        <Filter size={18} color="var(--slate)" style={{ alignSelf: 'center', marginRight: 8 }} />
        {domains.map(d => (
          <button
            key={d}
            onClick={() => setFilter(d)}
            className={`btn ${filter === d ? 'btn-teal' : 'btn-outline'}`}
            style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, flexShrink: 0 }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--slate)' }}>
          <Activity size={32} style={{ animation: 'spin 2s linear infinite', margin: '0 auto 16px' }} />
          Loading benchmarks...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
          {filtered.map((ds, i) => {
            const dc = DOMAIN_COLORS[ds.domain_color] || DOMAIN_COLORS['blue']
            
            return (
              <div key={ds.id} className={`card fade-up delay-${Math.min(i+2, 5)}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '28px 32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                    padding: '4px 12px', borderRadius: 8,
                    background: dc.bg, color: dc.text, border: `1px solid ${dc.border}`
                  }}>
                    {ds.domain}
                  </span>
                  <div style={{ fontSize: 12, color: 'var(--slate)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={14} /> {ds.rows.toLocaleString()} rows
                  </div>
                </div>

                <h3 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: 'var(--navy)', fontFamily: 'Space Grotesk, sans-serif' }}>
                  {ds.name}
                </h3>
                
                <p style={{ fontSize: 14, color: 'var(--slate)', lineHeight: 1.6, marginBottom: 16, flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {ds.description}
                </p>

                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    Known Research Finding
                  </div>
                  <div style={{ fontSize: 13, color: '#92400e', fontStyle: 'italic', fontWeight: 500, lineHeight: 1.5 }}>
                    "{ds.known_finding}"
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--slate)', fontWeight: 600, alignSelf: 'center' }}>Protected:</span>
                  {ds.protected_attributes.map(attr => (
                    <span key={attr} style={{ fontSize: 11, background: 'var(--bg)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 6, color: 'var(--navy)', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>
                      {attr}
                    </span>
                  ))}
                </div>

                {ds.available ? (
                  <button onClick={() => runBenchmarkAudit(ds.id)} className="btn btn-teal btn-full hover-lift" style={{ height: 48, fontSize: 15 }}>
                    Audit This Dataset <ChevronRight size={18} />
                  </button>
                ) : (
                   <div style={{ background: '#fef2f2', border: '1px dashed #fca5a5', borderRadius: 12, padding: '12px', textAlign: 'center', color: '#b91c1c', fontSize: 13, fontWeight: 600 }}>
                     Dataset Unavailable<br/>
                     <span style={{ fontSize: 11, fontWeight: 400 }}>Run backend/data/bootstrap.sh</span>
                   </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
