// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Nav } from '@/components/Nav'
import { AuthProvider } from '@/lib/AuthContext'
import { ToastProvider } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'FairSight — Real-Time AI Bias Detection',
  description: 'FairSight monitors deployed ML models in real-time, detecting and explaining bias using 12+ fairness metrics and AI-powered plain language verdicts.',
  keywords: 'AI bias detection, algorithmic fairness, machine learning, fairness metrics, bias audit',
  openGraph: {
    title: 'FairSight — Real-Time AI Bias Detection',
    description: 'Live bias monitoring for deployed ML models. One SDK line. Zero architecture change.',
    type: 'website',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Fonts loaded once here, NOT in globals.css */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="cyber-bg" />
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
        <div className="ambient-orb orb-3" />
          <AuthProvider>
            <ToastProvider>
              <Nav />
              <main>{children}</main>
            </ToastProvider>
          </AuthProvider>
      </body>
    </html>
  )
}
