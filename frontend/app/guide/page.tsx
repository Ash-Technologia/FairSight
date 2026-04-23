'use client'
import { Target, Lightbulb, ShieldCheck, Search, Database, Layers, Network, Zap, CheckCircle2, Bot, FileWarning, Cpu, Shield, Clock, BookOpen, Scaling } from 'lucide-react'

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
              FairSight converts raw prediction logs into measurable fairness guarantees using mathematically grounded bias metrics and a consensus-driven AI reasoning layer.
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
                Instead of trusting one LLM, FairSight queries multiple independent AI reasoning systems simultaneously and assigns a final verdict using majority-weighted consensus scoring.
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

        {/* ⭐ Optional: Before vs After Simulation */}
        <div className="fade-up" style={{ marginBottom: 100 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32 }}>Interactive Mitigation Engine</h2>
          <div className="card hover-lift" style={{ padding: 40, background: 'var(--teal-dim)', borderColor: 'rgba(20,184,166,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Scaling size={28} color="var(--teal)" />
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Before vs After Simulation Engine</h3>
            </div>
            <p style={{ color: 'var(--slate)', fontSize: 16, lineHeight: 1.7, margin: 0 }}>
              FairSight demonstrates fairness improvement interactively by simulating decision boundary adjustments and visualizing Equalized Odds recovery in real time. We don't just find problems; we sandbox the exact mathematical thresholds required to fix them.
            </p>
          </div>
        </div>

        {/* 6️⃣ User Journey Flow */}
        <div className="fade-up" style={{ marginBottom: 100 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32 }}>From Dataset to Compliance Report in 5 Steps</h2>
          
          <div className="card hover-lift" style={{ padding: '40px 48px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 20, bottom: 20, left: 19, width: 2, background: 'var(--border)', zIndex: 0 }} />

              {[
                { 
                  title: 'Step 1 — Upload Dataset', 
                  desc: 'User uploads CSV containing predictions. No preprocessing required.' 
                },
                { 
                  title: 'Step 2 — Hyper-Scan Execution', 
                  desc: 'Platform computes: 12 fairness matrices, protected attribute correlations, proxy leakage signals, and LLM reasoning consensus. Features our signature "Scanning overlay terminal animation" for powerful UX trust.' 
                },
                { 
                  title: 'Step 3 — Verdict Engine', 
                  desc: 'System outputs: CLEAR, WARNING, or GUILTY alongside a detailed explanation panel and Constitution severity check.' 
                },
                { 
                  title: 'Step 4 — Mitigation Sandbox', 
                  desc: 'User adjusts threshold sliders, decision boundaries, and group weights, watching their fairness score improve live. A killer operational differentiator.' 
                },
                { 
                  title: 'Step 5 — Compliance Export', 
                  desc: 'One-click generation: Board-ready PDF, audit certificate, risk explanation, and metric tables. Perfect for internal governance, legal review, and regulator submission.' 
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

        {/* 7️⃣ Platform Topology */}
        <div className="fade-up" style={{ marginBottom: 100 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32 }}>Platform Modules</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { path: '/audit', title: 'Dataset ingestion engine', icon: Database },
              { path: '/audit/[id]', title: 'Bias diagnostics dashboard', icon: Search },
              { path: '/dashboard', title: 'Historical compliance timeline', icon: Clock },
              { path: '/monitor', title: 'Live API simulation stream', icon: Network },
              { path: '/compliance', title: 'PDF export generator', icon: FileWarning }
            ].map((mod, i) => (
              <div key={i} className="card hover-lift" style={{ display: 'flex', alignItems: 'center', padding: '24px 32px', gap: 24 }}>
                <div style={{ flexShrink: 0, padding: 12, background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <mod.icon color="var(--teal)" size={24} />
                </div>
                <div style={{ width: 140, flexShrink: 0 }}>
                  <div className="mono" style={{ fontSize: 14, color: 'var(--teal)', fontWeight: 700 }}>{mod.path}</div>
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>{mod.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 8️⃣ Internal Component Intelligence */}
        <div className="fade-up" style={{ marginBottom: 100 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32 }}>Core Interface Modules</h2>
          
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {[
              { name: 'ModelConsensusPanel.tsx', desc: 'Aggregates verdicts from multiple AI reasoning engines and computes final severity classification.' },
              { name: 'IntersectionalRadar.tsx', desc: 'Visualizes multi-attribute discrimination overlap using polygonal disparity mapping.' },
              { name: 'ScanningOverlay.tsx', desc: 'Simulated computation terminal designed to increase user trust perception during fairness analysis execution.' },
              { name: 'DriftChart.tsx & BiasMetricBars.tsx', desc: 'Animate fairness metric transitions dynamically to visualize mitigation impact in real time.' },
            ].map((comp, i) => (
              <div key={comp.name} style={{ display: 'flex', gap: 24, padding: '24px 32px', borderBottom: i === 3 ? 'none' : '1px solid var(--border)', background: i % 2 === 0 ? 'var(--white)' : '#f8fafc' }}>
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

        {/* 🆕 FEATURE: THE CONSTITUTION */}
        <div className="fade-up" style={{ marginBottom: 100 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShieldCheck color="var(--teal)" size={32} /> The FairSight Constitution
          </h2>
          <div className="card" style={{ padding: 40, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', border: 'none' }}>
            <p style={{ fontSize: 18, lineHeight: 1.7, opacity: 0.9, marginBottom: 32 }}>
              The platform is governed by a strict **AI Constitution** — a set of high-order ethical constraints that the Consensus Engine enforces during every audit.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              {[
                { title: 'Demographic Non-Regression', desc: 'Ensures no minority group is statistically worse off after model optimization.' },
                { title: 'Proxy Transparency', desc: 'Mandates disclosure of all hidden identity correlates in decision features.' },
                { title: 'Explanation Fidelity', desc: 'AI verdicts must be provably grounded in the provided statistical drift data.' }
              ].map((law, i) => (
                <div key={i} style={{ padding: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--teal-light)' }}>{law.title}</h4>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{law.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 🆕 FEATURE: TEST FLIGHT & MONITOR */}
        <div className="fade-up" style={{ marginBottom: 100 }}>
          <h2 className="section-title" style={{ fontSize: 32, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Zap color="var(--amber)" size={32} /> Real-Time Test Flight
          </h2>
          <div className="card" style={{ padding: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>Shadow Monitoring Mode</h3>
                <p style={{ color: 'var(--slate)', fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
                  Deploy FairSight in **Shadow Mode** to analyze production traffic without interfering with model latency. The SDK streams decisions to our monitoring engine via asynchronous WebSockets.
                </p>
                <div style={{ padding: '12px 20px', background: 'var(--bg)', borderRadius: 10, fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--teal)' }}>
                  $ fairsight monitor --port 8080 --shadow
                </div>
              </div>
              <div style={{ background: 'var(--navy)', borderRadius: 16, padding: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                {/* Simplified Monitor UI Mockup */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f56' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27c93f' }} />
                </div>
                <div style={{ fontSize: 11, color: '#4ade80', fontFamily: 'DM Mono, monospace' }}>[16:42:01] DECISION: APPROVED</div>
                <div style={{ fontSize: 11, color: '#4ade80', fontFamily: 'DM Mono, monospace' }}>[16:42:04] DECISION: APPROVED</div>
                <div style={{ fontSize: 11, color: '#f87171', fontFamily: 'DM Mono, monospace' }}>[16:42:08] BIAS ALERT: PROTECTED GROUP [A]</div>
              </div>
            </div>
          </div>
        </div>

        {/* 9️⃣ Compliance Use Cases Section */}
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

        {/* 🔟 Trust Section */}
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
