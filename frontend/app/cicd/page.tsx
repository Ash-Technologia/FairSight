'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { GitBranch, CheckCircle, XCircle, Clock, Download, RefreshCw, Shield, ChevronRight, Terminal, AlertCircle } from 'lucide-react'

interface GateCheck {
  name:      string
  status:    'PASSED' | 'FAILED'
  value:     string
  threshold: string
  icon:      string
}

interface GateResult {
  status:         'PASSED' | 'FAILED'
  exit_code:      number
  fairness_score: number
  threshold:      number
  checks:         GateCheck[]
  failed_count:   number
  passed_count:   number
  filename:       string
  audit_id:       string
  timestamp:      any
  verdict:        string
  severity:       string
}

const YAML_CONTENT = `# fairness-check.yml — FairSight Fairness Gate
# Add this to your GitHub Actions workflow to block biased model deployments.

name: FairSight Fairness Gate

on: [push, pull_request]

jobs:
  fairness-audit:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Run FairSight Fairness Gate
        run: |
          RESULT=$(curl -s "\${{ secrets.FAIRSIGHT_API_URL }}/cicd/gate?uid=\${{ secrets.FAIRSIGHT_UID }}&threshold=80")
          EXIT_CODE=$(echo $RESULT | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['exit_code'])")
          SCORE=$(echo $RESULT | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['fairness_score'])")
          echo "Fairness Score: $SCORE / 100"
          exit $EXIT_CODE`

export default function CICDPage() {
  const { user } = useAuth()
  const [threshold,  setThreshold]  = useState(80)
  const [gateResult, setGateResult] = useState<GateResult | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [lines,      setLines]      = useState<{ text: string; status?: string }[]>([])
  const [animating,  setAnimating]  = useState(false)
  const termRef = useRef<HTMLDivElement>(null)

  const buildLines = useCallback((result: GateResult): { text: string; status?: string }[] => {
    const lines: { text: string; status?: string }[] = [
      { text: `▶  FairSight Fairness Gate v2.0  |  Branch: main  |  Threshold: ≥${result.threshold}` },
      { text: '─────────────────────────────────────────────────────────────────' },
      { text: `📁  Dataset: ${result.filename}` },
      { text: `🔖  Audit ID: ${result.audit_id?.slice(0,16) || 'N/A'}` },
      { text: '' },
      { text: 'Running fairness checks...', status: 'running' },
      { text: '' },
    ]
    result.checks.forEach(c => {
      const icon = c.status === 'PASSED' ? '✔' : '✖'
      lines.push({
        text: `  ${icon}  ${c.name.padEnd(40)} ${c.value.padEnd(20)} ${c.threshold}`,
        status: c.status,
      })
    })
    lines.push({ text: '' })
    lines.push({ text: '─────────────────────────────────────────────────────────────────' })
    const isBypassed = result.audit_id === 'N/A' || result.checks.length === 0
    let statusStr = ''
    if (isBypassed) {
      statusStr = `⚠  FAIRNESS GATE: BYPASSED (No audit found. Minimum threshold: ${result.threshold})`
    } else {
      statusStr = result.status === 'PASSED'
        ? `✔  FAIRNESS GATE: PASSED  (Score: ${result.fairness_score} ≥ ${result.threshold})`
        : `✖  FAIRNESS GATE: FAILED  (Score: ${result.fairness_score} < ${result.threshold})`
    }
    lines.push({ text: statusStr, status: isBypassed ? 'WARNING' : result.status })
    lines.push({ text: `   Exit code: ${result.exit_code}  —  ${result.exit_code === 0 ? 'Build unblocked.' : 'Build blocked. Resolve bias violations before merging.'}` })
    return lines
  }, [])

  const runGate = useCallback(async () => {
    setLoading(true)
    setLines([])
    setAnimating(false)
    try {
      const uid = user?.uid || 'guest'
      const res = await fetch(`/api/cicd?uid=${uid}&threshold=${threshold}`)
      const data: GateResult = await res.json()
      setGateResult(data)
      const allLines = buildLines(data)
      setAnimating(true)
      let i = 0
      const tick = () => {
        const lineToPush = allLines[i]
        setLines(prev => [...prev, lineToPush])
        i++
        if (i < allLines.length) setTimeout(tick, 60)
        else setAnimating(false)
      }
      tick()
    } catch (e) {
      setLines([{ text: 'Error: Could not connect to the FairSight backend.', status: 'FAILED' }])
    } finally {
      setLoading(false)
    }
  }, [user, threshold, buildLines])

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [lines])

  const downloadYAML = () => {
    const blob = new Blob([YAML_CONTENT], { type: 'text/yaml' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'fairness-check.yml'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-container fade-up">
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #1e293b, #334155)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <GitBranch size={22} color="#14b8a6" />
          </div>
          <div>
            <div className="label" style={{ color: 'var(--teal)', marginBottom: 2 }}>DevOps Integration</div>
            <h1 className="text-gradient gradient-primary" style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              CI/CD Fairness Gate
            </h1>
          </div>
        </div>
        <p style={{ color: 'var(--slate)', fontSize: 15, maxWidth: 640, lineHeight: 1.6 }}>
          Block biased model deployments before they reach production. This gate evaluates your most recent
          FairSight audit against a configurable threshold — and blocks the build if the model fails.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 32, alignItems: 'start' }}>
        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              Gate Configuration
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>Pass Threshold</label>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--teal)' }}>{threshold}</span>
              </div>
              <input type="range" min={60} max={95} step={5} value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--teal)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--slate)', marginTop: 4 }}>
                <span>60 (Lenient)</span><span>95 (Strict)</span>
              </div>
            </div>

            <button onClick={runGate} disabled={loading}
              className={`hover-lift ${!loading ? 'btn-pulse-teal' : ''}`}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: loading ? 'var(--slate)' : 'linear-gradient(135deg, var(--teal-light), var(--teal))',
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              {loading ? (
                <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #fff4', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite' }} /> Running Gate…</>
              ) : (
                <><RefreshCw size={14} /> Run Gate Check</>
              )}
            </button>
          </div>

          {gateResult && (() => {
            const isBypassed = gateResult.audit_id === 'N/A' || gateResult.checks.length === 0
            const PASSED = gateResult.status === 'PASSED' && !isBypassed
            const bgColor = isBypassed ? 'rgba(245,158,11,0.05)' : (PASSED ? 'rgba(34,197,94,0.05)' : 'rgba(220,38,38,0.05)')
            const borderColor = isBypassed ? '#f59e0b' : (PASSED ? '#22c55e' : '#dc2626')
            const iconColor = isBypassed ? '#f59e0b' : (PASSED ? '#16a34a' : '#dc2626')
            const Icon = isBypassed ? AlertCircle : (PASSED ? CheckCircle : XCircle)
            const statusText = isBypassed ? 'BYPASSED' : gateResult.status

            return (
              <div style={{
                borderRadius: 16, padding: 20,
                background: bgColor,
                border: `1.5px solid ${borderColor}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Icon size={22} color={iconColor} />
                  <span style={{ fontSize: 18, fontWeight: 800, color: iconColor }}>
                    {statusText}
                  </span>
                </div>
                {!isBypassed ? (
                  <>
                    <div style={{ fontSize: 13, color: 'var(--navy)', marginBottom: 8 }}>
                      Score: <strong>{gateResult.fairness_score}</strong> / 100
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>✔ {gateResult.passed_count} Passed</span>
                      <span style={{ color: '#dc2626', fontWeight: 600 }}>✖ {gateResult.failed_count} Failed</span>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--slate)' }}>
                    No prior audit found. Target threshold was {gateResult.threshold}.
                  </div>
                )}
              </div>
            )
          })()}

          <div className="card" style={{ background: 'rgba(13,148,136,0.04)', border: '1px solid rgba(13,148,136,0.15)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', marginBottom: 10 }}>GitHub Actions</div>
            <p style={{ fontSize: 12, color: 'var(--slate)', lineHeight: 1.6, marginBottom: 12 }}>
              Download the ready-to-use Actions workflow. Add your API URL to GitHub Secrets and merge.
            </p>
            <button onClick={downloadYAML} style={{
              width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid var(--teal)',
              background: 'transparent', color: 'var(--teal)', fontWeight: 700, fontSize: 12,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Download size={13} /> Download fairness-check.yml
            </button>
          </div>
        </div>

        {/* Terminal */}
        <div style={{
          background: '#0a0f1a', borderRadius: 20, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}>
          {/* Terminal header */}
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#ff5f57','#febc2e','#28c840'].map(c => (
                <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Terminal size={12} /> fairness-check — FairSight CI/CD Gate
            </span>
            {animating && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1s infinite' }} />
                <span style={{ fontSize: 10, color: '#64748b' }}>running</span>
              </div>
            )}
          </div>

          {/* Terminal body */}
          <div ref={termRef}
            style={{ padding: '20px 24px', minHeight: 400, maxHeight: 540, overflowY: 'auto', fontFamily: "'DM Mono', monospace", fontSize: 13, lineHeight: 1.7 }}>
            {lines.length === 0 ? (
              <div style={{ color: '#64748b' }}>
                <div>$ fairsight-gate --threshold {threshold}</div>
                <div style={{ marginTop: 16, color: '#475569' }}>Click "Run Gate Check" to evaluate your most recent audit...</div>
                <div style={{ marginTop: 8, color: '#334155' }}>
                  The gate checks Demographic Parity, Equalized Odds, Disparate Impact,<br/>
                  Individual Fairness, and Counterfactual Flip Rate against EU AI Act thresholds.
                </div>
              </div>
            ) : lines.map((line, i) => {
              let color = '#94a3b8'
              if (line.status === 'PASSED')  color = '#4ade80'
              if (line.status === 'FAILED')  color = '#f87171'
              if (line.status === 'running') color = '#fbbf24'
              return (
                <div key={i} style={{ color, whiteSpace: 'pre' }}>
                  {line.text}
                  {i === lines.length - 1 && animating && (
                    <span style={{ borderLeft: '1px solid #94a3b8', marginLeft: 2, animation: 'blink 1s step-end infinite' }}>&nbsp;</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  )
}
