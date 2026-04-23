'use client'
import { useState } from 'react'
import { Copy, Check, Filter } from 'lucide-react'

interface ProxyHeatmapProps {
  auditId: string
  correlationMatrix: Record<string, Record<string, number>>
  proxyFeatures: string[]
  proxyThreshold?: number
}

const getCellColor = (corr: number): string => {
  if (corr >= 0.25) return '#fecaca'  // red-200
  if (corr >= 0.15) return '#fed7aa'  // orange-200
  if (corr >= 0.05) return '#fef08a'  // yellow-200
  return '#dcfce7'                     // green-100
}

const getCellTextColor = (corr: number): string => {
  if (corr >= 0.25) return '#991b1b'  // red-800
  if (corr >= 0.15) return '#9a3412'  // orange-800
  if (corr >= 0.05) return '#854d0e'  // yellow-800
  return '#166534'                     // green-800
}

const getEmoji = (corr: number): string => {
  if (corr >= 0.25) return '🔴'
  if (corr >= 0.15) return '🟠'
  if (corr >= 0.05) return '🟡'
  return '🟢'
}

export function ProxyHeatmap({ auditId, correlationMatrix, proxyFeatures, proxyThreshold = 0.15 }: ProxyHeatmapProps) {
  const [copied, setCopied] = useState(false)
  const [showAll, setShowAll] = useState(false)

  // Avoid empty rendering
  if (!correlationMatrix || Object.keys(correlationMatrix).length < 2) return null

  // Extract all protected attributes from the first feature
  const firstFeature = Object.keys(correlationMatrix)[0]
  if (!firstFeature) return null
  const protectedAttrs = Object.keys(correlationMatrix[firstFeature])

  // Sort features by max correlation across any protected attribute (descending)
  const features = Object.keys(correlationMatrix).map(feat => {
    const maxCorr = Math.max(...protectedAttrs.map(attr => correlationMatrix[feat][attr] || 0))
    return { feat, maxCorr }
  }).sort((a, b) => b.maxCorr - a.maxCorr)

  const displayFeatures = showAll ? features : features.slice(0, 10)
  const actualProxies = proxyFeatures.length > 0 ? proxyFeatures : features.filter(f => f.maxCorr >= proxyThreshold).map(f => f.feat)

  const copyCode = () => {
    const snippet = `# FairSight — Remove proxy features before training
# Generated from audit #${auditId.split('-')[0]}
import pandas as pd

df = pd.read_csv("your_dataset.csv")
proxy_features = ${JSON.stringify(actualProxies)}
df_clean = df.drop(columns=proxy_features, errors='ignore')
print(f"Removed {len(actualProxies)} proxy features")
print(f"Remaining features: {list(df_clean.columns)}")`

    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card" style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Filter size={18} color="var(--red)" />
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>
          Proxy Feature Detector
        </div>
      </div>
      
      <p style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 20 }}>
        How to read this: Each cell shows the statistical correlation between a dataset feature and a protected attribute. Red = high proxy risk.
      </p>

      {/* CSS Grid for Heatmap */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `minmax(140px, 1fr) repeat(${protectedAttrs.length}, minmax(80px, 1fr))`,
        gap: 2,
        background: 'var(--border)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 16
      }}>
        {/* Header row */}
        <div style={{ background: '#f8fafc', padding: '10px 14px', fontWeight: 600, fontSize: 12, color: 'var(--slate)' }}>
          Dataset Feature
        </div>
        {protectedAttrs.map(attr => (
          <div key={attr} style={{ background: '#f8fafc', padding: '10px 14px', fontWeight: 600, fontSize: 12, color: 'var(--navy)', textAlign: 'center', textTransform: 'capitalize' }}>
            {attr}
          </div>
        ))}

        {/* Data rows */}
        {displayFeatures.map(({ feat }) => (
          <div style={{ display: 'contents' }} key={feat}>
            <div style={{ background: '#fff', padding: '10px 14px', fontSize: 13, color: 'var(--navy)', fontWeight: 500, fontFamily: 'DM Mono, monospace' }}>
              {feat}
            </div>
            {protectedAttrs.map(attr => {
              const corr = correlationMatrix[feat][attr] || 0
              const isProxy = corr >= proxyThreshold
              return (
                <div key={`${feat}-${attr}`} style={{
                  background: getCellColor(corr),
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  position: 'relative'
                }} title={`${feat} × ${attr}\nCorrelation: ${corr.toFixed(4)}\nRisk: ${isProxy ? 'HIGH PROXY' : 'SAFE'}\n→ Remove ${feat} from training data to reduce ${attr} proxy bias.`}>
                  {isProxy && (
                    <span style={{ position: 'absolute', top: 2, left: 2, background: '#fee2e2', color: '#991b1b', fontSize: 9, padding: '1px 4px', borderRadius: 3, fontWeight: 700, border: '1px solid #fecaca' }}>
                      PROXY
                    </span>
                  )}
                  <span style={{ fontSize: 13, color: getCellTextColor(corr), fontWeight: 600 }}>
                    {corr.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 12 }}>{getEmoji(corr)}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {features.length > 10 && (
        <button 
          onClick={() => setShowAll(!showAll)}
          style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 20 }}
        >
          {showAll ? 'Show top 10 features' : `Show all ${features.length} features`}
        </button>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--slate)', marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>🟢 &lt;0.05 Safe</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>🟡 0.05–0.15 Monitor</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>🟠 0.15–0.25 Risk</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>🔴 &gt;0.25 Proxy</div>
      </div>

      {/* Action Button */}
      {actualProxies.length > 0 && (
        <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 10 }}>Recommended Mitigation: Drop Proxy Features</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {actualProxies.map(p => (
              <span key={p} style={{ background: 'var(--red-dim)', color: 'var(--red-strong)', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontFamily: 'DM Mono, monospace' }}>
                {p}
              </span>
            ))}
          </div>
          <button 
            onClick={copyCode}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, fontWeight: 500, color: 'var(--navy)', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            {copied ? <Check size={14} color="var(--green)" /> : <Copy size={14} color="var(--slate)" />}
            {copied ? 'Copied to clipboard' : 'Copy feature removal snippet'}
          </button>
        </div>
      )}
    </div>
  )
}
