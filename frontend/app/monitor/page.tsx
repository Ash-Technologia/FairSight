'use client'
import { useState, useEffect, useCallback } from 'react'
import { LiveFeed } from '@/components/LiveFeed'
import { DriftChart } from '@/components/DriftChart'
import { useToast } from '@/components/Toast'
import Link from 'next/link'
import { LayoutDashboard, Zap, ShieldCheck, Bell } from 'lucide-react'

export default function MonitorPage() {
  const [threshold, setThreshold] = useState<number>(70)
  const [liveAvg, setLiveAvg] = useState<number | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [monitorStats, setMonitorStats] = useState<any>(null)
  const [scoresWindow, setScoresWindow] = useState<number[]>([])
  const { showToast } = useToast()

  // Persist threshold changes
  useEffect(() => {
    localStorage.setItem('fairsight_drift_threshold', threshold.toString())
  }, [threshold])

  // Fetch real moving average from backend
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:8000'
      const res = await fetch(`${backendUrl}/monitor/stats`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const stats = await res.json()
      setMonitorStats(stats)
      setLiveAvg(stats.avg_fairness_score ?? stats.recent_score_avg ?? null)
      if (Array.isArray(stats.scores_window) && stats.scores_window.length > 0) {
        setScoresWindow(stats.scores_window)
      }
    } catch (err) {
      console.warn('[monitor] Could not fetch /monitor/stats:', err)
      setLiveAvg(null)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Load stats on mount + refresh every 15s
  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 15_000)
    return () => clearInterval(interval)
  }, [fetchStats])


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsStreaming(true)
    showToast(`Initializing real-time stream for ${file.name}...`, 'info')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:8000'
      const res = await fetch(`${backendUrl}/monitor/stream_real_dataset`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Stream rejected')
      showToast('Backend streaming task connected! LiveFeed active.', 'success')
      // Reset the local file input so it can be uploaded again if needed
      e.target.value = ''
    } catch (err) {
      console.warn('Stream start failed', err)
      showToast('Failed to start Live Stream.', 'error')
      setIsStreaming(false)
    }
  }

  const checkAlert = () => {
    if (liveAvg === null) {
      showToast('⏳ Stats not yet loaded — try again in a moment.', 'info')
      return
    }
    if (liveAvg < threshold) {
      showToast(
        `⚠ Drift Alert: Moving average (${liveAvg.toFixed(1)}) is below threshold (${threshold})!`,
        'error'
      )
    } else {
      showToast(
        `✓ All clear: Moving average (${liveAvg.toFixed(1)}) is above threshold (${threshold}).`,
        'success'
      )
    }
  }

  return (
    <div className="page-container-narrow fade-up">
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div className="label">Live SDK Connection</div>
          <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
            <LayoutDashboard size={13} /> Dashboard
          </Link>
        </div>
        <h1 className="section-title" style={{ fontSize: 36, marginTop: 4 }}>Model Monitor</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <p style={{ color: 'var(--slate)', fontSize: 15, lineHeight: 1.6, marginTop: 8, maxWidth: 600 }}>
            Real-time event stream from deployed models instrumented with the FairSight SDK. 
            Suspicious decisions and parity drifts are flagged immediately.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {isStreaming && (
              <div style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 600, animation: 'pulse-dot 2s infinite' }}>
                ● STREAMING
              </div>
            )}
            {!isStreaming ? (
              <label
                className="btn"
                style={{
                  padding: '8px 16px', fontSize: 13, background: 'var(--teal)',
                  color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Upload CSV to Stream
                <input 
                  type="file" 
                  accept=".csv" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                />
              </label>
            ) : (
              <button
                className="btn"
                onClick={async () => {
                  try {
                    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:8000'
                    await fetch(`${backendUrl}/monitor/stop_stream`, { method: 'POST' })
                    setIsStreaming(false)
                    showToast('Streaming stopped.', 'info')
                  } catch (e) {
                    showToast('Failed to stop stream', 'error')
                  }
                }}
                style={{
                  padding: '8px 16px', fontSize: 13, background: 'transparent',
                  color: 'var(--red)', border: '1px solid var(--red)', fontWeight: 700, cursor: 'pointer',
                }}
              >
                ⏹ Stop Stream
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Monitor Stat Row */}
      {monitorStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total Audits', value: monitorStats.total_audits_run ?? 0, color: '#14b8a6' },
            { label: 'Avg Score', value: monitorStats.avg_fairness_score != null ? `${monitorStats.avg_fairness_score}/100` : '—', color: '#3b82f6' },
            { label: 'Active Alerts', value: monitorStats.active_alerts ?? 0, color: '#ef4444' },
            { label: 'WS Connections', value: monitorStats.active_connections ?? 0, color: '#a78bfa' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--white)', border: '1.5px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Drift Chart */}
      {scoresWindow.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <DriftChart scores={scoresWindow} />
        </div>
      )}

      <div className="fade-up delay-1" style={{ marginBottom: 24 }}>
        <LiveFeed
          onStatsUpdate={(avg) => setLiveAvg(avg)}
        />
      </div>

      {/* Drift Settings */}
      <div className="card fade-up delay-2" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>
              Drift Alert Threshold
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--slate)' }}>
              Alert if the moving average fairness score falls below this limit.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: threshold >= 70 ? 'var(--teal)' : 'var(--amber)',
                fontFamily: 'DM Mono, monospace',
              }}
            >
              {threshold}
            </div>
            {/* [BUG-8 FIX] Show real live average instead of hardcoded 74 */}
            <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 2 }}>
              {statsLoading
                ? 'Loading live avg…'
                : liveAvg !== null
                  ? `Live avg: ${liveAvg.toFixed(1)}`
                  : 'Live avg: —'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <input
            type="range"
            min="10"
            max="95"
            step="1"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--teal)' }}
          />
          <button
            onClick={checkAlert}
            className="btn btn-outline"
            style={{ padding: '8px 16px', fontSize: 13, whiteSpace: 'nowrap' }}
          >
            Check Status
          </button>
        </div>

        {/* Visual drift indicator bar */}
        {liveAvg !== null && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                height: 6,
                background: 'var(--border)',
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${liveAvg}%`,
                  background: liveAvg >= threshold ? 'var(--teal)' : 'var(--red)',
                  borderRadius: 4,
                  transition: 'width 0.6s ease, background 0.3s ease',
                }}
              />
              {/* Threshold marker */}
              <div
                style={{
                  position: 'absolute',
                  top: -2,
                  left: `${threshold}%`,
                  width: 2,
                  height: 10,
                  background: 'var(--navy)',
                  borderRadius: 2,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--slate)', marginTop: 4 }}>
              <span>0</span>
              <span style={{ color: liveAvg >= threshold ? 'var(--teal)' : 'var(--red)', fontWeight: 700 }}>
                {liveAvg >= threshold ? '✓ Above threshold' : '⚠ Below threshold'}
              </span>
              <span>100</span>
            </div>
          </div>
        )}
      </div>

      <div
        className="card fade-up delay-3"
        style={{ background: 'var(--navy)', color: 'white', borderColor: 'var(--navy-light)' }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--teal-light)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 12,
          }}
        >
          SDK Integration Guide
        </div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
          Send live predictions from any system to FairSight's ingestion engine via standard HTTP. 
          Use this script to embed telemetry inside your ML pipeline.
        </p>

        <div style={{ position: 'relative' }}>
          <pre style={{
                margin: 0, padding: 24, fontSize: 12, lineHeight: 1.8,
                fontFamily: 'DM Mono, monospace',
                background: '#0f172a',
                color: '#f8fafc',
                overflowX: 'auto',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
            <span style={{ color: '#a78bfa' }}>import</span> requests<br/>
            <span style={{ color: '#a78bfa' }}>import</span> time<br/>
            <br/>
            <span style={{ color: '#94a3b8' }}># Send batch telemetry directly to your FairSight node</span><br/>
            payload = {'{'}<br/>
            &nbsp;&nbsp;<span style={{ color: '#fca5a5' }}>"api_key"</span>: <span style={{ color: '#fca5a5' }}>"demo-sdk-key"</span>,<br/>
            &nbsp;&nbsp;<span style={{ color: '#fca5a5' }}>"protected_attributes"</span>: [<span style={{ color: '#fca5a5' }}>"race"</span>, <span style={{ color: '#fca5a5' }}>"gender"</span>],<br/>
            &nbsp;&nbsp;<span style={{ color: '#fca5a5' }}>"decisions"</span>: [<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;{'{'}<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#fca5a5' }}>"timestamp"</span>: time.time(),<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#fca5a5' }}>"inputs"</span>: {'{'} <span style={{ color: '#fca5a5' }}>"age"</span>: <span style={{ color: '#5eead4' }}>45</span>, <span style={{ color: '#fca5a5' }}>"gender"</span>: <span style={{ color: '#fca5a5' }}>"Female"</span> {'}'},<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#fca5a5' }}>"predictions"</span>: [<span style={{ color: '#fca5a5' }}>"APPROVED"</span>],<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#fca5a5' }}>"latency_ms"</span>: <span style={{ color: '#5eead4' }}>14.2</span><br/>
            &nbsp;&nbsp;&nbsp;&nbsp;{'}'}<br/>
            &nbsp;&nbsp;]<br/>
            {'}'}<br/>
            <br/>
            requests.post(<span style={{ color: '#fca5a5' }}>"http://localhost:8000/sdk/ingest"</span>, json=payload)<br/>
          </pre>
        </div>
      </div>
    </div>
  )
}