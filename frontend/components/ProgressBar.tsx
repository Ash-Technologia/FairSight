'use client'
import { useEffect, useState } from 'react'

interface ProgressBarProps {
  loading: boolean
}

export function ProgressBar({ loading }: ProgressBarProps) {
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (loading) {
      setVisible(true)
      setWidth(10)
      const t1 = setTimeout(() => setWidth(35), 200)
      const t2 = setTimeout(() => setWidth(60), 700)
      const t3 = setTimeout(() => setWidth(80), 1400)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    } else {
      setWidth(100)
      const hide = setTimeout(() => { setVisible(false); setWidth(0) }, 450)
      return () => clearTimeout(hide)
    }
  }, [loading])

  if (!visible) return null

  return (
    <div
      className="progress-bar-top"
      style={{ width: `${width}%`, opacity: width === 0 ? 0 : 1 }}
    />
  )
}
