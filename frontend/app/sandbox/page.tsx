'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, RefreshCw, AlertTriangle, CheckCircle, Sliders } from 'lucide-react'
import { evaluate, flipProfile, ApplicantProfile, DecisionResult } from './CounterfactualEngine'
import { BiasLabTab } from './BiasLabTab'

const DEFAULT_PROFILE: ApplicantProfile = {
  name: 'Jordan Lee',
  race: 'White',
  gender: 'Male',
  age: 34,
  income: '$60k–$80k',
  credit_score: 'Good',
  employment: 'Full-time',
  debt_ratio: 'Low (<30%)',
}

export default function SandboxPage() {
  const [activeTab, setActiveTab] = useState<'counterfactual' | 'lab'>('counterfactual')
  const [profile, setProfile] = useState<ApplicantProfile>(DEFAULT_PROFILE)
  const [flipped, setFlipped] = useState(false)
  const [flippedProfile, setFlippedProfile] = useState<ApplicantProfile | null>(null)

  const current = evaluate(profile)
  const flippedResult: DecisionResult | null = flippedProfile ? evaluate(flippedProfile) : null
  const biasDetected = flippedResult !== null && flippedResult.decision !== current.decision

  const update = (key: keyof ApplicantProfile, val: string | number) => {
    setFlipped(false)
    setFlippedProfile(null)
    setProfile(p => ({ ...p, [key]: val }))
  }

  const handleFlip = () => {
    const fp = flipProfile(profile)
    setFlippedProfile(fp)
    setFlipped(true)
  }

  const ACCENT = '#7c3aed'
  const ACCENT_LIGHT = 'rgba(124,58,237,0.08)'

  return (
    <div className="page-container fade-up">
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div className="label" style={{ color: ACCENT }}>Interactive Environments</div>
            <h1 className="section-title text-gradient gradient-primary" style={{ fontSize: 40, marginTop: 8, letterSpacing: '-0.02em', margin: 0 }}>
              Fairness Sandbox
            </h1>
          </div>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.4)', borderRadius: 12, padding: 6, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.02)' }}>
            <button onClick={() => setActiveTab('counterfactual')}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none', background: activeTab === 'counterfactual' ? 'var(--white)' : 'transparent',
                color: activeTab === 'counterfactual' ? 'var(--navy)' : 'var(--slate)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                boxShadow: activeTab === 'counterfactual' ? '0 2px 10px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}>
              Counterfactual Flip Test
            </button>
            <button onClick={() => setActiveTab('lab')}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none', background: activeTab === 'lab' ? 'var(--white)' : 'transparent',
                color: activeTab === 'lab' ? 'var(--navy)' : 'var(--slate)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                boxShadow: activeTab === 'lab' ? '0 2px 10px rgba(0,0,0,0.08)' : 'none',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
              }}>
              <Sliders size={14} /> Adversarial Bias Lab
            </button>
          </div>
        </div>
        <p style={{ color: 'var(--slate)', fontSize: 16, lineHeight: 1.6, maxWidth: 640 }}>
          {activeTab === 'counterfactual'
            ? "Build a fictional applicant profile. See the model's decision. Then flip the demographics — only race and gender change. If the decision flips, that is the legal definition of disparate treatment."
            : "Inject synthetic bias into a simulated evaluation pipeline. Watch how small demographic calibration gaps cascade into failing fairness scores in real-time."}
        </p>
      </div>

      {activeTab === 'lab' ? (
        <BiasLabTab />
      ) : (
        <>
          {/* Bias / No-bias banner */}
      {flipped && (
        <div style={{
          padding: '14px 20px', borderRadius: 12, marginBottom: 28,
          background: biasDetected ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
          border: `1.5px solid ${biasDetected ? '#ef4444' : '#22c55e'}`,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          {biasDetected ? <AlertTriangle size={20} color="#ef4444" style={{ marginTop: 2 }} /> : <CheckCircle size={20} color="#22c55e" style={{ marginTop: 2 }} />}
          <div>
            <div style={{ fontWeight: 700, color: biasDetected ? '#ef4444' : '#16a34a', fontSize: 15 }}>
              {biasDetected
                ? '⚠ Bias Detected: Only protected attributes changed.'
                : '✓ No flip detected for this profile combination.'}
            </div>
            {biasDetected && (
              <div style={{ color: 'var(--slate)', fontSize: 14, marginTop: 4 }}>
                Decision flipped from <strong>{current.decision}</strong> → <strong>{flippedResult!.decision}</strong>.&nbsp;
                This is the legal definition of <strong>disparate treatment</strong> under Title VII and the EU AI Act.
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
        {/* LEFT: Profile inputs */}
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>
            Applicant Profile
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Name (cosmetic)</label>
              <input
                type="text" value={profile.name}
                onChange={e => update('name', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            {/* Race */}
            <SelectField label="Race" value={profile.race} onChange={v => update('race', v)} options={['White', 'Black', 'Hispanic', 'Asian']} accent={ACCENT} />
            {/* Gender */}
            <SelectField label="Gender" value={profile.gender} onChange={v => update('gender', v)} options={['Male', 'Female']} accent={ACCENT} />
            {/* Age */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Age</label>
              <input
                type="number" min={25} max={65} value={profile.age}
                onChange={e => update('age', Number(e.target.value))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <SelectField label="Annual Income" value={profile.income} onChange={v => update('income', v)} options={['Under $40k', '$40k–$60k', '$60k–$80k', 'Over $80k']} accent={ACCENT} />
            <SelectField label="Credit Score Band" value={profile.credit_score} onChange={v => update('credit_score', v)} options={['Excellent', 'Good', 'Fair', 'Poor']} accent={ACCENT} />
            <SelectField label="Employment Status" value={profile.employment} onChange={v => update('employment', v)} options={['Full-time', 'Part-time', 'Self-employed', 'Unemployed']} accent={ACCENT} />
            <SelectField label="Debt-to-Income Ratio" value={profile.debt_ratio} onChange={v => update('debt_ratio', v)} options={['Low (<30%)', 'Medium (30–50%)', 'High (>50%)']} accent={ACCENT} />
          </div>

          <button
            onClick={handleFlip}
            style={{
              marginTop: 24, width: '100%', padding: '13px', borderRadius: 10,
              background: ACCENT, color: '#fff', border: 'none', fontWeight: 700,
              fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
            }}
          >
            <RefreshCw size={16} /> Flip Demographics →
          </button>
        </div>

        {/* RIGHT: Decision panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <DecisionPanel
            title="Original Profile"
            profile={profile}
            result={current}
            accent={ACCENT}
            accentLight={ACCENT_LIGHT}
          />
          {flipped && flippedProfile && flippedResult && (
            <DecisionPanel
              title="Flipped Demographics"
              profile={flippedProfile}
              result={flippedResult}
              accent="#ef4444"
              accentLight="rgba(239,68,68,0.08)"
            />
          )}
        </div>
      </div>

      {/* Comparison table */}
      {flipped && flippedProfile && flippedResult && (
        <div className="card fade-up" style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Side-by-Side Comparison</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['Field', 'Original', 'Flipped'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', background: 'var(--bg)', fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1.5px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { field: 'Name', orig: profile.name, flip: flippedProfile.name },
                { field: 'Race', orig: profile.race, flip: flippedProfile.race },
                { field: 'Gender', orig: profile.gender, flip: flippedProfile.gender },
                { field: 'Income', orig: profile.income, flip: flippedProfile.income },
                { field: 'Credit Score', orig: profile.credit_score, flip: flippedProfile.credit_score },
                { field: 'Decision', orig: current.decision, flip: flippedResult.decision },
              ].map(row => (
                <tr key={row.field} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--navy)' }}>{row.field}</td>
                  <td style={{ padding: '10px 12px', color: row.field === 'Decision' ? (current.decision === 'APPROVED' ? '#22c55e' : '#ef4444') : 'var(--slate)', fontWeight: row.field === 'Decision' ? 700 : 400 }}>{row.orig}</td>
                  <td style={{ padding: '10px 12px', color: row.field === 'Decision' ? (flippedResult.decision === 'APPROVED' ? '#22c55e' : '#ef4444') : (row.orig !== row.flip ? ACCENT : 'var(--slate)'), fontWeight: (row.field === 'Decision' || row.orig !== row.flip) ? 700 : 400 }}>{row.flip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <Link href="/audit" className="btn btn-teal">
          Run Full Audit <ArrowRight size={15} />
        </Link>
        <Link href="/preflight" className="btn btn-outline">
          Pre-Flight Scanner
        </Link>
      </div>
        </>
      )}
    </div>
  )
}

function SelectField({ label, value, onChange, options, accent }: { label: string; value: string; onChange: (v: string) => void; options: string[]; accent: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 14, background: 'white', cursor: 'pointer', boxSizing: 'border-box' }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function DecisionPanel({ title, profile, result, accent, accentLight }: { title: string; profile: ApplicantProfile; result: DecisionResult; accent: string; accentLight: string }) {
  const approved = result.decision === 'APPROVED'
  return (
    <div className="card" style={{ border: `1.5px solid ${accent}`, background: accentLight }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div style={{
          padding: '12px 24px', borderRadius: 12, fontWeight: 800, fontSize: 22,
          background: approved ? '#22c55e' : '#ef4444', color: '#fff',
          boxShadow: `0 4px 20px ${approved ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}>
          {result.decision}
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--slate)', fontWeight: 600 }}>Score</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy)' }}>{result.score}<span style={{ fontSize: 14, color: 'var(--slate)' }}>/100</span></div>
        </div>
      </div>

      {/* Confidence bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--slate)', marginBottom: 4, fontWeight: 600 }}>
          <span>Confidence</span><span>{(result.confidence * 100).toFixed(0)}%</span>
        </div>
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${result.confidence * 100}%`, background: accent, borderRadius: 4, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* Factors */}
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Contributing Factors</div>
      {result.contributingFactors.slice(0, 5).map(f => (
        <div key={f.feature} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--slate)', flex: 1 }}>{f.feature}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: f.direction === 'for' ? '#22c55e' : '#ef4444', marginLeft: 8 }}>
            {f.direction === 'for' ? '+' : '-'}{f.weight}
          </span>
        </div>
      ))}
    </div>
  )
}
