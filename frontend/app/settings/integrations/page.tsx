'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/components/Toast'
import { Bell, CheckCircle, XCircle, Loader2, Send, LayoutDashboard, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function IntegrationsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const uid = user?.uid ?? 'guest'

  const [slackUrl, setSlackUrl] = useState('')
  const [discordUrl, setDiscordUrl] = useState('')
  const [teamsUrl, setTeamsUrl] = useState('')
  const [threshold, setThreshold] = useState(70)
  const [enabled, setEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null)
  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'

  useEffect(() => {
    fetch(`/api/settings?uid=${uid}`)
      .then(r => r.json())
      .then(d => {
        if (d.slack_url)   setSlackUrl(d.slack_url)
        if (d.discord_url) setDiscordUrl(d.discord_url)
        if (d.teams_url)   setTeamsUrl(d.teams_url)
        setThreshold(d.bias_threshold ?? 70)
        setEnabled(d.enabled ?? true)
      })
      .catch(() => {})
  }, [uid])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, slack_url: slackUrl, discord_url: discordUrl, teams_url: teamsUrl, bias_threshold: threshold, enabled }),
      })
      showToast('Webhook settings saved!', 'success')
    } catch {
      showToast('Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${BACKEND}/settings/webhooks/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      })
      if (res.ok) { setTestResult('ok'); showToast('Test alert sent!', 'success') }
      else { setTestResult('fail'); showToast('Test failed — check your webhook URL.', 'error') }
    } catch {
      setTestResult('fail')
      showToast('Could not reach backend', 'error')
    } finally {
      setTesting(false)
    }
  }

  const InputRow = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</label>
      <input
        type="url" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'DM Mono, monospace' }}
      />
    </div>
  )

  return (
    <div className="page-container-narrow fade-up">
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div className="label">Settings</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
              <LayoutDashboard size={13} /> Dashboard
            </Link>
            <Link href="/audit" style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Zap size={13} /> Run Audit
            </Link>
          </div>
        </div>
        <h1 className="section-title" style={{ fontSize: 36, marginTop: 8 }}>Webhook Integrations</h1>
        <p style={{ color: 'var(--slate)', fontSize: 15, lineHeight: 1.6, marginTop: 8 }}>
          FairSight automatically fires alerts to Slack, Discord, or Teams when a <strong>GUILTY verdict</strong> is
          detected or the fairness score drops below your threshold.
        </p>
      </div>

      <div className="card fade-up delay-1" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ padding: 10, background: 'rgba(13,148,136,0.1)', borderRadius: 10 }}><Bell size={20} color="var(--teal)" /></div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Alert Configuration</h2>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--slate)' }}>Alerts</span>
            <button
              onClick={() => setEnabled(e => !e)}
              style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: enabled ? 'var(--teal)' : 'var(--border)', position: 'relative', transition: 'background 0.2s' }}
            >
              <div style={{ position: 'absolute', top: 3, left: enabled ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: enabled ? 'var(--teal)' : 'var(--slate)' }}>{enabled ? 'ON' : 'OFF'}</span>
          </div>
        </div>

        <InputRow label="Slack Webhook URL" value={slackUrl} onChange={setSlackUrl} placeholder="https://hooks.slack.com/services/…" />
        <InputRow label="Discord Webhook URL" value={discordUrl} onChange={setDiscordUrl} placeholder="https://discord.com/api/webhooks/…" />
        <InputRow label="Microsoft Teams Webhook URL" value={teamsUrl} onChange={setTeamsUrl} placeholder="https://your-org.webhook.office.com/…" />

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            <span>Alert Threshold</span>
            <span style={{ color: threshold < 70 ? 'var(--red)' : 'var(--teal)', fontFamily: 'DM Mono, monospace', fontSize: 16 }}>{threshold} / 100</span>
          </div>
          <input type="range" min={50} max={90} step={5} value={threshold} onChange={e => setThreshold(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--teal)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--slate)', marginTop: 4 }}>
            <span>50 — More sensitive</span><span>90 — Less sensitive</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--slate)', marginTop: 8 }}>Alert fires when fairness score drops below <strong>{threshold}</strong>.</p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleSave} disabled={saving} className="btn btn-teal" style={{ gap: 8 }}>
            {saving ? <Loader2 size={15} className="spin" /> : null} Save Configuration
          </button>
          <button onClick={handleTest} disabled={testing} className="btn btn-outline" style={{ gap: 8 }}>
            {testing ? <Loader2 size={15} /> : <Send size={15} />} Send Test Alert
            {testResult === 'ok' && <CheckCircle size={15} color="#22c55e" />}
            {testResult === 'fail' && <XCircle size={15} color="#ef4444" />}
          </button>
        </div>
      </div>

      <div className="card fade-up delay-2" style={{ background: 'var(--navy)', color: 'white', borderColor: 'var(--navy-light)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Trigger Conditions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[
            { emoji: '🚨', title: 'GUILTY Verdict', desc: 'Always fires when any audit returns GUILTY regardless of score' },
            { emoji: '📊', title: 'Score Below Threshold', desc: `Fires when fairness score < ${threshold} (your current setting)` },
          ].map(({ emoji, title, desc }) => (
            <div key={title} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Alert Payload Includes</div>
        <ol style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 2, margin: 0, paddingLeft: 20 }}>
          <li>Verdict (GUILTY / BORDERLINE / CLEAR) and severity level</li>
          <li>Fairness score and threshold comparison</li>
          <li>Protected attributes affected</li>
          <li>Direct link to the full FairSight audit report</li>
          <li>Timestamp and dataset filename</li>
        </ol>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Link href="/audit" className="btn btn-teal" style={{ display: 'inline-flex', gap: 8 }}>
          <Zap size={15} /> Run Audit to Test Alert <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
