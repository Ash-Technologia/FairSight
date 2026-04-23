'use client'
import { FlipTest } from '@/lib/types'

interface FlipTestCardProps {
  data: FlipTest
}

export function FlipTestCard({ data }: FlipTestCardProps) {
  if (!data) return null

  return (
    <div className="card-dark" style={{ marginBottom: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
          Counterfactual Flip Test
        </span>
        {data.flip_detected && (
          <span style={{ fontSize: 10, background: 'var(--red-dim)', color: 'var(--red-strong)', padding: '3px 10px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase', border: '1px solid var(--red)' }}>
            ⚠ Flip Detected
          </span>
        )}
      </div>

      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20, lineHeight: 1.6 }}>
        The same applicant profile was submitted twice — with only the protected attribute changed.
        This is the legal standard used in discrimination lawsuits.
      </p>

      {/* Pairs */}
      {data.pairs && data.pairs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.pairs.map((pair, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
              {/* Group A */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 16px', flex: 1 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                  {pair.profile_a.label}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    background: pair.outcome_a === 'REJECTED' ? 'var(--red-dim)' : 'var(--green-dim)',
                    color: pair.outcome_a === 'REJECTED' ? 'var(--red-strong)' : 'var(--green-strong)',
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                    border: `1px solid ${pair.outcome_a === 'REJECTED' ? 'var(--red)' : 'var(--green)'}`
                  }}>
                    {pair.outcome_a}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Mono, monospace' }}>
                    {(pair.approval_rate_a * 100).toFixed(0)}% approval
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 20, flexShrink: 0 }}>
                ↔
              </div>

              {/* Group B */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 16px', flex: 1 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                  {pair.profile_b.label}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    background: pair.outcome_b === 'REJECTED' ? 'var(--red-dim)' : 'var(--green-dim)',
                    color: pair.outcome_b === 'REJECTED' ? 'var(--red-strong)' : 'var(--green-strong)',
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                    border: `1px solid ${pair.outcome_b === 'REJECTED' ? 'var(--red)' : 'var(--green)'}`
                  }}>
                    {pair.outcome_b}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'DM Mono, monospace' }}>
                    {(pair.approval_rate_b * 100).toFixed(0)}% approval
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
          No flip pairs detected
        </div>
      )}

      {/* Interpretation */}
      <div style={{
        marginTop: 16, padding: '12px 16px', borderRadius: 10,
        background: data.flip_detected ? 'var(--red-dim)' : 'var(--card-bg)',
        border: `1px solid ${data.flip_detected ? 'var(--red)' : 'var(--border)'}`,
        fontSize: 13,
        color: data.flip_detected ? 'var(--red-strong)' : 'var(--slate)'
      }}>
        {data.interpretation}
        {data.flip_detected && (
          <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--red-strong)', fontWeight: 600 }}>
            ({data.flip_count}/{data.total_tests} tests positive)
          </span>
        )}
      </div>
    </div>
  )
}
