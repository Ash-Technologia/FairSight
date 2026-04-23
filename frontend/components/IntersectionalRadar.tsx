'use client'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

interface Intersection {
  label: string
  approval_rate: number
  sample_size: number
  disparity_from_best: number
  is_biased: boolean
}

interface IntersectionalData {
  intersections: Intersection[]
  most_disadvantaged: string | null
  least_disadvantaged: string | null
  intersectional_gap: number
  reference_rate: number
}

interface Props {
  data: IntersectionalData
}

export function IntersectionalRadar({ data }: Props) {
  if (!data?.intersections || data.intersections.length < 3) return null

  const chartData = data.intersections.map(i => ({
    group: i.label,
    rate: Math.round(i.approval_rate * 100),
    fullLabel: i.label,
    sampleSize: i.sample_size,
    disparity: i.disparity_from_best,
  }))

  return (
    <div className="card fade-up" style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Intersectional Analysis
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
            Cross-Demographic Approval Rates
          </h3>
          <p style={{ color: 'var(--slate)', fontSize: 14, marginTop: 6, marginBottom: 0 }}>
            Based on Crenshaw (1989) intersectionality framework. Each axis shows approval rate for a demographic intersection.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {data.most_disadvantaged && (
            <div style={{ textAlign: 'center', padding: '10px 16px', background: 'var(--red-dim)', borderRadius: 10, border: '1px solid var(--red)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--red-strong)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Disadvantaged</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginTop: 4 }}>{data.most_disadvantaged}</div>
            </div>
          )}
          {data.least_disadvantaged && (
            <div style={{ textAlign: 'center', padding: '10px 16px', background: 'var(--green-dim)', borderRadius: 10, border: '1px solid var(--green)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green-strong)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Least Disadvantaged</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', marginTop: 4 }}>{data.least_disadvantaged}</div>
            </div>
          )}
        </div>
      </div>

      {data.intersectional_gap > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ padding: '6px 14px', borderRadius: 20, background: data.intersectional_gap > 0.15 ? 'var(--red-dim)' : 'var(--orange-dim)', border: `1px solid ${data.intersectional_gap > 0.15 ? 'var(--red)' : 'var(--orange)'}`, fontSize: 13, fontWeight: 600, color: data.intersectional_gap > 0.15 ? 'var(--red-strong)' : 'var(--orange-strong)' }}>
            Intersectional Gap: {(data.intersectional_gap * 100).toFixed(1)}pp
          </div>
          <div style={{ padding: '6px 14px', borderRadius: 20, background: 'var(--teal-dim)', border: '1px solid var(--teal)', fontSize: 13, fontWeight: 600, color: 'var(--teal-strong)' }}>
            Best Rate: {(data.reference_rate * 100).toFixed(1)}%
          </div>
        </div>
      )}

      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="group" tick={{ fontSize: 11, fill: 'var(--slate)', fontWeight: 600 }} />
            <Radar
              name="Approval Rate (%)"
              dataKey="rate"
              stroke="#14b8a6"
              fill="#14b8a6"
              fillOpacity={0.35}
              strokeWidth={2}
            />
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${value}% approval (n=${props.payload.sampleSize}, gap=${(props.payload.disparity * 100).toFixed(1)}pp)`,
                props.payload.fullLabel,
              ]}
              contentStyle={{ background: 'var(--navy)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Ranked list */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Ranked by Approval Rate (Worst → Best)</div>
        {data.intersections.map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{ width: 120, fontSize: 12, fontWeight: 600, color: 'var(--navy)', flexShrink: 0 }}>{item.label}</div>
            <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${item.approval_rate * 100}%`, background: item.is_biased ? 'var(--red)' : 'var(--teal-light)', borderRadius: 4, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ width: 45, fontSize: 12, fontWeight: 700, color: 'var(--navy)', textAlign: 'right' }}>{(item.approval_rate * 100).toFixed(1)}%</div>
            <div style={{ width: 50, fontSize: 11, color: 'var(--slate)', textAlign: 'right' }}>n={item.sample_size}</div>
            <div style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: item.is_biased ? 'var(--red-dim)' : 'var(--green-dim)', color: item.is_biased ? 'var(--red-strong)' : 'var(--green-strong)', border: `1px solid ${item.is_biased ? 'var(--red)' : 'var(--green)'}` }}>
              {item.is_biased ? 'BIASED' : 'OK'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
