'use client'
import { GeminiVerdict } from '@/lib/types'

interface ModelConsensusPanelProps {
  verdicts: {
    gemini?:     GeminiVerdict | null
    groq?:       GeminiVerdict | null
    ollama?:     GeminiVerdict | null
    huggingface?: GeminiVerdict | null
    mistral?:    GeminiVerdict | null
  }
  latencies?: {
    gemini?:     number
    groq?:       number
    ollama?:     number
    huggingface?: number
    mistral?:    number
  }
  boardMode: boolean
  onToggleBoardMode: () => void
  boardSummary?: string
  synthesizedRootCause?: string
  consensusLevel?: 'strong' | 'partial' | 'split'
}

const PROVIDERS = [
  { id: 'groq',       name: 'Llama 3.3 70B (Ultra-Fast)', provider: 'Groq',        icon: '⚡', color: 'var(--amber)',  className: 'model-groq' },
  { id: 'gemini',     name: 'Gemini 2.5 Flash',           provider: 'Google',       icon: '✨', color: 'var(--teal)',   className: 'model-gemini' },
  { id: 'mistral',    name: 'Mistral Small',               provider: 'Mistral AI',   icon: '🌊', color: 'var(--indigo)', className: 'model-mistral' },
  { id: 'ollama',     name: 'Mistral (Local)',             provider: 'Ollama',       icon: '🏠', color: 'var(--slate)',  className: 'model-ollama' },
  { id: 'huggingface',name: 'Qwen / Llama 4',             provider: 'HuggingFace',  icon: '🤗', color: 'var(--purple)', className: 'model-hf' },
]

export function ModelConsensusPanel({
  verdicts,
  latencies,
  boardMode,
  onToggleBoardMode,
  boardSummary,
  synthesizedRootCause,
  consensusLevel
}: ModelConsensusPanelProps) {

  // Collect the available verdicts
  const activeVerdicts = PROVIDERS.filter(p => verdicts[p.id as keyof typeof verdicts])
  if (activeVerdicts.length === 0) return null

  // Check if we have disagreement
  let disagreementFound = false
  const severities = activeVerdicts.map(p => verdicts[p.id as keyof typeof verdicts]?.severity)
  if (severities.length > 1) {
    const first = severities[0]
    disagreementFound = !severities.every(s => s === first)
  }

  // Calculate consensus meter stats
  const agreementRatio = consensusLevel === 'strong' ? 1 
    : consensusLevel === 'partial' ? 0.66 
    : consensusLevel === 'split' ? 0.33 
    : (!disagreementFound ? 1 : 0.5)
  
  const agreementColor = agreementRatio === 1 ? 'var(--green)' : agreementRatio > 0.5 ? 'var(--amber)' : 'var(--red)'

  return (
    <div className="card fade-up delay-2" style={{ padding: 0, overflow: 'hidden', marginBottom: 32, border: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>🧠</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--navy)' }}>
            Multi-Model AI Consensus
          </h2>
        </div>
        
        <button 
          onClick={onToggleBoardMode}
          className="hover-lift"
          style={{ 
            background: boardMode ? 'var(--navy)' : 'var(--bg)', 
            color: boardMode ? 'var(--white)' : 'var(--slate)',
            border: '1px solid var(--border)', 
            padding: '8px 18px', borderRadius: 24, 
            fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {boardMode ? 'Board Mode: ON' : 'Board Mode: OFF'}
        </button>
      </div>

      {boardMode ? (
        <div style={{ padding: '32px 32px 40px' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 32, border: '1px solid var(--border)', fontSize: 18, color: 'var(--navy)', lineHeight: 1.8, fontWeight: 500, boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
            {boardSummary || "No board summary available for this decision."}
          </div>
        </div>
      ) : (
        <div style={{ padding: '24px 24px 32px' }}>
          
          {/* Consensus Meter & Disagreement Banner */}
          {activeVerdicts.length > 1 && (
            <div style={{ marginBottom: 24 }}>
              {disagreementFound ? (
                <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18 }}>⚠</span>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--red-strong)' }}>Model Disagreement Detected</h4>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--red-strong)', opacity: 0.9, lineHeight: 1.5 }}>
                      The AI compliance engines returned conflicting severity ratings. Manual review of this decision is strongly recommended.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: 12, padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 18, color: 'var(--green-strong)' }}>✓</span>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--green-strong)' }}>Strong Consensus</h4>
                    <div style={{ fontSize: 12, color: 'var(--green-strong)', opacity: 0.8, marginTop: 2 }}>{activeVerdicts.length}/{activeVerdicts.length} models agree on the verdict severity.</div>
                  </div>
                  <div style={{ width: 100, marginLeft: 16 }}>
                    <div className="consensus-bar"><div className="consensus-fill" style={{ width: `${agreementRatio * 100}%`, background: agreementColor }} /></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Synthesized Root Cause */}
          {synthesizedRootCause && (
            <div style={{ background: 'var(--teal-dim)', border: '1px solid var(--teal)', borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--teal-strong)' }}>
                Synthesized Root Cause
              </h4>
              <p style={{ margin: 0, fontSize: 15, color: 'var(--teal-strong)', opacity: 0.95, lineHeight: 1.6, fontWeight: 500 }}>
                {synthesizedRootCause}
              </p>
            </div>
          )}

          {/* Model Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {activeVerdicts.map((p, i) => {
              const data = verdicts[p.id as keyof typeof verdicts]!
              const time = latencies?.[p.id as keyof typeof latencies]
              const severityCls = `severity-${data.severity.toLowerCase()}`

              return (
                <div key={p.id} className={`stat-card fade-up delay-${i + 2}`} style={{ padding: 20, position: 'relative' }}>
                  {/* Color bar top */}
                  <div className={p.className} style={{ position: 'absolute', top: 0, left: 16, right: 16, borderRadius: '0 0 4px 4px' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{p.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.provider}</div>
                      </div>
                    </div>
                    <span className={`severity-chip ${severityCls}`}>{data.severity}</span>
                  </div>

                  <p style={{ fontSize: 14, color: 'var(--slate)', lineHeight: 1.6, flex: 1, margin: 0 }}>
                    {data.summary}
                  </p>

                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Top Mitigations</div>
                    <ul style={{ margin: 0, paddingLeft: 16, color: 'var(--navy)', fontSize: 12, lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {data.mitigations.slice(0, 2).map((m, idx) => (
                        <li key={idx}><strong>{m.title}</strong>: {m.expected_improvement}</li>
                      ))}
                    </ul>
                  </div>

                  {time !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                      <span style={{ fontSize: 10, background: 'var(--bg)', padding: '2px 8px', borderRadius: 10, color: 'var(--slate)', fontFamily: 'DM Mono, monospace' }}>
                        {(time / 1000).toFixed(2)}s
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      )}
    </div>
  )
}
