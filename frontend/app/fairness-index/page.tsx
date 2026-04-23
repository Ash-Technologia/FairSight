'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart2, Activity, Shield, AlertTriangle, CheckCircle, Search } from 'lucide-react'

export default function FairnessIndexPage() {
  const [index, setIndex] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/benchmark?action=index')
      .then(r => r.json())
      .then(d => {
        if (d.index) {
          // Sort by lowest fairness score first (meaning worst biased at the top)
          const sorted = d.index.sort((a: any, b: any) => {
            if (a.fairness_score === null && b.fairness_score === null) return 0
            if (a.fairness_score === null) return 1
            if (b.fairness_score === null) return -1
            return a.fairness_score - b.fairness_score
          })
          setIndex(sorted)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="page-container" style={{ maxWidth: 1000, paddingBottom: 100 }}>
      <div className="fade-up" style={{ marginBottom: 40, textAlign: 'center' }}>
        <div className="label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <BarChart2 size={14} /> Global Taxonomy
        </div>
        <h1 className="section-title" style={{ fontSize: 44, margin: '0 0 12px' }}>AI Fairness Index</h1>
        <p style={{ color: 'var(--slate)', fontSize: 16, lineHeight: 1.6, maxWidth: 640, margin: '0 auto' }}>
          A live, standardized ranking of predictive bias across open-source benchmarking datasets. 
          We run a continuous evaluation of demographic parity, equalized odds, and intersectional gaps.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--slate)' }}>
          <Activity size={32} style={{ animation: 'spin 2s linear infinite', margin: '0 auto 16px' }} />
          Calculating Global Index...
        </div>
      ) : (
        <div className="card fade-up delay-1" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '16px 24px', fontWeight: 700 }}>Dataset</th>
                <th style={{ padding: '16px 24px', fontWeight: 700 }}>Domain</th>
                <th style={{ padding: '16px 24px', fontWeight: 700 }}>Verdict</th>
                <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'right' }}>Fairness Score</th>
              </tr>
            </thead>
            <tbody>
              {index.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--white)' : 'var(--bg)' }}>
                  <td style={{ padding: '20px 24px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 15, marginBottom: 4 }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--slate)', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.known_finding}
                    </div>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    <span style={{ fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 6, color: 'var(--navy)', fontWeight: 600 }}>
                      {item.domain}
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px' }}>
                    {item.verdict === 'GUILTY' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red)', fontSize: 13, fontWeight: 700 }}>
                        <AlertTriangle size={14} /> FAILED
                      </div>
                    ) : item.verdict === 'PASSED' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--green)', fontSize: 13, fontWeight: 700 }}>
                        <CheckCircle size={14} /> PASSED
                      </div>
                    ) : (
                      <div style={{ color: 'var(--slate)', fontSize: 13, fontWeight: 600 }}>UNAVAILABLE</div>
                    )}
                  </td>
                  <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                    {item.fairness_score ? (
                       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                         <div style={{ width: 60, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                           <div style={{ height: '100%', width: `${item.fairness_score}%`, background: item.fairness_score < 60 ? 'var(--red)' : item.fairness_score < 80 ? 'var(--amber)' : 'var(--green)' }} />
                         </div>
                         <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', fontFamily: 'DM Mono, monospace', width: 30 }}>
                           {item.fairness_score}
                         </span>
                       </div>
                    ) : (
                      <Link href="/benchmark-lab" className="btn btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}>Generate</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
