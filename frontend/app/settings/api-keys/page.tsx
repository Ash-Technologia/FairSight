'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/components/Toast'
import { Key, Plus, Trash2, Copy, Eye, EyeOff, AlertTriangle, Code } from 'lucide-react'
import { DevHubModal } from '@/components/DevHubModal'

interface ApiKey {
  id: string
  label: string
  key_prefix: string
  created_at: string
  last_used: string | null
  revoked: boolean
  monthly_quota: number
  events_this_month: number
  full_key?: string  // Only present immediately after generation
}

export default function ApiKeysPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const uid = user?.uid ?? 'guest'

  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [generating, setGenerating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [showDevHub, setShowDevHub] = useState(false)

  const load = () => {
    fetch(`/api/keys?uid=${uid}`).then(r => r.json()).then(setKeys).catch(() => {})
  }

  useEffect(() => { load() }, [uid])

  const handleGenerate = async () => {
    setGenerating(true)
    setNewKey(null)
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, label: newLabel || 'Production' }),
      })
      const data = await res.json()
      setNewKey(data.full_key)
      setNewLabel('')
      load()
    } catch {
      showToast('Failed to generate key', 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this key? This cannot be undone.')) return
    await fetch(`/api/keys?id=${id}`, { method: 'DELETE' })
    showToast('Key revoked', 'success')
    load()
  }

  const copy = (text: string) => { navigator.clipboard.writeText(text); showToast('Copied!', 'success') }

  return (
    <div className="page-container-narrow fade-up">
      <div style={{ marginBottom: 40 }}>
        <div className="label">Settings</div>
        <h1 className="section-title" style={{ fontSize: 36, marginTop: 8 }}>API Keys</h1>
        <p style={{ color: 'var(--slate)', fontSize: 15, lineHeight: 1.6, marginTop: 8 }}>
          Generate API keys to authenticate your SDK integrations. Keys validate requests to <code>/sdk/ingest</code> and track monthly usage.
        </p>
      </div>

      {/* New key revealed banner */}
      {newKey && (
        <div style={{ padding: '16px 20px', borderRadius: 12, marginBottom: 24, background: 'rgba(245,158,11,0.08)', border: '1.5px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={16} color="#f59e0b" />
            <span style={{ fontWeight: 700, color: '#d97706', fontSize: 14 }}>Your API key will only be shown once. Copy it now.</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <code style={{ flex: 1, padding: '10px 14px', background: '#0f172a', color: '#f8fafc', borderRadius: 8, fontSize: 13, fontFamily: 'DM Mono, monospace', letterSpacing: '0.03em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {revealed ? newKey : newKey.slice(0, 12) + '•'.repeat(newKey.length - 12)}
            </code>
            <button onClick={() => setRevealed(r => !r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)' }}>
              {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button onClick={() => copy(newKey)} className="btn btn-teal" style={{ padding: '8px 14px', gap: 6, display: 'flex', alignItems: 'center' }}>
              <Copy size={14} /> Copy
            </button>
            <button onClick={() => setNewKey(null)} className="btn btn-outline" style={{ padding: '8px 12px' }}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Generate new key */}
      <div className="card fade-up delay-1" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ padding: 10, background: 'rgba(13,148,136,0.1)', borderRadius: 10 }}><Key size={20} color="var(--teal)" /></div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Generate New Key</h2>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text" placeholder="Label (e.g. Production, Staging)" value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14 }}
          />
          <button onClick={handleGenerate} disabled={generating} className="btn btn-teal" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> {generating ? 'Generating…' : 'Generate Key'}
          </button>
        </div>
      </div>

      {/* Keys table */}
      <div className="card fade-up delay-2" style={{ marginBottom: 32, overflowX: 'auto' }}>
        {keys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--slate)' }}>No API keys yet. Generate your first key above.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['Label', 'Key', 'Created', 'Last Used', 'Usage This Month', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', background: 'var(--bg)', fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 12px', fontWeight: 600, color: 'var(--navy)' }}>{k.label}</td>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <code style={{ fontSize: 12, fontFamily: 'DM Mono, monospace', color: 'var(--slate)' }}>{k.key_prefix}…</code>
                      <button onClick={() => copy(k.key_prefix)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate)', padding: 2 }}><Copy size={12} /></button>
                    </div>
                  </td>
                  <td style={{ padding: '12px 12px', color: 'var(--slate)', whiteSpace: 'nowrap' }}>{new Date(k.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 12px', color: 'var(--slate)' }}>{k.last_used ? new Date(k.last_used).toLocaleDateString() : 'Never'}</td>
                  <td style={{ padding: '12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 80, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (k.events_this_month / k.monthly_quota) * 100)}%`, background: 'var(--teal)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--slate)', whiteSpace: 'nowrap' }}>{k.events_this_month.toLocaleString()} / {k.monthly_quota.toLocaleString()}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 12px' }}>
                    <button onClick={() => handleRevoke(k.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
                      <Trash2 size={13} /> Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SDK snippet */}
      <div className="card fade-up delay-3" style={{ background: '#0f172a', borderColor: '#1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>SDK Integration</div>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>Generate live SDK drop-in snippets for Python, FastAPI, and Jupyter.</div>
        </div>
        <button onClick={() => setShowDevHub(true)} className="btn btn-teal" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontFamily: 'DM Mono, monospace' }}>
          <Code size={16} /> Quick Start
        </button>
      </div>

      {showDevHub && <DevHubModal apiKey={keys[0]?.full_key || (keys[0]?.key_prefix + '...')} onClose={() => setShowDevHub(false)} />}
    </div>
  )
}
