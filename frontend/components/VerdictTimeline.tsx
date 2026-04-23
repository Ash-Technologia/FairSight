import { useState } from 'react'
import { AuditRecord } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface VerdictTimelineProps {
  audits: AuditRecord[]
  onDelete?: (id: string) => void
}

type FilterMode = 'all' | 'guilty' | 'clear'

export function VerdictTimeline({ audits, onDelete }: VerdictTimelineProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterMode>('all')

  const filtered = audits.filter(a => {
    if (filter === 'all') return true
    return a.verdict === filter.toUpperCase()
  })

  // Calculate stats for tabs
  const allCount = audits.length
  const guiltyCount = audits.filter(a => a.verdict === 'GUILTY').length
  const clearCount = audits.filter(a => a.verdict === 'CLEAR').length

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header and filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>Verdict Timeline</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => setFilter('all')} 
            className="btn btn-outline" 
            style={{ padding: '6px 14px', fontSize: 12, borderColor: filter === 'all' ? 'var(--teal)' : 'var(--border)', color: filter === 'all' ? 'var(--teal)' : 'var(--slate)', background: filter === 'all' ? 'var(--teal-dim)' : 'transparent' }}
          >
            All <span style={{ opacity: 0.6, marginLeft: 4 }}>{allCount}</span>
          </button>
          <button 
            onClick={() => setFilter('guilty')} 
            className="btn btn-outline" 
            style={{ padding: '6px 14px', fontSize: 12, borderColor: filter === 'guilty' ? 'var(--red)' : 'var(--border)', color: filter === 'guilty' ? 'var(--red)' : 'var(--slate)', background: filter === 'guilty' ? 'var(--red-dim)' : 'transparent' }}
          >
            Guilty <span style={{ opacity: 0.6, marginLeft: 4 }}>{guiltyCount}</span>
          </button>
          <button 
            onClick={() => setFilter('clear')} 
            className="btn btn-outline" 
            style={{ padding: '6px 14px', fontSize: 12, borderColor: filter === 'clear' ? 'var(--green)' : 'var(--border)', color: filter === 'clear' ? 'var(--green)' : 'var(--slate)', background: filter === 'clear' ? '#f0fdf4' : 'transparent' }}
          >
            Clear <span style={{ opacity: 0.6, marginLeft: 4 }}>{clearCount}</span>
          </button>
        </div>
      </div>

      {/* Timeline List */}
      <div className="scroll-box" style={{ padding: '12px 16px', minHeight: 200, maxHeight: 400, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--slate)', fontSize: 14 }}>
            No decisions match this filter.
          </div>
        ) : (
          filtered.map((d, i) => {
            const isGuilty = d.verdict === 'GUILTY'
            const scoreColor = (d.fairnessScore ?? 0) >= 70 ? 'var(--green)' : (d.fairnessScore ?? 0) >= 40 ? 'var(--amber)' : 'var(--red)'
            
            return (
              <div 
                key={d.id} 
                className="hover-lift fade-up delay-1"
                style={{ display: 'flex', gap: 16, padding: '16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', borderRadius: 12, position: 'relative' }}
                onClick={() => router.push(`/audit/${d.id}`)}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {/* Icon */}
                <div style={{ 
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  background: isGuilty ? 'var(--red-dim)' : '#f0fdf4',
                  color: isGuilty ? 'var(--red)' : 'var(--green)',
                  border: `1px solid ${isGuilty ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`
                }}>
                  {isGuilty ? '⚠' : '✓'}
                </div>

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0, paddingRight: 40 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{d.filename}</div>
                    <div style={{ fontSize: 11, color: 'var(--slate)', fontFamily: 'DM Mono, monospace' }}>
                      {new Date(d.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: 13, color: 'var(--slate)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 8 }}>
                    {d.aiVerdict || 'AI diagnostic completed. View report for details.'}
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: 6, color: 'var(--slate)', fontWeight: 600, fontFamily: 'DM Mono, monospace' }}>
                      #{d.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span style={{ fontSize: 10, border: `1px solid ${scoreColor}40`, padding: '2px 8px', borderRadius: 6, color: scoreColor, fontWeight: 700, background: `${scoreColor}10` }}>
                      Score: {d.fairnessScore}/100
                    </span>
                    {d.flipTest?.flip_detected && (
                      <span style={{ fontSize: 10, background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                        FLIP DETECTED
                      </span>
                    )}
                    {d.aiVerdicts && Object.keys(d.aiVerdicts).length > 0 && (
                       <span style={{ fontSize: 10, background: 'rgba(139,92,246,0.1)', color: 'var(--purple)', border: '1px solid rgba(139,92,246,0.2)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                         MULTI-MODEL
                       </span>
                    )}
                  </div>
                </div>

                {/* Delete Button */}
                {onDelete && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(d.id);
                    }}
                    style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'var(--slate)', cursor: 'pointer', padding: 4 }}
                    title="Delete report"
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--slate)')}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
