'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, BarChart2 } from 'lucide-react'

interface IndexItem {
  id: string
  name: string
  domain: string
  domain_color: string
  fairness_score: number | null
  verdict: string | null
  available: boolean
}

export function FairnessIndexWidget() {
  const [index, setIndex] = useState<IndexItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/benchmark?action=index')
      .then(r => r.json())
      .then(d => {
        if (d.index) setIndex(d.index)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="card fade-up" style={{ padding: 24, textAlign: 'center', color: 'var(--slate)' }}>
         <Activity size={24} style={{ animation: 'spin 2s linear infinite', margin: '0 auto 12px' }} />
         <div style={{ fontSize: 13 }}>Syncing Global Index...</div>
      </div>
    )
  }

  // Calculate average score for available items
  const validScores = index.filter(i => i.fairness_score !== null).map(i => i.fairness_score as number)
  const avg = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0

  return (
    <div className="card fade-up" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart2 size={18} color="var(--teal)" />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live AI Fairness Index
          </h3>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', fontFamily: 'Space Grotesk, sans-serif' }}>
          {avg}/100
        </div>
      </div>

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {index.slice(0, 4).map(item => (
           <Link href={`/benchmark-lab/${item.id}`} key={item.id} style={{ display: 'block', textDecoration: 'none' }} className="hover-lift">
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
               <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{item.domain}</span>
               <span style={{ fontSize: 13, fontWeight: 700, color: item.fairness_score && item.fairness_score < 70 ? 'var(--red)' : 'var(--slate)', fontFamily: 'DM Mono, monospace' }}>
                 {item.fairness_score ? `${item.fairness_score}` : '--'}
               </span>
             </div>
             {/* Progress Bar */}
             <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
               {item.fairness_score && (
                 <div style={{ 
                   height: '100%', 
                   width: `${item.fairness_score}%`, 
                   background: item.fairness_score < 60 ? 'var(--red)' : item.fairness_score < 80 ? 'var(--amber)' : 'var(--green)',
                   transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                 }} />
               )}
             </div>
           </Link>
        ))}
      </div>
      
      <div style={{ background: '#f8fafc', padding: '12px 24px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <Link href="/fairness-index" style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', textDecoration: 'none', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          View Global Index →
        </Link>
      </div>
    </div>
  )
}
