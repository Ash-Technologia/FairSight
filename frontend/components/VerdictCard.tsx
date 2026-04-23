'use client'
import { AuditRecord } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface VerdictCardProps {
  audit: AuditRecord
  onDelete?: (id: string) => void
}

export function VerdictCard({ audit, onDelete }: VerdictCardProps) {
  const router = useRouter()
  const guilty = audit.verdict === 'GUILTY'
  const score = audit.fairnessScore ?? 0

  const hasMultiModel = audit.aiVerdicts && Object.keys(audit.aiVerdicts).length > 1
  const activeModels = hasMultiModel 
    ? [
        audit.aiVerdicts?.groq ? '⚡' : null,
        audit.aiVerdicts?.gemini ? '✨' : null,
        audit.aiVerdicts?.ollama ? '🏠' : null,
        (audit.aiVerdicts as any)?.huggingface ? '🦙' : null,
      ].filter(Boolean)
    : []

  const isStrong = audit.consensusLevel === 'strong'
  const isPartial = audit.consensusLevel === 'partial'

  return (
    <div
      className="card fade-up hover-lift"
      style={{
        borderLeft: `3px solid ${guilty ? '#dc2626' : '#0d9488'}`,
        cursor: 'pointer',
        padding: '20px',
      }}
      onClick={() => router.push(`/audit/${audit.id}`)}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 4, fontFamily: 'DM Mono, monospace' }}>
            #{typeof audit.id === 'string' ? audit.id.slice(0, 8).toUpperCase() : 'UNKNOWN'}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0f1f35' }}>{audit.filename}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span
            className={`badge badge-${guilty ? 'guilty' : 'clear'}`}
            style={{ flexShrink: 0, marginLeft: 10 }}
          >
            {audit.verdict}
          </span>
          {hasMultiModel && (
            <span style={{ 
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', 
              background: isStrong ? '#f0fdf4' : isPartial ? '#fffbeb' : '#fef2f2',
              color: isStrong ? '#15803d' : isPartial ? '#b45309' : '#b91c1c',
              border: `1px solid ${isStrong ? 'rgba(34,197,94,0.3)' : isPartial ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
              padding: '2px 8px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4
            }}>
              {isStrong ? '✓ 3/3 Agree' : isPartial ? '⚠ 2/3 Agree' : '✕ Split Verdict'}
            </span>
          )}
          
          {onDelete && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(audit.id);
              }}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              title="Delete report"
              onMouseEnter={(e) => (e.currentTarget.style.color = '#dc2626')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <Trash2 size={16} />
            </button>
          )}

        </div>
      </div>

      {/* AI Verdict snippet */}
      <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
        {audit.aiVerdict
          ? audit.aiVerdict.slice(0, 130) + (audit.aiVerdict.length > 130 ? '...' : '')
          : 'No AI verdict available.'}
      </p>

      {/* Fairness score bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>Fairness Score</span>
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: score >= 70 ? '#0d9488' : score >= 40 ? '#f59e0b' : '#dc2626' }}>
            {score}/100
          </span>
        </div>
        <div className="progress-track" style={{ height: 6 }}>
          <div
            className="progress-fill"
            style={{
              width: `${score}%`,
              background: score >= 70 ? '#0d9488' : score >= 40 ? '#f59e0b' : '#dc2626'
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border)', paddingTop: 16, marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasMultiModel && (
            <div style={{ display: 'flex', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 6px', fontSize: 12 }}>
              {activeModels.map((icon, i) => <span key={i}>{icon}</span>)}
            </div>
          )}
          <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'DM Mono, monospace' }}>
            {audit.createdAt ? new Date(audit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
          </span>
        </div>
        <span style={{ fontSize: 11, color: '#0d9488', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>View Report →</span>
      </div>
    </div>
  )
}
