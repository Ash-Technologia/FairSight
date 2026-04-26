'use client'
import { Target, Lightbulb, ShieldCheck, Search, Database, Layers, Network, Zap, CheckCircle2, Bot, FileWarning, Cpu, Shield, Clock, BookOpen, Scaling, Terminal, FileCode2, MessagesSquare, Code2, AlertTriangle, Fingerprint } from 'lucide-react'

export default function PlatformManualPage() {
  return (
    <>
      <div className="cyber-bg" />
      <div className="page-container-narrow" style={{ position: 'relative', zIndex: 10 }}>
        
        {/* 1️⃣ Hero Section */}
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 100, padding: '40px 0' }}>
          <div className="label" style={{ marginBottom: 16 }}>OFFICIAL PLATFORM ARCHITECTURE</div>
          <h1 className="section-title" style={{ fontSize: 56, letterSpacing: '-0.03em', marginBottom: 24, lineHeight: 1.15 }}>
            FairSight Engine
          </h1>
          <p style={{ color: 'var(--navy)', fontSize: 20, fontWeight: 500, lineHeight: 1.6, maxWidth: 800, margin: '0 auto 32px' }}>
            FairSight Engine is a real-time AI bias compliance layer that detects, explains, and mitigates algorithmic discrimination using statistical fairness metrics and multi-model consensus intelligence.
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 40 }}>
            {[
              { icon: ShieldCheck, text: 'Built for compliance officers & regulators' },
              { icon: Layers, text: 'Powered by Equalized Odds + Demographic Parity' },
              { icon: Bot, text: 'Verified through multi-LLM consensus voting' }
            ].map((anchor, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--white)', border: '1px solid var(--border)', padding: '10px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, color: 'var(--slate)' }}>
                <anchor.icon size={16} color="var(--teal)" />
                {anchor.text}
              </div>
            ))}
          </div>
        </div>

        {/* 2️⃣ The Problem Section */}
        <div className="fade-up delay-1" style={{ marginBottom: 100 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32 }}>The Hidden Risk Inside Every ML Model</h2>
          
          <div className="card hover-lift" style={{ padding: 40 }}>
            <p style={{ color: 'var(--slate)', fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
              Enterprises deploy ML systems for <strong style={{ color: 'var(--navy)' }}>credit approval, hiring pipelines, fraud detection, insurance scoring, and policing analytics.</strong>
            </p>
            <p style={{ color: 'var(--navy)', fontSize: 18, fontWeight: 700, lineHeight: 1.7, marginBottom: 24 }}>
              But those systems inherit historical bias from training data.
            </p>
            <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)', padding: 24, borderRadius: 12, marginBottom: 24 }}>
              <p style={{ color: 'var(--red)', fontSize: 15, margin: 0, fontWeight: 500 }}>
                Traditional audit tools require Python pipelines, statistical expertise, and weeks of manual evaluation — leaving compliance teams blind to algorithmic liability.
              </p>
            </div>
            <div style={{ display: 'inline-flex', background: 'var(--teal-dim)', color: 'var(--teal)', padding: '12px 24px', borderRadius: 8, fontWeight: 700, fontSize: 16 }}>
              FairSight transforms fairness auditing into a one-click compliance workflow.
            </div>
          </div>
        </div>

        {/* 3️⃣ The Solution Layer */}
        <div className="fade-up delay-2" style={{ marginBottom: 100 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32 }}>The FairSight Compliance Engine</h2>
          
          <div className="card hover-lift" style={{ padding: 40, borderTop: '4px solid var(--teal)' }}>
            <p style={{ color: 'var(--slate)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
              FairSight silently sits between <strong style={{ color: 'var(--navy)' }}>Dataset → Model Predictions → Regulatory Reporting</strong> and automatically produces:
            </p>
            
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
              {['bias detection', 'causal indicators', 'counterfactual simulations', 'mitigation guidance', 'board-ready compliance PDFs'].map((output, i) => (
                <span key={i} className="badge badge-clear" style={{ fontSize: 13, padding: '8px 16px', background: 'rgba(34,197,94,0.1)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20 }}>
                  ✓ {output}
                </span>
              ))}
            </div>

            <p style={{ color: 'var(--navy)', fontSize: 16, lineHeight: 1.7, margin: 0, fontWeight: 600 }}>
              FairSight converts raw prediction logs into measurable fairness guarantees using mathematically grounded bias metrics and a consensus-driven AI reasoning layer. We employ a zero-retention architecture, meaning raw PII data is never stored, immediately eliminating GDPR liability.
            </p>
          </div>
        </div>

        {/* 4️⃣ Core Innovation Stack */}
        <div className="fade-up" style={{ marginBottom: 100 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32 }}>What Makes FairSight Different</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 24 }}>
            <div className="card hover-lift" style={{ padding: 32 }}>
              <Bot color="var(--teal)" size={32} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>Multi-Model Consensus Engine</h3>
              <p style={{ fontSize: 15, color: 'var(--slate)', lineHeight: 1.6, marginBottom: 16 }}>
                Instead of trusting one LLM, FairSight queries multiple independent AI reasoning systems simultaneously (Gemini, Groq, Mistral, HuggingFace) and assigns a final verdict using majority-weighted consensus scoring.
              </p>
              <ul style={{ paddingLeft: 20, color: 'var(--slate)', fontSize: 14, margin: 0 }}>
                <li>Eliminates hallucination risk</li>
                <li>Prevents API instability</li>
                <li>Increases regulatory confidence</li>
                <li>Creates explainable audit trails</li>
              </ul>
            </div>

            <div className="card hover-lift" style={{ padding: 32 }}>
              <Search color="var(--teal)" size={32} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>Intersectional Radar</h3>
              <p style={{ fontSize: 15, color: 'var(--slate)', lineHeight: 1.6, marginBottom: 16 }}>
                Traditional audits check only Race or Gender. FairSight evaluates compound vectors: Race × Gender, Age × Income, Location × Education.
              </p>
              <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 14, color: 'var(--navy)', fontWeight: 600, borderLeft: '3px solid var(--teal)' }}>
                FairSight detects compound discrimination invisible to single-axis fairness testing.
              </div>
            </div>

            <div className="card hover-lift" style={{ padding: 32 }}>
              <FileWarning color="var(--teal)" size={32} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>Proxy Feature Detection</h3>
              <p style={{ fontSize: 15, color: 'var(--slate)', lineHeight: 1.6, marginBottom: 16 }}>
                Even if "Race" is removed, models may still learn discrimination through zip code, browser type, school name, or employment gap.
              </p>
              <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 14, color: 'var(--navy)', fontWeight: 600, borderLeft: '3px solid var(--teal)' }}>
                FairSight automatically flags proxy leakage channels.
              </div>
            </div>

            <div className="card hover-lift" style={{ padding: 32 }}>
              <Cpu color="var(--teal)" size={32} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>Generative Flip Testing</h3>
              <p style={{ fontSize: 15, color: 'var(--slate)', lineHeight: 1.6, marginBottom: 16 }}>
                Would the same applicant be approved if gender changed?
              </p>
              <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 14, color: 'var(--navy)', fontWeight: 600, borderLeft: '3px solid var(--teal)' }}>
                FairSight simulates counterfactual identity flips to expose hidden decision asymmetry.
              </div>
            </div>
          </div>
        </div>

        {/* 5️⃣ The Statistical Bias Engine */}
        <div className="fade-up" style={{ marginBottom: 100 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32 }}>Mathematical Fairness Backbone</h2>
          
          <div className="card hover-lift" style={{ padding: 40, borderLeft: '4px solid var(--navy)' }}>
            <p style={{ color: 'var(--slate)', fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>
              FairSight evaluates models using industry-recognized fairness constraints:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginBottom: 32 }}>
              {['Equalized Odds', 'Demographic Parity', 'Predictive Equality', 'Disparate Impact Ratio'].map((metric, i) => (
                <div key={i} style={{ padding: '16px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 700, color: 'var(--navy)' }}>
                  ∑ {metric}
                </div>
              ))}
            </div>
            <div style={{ padding: 20, background: 'rgba(34,197,94,0.08)', borderRadius: 12, border: '1px solid rgba(34,197,94,0.2)' }}>
              <p style={{ color: 'var(--green)', fontSize: 16, margin: 0, fontWeight: 600 }}>
                These metrics transform abstract ethical concerns into measurable compliance signals. This makes your system regulator-ready.
              </p>
            </div>
          </div>
        </div>

        {/* 6️⃣ Interactive Mitigation Engine */}
        <div className="fade-up" style={{ marginBottom: 100 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32 }}>Interactive Mitigation Engine</h2>
          <div className="card hover-lift" style={{ padding: 40, background: 'var(--teal-dim)', borderColor: 'rgba(20,184,166,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Scaling size={28} color="var(--teal)" />
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Before vs After Simulation Engine</h3>
            </div>
            <p style={{ color: 'var(--slate)', fontSize: 16, lineHeight: 1.7, margin: 0 }}>
              FairSight demonstrates fairness improvement interactively by simulating decision boundary adjustments and visualizing Equalized Odds recovery in real time. Our <strong>Magic Debiasing</strong> uses the Kamiran & Calders (2012) algorithmic reweighing standard to output a debiased copy of your data instantly. We don't just find problems; we sandbox the exact mathematical thresholds required to fix them.
            </p>
          </div>
        </div>

        {/* 7️⃣ Advanced Platform Modules */}
        <div className="fade-up" style={{ marginBottom: 100 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32 }}>Enterprise Architecture & Integrations</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            
            {/* The Constitution */}
            <div className="card hover-lift" style={{ padding: 32, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', border: 'none' }}>
              <ShieldCheck color="var(--teal)" size={32} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--white)', marginBottom: 12 }}>The AI Constitution Editor</h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
                Write fairness rules in plain English (e.g., "Demographic parity gap must not exceed 10%"). Our Gemini 1.5 Flash agent translates it into strict JSON constraints applied across the entire organization. Features full Check, Modify, Verify, and Delete workflows.
              </p>
            </div>

            {/* DevHub & SDK */}
            <div className="card hover-lift" style={{ padding: 32 }}>
              <Code2 color="var(--teal)" size={32} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>DevHub & Python SDK</h3>
              <p style={{ fontSize: 15, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>
                The <span className="mono">fairsight</span> pip package allows direct instrumentation of ML pipelines. The interactive DevHub modal generates copy-paste FastAPI, Python, and cURL snippets injected with your real API keys for instant onboarding.
              </p>
            </div>

            {/* Active Firewall */}
            <div className="card hover-lift" style={{ padding: 32 }}>
              <Shield color="#dc2626" size={32} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>Live Fairness Firewall</h3>
              <p style={{ fontSize: 15, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>
                A proactive runtime security layer that intercepts live model decisions, runs an internal counterfactual flip-test in milliseconds, and blocks discriminatory decisions before they reach end-users. Includes a live dashboard tracking "Blocked Rate" and "Bias Magnitude".
              </p>
            </div>

            {/* RLHF Feedback */}
            <div className="card hover-lift" style={{ padding: 32 }}>
              <MessagesSquare color="#3b82f6" size={32} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>RLHF Human Feedback Loop</h3>
              <p style={{ fontSize: 15, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>
                Every audit verdict supports human validation. Auditors can flag incorrect severity, false positive proxies, or unhelpful mitigations. This Reinforcement Learning from Human Feedback refines our internal confidence engine over time.
              </p>
            </div>
            
            {/* Transparency Badges */}
            <div className="card hover-lift" style={{ padding: 32 }}>
              <CheckCircle2 color="#22c55e" size={32} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>Public Transparency Badges</h3>
              <p style={{ fontSize: 15, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>
                Generate live, color-coded SVG compliance badges (HTML/Markdown) that sync with your latest audit score. Embed them on corporate websites or GitHub READMEs to publicly demonstrate ESG and AI ethics compliance.
              </p>
            </div>

            {/* Adversarial Bias Lab */}
            <div className="card hover-lift" style={{ padding: 32 }}>
              <AlertTriangle color="#f59e0b" size={32} style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 12 }}>Adversarial Bias Lab</h3>
              <p style={{ fontSize: 15, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>
                A dedicated sandbox environment where compliance teams can intentionally inject synthetic demographic calibration gaps into simulated pipelines to watch the fairness score decay live—teaching stakeholders what bias looks like mathematically.
              </p>
            </div>

          </div>
        </div>

        {/* 8️⃣ User Journey Flow */}
        <div className="fade-up" style={{ marginBottom: 100 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32 }}>From Dataset to Compliance Report in 5 Steps</h2>
          
          <div className="card hover-lift" style={{ padding: '40px 48px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 20, bottom: 20, left: 19, width: 2, background: 'var(--border)', zIndex: 0 }} />

              {[
                { 
                  title: 'Step 1 — Upload & Hash', 
                  desc: 'User uploads CSV containing predictions. Platform generates a SHA-256 fingerprint for tamper-proof compliance trails.' 
                },
                { 
                  title: 'Step 2 — Hyper-Scan Execution', 
                  desc: 'Platform computes: 12 fairness matrices, intersectional correlations, proxy leakage signals, and LLM consensus voting.' 
                },
                { 
                  title: 'Step 3 — Verdict & Constitution Engine', 
                  desc: 'System outputs: CLEAR, WARNING, or GUILTY. The active Constitution rules automatically scan the results to issue a GDPR / EU AI Act violation badge if constraints are breached.' 
                },
                { 
                  title: 'Step 4 — Mitigation & Sandboxing', 
                  desc: 'User adjusts threshold sliders to project score improvements. If desired, Magic Debiasing generates a clean dataset.' 
                },
                { 
                  title: 'Step 5 — Compliance Export', 
                  desc: 'One-click generation of the Board-Ready PDF Certificate, raw JSON telemetry, and AI-synthesized executive summaries.' 
                }
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 24, position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: 'var(--white)', border: '2px solid var(--teal)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--teal)', fontSize: 15, flexShrink: 0
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ paddingTop: 8 }}>
                    <h4 style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)', marginBottom: 8 }}>{step.title}</h4>
                    <p style={{ fontSize: 15, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 9️⃣ Internal Component Intelligence */}
        <div className="fade-up" style={{ marginBottom: 100 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32 }}>Core Interface Modules</h2>
          
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {[
              { name: 'ModelConsensusPanel.tsx', desc: 'Aggregates verdicts from multiple AI engines, synthesizes the Executive Board Summary, and computes final severity classification.' },
              { name: 'IntersectionalRadar.tsx', desc: 'Visualizes multi-attribute discrimination overlap using polygonal disparity mapping.' },
              { name: 'LiveFeed & DriftChart.tsx', desc: 'Tracks live WebSocket telemetry from production SDKs to calculate fairness decay slopes in real time.' },
              { name: 'VerdictTimeline.tsx & FairnessIndex.tsx', desc: 'Displays organizational compliance trajectory over time and ranks performance against industry averages.' },
              { name: 'ScanningOverlay.tsx', desc: 'Simulated computation terminal designed to visualize mathematical operations and increase UX trust during audit execution.' },
            ].map((comp, i) => (
              <div key={comp.name} style={{ display: 'flex', gap: 24, padding: '24px 32px', borderBottom: i === 4 ? 'none' : '1px solid var(--border)', background: i % 2 === 0 ? 'var(--white)' : '#f8fafc' }}>
                <div style={{ marginTop: 2 }}>
                  <Database color="var(--slate-light)" size={18} />
                </div>
                <div>
                  <h4 className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>{comp.name}</h4>
                  <p style={{ fontSize: 14, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>{comp.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 🔟 Compliance Use Cases Section */}
        <div className="fade-up" style={{ marginBottom: 100 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32 }}>Who FairSight Is Built For</h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {['Banks', 'FinTech companies', 'Hiring platforms', 'Insurance providers', 'Government analytics teams', 'AI compliance auditors', 'Risk officers'].map((role, i) => (
              <div key={i} style={{ padding: '12px 24px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 30, fontSize: 15, fontWeight: 600, color: 'var(--navy)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                {role}
              </div>
            ))}
          </div>
        </div>

        {/* 11 Trust Section */}
        <div className="fade-up" style={{ marginBottom: 40 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32 }}>Why FairSight Matters Now</h2>
          
          <div className="card hover-lift" style={{ padding: 40, borderTop: '4px solid var(--navy)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Shield size={32} color="var(--navy)" />
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>The Compliance Imperative</h3>
            </div>
            <p style={{ color: 'var(--slate)', fontSize: 16, lineHeight: 1.7, margin: 0 }}>
              As AI regulation frameworks like the <strong>EU AI Act</strong> and emerging algorithmic accountability laws expand globally, organizations must demonstrate measurable fairness guarantees. FairSight provides the infrastructure layer required to operationalize responsible AI deployment at scale.
            </p>
          </div>
        </div>

      </div>
    </>
  )
}
