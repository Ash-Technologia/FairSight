'use client'
import { useEffect, useRef } from 'react'

interface DriftChartProps {
  scores: number[] // Array of historical fairness scores (e.g., [40, 60, 85, 92])
}

export function DriftChart({ scores }: DriftChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Setup High-DPI canvas
    const wrap = canvas.parentElement
    if (!wrap) return
    const bw = wrap.clientWidth
    const bh = wrap.clientHeight
    
    canvas.width = bw * 2
    canvas.height = bh * 2
    ctx.scale(2, 2)
    
    const W = bw
    const H = bh

    ctx.clearRect(0, 0, W, H)

    if (scores.length < 2) {
      ctx.fillStyle = '#94a3b8'
      ctx.font = '14px Inter'
      ctx.textAlign = 'center'
      ctx.fillText('Run 2+ audits to see fairness drift over time', W / 2, H / 2)
      return
    }

    // Grid lines
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 1
    ;[20, 40, 60, 80].forEach(yVal => {
      const y = H - (yVal / 100) * (H - 30) - 20
      ctx.beginPath()
      ctx.moveTo(35, y)
      ctx.lineTo(W - 15, y)
      ctx.stroke()
      
      ctx.fillStyle = '#94a3b8'
      ctx.font = '10px DM Mono'
      ctx.textAlign = 'right'
      ctx.fillText(yVal.toString(), 28, y + 3)
    })

    // Calculate points
    const pts = scores.map((s, i) => ({
      x: 40 + (i / (scores.length - 1)) * (W - 60),
      y: H - (Math.max(0, Math.min(100, s)) / 100) * (H - 30) - 20
    }))

    // Area fill
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, 'rgba(20, 184, 166, 0.25)') // Teal
    grad.addColorStop(1, 'rgba(20, 184, 166, 0)')
    ctx.beginPath()
    ctx.moveTo(pts[0].x, H)
    pts.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(pts[pts.length - 1].x, H)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Draw Line
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i - 1].x + pts[i].x) / 2
      ctx.bezierCurveTo(cx, pts[i - 1].y, cx, pts[i].y, pts[i].x, pts[i].y)
    }
    ctx.strokeStyle = '#0d9488' // Teal
    ctx.lineWidth = 2.5
    ctx.stroke()

    // Draw Dots
    pts.forEach((p, i) => {
      const sc = scores[i]
      const col = sc >= 70 ? '#10b981' : sc >= 40 ? '#f59e0b' : '#ef4444' // Green, Amber, Red
      
      ctx.beginPath()
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      
      ctx.strokeStyle = col
      ctx.lineWidth = 2.5
      ctx.stroke()

      // Hover-like label for points 
      ctx.fillStyle = col
      ctx.font = 'bold 11px DM Mono'
      ctx.textAlign = 'center'
      ctx.fillText(sc.toString(), p.x, p.y - 12)
    })

  }, [scores])

  return (
    <div className="card">
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>Fairness Score Drift</h3>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--slate)' }}>
          Session history — tracking model degradation across evaluations.
        </p>
      </div>
      <div className="drift-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
