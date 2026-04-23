'use client'

interface FairnessScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export function FairnessScore({ score, size = 'md' }: FairnessScoreProps) {
  const radius = size === 'lg' ? 54 : size === 'md' ? 40 : 28
  const stroke = size === 'lg' ? 8 : 6
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(100, score))
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const color = score >= 70 ? 'var(--teal)' : score >= 40 ? 'var(--orange)' : 'var(--red)'
  const label = score >= 70 ? 'FAIR' : score >= 40 ? 'AT RISK' : 'BIASED'
  const fontSize = size === 'lg' ? 22 : size === 'md' ? 16 : 11
  const svgSize = (radius + stroke) * 2 + 4

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={svgSize} height={svgSize} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        {/* Progress circle */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease-out, stroke 0.3s' }}
        />
        {/* Score text */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: 'center',
            fill: color,
            fontSize,
            fontWeight: 700,
            fontFamily: 'Space Grotesk, sans-serif',
          }}
        >
          {score}
        </text>
      </svg>
      {size !== 'sm' && (
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color
        }}>
          {label}
        </span>
      )}
    </div>
  )
}
