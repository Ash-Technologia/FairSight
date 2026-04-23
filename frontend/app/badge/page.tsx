'use client'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/components/Toast'
import { Copy, ExternalLink } from 'lucide-react'

export default function BadgePage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const uid = user?.uid ?? 'demo-user'
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://fairsight.app'
  const badgeUrl = `${origin}/api/badge/${uid}`
  const htmlEmbed = `<img src="${badgeUrl}" alt="FairSight Fairness Score" />`
  const mdEmbed = `![FairSight Score](${badgeUrl})`

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    showToast(`${label} copied!`, 'success')
  }

  return (
    <div className="page-container-narrow fade-up">
      <div style={{ marginBottom: 40 }}>
        <div className="label">Settings</div>
        <h1 className="section-title" style={{ fontSize: 36, marginTop: 8 }}>Transparency Badge</h1>
        <p style={{ color: 'var(--slate)', fontSize: 15, lineHeight: 1.6, marginTop: 8 }}>
          Embed a live fairness badge on your website or in your GitHub README. It updates automatically whenever you run a new audit.
        </p>
      </div>

      {/* Live preview */}
      <div className="card fade-up delay-1" style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Live Preview</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={badgeUrl} alt="FairSight Badge" style={{ height: 28, borderRadius: 4, margin: '0 auto', display: 'block' }} />
        <p style={{ color: 'var(--slate)', fontSize: 12, marginTop: 12 }}>
          Updates live — reflects your most recent audit score
        </p>
        <a href={badgeUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--teal)', marginTop: 4 }}>
          View raw SVG <ExternalLink size={12} />
        </a>
      </div>

      {/* Embed codes */}
      {[
        { label: 'HTML Embed', code: htmlEmbed, lang: 'html' },
        { label: 'Markdown (GitHub README)', code: mdEmbed, lang: 'markdown' },
        { label: 'Direct URL', code: badgeUrl, lang: 'url' },
      ].map(({ label, code, lang }) => (
        <div key={lang} className="card fade-up delay-2" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            <button onClick={() => copy(code, label)} className="btn btn-outline" style={{ padding: '5px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Copy size={12} /> Copy
            </button>
          </div>
          <pre style={{ background: 'var(--navy)', color: '#e2e8f0', padding: '12px 14px', borderRadius: 8, fontSize: 12, overflowX: 'auto', margin: 0, fontFamily: 'DM Mono, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {code}
          </pre>
        </div>
      ))}

      <div className="card fade-up delay-3" style={{ background: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.2)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)', marginBottom: 8 }}>Score → Color Mapping</div>
        {[{ label: '80–100', color: '#22c55e', text: 'Green — Model passes fairness thresholds' }, { label: '60–79', color: '#f59e0b', text: 'Amber — Model has moderate bias concerns' }, { label: '0–59', color: '#ef4444', text: 'Red — Model has critical fairness violations' }].map(r => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: r.color }} />
            <strong style={{ fontSize: 13, color: 'var(--navy)', minWidth: 60 }}>{r.label}</strong>
            <span style={{ fontSize: 13, color: 'var(--slate)' }}>{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
