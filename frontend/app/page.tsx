'use client'
import Link from 'next/link'
import { Activity, ShieldCheck, Database, ArrowRight, Zap, BarChart2, Globe } from 'lucide-react'

const LIVE_FEED_DATA = [
  { group: 'Race: Hispanic', model: 'credit_model_v2', status: 'FLAGGED', reason: 'zip_code proxy triggered, DP=0.34' },
  { group: 'Gender: Female', model: 'hiring_model_v1', status: 'PASSED', reason: 'All fairness thresholds met' },
  { group: 'Race: Black', model: 'loan_model_v3', status: 'FLAGGED', reason: 'Flip test positive — decision flips on race' },
  { group: 'Age: 55+', model: 'credit_model_v2', status: 'REVIEW', reason: 'Rejection rate 2.1× baseline group' },
  { group: 'Race: Asian', model: 'hiring_model_v1', status: 'PASSED', reason: 'Demographic parity gap: 0.04' },
  { group: 'Gender: Non-binary', model: 'loan_model_v3', status: 'FLAGGED', reason: 'Equalized odds violation: 0.28' },
]

const STATUS_COLOR: Record<string, string> = {
  FLAGGED: '#ef4444', PASSED: '#22c55e', REVIEW: '#f59e0b'
}

const STATUS_BG: Record<string, string> = {
  FLAGGED: 'rgba(239,68,68,0.08)', PASSED: 'rgba(34,197,94,0.08)', REVIEW: 'rgba(245,158,11,0.08)'
}

export default function LandingPage() {
  return (
    <main style={{ paddingBottom: 120 }}>
      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 180, paddingBottom: 100 }}>
        <div className="page-container" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '54% 46%', gap: 64, alignItems: 'center' }}>

            {/* Left: Copy */}
            <div className="fade-up">
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)',
                borderRadius: 20, padding: '6px 18px', marginBottom: 32
              }}>
                <span style={{
                  width: 8, height: 8, background: '#14b8a6', borderRadius: '50%',
                  boxShadow: '0 0 12px #14b8a6', animation: 'pulse-glow 2s infinite', display: 'inline-block'
                }} />
                <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Live AI Monitoring Active
                </span>
              </div>

              <h1 style={{
                fontSize: 'clamp(42px, 5.5vw, 72px)', fontWeight: 800,
                color: 'var(--navy)', lineHeight: 1.05, letterSpacing: '-0.03em',
                marginBottom: 28, fontFamily: 'Space Grotesk, sans-serif'
              }}>
                Your AI model is making
                <br />
                <span style={{
                  background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>biased decisions.</span>
                <br />
                Right now.
              </h1>

              <p style={{ fontSize: 18, color: 'var(--slate)', lineHeight: 1.7, maxWidth: 520, marginBottom: 44 }}>
                FairSight is the only compliance platform that watches your deployed model
                in real-time — intercepting decisions as they happen, evaluating 12 metrics natively.
              </p>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <Link href="/audit" className="btn btn-teal btn-lg" style={{ fontSize: 17, padding: '18px 36px' }}>
                  Run Free Audit <ArrowRight size={18} />
                </Link>
                <Link href="/dashboard" className="btn btn-outline btn-lg" style={{ fontSize: 17, padding: '18px 36px' }}>
                  View Dashboard
                </Link>
              </div>

              {/* Trust signals */}
              <div style={{ display: 'flex', gap: 24, marginTop: 40, flexWrap: 'wrap' }}>
                {[
                  { label: 'Fairness Metrics', value: '12+' },
                  { label: 'AI Models in Consensus', value: '4' },
                  { label: 'Regulatory Frameworks', value: '4' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--teal)', fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: 'var(--slate)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Terminal window */}
            <div className="fade-up delay-2">
              <div style={{
                background: 'var(--navy)', borderRadius: 20, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 24px 64px -16px rgba(13, 148, 136, 0.15), 0 0 0 1px rgba(255,255,255,0.05)'
              }}>
                {/* Title bar */}
                <div style={{
                  background: 'rgba(255,255,255,0.04)', padding: '14px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <div style={{ width: 11, height: 11, background: '#ef4444', borderRadius: '50%' }} />
                  <div style={{ width: 11, height: 11, background: '#f59e0b', borderRadius: '50%' }} />
                  <div style={{ width: 11, height: 11, background: '#22c55e', borderRadius: '50%' }} />
                  <span style={{ marginLeft: 12, color: 'rgba(255,255,255,0.25)', fontSize: 12, fontFamily: 'DM Mono, monospace' }}>
                    fairsight.dev — production terminal
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: 28, fontFamily: 'DM Mono, monospace', fontSize: 13 }}>
                  <div style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 16, fontSize: 12 }}>
                    <span style={{ color: '#a78bfa' }}>from</span> fairsight <span style={{ color: '#a78bfa' }}>import</span> FairSight
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 20, lineHeight: 1.8 }}>
                    fs = FairSight(model=hiring_model,<br />
                    {'  '}protected=<span style={{ color: '#86efac' }}>[&quot;race&quot;, &quot;gender&quot;]</span>)<br />
                    result = fs.predict(applicant_data)
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16, marginBottom: 16, color: '#5eead4', fontSize: 11 }}>
                    // Real-time verdicts ↓
                  </div>

                  {/* Animated feed */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {LIVE_FEED_DATA.slice(0, 4).map((item, i) => (
                      <div
                        key={item.group}
                        style={{
                          display: 'flex', gap: 12, alignItems: 'flex-start',
                          padding: '8px 12px', borderRadius: 8,
                          background: STATUS_BG[item.status],
                          border: `1px solid ${STATUS_COLOR[item.status]}20`,
                          animation: `fade-up 0.4s ease ${i * 0.1}s both`
                        }}
                      >
                        <span style={{ color: STATUS_COLOR[item.status], fontWeight: 700, fontSize: 11, paddingTop: 1, flexShrink: 0 }}>
                          [{item.status}]
                        </span>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{item.group}</div>
                          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>{item.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0', borderTop: '1px solid var(--border)', background: '#fafcff' }}>
        <div className="page-container" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div className="label" style={{ marginBottom: 12 }}>Platform Features</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: 'var(--navy)', fontFamily: 'Space Grotesk, sans-serif' }}>
              Everything you need. Nothing you don&apos;t.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
            {[
              {
                icon: ShieldCheck, color: '#14b8a6', bgColor: 'rgba(20,184,166,0.08)',
                title: 'Upload & Audit',
                desc: 'Drop any CSV or JSON. We run 12 fairness metrics natively and generate a plain-language AI diagnostic verdict in seconds.'
              },
              {
                icon: Activity, color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.08)',
                title: 'Live SDK Telemetry',
                desc: 'One pip install. Wrap your model and we dynamically analyze incoming decisions with WebSocket streaming.'
              },
              {
                icon: BarChart2, color: '#f59e0b', bgColor: 'rgba(245,158,11,0.08)',
                title: '3-Model AI Consensus',
                desc: 'Gemini, Groq, and HuggingFace evaluate your model simultaneously. Disagreement flags the most critical bias risks.'
              },
              {
                icon: Database, color: '#ef4444', bgColor: 'rgba(239,68,68,0.08)',
                title: 'Immutable Audit Trail',
                desc: 'Every decision hashed with SHA-256. Tamper-proof audit history stored in Firestore, exportable as PDF.'
              },
              {
                icon: Zap, color: '#14b8a6', bgColor: 'rgba(20,184,166,0.08)',
                title: 'Drift Detection',
                desc: 'Chart fairness score trends over time. Automated alerts when model behavior shifts beyond defined thresholds.'
              },
              {
                icon: Globe, color: '#6366f1', bgColor: 'rgba(99,102,241,0.08)',
                title: 'Compliance Generator',
                desc: 'Auto-generate EU AI Act, EEOC, ECOA attestation certificates with one click. Ready for regulatory review.'
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className="card hover-lift fade-up"
                style={{ animationDelay: `${i * 0.05}s`, padding: 32 }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: item.bgColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20, color: item.color
                }}>
                  <item.icon size={26} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: 'var(--navy)' }}>{item.title}</h3>
                <p style={{ color: 'var(--slate)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 0' }}>
        <div className="page-container" style={{ paddingTop: 0, paddingBottom: 0, textAlign: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            borderRadius: 28, padding: '64px 40px',
            boxShadow: '0 32px 80px -20px rgba(15,23,42,0.25)'
          }}>
            <div className="label" style={{ color: 'var(--teal-light)', marginBottom: 16 }}>Get Started Free</div>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: '#ffffff', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 16, letterSpacing: '-0.02em' }}>
              Ready to audit your model?
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.6 }}>
              Drop a CSV and get a full bias diagnostic report in under 60 seconds. No credit card required.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/audit" className="btn btn-teal btn-lg" style={{ fontSize: 17, padding: '18px 40px' }}>
                Run Free Audit <ArrowRight size={18} />
              </Link>
              <Link href="/guide" className="btn btn-outline btn-lg" style={{ fontSize: 17, padding: '18px 40px', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>
                View Documentation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
