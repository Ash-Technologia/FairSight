'use client'
import { useState, useEffect, useCallback } from 'react'
import { VerdictCard } from '@/components/VerdictCard'
import { FairnessScore } from '@/components/FairnessScore'
import { DriftChart } from '@/components/DriftChart'
import { VerdictTimeline } from '@/components/VerdictTimeline'
import { FairnessIndexWidget } from '@/components/FairnessIndex'
import { useAuth } from '@/lib/AuthContext'
import { AuditRecord } from '@/lib/types'
import Link from 'next/link'
import {
  Server, Activity, AlertTriangle, Download, ShieldCheck, GitBranch,
  Scale, Swords, FlaskConical, Bell, BarChart2, ArrowRight, Clock,
  TrendingUp, TrendingDown, Zap, FileText, Eye, RefreshCw, Shield
} from 'lucide-react'

// ── Mini stat cards ──────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub, href }: {
  label: string; value: any; icon: any; color: string; sub?: string; href?: string
}) {
  const inner = (
    <div className="stat-card fade-up" style={{ cursor: href ? 'pointer' : 'default', transition: 'transform 0.15s', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--navy)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 6 }}>{sub}</div>}
      {href && <div style={{ position: 'absolute', bottom: 16, right: 16, fontSize: 11, color, fontWeight: 700 }}>View →</div>}
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner
}

// ── Quick action button ───────────────────────────────────────────────────────
function QuickAction({ icon: Icon, label, desc, href, color }: {
  icon: any; label: string; desc: string; href: string; color: string
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
        borderRadius: 14, border: '1.5px solid var(--border)', background: 'var(--white)',
        cursor: 'pointer', transition: 'all 0.18s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${color}20` }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={22} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>{label}</div>
          <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>{desc}</div>
        </div>
        <ArrowRight size={16} color="var(--slate)" />
      </div>
    </Link>
  )
}

// ── Live Monitor Pill ─────────────────────────────────────────────────────────
function LiveMonitorPill({ score, avgScore, totalAudits, flagged }: {
  score: number | null; avgScore: number; totalAudits: number; flagged: number
}) {
  return (
    <Link href="/monitor" style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '18px 28px',
        borderRadius: 16, border: '2px solid var(--teal)', background: 'var(--teal-dim)',
        cursor: 'pointer', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>LIVE MONITORING</span>
        </div>
        <div style={{ display: 'flex', gap: 24, flex: 1 }}>
          {[
            { label: 'Last Score', value: score != null ? `${score}/100` : '—' },
            { label: 'Session Avg', value: avgScore > 0 ? `${Math.round(avgScore)}/100` : '—' },
            { label: 'Total Audits', value: totalAudits },
            { label: 'Active Alerts', value: flagged, alert: flagged > 0 },
          ].map(({ label, value, alert }) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--slate)', fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: alert ? '#ef4444' : 'var(--navy)' }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 4 }}>
          Open Monitor <ArrowRight size={14} />
        </div>
      </div>
    </Link>
  )
}

// ── Constitution Status Widget ────────────────────────────────────────────────
function ConstitutionWidget({ uid }: { uid: string }) {
  const [rules, setRules] = useState<any[]>([])
  useEffect(() => {
    fetch(`/api/constitution?uid=${uid}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setRules(d) })
      .catch(() => {})
  }, [uid])

  const active = rules.filter(r => r.active).length
  return (
    <Link href="/constitution" style={{ textDecoration: 'none' }}>
      <div style={{
        padding: '18px 20px', borderRadius: 14, border: '1.5px solid var(--border)',
        background: 'var(--white)', cursor: 'pointer', transition: 'all 0.18s',
      }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#7c3aed'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Constitution</div>
          <Scale size={16} color="#7c3aed" />
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--navy)' }}>{active}</div>
        <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>
          {active === 0 ? 'No active rules — set constraints' : `active rule${active !== 1 ? 's' : ''} enforced`}
        </div>
        <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(active * 20, 100)}%`, height: '100%', background: '#7c3aed', borderRadius: 2, transition: 'width 0.6s' }} />
        </div>
      </div>
    </Link>
  )
}

// ── CI/CD Gate Widget ─────────────────────────────────────────────────────────
function CICDWidget({ uid }: { uid: string }) {
  const [gate, setGate] = useState<any>(null)
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:8000'
    fetch(`${backendUrl}/cicd/gate?uid=${uid}&threshold=80`)
      .then(r => r.json())
      .then(setGate)
      .catch(() => {})
  }, [uid])

  const passed = gate?.status === 'PASSED'
  const color = !gate ? 'var(--slate)' : passed ? '#22c55e' : '#ef4444'
  return (
    <Link href="/cicd" style={{ textDecoration: 'none' }}>
      <div style={{
        padding: '18px 20px', borderRadius: 14, border: `1.5px solid ${gate ? (passed ? '#bbf7d0' : '#fca5a5') : 'var(--border)'}`,
        background: gate ? (passed ? '#f0fdf4' : '#fef2f2') : 'var(--white)', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CI/CD Gate</div>
          <GitBranch size={16} color={color} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color }}>{gate ? gate.status : '—'}</div>
        <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>
          {gate ? `Score: ${gate.fairness_score}/100 · ${gate.passed_count ?? 0} checks passed` : 'No audit on record'}
        </div>
      </div>
    </Link>
  )
}

// ── Benchmark Snapshot ─────────────────────────────────────────────────────── 
function BenchmarkSnapshot() {
  const [datasets, setDatasets] = useState<any[]>([])
  useEffect(() => {
    fetch('/api/benchmark').then(r => r.json()).then(d => {
      if (d.datasets) setDatasets(d.datasets.slice(0, 3))
    }).catch(() => {})
  }, [])

  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FlaskConical size={16} color="var(--teal)" /> Benchmark Lab
        </div>
        <Link href="/benchmark-lab" style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 700, textDecoration: 'none' }}>View All →</Link>
      </div>
      {datasets.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--slate)', padding: '16px 0' }}>Loading benchmarks…</div>
      ) : datasets.map(d => (
        <Link key={d.id} href={`/benchmark-lab/${d.id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0', borderBottom: '1px solid var(--border)',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{d.name}</div>
              <div style={{ fontSize: 11, color: 'var(--slate)' }}>{d.domain} · {d.rows?.toLocaleString()} rows</div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: d.expected_verdict === 'GUILTY' ? '#fef2f2' : '#f0fdf4',
              color: d.expected_verdict === 'GUILTY' ? '#dc2626' : '#16a34a',
              border: `1px solid ${d.expected_verdict === 'GUILTY' ? '#fca5a5' : '#bbf7d0'}`,
            }}>{d.expected_verdict ?? 'UNKNOWN'}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ── Webhook Status Widget ─────────────────────────────────────────────────────
function WebhookWidget({ uid }: { uid: string }) {
  const [cfg, setCfg] = useState<any>(null)
  useEffect(() => {
    fetch(`/api/settings?uid=${uid}`)
      .then(r => r.json()).then(setCfg).catch(() => {})
  }, [uid])

  const hasUrl = cfg?.slack_url || cfg?.discord_url || cfg?.teams_url
  return (
    <Link href="/settings/integrations" style={{ textDecoration: 'none' }}>
      <div style={{
        padding: '18px 20px', borderRadius: 14, border: '1.5px solid var(--border)',
        background: 'var(--white)', cursor: 'pointer', transition: 'all 0.18s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Webhook Alerts</div>
          <Bell size={16} color={hasUrl ? '#22c55e' : 'var(--slate)'} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: hasUrl ? '#22c55e' : '#ef4444' }}>
          {cfg === null ? '—' : hasUrl ? 'Armed' : 'Not Set'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>
          {hasUrl ? `Threshold: ${cfg.bias_threshold ?? 70}/100` : 'Configure Slack / Discord alerts'}
        </div>
      </div>
    </Link>
  )
}

// ── Fairness Firewall Status ──────────────────────────────────────────────────
function FirewallWidget() {
  return (
    <Link href="/firewall" style={{ textDecoration: 'none' }}>
      <div style={{
        padding: '18px 20px', borderRadius: 14, border: '1.5px solid #fbbf24',
        background: '#fffbeb', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fairness Firewall</div>
          <Shield size={16} color="#d97706" />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>Active</div>
        <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>Real-time decision filtering</div>
      </div>
    </Link>
  )
}

// ── Sandbox Link ──────────────────────────────────────────────────────────────
function SandboxWidget() {
  return (
    <Link href="/sandbox" style={{ textDecoration: 'none' }}>
      <div style={{
        padding: '18px 20px', borderRadius: 14, border: '1.5px solid var(--indigo)',
        background: 'rgba(99,102,241,0.04)', cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Sandbox</div>
          <Swords size={16} color="var(--indigo)" />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--indigo)' }}>Test</div>
        <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>Counterfactual & bias simulation</div>
      </div>
    </Link>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [audits, setAudits] = useState<AuditRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [monitorScores, setMonitorScores] = useState<number[]>([])
  const [monitorStats, setMonitorStats] = useState<any>(null)
  const { user } = useAuth()
  const uid = user?.uid ?? 'guest'

  const loadAudits = useCallback(() => {
    fetch(`/api/verdict?uid=${uid}`)
      .then(r => r.json())
      .then(data => {
        setAudits(Array.isArray(data) ? data.sort((a, b) => b.createdAt - a.createdAt) : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [uid])

  const fetchMonitorData = useCallback(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:8000'
    fetch(`${backendUrl}/monitor/stats`)
      .then(r => r.json())
      .then(s => {
        setMonitorStats(s)
        if (Array.isArray(s.scores_window) && s.scores_window.length > 0) {
          setMonitorScores(s.scores_window)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadAudits()
    fetchMonitorData()
    const pollInterval = setInterval(fetchMonitorData, 12000)

    // Live WebSocket for instant refresh
    const wsUrl = `${(process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000').replace('http', 'ws')}/monitor/live`
    let ws: WebSocket | null = null
    try {
      ws = new WebSocket(wsUrl)
      ws.onmessage = (ev) => {
        const data = JSON.parse(ev.data)
        if (data.type === 'AUDIT_COMPLETE' || data.type === 'NEW_AUDIT') {
          loadAudits()
          fetchMonitorData()
        }
      }
    } catch { console.warn('WebSocket unavailable — using poll fallback') }

    return () => { ws?.close(); clearInterval(pollInterval) }
  }, [uid, loadAudits, fetchMonitorData])

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(audits, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `fairsight_export_${Date.now()}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  const total        = audits.length
  const flagged      = audits.filter(a => a.verdict === 'GUILTY').length
  const cleared      = audits.filter(a => a.verdict === 'CLEAR').length
  const borderline   = audits.filter(a => a.verdict === 'BORDERLINE').length
  const avgScore     = total > 0 ? Math.round(audits.reduce((s, a) => s + (a.fairnessScore || 0), 0) / total) : 0
  const historicalScores = [...audits].reverse().map(a => a.fairnessScore || 0)
  const scoresOverTime   = monitorScores.length > 0 ? monitorScores : historicalScores
  const lastScore        = audits[0]?.fairnessScore ?? monitorStats?.last_fairness_score ?? null
  const trend = audits.length >= 2
    ? audits[0].fairnessScore - audits[1].fairnessScore
    : 0

  return (
    <div className="page-container">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
        <div>
          <div className="label">Mission Control</div>
          <h1 className="section-title text-gradient gradient-primary" style={{ fontSize: 40, marginTop: 8, letterSpacing: '-0.02em', marginBottom: 0 }}>
            {user ? `${user.displayName?.split(' ')[0]}'s Dashboard` : 'FairSight Dashboard'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--slate)', marginTop: 6 }}>
            {total > 0
              ? `${total} audit${total !== 1 ? 's' : ''} on record · ${flagged} flagged · Last score: ${lastScore ?? '—'}/100`
              : 'No audits yet — upload a dataset to start.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={handleExportJSON} className="btn btn-outline" disabled={total === 0} style={{ gap: 7 }}>
            <Download size={15} /> Export JSON
          </button>
          <button onClick={() => { loadAudits(); fetchMonitorData() }} className="btn btn-outline" style={{ gap: 7 }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <Link href="/audit" className="btn btn-teal" style={{ gap: 7 }}>
            <Zap size={15} /> New Audit
          </Link>
        </div>
      </div>

      {/* ── Live Monitor Banner ──────────────────────────────────────────── */}
      <div className="fade-up" style={{ marginBottom: 28 }}>
        <LiveMonitorPill
          score={lastScore}
          avgScore={avgScore}
          totalAudits={total}  // Use Firestore count — always accurate
          flagged={flagged}
        />
      </div>

      {/* ── 5 Stat Cards ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 18, marginBottom: 28 }}>
        <StatCard label="Total Audits" value={total} icon={Activity} color="#14b8a6" sub="All time" href="/audit" />
        <StatCard label="GUILTY" value={flagged} icon={AlertTriangle} color="#ef4444"
          sub={total > 0 ? `${Math.round(flagged / total * 100)}% of audits` : '0%'} />
        <StatCard label="CLEAR" value={cleared} icon={ShieldCheck} color="#22c55e"
          sub={total > 0 ? `${Math.round(cleared / total * 100)}% of audits` : '0%'} />
        <StatCard label="Borderline" value={borderline} icon={Eye} color="#f59e0b"
          sub="Monitoring recommended" />
        <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg Fairness</div>
          <FairnessScore score={avgScore || 100} size="md" />
          {trend !== 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: trend > 0 ? '#22c55e' : '#ef4444' }}>
              {trend > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {trend > 0 ? '+' : ''}{trend.toFixed(0)} pts trend
            </div>
          )}
        </div>
      </div>

      {/* ── Governance Widget Row ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 28 }}>
        <ConstitutionWidget uid={uid} />
        <CICDWidget uid={uid} />
        <WebhookWidget uid={uid} />
        <FirewallWidget />
      </div>

      {/* ── Charts + Sidebar ─────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginBottom: 28, alignItems: 'start' }}>

        {/* Left: Drift + Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <DriftChart scores={scoresOverTime} />
          <VerdictTimeline
            audits={audits}
            onDelete={async (id) => {
              try {
                await fetch(`/api/verdict?id=${id}`, { method: 'DELETE' })
                setAudits(prev => prev.filter(a => a.id !== id))
              } catch { }
            }}
          />
        </div>

        {/* Right: Benchmark + Fairness Index + Sandbox */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <BenchmarkSnapshot />
          <FairnessIndexWidget />
          <SandboxWidget />
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <div className="card fade-up" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>⚡ Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          <QuickAction icon={FileText} label="Run New Audit" desc="Upload CSV or JSON dataset" href="/audit" color="#0d9488" />
          <QuickAction icon={FlaskConical} label="Pre-Flight Check" desc="Validate data before audit" href="/preflight" color="#8b5cf6" />
          <QuickAction icon={BarChart2} label="Benchmark Lab" desc="Test against COMPAS, Adult Income…" href="/benchmark-lab" color="#3b82f6" />
          <QuickAction icon={Swords} label="AI Sandbox" desc="Counterfactual & intersectional testing" href="/sandbox" color="#6366f1" />
          <QuickAction icon={Activity} label="Live Monitor" desc="Stream real-time decision analysis" href="/monitor" color="#14b8a6" />
          <QuickAction icon={ShieldCheck} label="Compliance Report" desc="Generate EU AI Act attestation" href="/compliance" color="#22c55e" />
          <QuickAction icon={Scale} label="Constitution Editor" desc="Define fairness rules & constraints" href="/constitution" color="#7c3aed" />
          <QuickAction icon={GitBranch} label="CI/CD Gate" desc="Block biased deployments in CI" href="/cicd" color="#f59e0b" />
          <QuickAction icon={FileText} label="Fairness Index" desc="Global leaderboard of fair models" href="/fairness-index" color="#06b6d4" />
          <QuickAction icon={Bell} label="Webhook Setup" desc="Slack / Discord / Teams alerts" href="/settings/integrations" color="#ec4899" />
          <QuickAction icon={Shield} label="Fairness Firewall" desc="Real-time decision filtering" href="/firewall" color="#f97316" />
          <QuickAction icon={Eye} label="Transparency Badge" desc="Public fairness certificate" href="/badge" color="#64748b" />
        </div>
      </div>

      {/* ── Recent Verdicts (full grid) ──────────────────────────────────── */}
      <div className="fade-up">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Recent Audits</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--slate)' }}>{total} total audit{total !== 1 ? 's' : ''}</span>
            {total > 10 && (
              <Link href="/audit" style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 700, textDecoration: 'none' }}>
                View All →
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 24 }}>
            <div className="card skeleton" style={{ height: 220 }} />
            <div className="card skeleton" style={{ height: 220 }} />
            <div className="card skeleton" style={{ height: 220 }} />
            <div className="card skeleton" style={{ height: 220 }} />
          </div>
        ) : audits.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '72px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--navy)', marginBottom: 8 }}>No Audits Yet</div>
            <p style={{ color: 'var(--slate)', fontSize: 14, marginBottom: 24 }}>
              Upload a CSV or JSON prediction log to run your first fairness diagnostic.
            </p>
            <Link href="/audit" className="btn btn-teal" style={{ display: 'inline-flex' }}>
              <Zap size={15} /> Start First Audit
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 24 }}>
            {audits.slice(0, 12).map((a, i) => (
              <div key={a.id} className={`fade-up delay-${Math.min(i + 1, 5)}`}>
                <VerdictCard
                  audit={a}
                  onDelete={async (id) => {
                    try {
                      await fetch(`/api/verdict?id=${id}`, { method: 'DELETE' })
                      setAudits(prev => prev.filter(x => x.id !== id))
                    } catch { }
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
