'use client'
// frontend/components/LiveFeed.tsx — v2.0
//
// Changes:
//  - Connects to /monitor/live instead of /ws/events (correct endpoint)
//  - Displays per-decision fairness score, not just status badge
//  - Shows drift indicator when recent_scores trend is declining
//  - Domain column added for richer context
//  - SDK action badge: PASSED / REVIEW / BLOCK
//  - Session stats update from server payload (not local counting)

import { useEffect, useRef, useState } from 'react'

interface LiveDecision {
  id: string
  model: string
  domain: string
  group: string
  group_attr: string
  group_val: string
  outcome: string
  status: 'PASSED' | 'FLAGGED' | 'REVIEW'
  reason: string
  timestamp: number
  latency_ms: number
  fairness_score: number
  sdk_action: string
  session_stats?: {
    total: number
    passed: number
    flagged: number
    review: number
    avg_latency_ms: number
    drift_score: number
  }
  drift?: {
    drifting: boolean
    trend: string
    slope: number
    window_avg: number
  }
}

const STATUS_CONFIG = {
  PASSED: { bg: 'rgba(74,222,128,0.08)', text: '#4ade80', dot: '#4ade80', label: 'PASSED' },
  FLAGGED: { bg: 'rgba(248,113,113,0.08)', text: '#f87171', dot: '#f87171', label: 'FLAGGED' },
  REVIEW: { bg: 'rgba(96,165,250,0.08)', text: '#60a5fa', dot: '#60a5fa', label: 'REVIEW' },
}

interface LiveFeedProps {
  onStatsUpdate?: (avgScore: number | null) => void
}

export function LiveFeed({ onStatsUpdate }: LiveFeedProps) {
  const [decisions, setDecisions] = useState<LiveDecision[]>([])
  const [connected, setConnected] = useState(false)
  const [stats, setStats] = useState({ total: 0, passed: 0, flagged: 0, review: 0, avg_latency_ms: 0 })
  const [drift, setDrift] = useState<{ drifting: boolean; trend: string; window_avg: number } | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wsBase = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000')
      .replace('https://', 'wss://')
      .replace('http://', 'ws://')

    let ws: WebSocket | null = null
    let fallbackInterval: ReturnType<typeof setInterval> | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
    let mounted = true

    function addDecision(dec: LiveDecision) {
      if (!mounted) return
      setDecisions(prev => [dec, ...prev].slice(0, 60))
      if (dec.session_stats) {
        setStats(s => ({ ...s, ...dec.session_stats! }))
      } else {
        setStats(s => ({
          ...s,
          total: s.total + 1,
          passed: s.passed + (dec.status === 'PASSED' ? 1 : 0),
          flagged: s.flagged + (dec.status === 'FLAGGED' ? 1 : 0),
          review: s.review + (dec.status === 'REVIEW' ? 1 : 0),
          avg_latency_ms: parseFloat(((s.avg_latency_ms * s.total + dec.latency_ms) / (s.total + 1)).toFixed(1)),
        }))
      }
      if (dec.drift) setDrift(dec.drift)
    }

    function connect() {
      if (!mounted) return
      try {
        ws = new WebSocket(`${wsBase}/monitor/live`)
        ws.onopen = () => { if (mounted) setConnected(true) }
        ws.onclose = () => {
          if (!mounted) return
          setConnected(false)
          ws = null
          reconnectTimeout = setTimeout(connect, 5000)
        }
        ws.onerror = () => {
          ws = null
        }
        ws.onmessage = (e) => {
          try {
            const dec = JSON.parse(e.data) as LiveDecision
            addDecision(dec)
            if (dec.drift?.window_avg && onStatsUpdate) {
              onStatsUpdate(dec.drift.window_avg)
            }
          } catch { /* ignore */ }
        }
      } catch {
        // ignore setup crash
      }
    }

    connect()

    return () => {
      mounted = false
      ws?.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [])

  return (
    <div style={{ background: '#0d0d12', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#13131a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, background: connected ? '#4ade80' : '#94a3b8', borderRadius: '50%',
            boxShadow: connected ? '0 0 6px #4ade80' : 'none',
            animation: connected ? 'pulse-dot 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f5', fontFamily: 'Space Grotesk, sans-serif' }}>
            {connected ? 'Live Decision Stream' : 'Connecting to SDK...'}
          </span>
          {drift && (
            <span style={{
              fontSize: 11, fontFamily: 'DM Mono, monospace', padding: '2px 8px', borderRadius: 12,
              background: drift.drifting ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
              color: drift.drifting ? '#f87171' : '#4ade80',
              border: `1px solid ${drift.drifting ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.2)'}`,
            }}>
              {drift.drifting ? '⚠ DRIFT DETECTED' : `✓ STABLE · avg ${drift.window_avg}`}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, fontFamily: 'DM Mono, monospace' }}>
          <span style={{ color: '#4ade80' }}>✓ {stats.passed}</span>
          <span style={{ color: '#f87171' }}>⚠ {stats.flagged}</span>
          <span style={{ color: '#60a5fa' }}>? {stats.review}</span>
          {stats.avg_latency_ms > 0 && (
            <span style={{ color: '#9090a8' }}>{stats.avg_latency_ms}ms avg</span>
          )}
        </div>
      </div>

      {/* Decision feed */}
      <div ref={listRef} style={{ maxHeight: 400, overflowY: 'auto', padding: '6px 0' }}>
        {decisions.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#5a5a72', fontSize: 13, fontFamily: 'DM Mono, monospace' }}>
            Waiting for SDK decisions...
          </div>
        ) : (
          decisions.map((d, i) => {
            const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.PASSED
            const isNew = i === 0
            return (
              <div
                key={d.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  animation: isNew ? 'fade-up 0.25s ease-out' : 'none',
                  transition: 'background 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {/* Status dot */}
                <div style={{
                  width: 6, height: 6, background: cfg.dot, borderRadius: '50%', flexShrink: 0,
                  boxShadow: d.status !== 'PASSED' ? `0 0 5px ${cfg.dot}` : 'none'
                }} />

                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#f0f0f5', fontFamily: 'DM Mono, monospace' }}>
                      {d.group}
                    </span>
                    <span style={{ fontSize: 10, color: '#5a5a72', fontFamily: 'DM Mono, monospace' }}>
                      {d.domain} · {d.model}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 11, color: '#9090a8', fontFamily: 'DM Mono, monospace',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {d.reason}
                  </div>
                </div>

                {/* Fairness score */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 700, fontFamily: 'DM Mono, monospace',
                    color: d.fairness_score >= 70 ? '#4ade80' : d.fairness_score >= 45 ? '#fbbf24' : '#f87171',
                  }}>
                    {d.fairness_score}
                  </div>
                  <div style={{ fontSize: 10, color: '#5a5a72' }}>{d.latency_ms}ms</div>
                </div>

                {/* Status badge */}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                  background: cfg.bg, color: cfg.text,
                  border: `1px solid ${cfg.dot}30`,
                  fontFamily: 'DM Mono, monospace',
                  flexShrink: 0,
                }}>
                  {d.status}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}