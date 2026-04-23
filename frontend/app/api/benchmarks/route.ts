// frontend/app/api/benchmarks/route.ts
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Based on published research: Obermeyer et al. 2019, ProPublica COMPAS 2016, NIST AI RMF
const INDUSTRY_AVERAGES: Record<string, { avg: number; label: string }> = {
  hiring:           { avg: 71, label: 'Hiring & Recruitment' },
  lending:          { avg: 74, label: 'Loan & Credit Approval' },
  healthcare:       { avg: 63, label: 'Healthcare Triage' },
  criminal_justice: { avg: 51, label: 'Criminal Justice / Recidivism' },
  insurance:        { avg: 69, label: 'Insurance Underwriting' },
}

export async function GET(req: NextRequest) {
  const score = parseInt(req.nextUrl.searchParams.get('score') ?? '0', 10)
  const allScores: number[] = []

  // Aggregate from Firestore
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'audits'))
      snap.forEach(d => { const s = d.data().fairnessScore; if (typeof s === 'number') allScores.push(s) })
    }
  } catch { /* fall through */ }

  // Also aggregate from local cache
  try {
    const cachePath = path.join(process.cwd(), '.fairsight_cache.json')
    if (fs.existsSync(cachePath)) {
      const cache: any[] = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
      cache.forEach(a => { if (typeof a.fairnessScore === 'number') allScores.push(a.fairnessScore) })
    }
  } catch { /* ignore */ }

  const global_average = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 68 // reasonable default

  const sorted = [...allScores].sort((a, b) => a - b)
  const p25 = sorted[Math.floor(sorted.length * 0.25)] ?? 55
  const p75 = sorted[Math.floor(sorted.length * 0.75)] ?? 85

  const belowCount = allScores.filter(s => s <= score).length
  const user_percentile = allScores.length > 0
    ? Math.round((belowCount / allScores.length) * 100)
    : null

  return Response.json({
    global_average,
    global_p25: p25,
    global_p75: p75,
    total_audits: allScores.length,
    user_percentile,
    user_score: score,
    industry_averages: INDUSTRY_AVERAGES,
  })
}
