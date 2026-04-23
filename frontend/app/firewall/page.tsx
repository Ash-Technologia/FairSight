'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { Shield, Zap, AlertTriangle, CheckCircle, BarChart3, Clock, Terminal } from 'lucide-react'

const ATTRIBUTES = [
  { key: 'race',      label: 'Race / Ethnicity', options: ['White','African-American','Black','Hispanic','Asian','Other'] },
  { key: 'gender',    label: 'Gender',            options: ['Male','Female','Non-binary'] },
  { key: 'age_group', label: 'Age Group',         options: ['Under 30','30-39','40-49','50+'] },
  { key: 'sex',       label: 'Sex',               options: ['Male','Female'] },
]

interface LogEntry {
  status:               'ALLOWED' | 'BLOCKED'
  flip_detected:        boolean
  flipped_attributes:   string[]
  risk_score:           number
  risk_level:           string
  evidence:             any[]
  decision:             number
  confidence:           number
  protected_attributes: Record<string,string>
  timestamp:            number
  recommendation:       string
}

export default function FirewallPage() {
  const { user } = useAuth()

  // Form state
  const [decision,    setDecision]    = useState(0)
  const [confidence,  setConfidence]  = useState(0.61)
  const [attrs,       setAttrs]       = useState<Record<string,string>>({ race: 'Black', gender: 'Female' })
  const [loading,     setLoading]     = useState(false)
  const [lastResult,  setLastResult]  = useState<LogEntry | null>(null)
  const [log,         setLog]         = useState<LogEntry[]>([])
  const [stats,       setStats]       = useState({ total_intercepted: 0, total_blocked: 0, block_rate: 0, avg_risk_score: 0 })
  const [showJSON,    setShowJSON]    = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshStats = useCallback(async () => {
    try {
      const [statsRes, logRes] = await Promise.all([
        fetch('/api/firewall?action=stats'),
        fetch('/api/firewall?action=log'),
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (logRes.ok) {
        const data = await logRes.json()
        setLog(data.log || [])
      }
    } catch {}
  }, [])

  useEffect(() => {
    refreshStats()
    intervalRef.current = setInterval(refreshStats, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [refreshStats])

  const toggleAttr = (key: string) => {
    setAttrs(prev => {
      const next = { ...prev }
      if (key in next) delete next[key]
      else next[key] = ATTRIBUTES.find(a => a.key === key)?.options[0] || ''
      return next
    })
  }

  const setAttrVal = (key: string, val: string) => setAttrs(prev => ({ ...prev, [key]: val }))

  const intercept = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/firewall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          confidence,
          protected_attributes: attrs,
        }),
      })
      const data = await res.json()
      setLastResult(data)
      refreshStats()
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const curlExample = `curl -X POST http://localhost:8000/firewall/intercept \\
  -H "Content-Type: application/json" \\
  -d '{
    "decision": ${decision},
    "confidence": ${confidence},
    "protected_attributes": ${JSON.stringify(attrs)}
  }'`

  const BLOCKED = lastResult?.status === 'BLOCKED'

  return (
    <div className="page-container fade-up">
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(220,38,38,0.3)',
          }}>
            <Shield size={24} color="#fff" />
          </div>
          <div>
            <div className="label" style={{ color: '#dc2626', marginBottom: 2 }}>Enterprise Infrastructure</div>
            <h1 className="text-gradient gradient-primary" style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              Fairness Firewall
            </h1>
          </div>
        </div>
        <p style={{ color: 'var(--slate)', fontSize: 15, maxWidth: 640, lineHeight: 1.6 }}>
          Intercept live model decisions before they reach end-users. The Firewall runs a counterfactual
          flip test on every decision — if flipping the protected attribute changes the outcome,
          the decision is <strong>automatically quarantined</strong> for human review.
        </p>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
        marginBottom: 32,
      }}>
        {[
          { label: 'Total Intercepted', value: stats.total_intercepted, icon: Zap,         color: 'var(--teal)' },
          { label: 'Decisions Blocked', value: stats.total_blocked,     icon: AlertTriangle, color: '#dc2626'      },
          { label: 'Block Rate',        value: `${stats.block_rate}%`,  icon: BarChart3,    color: '#f59e0b'      },
          { label: 'Avg Risk Score',    value: stats.avg_risk_score,    icon: Shield,       color: 'var(--purple)'},
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{
            background: 'var(--white)', borderRadius: 16, padding: '20px 24px',
            border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon size={14} color={color} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
        {/* LEFT: Submission Form */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>
              Decision Payload
            </div>

            {/* Decision */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Model Decision
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ val: 1, label: 'APPROVED / HIRED', color: '#22c55e' }, { val: 0, label: 'REJECTED / DENIED', color: '#ef4444' }].map(opt => (
                  <button key={opt.val} onClick={() => setDecision(opt.val)} style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${decision === opt.val ? opt.color : 'var(--border)'}`,
                    background: decision === opt.val ? `${opt.color}15` : 'var(--bg)',
                    color: decision === opt.val ? opt.color : 'var(--slate)',
                    fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Model Confidence
                </label>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)' }}>{(confidence * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min={0.50} max={0.99} step={0.01} value={confidence}
                onChange={e => setConfidence(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--teal)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--slate)', marginTop: 4 }}>
                <span>50% (Boundary)</span><span>99% (Certain)</span>
              </div>
            </div>

            {/* Protected Attributes */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Protected Attributes
              </label>
              {ATTRIBUTES.map(a => (
                <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <input type="checkbox" id={`attr-${a.key}`} checked={a.key in attrs}
                    onChange={() => toggleAttr(a.key)}
                    style={{ width: 16, height: 16, accentColor: 'var(--teal)', cursor: 'pointer' }} />
                  <label htmlFor={`attr-${a.key}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', flex: 1, cursor: 'pointer' }}>
                    {a.label}
                  </label>
                  {a.key in attrs && (
                    <select value={attrs[a.key]} onChange={e => setAttrVal(a.key, e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 13, background: 'var(--bg)', color: 'var(--navy)' }}>
                      {a.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  )}
                </div>
              ))}
            </div>

            <button onClick={intercept} disabled={loading || Object.keys(attrs).length === 0}
              className={`hover-lift ${!loading ? 'btn-pulse-red' : ''}`}
              style={{
                width: '100%', padding: 14, borderRadius: 12, border: 'none',
                background: loading ? 'var(--slate)' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'var(--white)', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {loading ? (
                <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--white)4', borderTop: '2px solid var(--white)', animation: 'spin 0.8s linear infinite' }} /> Intercepting…</>
              ) : (
                <><Shield size={16} /> Intercept Decision</>
              )}
            </button>
          </div>

          {/* cURL integration */}
          <div className="card" style={{ background: '#0a0f1a', borderColor: '#1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={14} color="#14b8a6" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Integration Example
                </span>
              </div>
            </div>
            <pre style={{ fontSize: 11, color: '#e2e8f0', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.8, fontFamily: "'DM Mono', monospace" }}>
              {curlExample}
            </pre>
          </div>
        </div>

        {/* RIGHT: Result + Log */}
        <div>
          {/* Last Result */}
          {lastResult && (
            <div style={{
              borderRadius: 16, padding: 24, marginBottom: 20,
              background: BLOCKED ? 'rgba(220,38,38,0.04)' : 'rgba(34,197,94,0.04)',
              border: `2px solid ${BLOCKED ? '#dc2626' : '#22c55e'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                {BLOCKED
                  ? <AlertTriangle size={28} color="#dc2626" />
                  : <CheckCircle  size={28} color="#22c55e" />}
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: BLOCKED ? '#dc2626' : '#16a34a' }}>
                    {lastResult.status}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>
                    Risk Level: <strong style={{ color: BLOCKED ? '#dc2626' : '#16a34a' }}>{lastResult.risk_level}</strong>
                    {' · '}Risk Score: <strong>{lastResult.risk_score}</strong>/100
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 13, color: 'var(--navy)', lineHeight: 1.6, marginBottom: 12 }}>
                {lastResult.recommendation}
              </div>

              {lastResult.evidence.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Flip Evidence
                  </div>
                  {lastResult.evidence.map((ev, i) => (
                    <div key={i} style={{
                      background: 'rgba(220,38,38,0.06)', borderRadius: 10, padding: '10px 14px',
                      border: '1px solid rgba(220,38,38,0.15)', marginBottom: 8,
                      fontSize: 12, color: 'var(--navy)',
                    }}>
                      <strong>{ev.attribute}:</strong> {ev.original_value} → {ev.counterfactual_value}<br/>
                      Decision: <strong style={{ color: '#dc2626' }}>{ev.original_decision}</strong> → <strong style={{ color: '#22c55e' }}>{ev.counterfactual_decision}</strong>
                      <span style={{ marginLeft: 8, color: 'var(--slate)', fontSize: 11 }}>(Bias mag: {ev.bias_magnitude})</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => setShowJSON(v => !v)}
                style={{ marginTop: 8, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 11, cursor: 'pointer', color: 'var(--slate)' }}>
                {showJSON ? 'Hide' : 'Show'} Raw JSON
              </button>
              {showJSON && (
                <pre style={{ marginTop: 10, fontSize: 10, background: 'var(--bg)', padding: 12, borderRadius: 8, overflow: 'auto', maxHeight: 200, color: '#1e293b' }}>
                  {JSON.stringify(lastResult, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Live Log */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg)'
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Live Interception Log ({log.length})
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate)' }}>Auto-refreshes every 5s</span>
            </div>
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {log.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--slate)', fontSize: 13 }}>
                  No decisions intercepted yet. Submit one above.
                </div>
              ) : log.map((entry, i) => (
                <div key={i} style={{
                  padding: '10px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: i % 2 === 0 ? 'var(--white)' : 'var(--bg)',
                }}>
                  <div style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                    background: entry.status === 'BLOCKED' ? '#fef2f2' : '#f0fdf4',
                    color: entry.status === 'BLOCKED' ? '#dc2626' : '#16a34a',
                    border: `1px solid ${entry.status === 'BLOCKED' ? '#fca5a5' : '#bbf7d0'}`,
                    flexShrink: 0,
                  }}>
                    {entry.status}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--navy)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {Object.entries(entry.protected_attributes).map(([k,v]) => `${k}=${v}`).join(', ')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--slate)' }}>
                      Risk: {entry.risk_level} · Score: {entry.risk_score}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--slate)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} /> {new Date(entry.timestamp * 1000).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}
